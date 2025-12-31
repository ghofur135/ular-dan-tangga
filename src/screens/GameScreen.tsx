import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Animated,
} from 'react-native'
import { useGameStore } from '../store/gameStore'
import GameBoard from '../components/GameBoard'
import DiceRoller from '../components/DiceRoller'
import TurnIndicator from '../components/TurnIndicator'
import GameEventModal from '../components/GameEventModal'
import { checkWin } from '../utils/boardLogic'
import { playGameStartSound } from '../utils/soundUtils'

// Dot patterns for dice face
const DOT_PATTERNS: { [key: number]: { top: number; left: number }[] } = {
  1: [{ top: 50, left: 50 }],
  2: [{ top: 25, left: 25 }, { top: 75, left: 75 }],
  3: [{ top: 25, left: 25 }, { top: 50, left: 50 }, { top: 75, left: 75 }],
  4: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
  5: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 50, left: 50 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
  6: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 50, left: 25 }, { top: 50, left: 75 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
}

const LARGE_DICE_SIZE = 120
const LARGE_DOT_SIZE = 20

// DiceFace component for bot dice display
const DiceFace = ({ value }: { value: number }) => (
  <View style={diceStyles.diceFace}>
    {DOT_PATTERNS[value].map((pos, index) => (
      <View
        key={index}
        style={[
          diceStyles.dot,
          {
            top: `${pos.top}%` as any,
            left: `${pos.left}%` as any,
            marginTop: -LARGE_DOT_SIZE / 2,
            marginLeft: -LARGE_DOT_SIZE / 2,
          },
        ]}
      />
    ))}
  </View>
)

const diceStyles = StyleSheet.create({
  diceFace: {
    width: LARGE_DICE_SIZE,
    height: LARGE_DICE_SIZE,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E8E8E8',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  dot: {
    position: 'absolute',
    width: LARGE_DOT_SIZE,
    height: LARGE_DOT_SIZE,
    borderRadius: LARGE_DOT_SIZE / 2,
    backgroundColor: '#2C2C2C',
  },
})

interface GameScreenProps {
  navigation: any
}

/**
 * GameScreen - Main game screen with board, dice, and turn management
 */
export default function GameScreen({ navigation }: GameScreenProps) {
  const [showWinModal, setShowWinModal] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showBotDiceModal, setShowBotDiceModal] = useState(false)
  const [botDiceResult, setBotDiceResult] = useState<number>(1)
  const [botName, setBotName] = useState<string>('')
  const [showSnakeModal, setShowSnakeModal] = useState(false)
  const [showLadderModal, setShowLadderModal] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [winnerName, setWinnerName] = useState<string>('')
  
  const {
    players,
    currentPlayerIndex,
    gameStatus,
    isPaused,
    isAnimating,
    winner,
    currentPlayerId,
    moveHistory,
    processMove,
    endPlayerTurn,
    startGame,
    resetGame,
    pauseGame,
    resumeGame,
    setAnimating,
    setAnimationPosition,
    isMyTurn,
    getCurrentPlayer,
  } = useGameStore()

  const currentPlayer = getCurrentPlayer()
  const canRoll = gameStatus === 'playing' && isMyTurn() && !isPaused && !isAnimating
  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null

  // Add bot player for single player mode
  useEffect(() => {
    if (players.length === 1 && gameStatus === 'waiting') {
      // Auto-add a bot player for testing
      const botColors = ['#45B7D1', '#96CEB4', '#DDA0DD']
      const botNames = ['Bot Alice', 'Bot Bob', 'Bot Charlie']
      
      useGameStore.setState((state) => ({
        players: [
          ...state.players,
          {
            id: `bot-${Date.now()}`,
            name: botNames[0],
            color: botColors[0],
            position: 1,
            isCurrentTurn: false,
            joinedAt: new Date(),
          },
        ],
      }))
    }
  }, [players.length, gameStatus])

  // Show win modal when game ends
  useEffect(() => {
    if (gameStatus === 'finished' && winner) {
      setWinnerName(winner.name)
      setShowWinnerModal(true)
    }
  }, [gameStatus, winner])

  // Animate movement step by step
  const animateMovement = async (
    playerId: string,
    startPos: number,
    endPos: number,
    diceRoll: number,
    onComplete: () => void
  ) => {
    setAnimating(true, playerId)
    
    // Calculate intermediate positions (step by step)
    const steps: number[] = []
    let currentPos = startPos
    
    // Add each step position
    for (let i = 0; i < diceRoll; i++) {
      currentPos++
      if (currentPos <= 100) {
        steps.push(currentPos)
      }
    }
    
    // Animate through each step
    for (let i = 0; i < steps.length; i++) {
      setAnimationPosition(steps[i])
      await new Promise(resolve => setTimeout(resolve, 250)) // 250ms per step
    }
    
    // If landed on snake or ladder, animate that too
    if (endPos !== steps[steps.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setAnimationPosition(endPos)
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    
    setAnimating(false, null)
    onComplete()
  }

  const handleDiceRoll = (result: number) => {
    if (!currentPlayerId) return

    // Get current position before move
    const player = players.find(p => p.id === currentPlayerId)
    if (!player) return
    
    const startPosition = player.position
    const moveResult = processMove(currentPlayerId, result)
    
    if (moveResult) {
      // Animate the movement
      animateMovement(
        currentPlayerId,
        startPosition,
        moveResult.position,
        result,
        () => {
          // Show modal for special moves after animation
          if (moveResult.moveType === 'snake') {
            setShowSnakeModal(true)
          } else if (moveResult.moveType === 'ladder') {
            setShowLadderModal(true)
          }

          // Check for win
          if (checkWin(moveResult.position)) {
            return
          }

          // End turn after animation (with delay for modal)
          const delay = moveResult.moveType !== 'normal' ? 2000 : 500
          setTimeout(() => {
            endPlayerTurn()
          }, delay)
        }
      )
    }
  }

  // Effect to handle bot turns when it becomes bot's turn
  useEffect(() => {
    if (gameStatus !== 'playing' || isPaused || isAnimating) return
    
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return
    
    // If current player is a bot, auto-roll
    if (currentPlayer.id.startsWith('bot-')) {
      const botTimer = setTimeout(() => {
        handleBotTurn(currentPlayer.id)
      }, 1500)
      
      return () => clearTimeout(botTimer)
    }
  }, [currentPlayerIndex, gameStatus, players, isPaused, isAnimating])

  const handleBotTurn = (botId: string) => {
    const state = useGameStore.getState()
    if (state.gameStatus !== 'playing' || state.isPaused || state.isAnimating) return
    
    // Verify it's still this bot's turn
    const botPlayer = state.players[state.currentPlayerIndex]
    if (!botPlayer || botPlayer.id !== botId) return
    
    const startPosition = botPlayer.position
    const botResult = Math.floor(Math.random() * 6) + 1
    
    // Show bot dice result modal
    setBotDiceResult(botResult)
    setBotName(botPlayer.name)
    setShowBotDiceModal(true)
    
    // Process move after showing dice
    setTimeout(() => {
      setShowBotDiceModal(false)
      
      const moveResult = processMove(botId, botResult)
      
      if (moveResult) {
        // Animate bot movement
        animateMovement(
          botId,
          startPosition,
          moveResult.position,
          botResult,
          () => {
            if (!checkWin(moveResult.position)) {
              setTimeout(() => {
                endPlayerTurn()
              }, 500)
            }
          }
        )
      }
    }, 1500) // Show dice for 1.5 seconds
  }

  const handlePauseGame = () => {
    pauseGame()
    setShowPauseModal(true)
  }

  const handleResumeGame = () => {
    setShowPauseModal(false)
    resumeGame()
  }

  const handleQuitGame = () => {
    setShowPauseModal(false)
    resetGame()
    navigation.navigate('Home')
  }

  const handleStartGame = () => {
    if (players.length < 2) {
      Alert.alert('Need More Players', 'At least 2 players are required to start')
      return
    }
    playGameStartSound()
    startGame()
  }

  const handlePlayAgain = () => {
    setShowWinModal(false)
    setShowWinnerModal(false)
    // Reset positions but keep players
    useGameStore.setState((state) => ({
      players: state.players.map((p, i) => ({
        ...p,
        position: 1,
        isCurrentTurn: i === 0,
        diceResult: undefined,
      })),
      currentPlayerIndex: 0,
      gameStatus: 'playing',
      winner: null,
      moveHistory: [],
    }))
  }

  const handleExitGame = () => {
    setShowWinModal(false)
    setShowWinnerModal(false)
    resetGame()
    navigation.navigate('Home')
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Pause Button */}
        {gameStatus === 'playing' && (
          <View style={styles.headerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.pauseButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handlePauseGame}
            >
              <Text style={styles.pauseButtonText}>⏸️ Pause</Text>
            </Pressable>
          </View>
        )}

        {/* Turn Indicator */}
        <TurnIndicator
          currentPlayer={currentPlayer}
          allPlayers={players}
          gameStatus={gameStatus}
        />

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <GameBoard players={players} />
        </View>

        {/* Game Controls */}
        <View style={styles.controlsContainer}>
          {gameStatus === 'waiting' && (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Players: {players.length}/4
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && styles.buttonPressed,
                  players.length < 2 && styles.buttonDisabled,
                ]}
                onPress={handleStartGame}
                disabled={players.length < 2}
              >
                <Text style={styles.startButtonText}>Start Game</Text>
              </Pressable>
            </View>
          )}

          {gameStatus === 'playing' && (
            <DiceRoller onRoll={handleDiceRoll} isDisabled={!canRoll} />
          )}
        </View>

        {/* Move History Preview */}
        {gameStatus === 'playing' && (
          <View style={styles.historyPreview}>
            <Text style={styles.historyTitle}>📜 Last Move</Text>
            {lastMove ? (
              <View style={styles.historyContent}>
                <Text style={styles.historyPlayerName}>{lastMove.playerName}</Text>
                <Text style={styles.historyText}>
                  rolled 🎲 {lastMove.diceRoll} → moved from {lastMove.previousPosition} to {lastMove.newPosition}
                  {lastMove.moveType === 'snake' && ' 🐍'}
                  {lastMove.moveType === 'ladder' && ' 🪜'}
                </Text>
              </View>
            ) : (
              <Text style={styles.historyText}>No moves yet</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Win Modal */}
      <Modal
        visible={showWinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Winner!</Text>
            <Text style={styles.modalWinner}>{winner?.name}</Text>
            <Text style={styles.modalSubtitle}>reached position 100!</Text>
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.playAgainButton]}
                onPress={handlePlayAgain}
              >
                <Text style={styles.modalButtonText}>Play Again</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.exitButton]}
                onPress={handleExitGame}
              >
                <Text style={[styles.modalButtonText, styles.exitButtonText]}>
                  Exit
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pause Modal */}
      <Modal
        visible={showPauseModal}
        transparent
        animationType="fade"
        onRequestClose={handleResumeGame}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>⏸️</Text>
            <Text style={styles.modalTitle}>Game Paused</Text>
            <Text style={styles.pauseSubtitle}>Take a break!</Text>
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.resumeButton]}
                onPress={handleResumeGame}
              >
                <Text style={styles.modalButtonText}>▶️ Resume</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.restartButton]}
                onPress={handlePlayAgain}
              >
                <Text style={styles.modalButtonText}>🔄 Restart</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.quitButton]}
                onPress={handleQuitGame}
              >
                <Text style={[styles.modalButtonText, styles.quitButtonText]}>
                  🚪 Quit Game
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bot Dice Result Modal */}
      <Modal
        visible={showBotDiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.botDiceModalContent}>
            <Text style={styles.botDiceTitle}>🤖 {botName}</Text>
            <Text style={styles.botDiceSubtitle}>rolled the dice!</Text>
            <View style={styles.botDiceContainer}>
              <DiceFace value={botDiceResult} />
            </View>
            <Text style={styles.botDiceNumber}>{botDiceResult}</Text>
          </View>
        </View>
      </Modal>

      {/* Snake Event Modal */}
      <GameEventModal
        visible={showSnakeModal}
        type="snake"
        onClose={() => setShowSnakeModal(false)}
      />

      {/* Ladder Event Modal */}
      <GameEventModal
        visible={showLadderModal}
        type="ladder"
        onClose={() => setShowLadderModal(false)}
      />

      {/* Winner Event Modal */}
      <GameEventModal
        visible={showWinnerModal}
        type="winner"
        playerName={winnerName}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  boardContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  controlsContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  waitingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
  },
  waitingText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyPreview: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600',
  },
  historyContent: {
    alignItems: 'center',
  },
  historyPlayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalWinner: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
  },
  exitButton: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  exitButtonText: {
    color: '#666',
  },
  pauseSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  restartButton: {
    backgroundColor: '#2196F3',
  },
  quitButton: {
    backgroundColor: '#f0f0f0',
  },
  quitButtonText: {
    color: '#E53935',
  },
  botDiceModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  botDiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#45B7D1',
    marginBottom: 4,
  },
  botDiceSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  botDiceContainer: {
    marginBottom: 16,
  },
  botDiceNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
})
