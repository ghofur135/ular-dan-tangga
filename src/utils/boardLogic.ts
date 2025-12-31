import { MoveEvent, MoveResult, ValidationResult, STANDARD_BOARD } from '../types/game'

/**
 * Calculate new position after dice roll, applying snake/ladder effects
 * @param currentPosition - Current position of the player (1-100)
 * @param diceRoll - Result of dice roll (1-6)
 * @param snakes - Map of snake head positions to tail positions
 * @param ladders - Map of ladder bottom positions to top positions
 * @param maxPosition - Maximum position on the board (default: 100)
 * @returns Object containing new position and move type
 * 
 * @example
 * // Normal move
 * calculateNewPosition(5, 3, {}, {}, 100) // { position: 8, moveType: 'normal' }
 * 
 * // Snake move
 * calculateNewPosition(14, 3, { 17: 7 }, {}, 100) // { position: 7, moveType: 'snake' }
 * 
 * // Ladder move
 * calculateNewPosition(1, 2, {}, { 3: 22 }, 100) // { position: 22, moveType: 'ladder' }
 * 
 * // Exceeds max - stay in place
 * calculateNewPosition(98, 5, {}, {}, 100) // { position: 98, moveType: 'normal' }
 */
export const calculateNewPosition = (
  currentPosition: number,
  diceRoll: number,
  snakes: Record<number, number> = STANDARD_BOARD.snakes,
  ladders: Record<number, number> = STANDARD_BOARD.ladders,
  maxPosition: number = 100
): MoveResult => {
  let newPos = currentPosition + diceRoll

  // Can't go beyond max position - stay in place
  if (newPos > maxPosition) {
    return {
      position: currentPosition,
      moveType: 'normal',
    }
  }

  // Check for snakes (slide down)
  if (snakes[newPos] !== undefined) {
    return {
      position: snakes[newPos],
      moveType: 'snake',
    }
  }

  // Check for ladders (climb up)
  if (ladders[newPos] !== undefined) {
    return {
      position: ladders[newPos],
      moveType: 'ladder',
    }
  }

  return {
    position: newPos,
    moveType: 'normal',
  }
}

/**
 * Check if player has won the game
 * @param position - Current position of the player
 * @param maxPosition - Winning position (default: 100)
 * @returns true if player has won
 * 
 * @example
 * checkWin(100, 100) // true
 * checkWin(99, 100)  // false
 */
export const checkWin = (
  position: number,
  maxPosition: number = 100
): boolean => {
  return position === maxPosition
}

/**
 * Get the index of the next player in turn order
 * @param currentPlayerIndex - Index of current player (0-based)
 * @param totalPlayers - Total number of players in the game
 * @returns Index of the next player
 * 
 * @example
 * getNextPlayer(0, 4) // 1
 * getNextPlayer(3, 4) // 0 (wraps around)
 */
export const getNextPlayer = (
  currentPlayerIndex: number,
  totalPlayers: number
): number => {
  return (currentPlayerIndex + 1) % totalPlayers
}

/**
 * Validate if a move is legal
 * @param playerId - ID of the player attempting the move
 * @param currentTurnPlayerId - ID of the player whose turn it is
 * @param diceRoll - The dice roll value
 * @param currentPosition - Player's current position
 * @param newPosition - Proposed new position
 * @returns Validation result with isValid flag and optional reason
 * 
 * @example
 * validateMove('p1', 'p1', 4, 10, 14) // { isValid: true }
 * validateMove('p1', 'p2', 4, 10, 14) // { isValid: false, reason: 'Not your turn' }
 */
export const validateMove = (
  playerId: string,
  currentTurnPlayerId: string,
  diceRoll: number,
  currentPosition: number,
  newPosition: number
): ValidationResult => {
  // Check if it's player's turn
  if (playerId !== currentTurnPlayerId) {
    return { isValid: false, reason: 'Not your turn' }
  }

  // Check if dice roll is valid (1-6)
  if (diceRoll < 1 || diceRoll > 6) {
    return { isValid: false, reason: 'Invalid dice roll' }
  }

  // Check if position is within bounds
  if (currentPosition < 1 || currentPosition > 100) {
    return { isValid: false, reason: 'Invalid current position' }
  }

  if (newPosition < 1 || newPosition > 100) {
    return { isValid: false, reason: 'Invalid new position' }
  }

  return { isValid: true }
}

/**
 * Create a move event record
 * @param playerId - ID of the player who made the move
 * @param playerName - Name of the player
 * @param previousPosition - Position before the move
 * @param newPosition - Position after the move
 * @param diceRoll - The dice roll value
 * @param moveType - Type of move (normal, snake, or ladder)
 * @returns MoveEvent object
 */
export const createMoveEvent = (
  playerId: string,
  playerName: string,
  previousPosition: number,
  newPosition: number,
  diceRoll: number,
  moveType: 'normal' | 'snake' | 'ladder'
): MoveEvent => {
  return {
    playerId,
    playerName,
    previousPosition,
    newPosition,
    diceRoll,
    timestamp: new Date(),
    moveType,
  }
}

/**
 * Generate a random dice roll (1-6)
 * @returns Random integer between 1 and 6
 */
export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1
}

/**
 * Get the row and column position for a square number on the board
 * Board uses snake pattern: odd rows go left-to-right, even rows go right-to-left
 * @param squareNumber - The square number (1-100)
 * @param boardSize - Size of one side of the board (default: 10)
 * @returns Object with row, col, x, y coordinates
 */
export const getSquarePosition = (
  squareNumber: number,
  boardSize: number = 10
): { row: number; col: number } => {
  const adjustedNumber = squareNumber - 1
  const row = Math.floor(adjustedNumber / boardSize)
  const col = adjustedNumber % boardSize

  // Alternate row direction (snake pattern)
  // Even rows (0, 2, 4...) go left to right
  // Odd rows (1, 3, 5...) go right to left
  const actualCol = row % 2 === 0 ? col : (boardSize - 1) - col

  return { row, col: actualCol }
}

/**
 * Generate array of board squares with metadata
 * @param boardSize - Total number of squares (default: 100)
 * @param snakes - Map of snake positions
 * @param ladders - Map of ladder positions
 * @returns Array of square objects with number and type indicators
 */
export const generateBoardSquares = (
  boardSize: number = 100,
  snakes: Record<number, number> = STANDARD_BOARD.snakes,
  ladders: Record<number, number> = STANDARD_BOARD.ladders
): Array<{ number: number; isSnakeHead: boolean; isLadderBottom: boolean }> => {
  const squares = []
  for (let i = 1; i <= boardSize; i++) {
    squares.push({
      number: i,
      isSnakeHead: snakes[i] !== undefined,
      isLadderBottom: ladders[i] !== undefined,
    })
  }
  return squares
}

/**
 * Get all players currently on a specific square
 * @param players - Array of all players
 * @param squareNumber - The square number to check
 * @returns Array of players on that square
 */
export const getPlayersOnSquare = <T extends { position: number }>(
  players: T[],
  squareNumber: number
): T[] => {
  return players.filter((p) => p.position === squareNumber)
}
