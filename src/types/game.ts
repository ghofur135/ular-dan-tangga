/**
 * Represents a player in the game
 */
export interface Player {
  id: string
  name: string
  color: string
  position: number
  isCurrentTurn: boolean
  diceResult?: number
  joinedAt: Date
}

/**
 * Represents the game board configuration
 */
export interface GameBoard {
  size: number
  snakes: Record<number, number>  // {head: tail}
  ladders: Record<number, number> // {bottom: top}
  maxPosition: number
}

/**
 * Represents a game room where players gather to play
 */
export interface GameRoom {
  id: string
  name: string
  players: Player[]
  currentTurnPlayerId: string
  status: 'waiting' | 'playing' | 'finished'
  winner?: Player
  createdAt: Date
  updatedAt: Date
}

/**
 * Represents a single move event in the game
 */
export interface MoveEvent {
  playerId: string
  playerName: string
  previousPosition: number
  newPosition: number
  diceRoll: number
  timestamp: Date
  moveType: 'normal' | 'snake' | 'ladder'
}

/**
 * Represents the current game state
 */
export interface GameState {
  currentRoom: GameRoom | null
  currentPlayer: Player | null
  moveHistory: MoveEvent[]
  isMyTurn: boolean
}

/**
 * Payload structure for real-time game updates
 */
export interface GameUpdatePayload {
  event: 'player_moved' | 'turn_changed' | 'player_joined' | 'game_ended'
  playerId: string
  playerName: string
  data: any
  timestamp: number
}

/**
 * Result of position calculation after a move
 */
export interface MoveResult {
  position: number
  moveType: 'normal' | 'snake' | 'ladder'
}

/**
 * Result of move validation
 */
export interface ValidationResult {
  isValid: boolean
  reason?: string
}

/**
 * Leaderboard entry for player statistics
 */
export interface LeaderboardEntry {
  id: string
  username: string
  avatarUrl?: string
  totalGamesPlayed: number
  totalGamesWon: number
  totalGamesLost: number
  winPercentage: number
  rank: number
}

/**
 * Standard board configuration with predefined snake and ladder positions
 * Snakes: 17→7, 54→34, 62→19, 87→36, 93→73, 99→79
 * Ladders: 3→22, 5→14, 20→39, 27→84, 51→67, 72→91, 88→99
 */
export const STANDARD_BOARD: GameBoard = {
  size: 10,
  snakes: {
    17: 7,
    54: 34,
    62: 19,
    87: 36,
    93: 73,
    99: 79,
  },
  ladders: {
    3: 22,
    5: 14,
    20: 39,
    27: 84,
    51: 67,
    72: 91,
    88: 99,
  },
  maxPosition: 100,
}

/**
 * Available player colors for selection
 */
export const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#FF8C00', // Orange
  '#9370DB', // Purple
]
