import { supabase } from '../config/supabase'
import { create } from 'zustand'
import { Player, GameRoom, MoveEvent, STANDARD_BOARD, CollisionEvent } from '../types/game'
import { authService, RegisteredUser } from '../services/authService'
import { CUSTOM_BOARD_CONFIG } from '../config/boardConfig'
import { calculateNewPosition, getNextPlayer, checkWin, createMoveEvent, checkCollision } from '../utils/boardLogic'

interface GameStore {
  // State
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
  hasBonusRoll: boolean // Track if player rolled 6 and gets bonus roll
  lastCollision: CollisionEvent | null // Track last collision event

  // Auth
  user: any
  currentUser: RegisteredUser | null
  isAuthenticated: boolean

  // Actions
  updateStats: (isWin: boolean, moves: number) => Promise<void>
  login: (username: string, pin: string, avatar: number) => Promise<{ success: boolean; error?: string }>
  initializeAuth: (session: any) => void
  setCurrentPlayerId: (playerId: string) => void
  createGameRoom: (roomName: string, playerName: string, playerColor: string, avatar?: number) => void
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
  processMove: (playerId: string, diceRoll: number) => { position: number; moveType: string; collision?: CollisionEvent | null } | null
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

  // Auth
  updateStats: async (isWin, moves) => {
    const state = get()
    if (!state.currentUser && !state.user?.email) return // Only for logged in users

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
      set({
        currentUser: user,
        isAuthenticated: true,
        // Also update standard user field for compatibility
        user: { id: user.id, email: user.username }
      })
      return { success: true }
    }
    return { success: false, error: error || 'Login gagal' }
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
  createGameRoom: (roomName, playerName, playerColor, avatar = 1) => {
    const state = get()
    // Use authenticated ID if available, otherwise random
    const playerId = state.currentUser ? state.currentUser.id : `player-${Date.now()}`

    // Use authenticated name if available (though passed arg should match)
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
    }

    set({
      currentRoom: newRoom,
      players: [newPlayer],
      currentPlayerIndex: 0,
      currentPlayerId: playerId,
      gameStatus: 'waiting',
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

  // Start game
  startGame: () => {
    const state = get()
    if (state.players.length < 2) return

    const updatedPlayers = state.players.map((p, i) => ({
      ...p,
      isCurrentTurn: i === 0,
      position: 1,
    }))

    set({
      gameStatus: 'playing',
      players: updatedPlayers,
      currentPlayerIndex: 0,
      moveHistory: [],
      winner: null,
    })
  },

  // Reset game
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
    })
  },

  // Pause game
  pauseGame: () => {
    const state = get()
    if (state.gameStatus === 'playing') {
      set({ isPaused: true })
    }
  },

  // Resume game
  resumeGame: () => {
    const state = get()
    if (state.gameStatus === 'playing' && state.isPaused) {
      set({ isPaused: false })
    }
  },

  // Set animating state
  setAnimating: (isAnimating, playerId = null) => {
    set({ isAnimating, animatingPlayerId: playerId })
  },

  // Set animation position
  setAnimationPosition: (position) => {
    set({ animationPosition: position })
  },

  // Set bonus roll state
  setHasBonusRoll: (hasBonusRoll) => {
    set({ hasBonusRoll })
  },

  // Set last collision
  setLastCollision: (collision) => {
    set({ lastCollision: collision })
  },

  // Apply collision - move bumped player back 2 squares
  applyCollision: (collision) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === collision.bumpedPlayerId
          ? { ...p, position: collision.bumpedToPosition }
          : p
      ),
    }))
  },

  // Process move
  processMove: (playerId, diceRoll) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)

    if (!player) return null

    const result = calculateNewPosition(
      player.position,
      diceRoll,
      CUSTOM_BOARD_CONFIG.snakes,
      CUSTOM_BOARD_CONFIG.ladders
    )

    // Check for collision with other players
    const collision = checkCollision(result.position, state.players, playerId)

    // Update player position
    const updatedPlayers = state.players.map((p) =>
      p.id === playerId
        ? { ...p, position: result.position, diceResult: diceRoll }
        : p
    )

    // Set bonus roll if dice is 6
    const hasBonusRoll = diceRoll === 6

    set({
      players: updatedPlayers,
      hasBonusRoll,
      lastCollision: collision,
    })

    // Check win
    if (checkWin(result.position)) {
      set({
        gameStatus: 'finished',
        winner: { ...player, position: result.position },
        hasBonusRoll: false, // No bonus roll if won
      })
    }

    // Record move
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

  // End turn - check for bonus roll first
  endPlayerTurn: () => {
    const state = get()
    if (state.gameStatus !== 'playing') return

    // If player has bonus roll (rolled 6), don't switch turn
    if (state.hasBonusRoll) {
      set({ hasBonusRoll: false }) // Reset bonus roll flag
      return // Stay on same player's turn
    }

    const nextIndex = getNextPlayer(state.currentPlayerIndex, state.players.length)

    set({
      currentPlayerIndex: nextIndex,
      players: state.players.map((p, i) => ({
        ...p,
        isCurrentTurn: i === nextIndex,
        diceResult: undefined,
      })),
      hasBonusRoll: false,
    })
  },

  // Record move
  recordMove: (move) => {
    set((state) => ({
      moveHistory: [...state.moveHistory, move],
    }))
  },

  // Update position
  updatePlayerPosition: (playerId, newPosition) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, position: newPosition } : p
      ),
    }))
  },

  // Update turn
  updateCurrentTurn: (playerIndex) => {
    set((state) => ({
      currentPlayerIndex: playerIndex,
      players: state.players.map((p, i) => ({
        ...p,
        isCurrentTurn: i === playerIndex,
      })),
    }))
  },

  // Set status
  setGameStatus: (status) => {
    set({ gameStatus: status })
  },

  // Set winner
  setWinner: (player) => {
    set({ winner: player, gameStatus: 'finished' })
  },

  // Set players
  setPlayers: (players) => {
    set({ players })
  },

  // Realtime handlers
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
      hasBonusRoll: diceRoll === 6, // Set bonus roll for remote player too
    }))

    // Check if remote player won
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

  // Getters
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
