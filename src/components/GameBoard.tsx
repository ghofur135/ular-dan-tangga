
import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, ImageBackground, Animated } from 'react-native'
import { Player, STANDARD_BOARD } from '../types/game'
import { useGameStore } from '../store/gameStore'
import { CUSTOM_BOARD_CONFIG } from '../config/boardConfig'
import { getBoardThemeById } from '../config/boardThemes'
import SnakeDrawing from './SnakeDrawing'
import LadderDrawing from './LadderDrawing'
import PlayerToken from './PlayerToken'

interface GameBoardProps {
  players: Player[]
  boardTheme?: string // Optional prop for multiplayer
  highlightedSquare?: number | null
}

const BOARD_SIZE = 10

// Snake colors for visual variety
const SNAKE_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#EC4899', '#3B82F6']

// Snake and ladder positions with their visual data
const SNAKES_VISUAL = Object.entries(CUSTOM_BOARD_CONFIG.snakes).map(([head, tail], index) => ({
  head: parseInt(head),
  tail: tail,
  color: SNAKE_COLORS[index % SNAKE_COLORS.length],
}))

const LADDERS_VISUAL = Object.entries(CUSTOM_BOARD_CONFIG.ladders).map(([bottom, top]) => ({
  bottom: parseInt(bottom),
  top: top,
}))

/**
 * Get the pixel position for a square number
 * Board uses snake pattern: row 1 (1-10) left-to-right, row 2 (11-20) right-to-left, etc.
 */
const getSquarePosition = (squareNumber: number, cellSize: number): { x: number; y: number } => {
  const adjustedNumber = squareNumber - 1
  const row = Math.floor(adjustedNumber / BOARD_SIZE)
  const col = adjustedNumber % BOARD_SIZE

  // Snake pattern - alternate direction each row
  const actualCol = row % 2 === 0 ? col : (BOARD_SIZE - 1) - col

  // Y is inverted because row 0 is at bottom
  const x = actualCol * cellSize + cellSize / 2
  const y = (BOARD_SIZE - 1 - row) * cellSize + cellSize / 2

  return { x, y }
}

/**
 * Get square number from row and column (for rendering)
 */
const getSquareNumber = (row: number, col: number): number => {
  const actualRow = BOARD_SIZE - 1 - row
  const actualCol = actualRow % 2 === 0 ? col : (BOARD_SIZE - 1) - col
  return actualRow * BOARD_SIZE + actualCol + 1
}

const BlinkingStar = ({ size }: { size: number }) => {
  const opacity = useRef(new Animated.Value(0.3)).current
  const scale = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    const blink = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ])
    )
    blink.start()
    return () => blink.stop()
  }, [])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: opacity,
        transform: [{ scale: scale }],
        zIndex: 5,
        // No background color, just the icon
      }}
    >
      <Text style={{ fontSize: size * 0.6 }}>⭐</Text>
    </Animated.View>
  )
}

/**
 * GameBoard component - 10x10 board with snakes, ladders, and player tokens
 */
export default function GameBoard({ players, boardTheme: propBoardTheme, highlightedSquare }: GameBoardProps) {
  const { isAnimating, animatingPlayerId, animationPosition, selectedBoard } = useGameStore()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  // Use prop if available (for multiplayer), otherwise use store selection (local)
  const themeId = propBoardTheme || selectedBoard
  const boardTheme = getBoardThemeById(themeId)


  // Calculate responsive board size - fit in available space
  const maxBoardWidth = screenWidth - 24
  const maxBoardHeight = screenHeight - 280 // Leave space for header, dice, etc
  const BOARD_WIDTH = Math.min(maxBoardWidth, maxBoardHeight, 400)
  const CELL_SIZE = BOARD_WIDTH / BOARD_SIZE

  // Get display position for a player (considering animation)
  const getPlayerDisplayPosition = (player: Player): number => {
    if (isAnimating && player.id === animatingPlayerId) {
      return animationPosition
    }
    return player.position
  }

  // Generate invisible overlay squares for player positioning
  const renderOverlaySquares = () => {
    const squares = []

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const squareNum = getSquareNumber(row, col)
        const isWinSquare = squareNum === 100
        const isFunFactSquare = CUSTOM_BOARD_CONFIG.funFacts && CUSTOM_BOARD_CONFIG.funFacts.includes(squareNum)
        // const isHighlighted = squareNum === highlightedSquare // Not using blink anymore per request

        // Get players on this square (considering animation position)
        const playersOnSquare = players.filter(
          (p) => getPlayerDisplayPosition(p) === squareNum
        )

        squares.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.overlaySquare,
              {
                width: CELL_SIZE,
                height: CELL_SIZE,
              },
            ]}
          >
            {/* STatic Star for Fun Fact */}
            {isFunFactSquare && (
              <View style={{
                position: 'absolute',
                width: CELL_SIZE,
                height: CELL_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0.9,
                zIndex: 5
              }}>
                <Text style={{ fontSize: CELL_SIZE * 0.4 }}>⭐</Text>
              </View>
            )}

            {/* Square number for debugging - uncomment to see numbers */}
            {/* <Text style={[styles.debugNumber, { fontSize: CELL_SIZE * 0.2 }]}>
              {squareNum}
            </Text> */}

            {/* Win square trophy */}
            {isWinSquare && (
              <Text style={[styles.trophy, { fontSize: CELL_SIZE * 0.5 }]}>🏆</Text>
            )}

            {/* Players on this square */}
            {playersOnSquare.map((player, index) => (
              <View
                key={player.id}
                style={[
                  styles.playerTokenWrapper,
                  {
                    bottom: 2 + index * 6,
                    right: 2 + index * 6,
                  },
                ]}
              >
                <PlayerToken
                  player={player}
                  size={CELL_SIZE * 0.45}
                  isAnimating={isAnimating && player.id === animatingPlayerId}
                />
              </View>
            ))}
          </View>
        )
      }
    }

    return squares
  }

  return (
    <View style={styles.boardWrapper}>
      {/* Jungle border */}
      <View style={styles.jungleBorder}>
        <View style={styles.boardContainer}>
          {/* Board background image */}
          <ImageBackground
            source={boardTheme.image}
            style={[styles.boardBackground, { width: BOARD_WIDTH, height: BOARD_WIDTH }]}
            resizeMode="cover"
          >
            {/* Invisible overlay grid for player positioning */}
            <View style={[styles.overlayGrid, { width: BOARD_WIDTH, height: BOARD_WIDTH }]}>
              {renderOverlaySquares()}
            </View>
          </ImageBackground>

          {/* Snakes overlay */}
          {SNAKES_VISUAL.map((snake, index) => {
            const headPos = getSquarePosition(snake.head, CELL_SIZE)
            const tailPos = getSquarePosition(snake.tail, CELL_SIZE)
            return (
              <View key={`snake-container-${index}`} style={styles.overlayElement}>
                <SnakeDrawing
                  key={`snake-${index}`}
                  startX={headPos.x}
                  startY={headPos.y}
                  endX={tailPos.x}
                  endY={tailPos.y}
                  color={snake.color}
                  cellSize={CELL_SIZE}
                />
              </View>
            )
          })}

          {/* Ladders overlay */}
          {LADDERS_VISUAL.map((ladder, index) => {
            const bottomPos = getSquarePosition(ladder.bottom, CELL_SIZE)
            const topPos = getSquarePosition(ladder.top, CELL_SIZE)
            return (
              <View key={`ladder-container-${index}`} style={styles.overlayElement}>
                <LadderDrawing
                  key={`ladder-${index}`}
                  startX={bottomPos.x}
                  startY={bottomPos.y}
                  endX={topPos.x}
                  endY={topPos.y}
                  cellSize={CELL_SIZE}
                />
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  boardWrapper: {
    alignItems: 'center',
  },
  jungleBorder: {
    padding: 6,
    backgroundColor: '#0D5C4D',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#094D40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  boardContainer: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  boardBackground: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  overlayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlaySquare: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 1,
    position: 'relative',
    backgroundColor: 'transparent', // Invisible overlay
  },
  debugNumber: {
    fontWeight: 'bold',
    color: '#FF0000',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 2,
    borderRadius: 2,
    textAlign: 'center',
  },
  trophy: {
    position: 'absolute',
    top: '25%',
    left: '25%',
  },
  overlayElement: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  playerTokenWrapper: {
    position: 'absolute',
    zIndex: 20,
  },
})
