import { supabase } from '../config/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { Player, GameRoom, MoveEvent, CollisionEvent } from '../types/game'
import { authService, RegisteredUser } from '../services/authService'
import { CUSTOM_BOARD_CONFIG } from '../config/boardConfig'
import { calculateNewPosition, getNextPlayer, checkWin, createMoveEvent, checkCollision } from '../utils/boardLogic'

interface GameStore {
  // State
  selectedBoard: string
  currentRoom: GameRoom | null
  players: Player[]
  moveHistory: MoveEvent[]
  currentPlayerIndex: number
  gameStatus: 'waiting' | 'playing' | 'finished'
  isPaused: boolean
  isAnimating: boolean
  animatingPlayerId: string | null
  animationPosition: number
  winner: Player | null
  currentSession: any
  currentPlayerId: string | null
  hasBonusRoll: boolean
  lastCollision: CollisionEvent | null

  // Auth
  user: any
  currentUser: RegisteredUser | null
  isAuthenticated: boolean

  // Actions
  setSelectedBoard: (boardId: string) => void
  updateStats: (isWin: boolean, moves: number) => Promise<void>
  login: (username: string, pin: string, avatar: number) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  initializeAuth: (session: any) => void
  setCurrentPlayerId: (playerId: string) => void
  createGameRoom: (roomName: string, playerName: string, playerColor: string, avatar?: number, boardTheme?: string) => void
  joinGameRoom: (roomId: string, playerName: string, playerColor: string, avatar?: number) => void
  startGame: () => void
  resetGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  setAnimating: (isAnimating: boolean, playerId?: string | null) => void
  setAnimationPosition: (position: number) => void
  setHasBonusRoll: (hasBonusRoll: boolean) => void
  setLastCollision: (collision: CollisionEvent | null) => void
  applyCollision: (collision: CollisionEvent) => void

  // Game Actions
  processMove: (playerId: string, diceRoll: number, options?: { ignoreSnakes?: boolean }) => { position: number; moveType: string; collision?: CollisionEvent | null } | null
  teleportPlayer: (playerId: string) => { position: number; collision?: CollisionEvent | null } | null
  endPlayerTurn: () => void
  recordMove: (move: MoveEvent) => void

  // UI Updates
  updatePlayerPosition: (playerId: string, newPosition: number) => void
  updateCurrentTurn: (playerIndex: number) => void
  setGameStatus: (status: 'waiting' | 'playing' | 'finished') => void
  setWinner: (player: Player) => void
  setPlayers: (players: Player[]) => void

  // Realtime handlers
  handleRemotePlayerMove: (
    playerId: string,
    playerName: string,
    previousPos: number,
    newPos: number,
    diceRoll: number,
    moveType: string
  ) => void
  handleRemoteTurnChange: (nextPlayerIndex: number) => void
  handleRemotePlayerJoin: (player: Player) => void

  // Getters
  getCurrentPlayer: () => Player | null
  isMyTurn: () => boolean
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  selectedBoard: 'default',
  currentRoom: null,
  players: [],
  moveHistory: [],
  currentPlayerIndex: 0,
  gameStatus: 'waiting',
  isPaused: false,
  isAnimating: false,
  animatingPlayerId: null,
  animationPosition: 1,
  winner: null,
  currentSession: null,
  currentPlayerId: null,
  hasBonusRoll: false,
  lastCollision: null,
  user: null,
  currentUser: null,
  isAuthenticated: false,

  setSelectedBoard: (boardId) => set({ selectedBoard: boardId }),

  // Auth
  updateStats: async (isWin, moves) => {
    const state = get()
    if (!state.currentUser && !state.user?.email) return

    const playerName = state.currentUser?.username || state.user?.email

    try {
      const { error } = await supabase.rpc('update_player_stats', {
        p_player_name: playerName,
        p_won: isWin,
        p_moves: moves
      })

      if (error) console.error('Error updating stats:', error)
    } catch (err) {
      console.error('Error updating stats:', err)
    }
  },

  login: async (username, pin, avatar) => {
    const { user, error } = await authService.loginOrRegister(username, pin, avatar)
    if (user) {
      // Save session locally
      try {
        await AsyncStorage.setItem('user_session', JSON.stringify(user))
      } catch (e) {
        console.error('Failed to save session', e)
      }

      set({
        currentUser: user,
        isAuthenticated: true,
        user: { id: user.id, email: user.username }
      })
      return { success: true }
    }
    return { success: false, error: error || 'Login gagal' }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('user_session')
    } catch (e) {
      console.error('Failed to clear session', e)
    }
    set({
      currentUser: null,
      isAuthenticated: false,
      user: null
    })
  },

  checkSession: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user_session')
      if (jsonValue != null) {
        const user = JSON.parse(jsonValue) as RegisteredUser
        set({
          currentUser: user,
          isAuthenticated: true,
          user: { id: user.id, email: user.username }
        })
      }
    } catch (e) {
      console.error('Failed to load session', e)
    }
  },

  initializeAuth: (session) => {
    set({
      currentSession: session,
      isAuthenticated: !!session,
      user: session?.user,
    })
  },

  setCurrentPlayerId: (playerId) => {
    set({ currentPlayerId: playerId })
  },

  // Create room
  createGameRoom: (roomName, playerName, playerColor, avatar = 1, boardTheme = 'default') => {
    const state = get()
    const playerId = state.currentUser ? state.currentUser.id : `player-${Date.now()}`
    const finalName = state.currentUser ? state.currentUser.username : playerName

    const newPlayer: Player = {
      id: playerId,
      name: finalName,
      color: playerColor,
      avatar: avatar,
      position: 1,
      isCurrentTurn: true,
      joinedAt: new Date(),
    }

    const newRoom: GameRoom = {
      id: `room-${Date.now()}`,
      name: roomName,
      players: [newPlayer],
      currentTurnPlayerId: playerId,
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
      boardTheme: boardTheme
    }

    set({
      currentRoom: newRoom,
      players: [newPlayer],
      currentPlayerIndex: 0,
      currentPlayerId: playerId,
      gameStatus: 'waiting',
      selectedBoard: boardTheme,
    })
  },

  // Join room
  joinGameRoom: (roomId, playerName, playerColor, avatar = 1) => {
    const state = get()
    const playerId = state.currentUser ? state.currentUser.id : `player-${Date.now()}`
    const finalName = state.currentUser ? state.currentUser.username : playerName

    const newPlayer: Player = {
      id: playerId,
      name: finalName,
      color: playerColor,
      avatar: avatar,
      position: 1,
      isCurrentTurn: false,
      joinedAt: new Date(),
    }

    if (state.currentRoom) {
      const updatedPlayers = [...state.players, newPlayer]
      const updatedRoom: GameRoom = {
        ...state.currentRoom,
        players: updatedPlayers,
        updatedAt: new Date(),
      }
      set({
        currentRoom: updatedRoom,
        players: updatedPlayers,
        currentPlayerId: playerId,
      })
    }
  },

  startGame: () => {
    const state = get()
    if (state.players.length < 2) return

    // CRITICAL FIX: Find human player index first to ensure correct turn order
    const humanPlayerIndex = state.players.findIndex(p => !p.id.startsWith('bot-'))
    const startingPlayerIndex = humanPlayerIndex >= 0 ? humanPlayerIndex : 0

    const updatedPlayers = state.players.map((p, i) => ({
      ...p,
      isCurrentTurn: i === startingPlayerIndex,
      position: 1,
      diceResult: undefined, // Reset dice result
    }))

    // Find human player (non-bot) to set as currentPlayerId for single player mode
    const humanPlayer = state.players.find(p => !p.id.startsWith('bot-'))

    set({
      gameStatus: 'playing',
      players: updatedPlayers,
      currentPlayerIndex: startingPlayerIndex,
      moveHistory: [],
      winner: null,
      currentPlayerId: humanPlayer?.id || state.currentPlayerId, // Set human player ID if not already set
      hasBonusRoll: false, // CRITICAL: Explicitly reset hasBonusRoll when starting game
    })
  },

  resetGame: () => {
    set({
      currentRoom: null,
      players: [],
      moveHistory: [],
      currentPlayerIndex: 0,
      gameStatus: 'waiting',
      isPaused: false,
      winner: null,
      currentPlayerId: null,
      hasBonusRoll: false,
      lastCollision: null,
      isAnimating: false,
      animatingPlayerId: null,
    })
  },

  pauseGame: () => {
    const state = get()
    if (state.gameStatus === 'playing') {
      set({ isPaused: true })
    }
  },

  resumeGame: () => {
    const state = get()
    if (state.gameStatus === 'playing' && state.isPaused) {
      set({ isPaused: false })
    }
  },

  setAnimating: (isAnimating, playerId = null) => {
    set({ isAnimating, animatingPlayerId: playerId })
  },

  setAnimationPosition: (position) => {
    set({ animationPosition: position })
  },

  setHasBonusRoll: (hasBonusRoll) => {
    set({ hasBonusRoll })
  },

  setLastCollision: (collision) => {
    set({ lastCollision: collision })
  },

  applyCollision: (collision) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === collision.bumpedPlayerId
          ? { ...p, position: collision.bumpedToPosition }
          : p
      ),
    }))
  },

  processMove: (playerId, diceRoll, options = {}) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)

    if (!player) return null

    const result = calculateNewPosition(
      player.position,
      diceRoll,
      options.ignoreSnakes ? {} : CUSTOM_BOARD_CONFIG.snakes,
      CUSTOM_BOARD_CONFIG.ladders
    )

    console.log(`[Dice Roll] Player ${player.name} rolled ${diceRoll}. Pos: ${player.position} -> ${result.position} (${result.moveType})`)

    const collision = checkCollision(result.position, state.players, playerId)

    // CRITICAL FIX: Ensure only the current player gets their diceResult updated
    // This prevents stale diceResult from causing incorrect bonus rolls
    const updatedPlayers = state.players.map((p) => {
      if (p.id === playerId) {
        return { ...p, position: result.position, diceResult: diceRoll }
      } else {
        // Clear diceResult for all other players to prevent confusion
        return { ...p, diceResult: undefined }
      }
    })

    // CRITICAL FIX: Only set hasBonusRoll if player actually rolled a 6
    // This is especially important for bot turns to prevent multiple rolls
    const hasBonusRoll = diceRoll === 6

    set({
      players: updatedPlayers,
      hasBonusRoll,
      lastCollision: collision,
    })

    if (checkWin(result.position)) {
      set({
        gameStatus: 'finished',
        winner: { ...player, position: result.position },
        hasBonusRoll: false,
      })
    }

    const moveEvent = createMoveEvent(
      playerId,
      player.name,
      player.position,
      result.position,
      diceRoll,
      collision ? 'collision' : result.moveType
    )
    set((state) => ({
      moveHistory: [...state.moveHistory, moveEvent],
    }))

    return { ...result, collision }
  },

  teleportPlayer: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (!player) return null

    console.log(`[Teleport] Player ${player.name} initiated teleport (current pos: ${player.position})`)

    // Find nearest ladder ahead
    const ladders = CUSTOM_BOARD_CONFIG.ladders
    const sortedLadderBottoms = Object.keys(ladders).map(Number).sort((a, b) => a - b)
    const nextLadderBottom = sortedLadderBottoms.find(b => b > player.position)

    if (!nextLadderBottom) return null

    const targetPos = ladders[nextLadderBottom]
    const collision = checkCollision(targetPos, state.players, playerId)

    const updatedPlayers = state.players.map((p) =>
      p.id === playerId
        ? { ...p, position: targetPos, diceResult: 0 }
        : p
    )

    set({
      players: updatedPlayers,
      hasBonusRoll: false,
      lastCollision: collision,
    })

    if (checkWin(targetPos)) {
      set({
        gameStatus: 'finished',
        winner: { ...player, position: targetPos },
        hasBonusRoll: false,
      })
    }

    const moveEvent = createMoveEvent(
      playerId,
      player.name,
      player.position,
      targetPos,
      0,
      'teleport'
    )
    set((state) => ({
      moveHistory: [...state.moveHistory, moveEvent],
    }))

    return { position: targetPos, collision }
  },

  endPlayerTurn: () => {
    const state = get()
    if (state.gameStatus !== 'playing') return

    // CRITICAL FIX: Double-check if player actually rolled a 6
    const currentPlayer = state.players[state.currentPlayerIndex]
    console.log(`[End Turn] Checking for ${currentPlayer?.name}. Bonus: ${state.hasBonusRoll}, Dice: ${currentPlayer?.diceResult}`)
    const actuallyRolledSix = currentPlayer?.diceResult === 6
    
    // CRITICAL FIX: If hasBonusRoll is true but player didn't actually roll a 6, reset it immediately
    // This is especially important for bot turns to prevent multiple rolls
    if (state.hasBonusRoll && !actuallyRolledSix) {
      console.log('Fixing inconsistent hasBonusRoll state - player did not roll 6')
      set({ hasBonusRoll: false })
    }
    
    // If player has bonus roll (rolled a 6), don't advance to next player
    if (state.hasBonusRoll && actuallyRolledSix) {
      // Just clear the bonus roll flag but keep the same player's turn
      // IMPORTANT: Keep diceResult so we can verify bonus roll in next turn
      set({ hasBonusRoll: false })
      return // Don't advance to next player - same player rolls again
    }

    const nextIndex = getNextPlayer(state.currentPlayerIndex, state.players.length)

    console.log(`[Turn switch] ${state.players[state.currentPlayerIndex]?.name} -> ${state.players[nextIndex]?.name}`)

    set({
      currentPlayerIndex: nextIndex,
      players: state.players.map((p, i) => ({
        ...p,
        isCurrentTurn: i === nextIndex,
        // CRITICAL FIX: Only clear diceResult when changing turns
        diceResult: i === nextIndex ? p.diceResult : undefined,
      })),
      hasBonusRoll: false, // Always reset when changing turns
    })
  },

  recordMove: (move) => {
    set((state) => ({
      moveHistory: [...state.moveHistory, move],
    }))
  },

  updatePlayerPosition: (playerId, newPosition) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, position: newPosition } : p
      ),
    }))
  },

  updateCurrentTurn: (playerIndex) => {
    set((state) => ({
      currentPlayerIndex: playerIndex,
      players: state.players.map((p, i) => ({
        ...p,
        isCurrentTurn: i === playerIndex,
      })),
    }))
  },

  setGameStatus: (status) => {
    set({ gameStatus: status })
  },

  setWinner: (player) => {
    set({ winner: player, gameStatus: 'finished' })
  },

  setPlayers: (players) => {
    set({ players })
  },

  handleRemotePlayerMove: (playerId, playerName, previousPos, newPos, diceRoll, moveType) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, position: newPos, diceResult: diceRoll }
          : p
      ),
      moveHistory: [
        ...state.moveHistory,
        {
          playerId,
          playerName,
          previousPosition: previousPos,
          newPosition: newPos,
          diceRoll,
          timestamp: new Date(),
          moveType: moveType as 'normal' | 'snake' | 'ladder' | 'bounce' | 'collision',
        },
      ],
      // CRITICAL FIX: Only set hasBonusRoll if player actually rolled a 6
      hasBonusRoll: diceRoll === 6,
    }))

    if (checkWin(newPos)) {
      const winner = get().players.find((p) => p.id === playerId)
      if (winner) {
        set({
          gameStatus: 'finished',
          winner: { ...winner, position: newPos },
        })
      }
    }
  },

  handleRemoteTurnChange: (nextPlayerIndex) => {
    set((state) => ({
      currentPlayerIndex: nextPlayerIndex,
      players: state.players.map((p, i) => ({
        ...p,
        isCurrentTurn: i === nextPlayerIndex,
        diceResult: undefined,
      })),
    }))
  },

  handleRemotePlayerJoin: (player) => {
    set((state) => ({
      players: [...state.players, player],
    }))
  },

  getCurrentPlayer: () => {
    const state = get()
    return state.players[state.currentPlayerIndex] || null
  },

  isMyTurn: () => {
    const state = get()
    const currentPlayer = state.players[state.currentPlayerIndex]
    return currentPlayer?.id === state.currentPlayerId
  },
}))
