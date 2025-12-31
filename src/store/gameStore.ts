import { create } from 'zustand'
import { Player, GameRoom, MoveEvent, STANDARD_BOARD } from '../types/game'
import { calculateNewPosition, getNextPlayer, checkWin, createMoveEvent } from '../utils/boardLogic'

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

  // Auth
  user: any
  isAuthenticated: boolean

  // Actions
  initializeAuth: (session: any) => void
  setCurrentPlayerId: (playerId: string) => void
  createGameRoom: (roomName: string, playerName: string, playerColor: string) => void
  joinGameRoom: (roomId: string, playerName: string, playerColor: string) => void
  startGame: () => void
  resetGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  setAnimating: (isAnimating: boolean, playerId?: string | null) => void
  setAnimationPosition: (position: number) => void

  // Game Actions
  processMove: (playerId: string, diceRoll: number) => { position: number; moveType: string } | null
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
  user: null,
  isAuthenticated: false,

  // Auth
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
  createGameRoom: (roomName, playerName, playerColor) => {
    const playerId = `player-${Date.now()}`
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      color: playerColor,
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
  joinGameRoom: (roomId, playerName, playerColor) => {
    const state = get()
    const playerId = `player-${Date.now()}`
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      color: playerColor,
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

  // Process move
  processMove: (playerId, diceRoll) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)

    if (!player) return null

    const result = calculateNewPosition(
      player.position,
      diceRoll,
      STANDARD_BOARD.snakes,
      STANDARD_BOARD.ladders
    )

    // Update player position
    const updatedPlayers = state.players.map((p) =>
      p.id === playerId
        ? { ...p, position: result.position, diceResult: diceRoll }
        : p
    )

    set({ players: updatedPlayers })

    // Check win
    if (checkWin(result.position)) {
      set({
        gameStatus: 'finished',
        winner: { ...player, position: result.position },
      })
    }

    // Record move
    const moveEvent = createMoveEvent(
      playerId,
      player.name,
      player.position,
      result.position,
      diceRoll,
      result.moveType
    )
    set((state) => ({
      moveHistory: [...state.moveHistory, moveEvent],
    }))

    return result
  },

  // End turn
  endPlayerTurn: () => {
    const state = get()
    if (state.gameStatus !== 'playing') return

    const nextIndex = getNextPlayer(state.currentPlayerIndex, state.players.length)

    set({
      currentPlayerIndex: nextIndex,
      players: state.players.map((p, i) => ({
        ...p,
        isCurrentTurn: i === nextIndex,
        diceResult: undefined,
      })),
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
          moveType: moveType as 'normal' | 'snake' | 'ladder',
        },
      ],
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
