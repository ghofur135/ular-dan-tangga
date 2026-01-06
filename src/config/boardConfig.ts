/**
 * Board Configuration - Snake and Ladder positions
 * Update these positions to match your board.png image
 */

export interface BoardConfig {
  snakes: Record<number, number>  // {head: tail}
  ladders: Record<number, number> // {bottom: top}
  funFacts: number[]             // Squares with Fun Facts (Stars)
}

/**
 * Current board configuration
 * Updated to match the actual board.png image positions
 */
export const CUSTOM_BOARD_CONFIG: BoardConfig = {
  // Snakes (head → tail)
  snakes: {
    99: 83,
    95: 36,
    62: 19,
    54: 14,
    17: 6,
  },

  // Ladders (bottom → top)
  ladders: {
    3: 22,
    5: 14,
    9: 31,
    20: 39,
    27: 84,
    51: 67,
    72: 91,
    73: 93,
    88: 99,
  },

  // Fun Fact Slots (Safe spots, spread out)
  funFacts: [
    2, 7, 12, 25, 33, 41, 48, 58, 65, 76, 82, 90, 96
  ]
}

/**
 * Helper function to check if a position has a snake
 */
export const hasSnake = (position: number): boolean => {
  return position in CUSTOM_BOARD_CONFIG.snakes
}

/**
 * Helper function to check if a position has a ladder
 */
export const hasLadder = (position: number): boolean => {
  return position in CUSTOM_BOARD_CONFIG.ladders
}

/**
 * Get snake tail position
 */
export const getSnakeTail = (head: number): number | null => {
  return CUSTOM_BOARD_CONFIG.snakes[head] || null
}

/**
 * Get ladder top position
 */
export const getLadderTop = (bottom: number): number | null => {
  return CUSTOM_BOARD_CONFIG.ladders[bottom] || null
}

/**
 * Debug: Get all snake and ladder positions for verification
 */
export const getAllPositions = () => {
  const snakePositions = Object.entries(CUSTOM_BOARD_CONFIG.snakes).map(([head, tail]) => ({
    type: 'snake',
    head: parseInt(head),
    tail,
  }))

  const ladderPositions = Object.entries(CUSTOM_BOARD_CONFIG.ladders).map(([bottom, top]) => ({
    type: 'ladder',
    bottom: parseInt(bottom),
    top,
  }))

  return { snakes: snakePositions, ladders: ladderPositions }
}