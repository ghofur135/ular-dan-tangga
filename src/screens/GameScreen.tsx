import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native'
import { useGameStore } from '../store/gameStore'
import GameBoard from '../components/GameBoard'
import DiceRoller from '../components/DiceRoller'
import GameEventModal from '../components/GameEventModal'
import { checkWin } from '../utils/boardLogic'
import { 
  playGameStartSound, 
  playTurnBellSound, 
  playSnakeSound, 
  playLadderSound,
  startGameBackgroundMusic,
  stopGameBackgroundMusic,
  pauseGameBackgroundMusic,
  resumeGameBackgroundMusic,
  playWinnerSound
} from '../utils/soundUtils'
import { CollisionEvent } from '../types/game'
import { databaseService } from '../services/databaseService'

// Dot patterns for dice face
const DOT_PATTERNS: { [key: number]: { top: number; left: number }[] } = {
  1: [{ top: 50, left: 50 }],
  2: [{ top: 25, left: 25 }, { top: 75, left: 75 }],
  3: [{ top: 25, left: 25 }, { top: 50, left: 50 }, { top: 75, left: 75 }],
  4: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
  5: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 50, left: 50 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
  6: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 50, left: 25 }, { top: 50, left: 75 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
}

const LARGE_DICE_SIZE = 100
const LARGE_DOT_SIZE = 16

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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    position: 'relative',
    elevation: 8,
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

export default function GameScreen({ navigation }: GameScreenProps) {
  const [showWinModal, setShowWinModal] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showBotDiceModal, setShowBotDiceModal] = useState(false)
  const [botDiceResult, setBotDiceResult] = useState<number>(1)
  const [botName, setBotName] = useState<string>('')
  const [showSnakeModal, setShowSnakeModal] = useState(false)
  const [showLadderModal, setShowLadderModal] = useState(false)
  const [showBounceModal, setShowBounceModal] = useState(false)
  const [showCollisionModal, setShowCollisionModal] = useState(false)
  const [collisionInfo, setCollisionInfo] = useState<{ bumpedPlayerName: string; fromPosition: number; toPosition: number } | null>(null)
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
    hasBonusRoll,
    processMove,
    endPlayerTurn,
    startGame,
    resetGame,
    pauseGame,
    resumeGame,
    setAnimating,
    setAnimationPosition,
    applyCollision,
    isMyTurn,
    getCurrentPlayer,
  } = useGameStore()

  const currentPlayer = getCurrentPlayer()
  const canRoll = gameStatus === 'playing' && isMyTurn() && !isPaused && !isAnimating
  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null

  // Add bot player for single player mode
  useEffect(() => {
    if (players.length === 1 && gameStatus === 'waiting') {
      const botColors = ['#45B7D1', '#96CEB4', '#DDA0DD']
      const botNames = ['Bot Alice', 'Bot Bob', 'Bot Charlie']
      useGameStore.setState((state) => ({
        players: [
          ...state.players,
          { id: `bot-${Date.now()}`, name: botNames[0], color: botColors[0], position: 1, isCurrentTurn: false, joinedAt: new Date() },
        ],
      }))
    }
  }, [players.length, gameStatus])

  useEffect(() => {
    if (gameStatus === 'finished' && winner) {
      stopGameBackgroundMusic() // Stop game music when game ends
      playWinnerSound() // Play winner celebration sound
      setWinnerName(winner.name)
      setShowWinnerModal(true)
      
      // Save stats to database for all players
      const saveStats = async () => {
        for (const player of players) {
          // Skip bot players
          if (player.id.startsWith('bot-')) continue
          
          const won = player.id === winner.id
          const playerMoves = moveHistory.filter(m => m.playerId === player.id).length
          await databaseService.updatePlayerStatsSimple(player.name, won, playerMoves)
        }
      }
      saveStats()
    }
  }, [gameStatus, winner])

  // Cleanup game background music when component unmounts
  useEffect(() => {
    return () => {
      stopGameBackgroundMusic()
    }
  }, [])

  const animateMovement = async (playerId: string, startPos: number, endPos: number, diceRoll: number, onComplete: () => void) => {
    setAnimating(true, playerId)
    const steps: number[] = []
    let currentPos = startPos
    for (let i = 0; i < diceRoll; i++) {
      currentPos++
      if (currentPos <= 100) steps.push(currentPos)
    }
    for (let i = 0; i < steps.length; i++) {
      setAnimationPosition(steps[i])
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    if (endPos !== steps[steps.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 250))
      setAnimationPosition(endPos)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    setAnimating(false, null)
    onComplete()
  }

  const handleDiceRoll = (result: number) => {
    if (!currentPlayerId) return
    const player = players.find(p => p.id === currentPlayerId)
    if (!player) return
    const startPosition = player.position
    const moveResult = processMove(currentPlayerId, result)
    if (moveResult) {
      animateMovement(currentPlayerId, startPosition, moveResult.position, result, () => {
        // Handle collision first
        if (moveResult.collision) {
          setCollisionInfo({
            bumpedPlayerName: moveResult.collision.bumpedPlayerName,
            fromPosition: moveResult.collision.bumpedFromPosition,
            toPosition: moveResult.collision.bumpedToPosition,
          })
          applyCollision(moveResult.collision)
          setShowCollisionModal(true)
        }
        // Then show other modals and play sounds
        else if (moveResult.moveType === 'snake') {
          playSnakeSound()
          setShowSnakeModal(true)
        }
        else if (moveResult.moveType === 'ladder') {
          playLadderSound()
          setShowLadderModal(true)
        }
        else if (moveResult.moveType === 'bounce') setShowBounceModal(true)
        
        if (checkWin(moveResult.position)) return
        
        // Delay based on move type, collision gets extra time
        const delay = moveResult.collision ? 2500 : (moveResult.moveType !== 'normal' ? 2000 : 500)
        setTimeout(() => endPlayerTurn(), delay)
      })
    }
  }

  useEffect(() => {
    if (gameStatus !== 'playing' || isPaused || isAnimating) return
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return
    if (currentPlayer.id.startsWith('bot-')) {
      const botTimer = setTimeout(() => handleBotTurn(currentPlayer.id), 1500)
      return () => clearTimeout(botTimer)
    }
  }, [currentPlayerIndex, gameStatus, players, isPaused, isAnimating])

  const handleBotTurn = (botId: string) => {
    const state = useGameStore.getState()
    if (state.gameStatus !== 'playing' || state.isPaused || state.isAnimating) return
    const botPlayer = state.players[state.currentPlayerIndex]
    if (!botPlayer || botPlayer.id !== botId) return
    const startPosition = botPlayer.position
    const botResult = Math.floor(Math.random() * 6) + 1
    setBotDiceResult(botResult)
    setBotName(botPlayer.name)
    setShowBotDiceModal(true)
    setTimeout(() => {
      setShowBotDiceModal(false)
      const moveResult = processMove(botId, botResult)
      if (moveResult) {
        animateMovement(botId, startPosition, moveResult.position, botResult, () => {
          // Handle collision for bot
          if (moveResult.collision) {
            setCollisionInfo({
              bumpedPlayerName: moveResult.collision.bumpedPlayerName,
              fromPosition: moveResult.collision.bumpedFromPosition,
              toPosition: moveResult.collision.bumpedToPosition,
            })
            applyCollision(moveResult.collision)
            setShowCollisionModal(true)
          }
          
          // Play sound effects for bot moves
          if (moveResult.moveType === 'snake') {
            playSnakeSound()
          } else if (moveResult.moveType === 'ladder') {
            playLadderSound()
          }
          
          if (!checkWin(moveResult.position)) {
            const delay = moveResult.collision ? 2500 : 500
            setTimeout(() => endPlayerTurn(), delay)
          }
        })
      }
    }, 1500)
  }

  const handlePauseGame = () => { 
    pauseGameBackgroundMusic() // Pause game music
    pauseGame()
    setShowPauseModal(true) 
  }
  const handleResumeGame = () => { 
    resumeGameBackgroundMusic() // Resume game music
    setShowPauseModal(false)
    resumeGame() 
  }
  const handleQuitGame = () => { 
    stopGameBackgroundMusic() // Stop game music
    setShowPauseModal(false)
    resetGame()
    navigation.navigate('Home') 
  }
  const handleStartGame = () => {
    if (players.length < 2) { Alert.alert('Butuh Lebih Banyak Pemain', 'Minimal 2 pemain untuk memulai'); return }
    playGameStartSound()
    startGameBackgroundMusic() // Start game background music
    startGame()
  }
  const handlePlayAgain = () => {
    setShowWinModal(false)
    setShowWinnerModal(false)
    useGameStore.setState((state) => ({
      players: state.players.map((p, i) => ({ ...p, position: 1, isCurrentTurn: i === 0, diceResult: undefined })),
      currentPlayerIndex: 0, gameStatus: 'playing', winner: null, moveHistory: [], hasBonusRoll: false, lastCollision: null,
    }))
  }
  const handleExitGame = () => { setShowWinModal(false); setShowWinnerModal(false); resetGame(); navigation.navigate('Home') }

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.turnInfo}>
          <Text style={styles.turnLabel}>GILIRAN</Text>
          <View style={styles.turnNameRow}>
            <Text style={styles.turnName} numberOfLines={1}>{currentPlayer?.name || 'Menunggu...'}</Text>
            {hasBonusRoll && gameStatus === 'playing' && (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusText}>🎲 BONUS!</Text>
              </View>
            )}
          </View>
        </View>
        {gameStatus === 'playing' && (
          <Pressable style={styles.pauseBtn} onPress={handlePauseGame}>
            <Text style={styles.pauseBtnText}>⏸️</Text>
          </Pressable>
        )}
      </View>

      {/* Players Row */}
      <View style={styles.playersRow}>
        {players.map((p) => (
          <View key={p.id} style={[styles.playerBadge, p.isCurrentTurn && styles.playerBadgeActive]}>
            <View style={[styles.playerDot, { backgroundColor: p.color }]} />
            <Text style={styles.playerBadgeName} numberOfLines={1}>{p.name.substring(0, 8)}</Text>
            <Text style={styles.playerBadgePos}>📍{p.position}</Text>
          </View>
        ))}
      </View>

      {/* Game Board - Flex to fill available space */}
      <View style={styles.boardContainer}>
        <GameBoard players={players} />
      </View>

      {/* Bottom Section - Dice & History */}
      <View style={styles.bottomSection}>
        {gameStatus === 'waiting' ? (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Pemain: {players.length}/4</Text>
            <Pressable
              style={[styles.startButton, players.length < 2 && styles.buttonDisabled]}
              onPress={handleStartGame}
              disabled={players.length < 2}
            >
              <Text style={styles.startButtonText}>🎮 Mulai Game</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <DiceRoller 
              onRoll={handleDiceRoll} 
              isDisabled={!canRoll}
              isMyTurn={canRoll && !isAnimating}
            />
            {lastMove && (
              <View style={styles.historyRow}>
                <Text style={styles.historyText}>
                  📜 <Text style={styles.historyName}>{lastMove.playerName}</Text> 🎲{lastMove.diceRoll} → {lastMove.previousPosition}→{lastMove.newPosition}
                  {lastMove.moveType === 'snake' && ' 🐍'}
                  {lastMove.moveType === 'ladder' && ' 🪜'}
                  {lastMove.moveType === 'bounce' && ' ↩️'}
                  {lastMove.moveType === 'collision' && ' 💥'}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Modals */}
      <Modal visible={showWinModal} transparent animationType="fade" onRequestClose={() => setShowWinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Pemenang!</Text>
            <Text style={styles.modalWinner}>{winner?.name}</Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.playAgainButton]} onPress={handlePlayAgain}>
                <Text style={styles.modalButtonText}>Main Lagi</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.exitButton]} onPress={handleExitGame}>
                <Text style={[styles.modalButtonText, styles.exitButtonText]}>Keluar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPauseModal} transparent animationType="fade" onRequestClose={handleResumeGame}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>⏸️</Text>
            <Text style={styles.modalTitle}>Game Dijeda</Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.resumeButton]} onPress={handleResumeGame}>
                <Text style={styles.modalButtonText}>▶️ Lanjutkan</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.restartButton]} onPress={handlePlayAgain}>
                <Text style={styles.modalButtonText}>🔄 Ulang</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.quitButton]} onPress={handleQuitGame}>
                <Text style={[styles.modalButtonText, styles.quitButtonText]}>🚪 Keluar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showBotDiceModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.botDiceModalContent}>
            <Text style={styles.botDiceTitle}>🤖 {botName}</Text>
            <DiceFace value={botDiceResult} />
            <Text style={styles.botDiceNumber}>{botDiceResult}</Text>
          </View>
        </View>
      </Modal>

      <GameEventModal visible={showSnakeModal} type="snake" onClose={() => setShowSnakeModal(false)} />
      <GameEventModal visible={showLadderModal} type="ladder" onClose={() => setShowLadderModal(false)} />
      <GameEventModal visible={showBounceModal} type="bounce" onClose={() => setShowBounceModal(false)} />
      <GameEventModal 
        visible={showCollisionModal} 
        type="collision" 
        collisionInfo={collisionInfo || undefined}
        onClose={() => setShowCollisionModal(false)} 
      />
      <GameEventModal 
        visible={showWinnerModal} 
        type="winner" 
        playerName={winnerName} 
        onPlayAgain={handlePlayAgain}
        onExit={handleExitGame}
      />
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
  },
  turnInfo: {
    flex: 1,
  },
  turnLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  turnName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  turnNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bonusBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bonusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  pauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtnText: {
    fontSize: 18,
  },
  playersRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: '#e8f5e9',
  },
  playerBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  playerBadgeActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  playerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  playerBadgeName: {
    flex: 1,
    fontSize: 11,
    color: '#333',
  },
  playerBadgePos: {
    fontSize: 10,
    color: '#666',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bottomSection: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyRow: {
    marginTop: 4,
    paddingHorizontal: 8,
  },
  historyText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  historyName: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalWinner: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  modalButtons: {
    width: '100%',
    gap: 8,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
  },
  exitButton: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  exitButtonText: {
    color: '#666',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  botDiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#45B7D1',
    marginBottom: 12,
  },
  botDiceNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 12,
  },
})
