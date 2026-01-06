import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGameStore } from '../store/gameStore'
import GameBoard from '../components/GameBoard'
import DiceRoller from '../components/DiceRoller'
import GameEventModal from '../components/GameEventModal'
import GenericModal from '../components/GenericModal'
import { checkWin, calculateNewPosition } from '../utils/boardLogic'
import { CUSTOM_BOARD_CONFIG } from '../config/boardConfig'
import {
  playGameStartSound,
  playSnakeSound,
  playLadderSound,
  startGameBackgroundMusic,
  stopGameBackgroundMusic,
  pauseGameBackgroundMusic,
  resumeGameBackgroundMusic,
  playWinnerSound
} from '../utils/soundUtils'
import { databaseService } from '../services/databaseService'
import EducationModal from '../components/EducationModal'
import { educationService } from '../services/educationService'
import { EducationFact, EducationQuestion } from '../types/education'

// Module-level lock to prevent race conditions across re-renders or multiple instances
let globalBotProcessingLock: string | null = null;

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

  const insets = useSafeAreaInsets()
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
    teleportPlayer,
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
    isEducationMode,
    setEducationMode,
  } = useGameStore()
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

  // Power Ups State
  const [shieldCharges, setShieldCharges] = useState(0)
  const [shieldCooldownEnd, setShieldCooldownEnd] = useState(0)
  const [customDiceCooldownEnd, setCustomDiceCooldownEnd] = useState(0)
  const [teleportUsed, setTeleportUsed] = useState(false)

  const [showCustomDiceModal, setShowCustomDiceModal] = useState(false)

  // Education Mode State
  const [showEducationModal, setShowEducationModal] = useState(false)
  const [educationType, setEducationType] = useState<'quiz' | 'fact'>('quiz')
  const [educationData, setEducationData] = useState<EducationQuestion | EducationFact | null>(null)
  const [pendingMove, setPendingMove] = useState<{ result: number; prediction: any } | null>(null)
  const [highlightedSquare, setHighlightedSquare] = useState<number | null>(null)

  // GLOBAL LOCK REPLACEMENT: Use a ref that syncs with global if needed, but for now relies on the static variable
  // checking below.
  const processingBotId = useRef<string | null>(null)
  const gameSessionId = useRef<number>(0) // Track game session to prevent stale callbacks
  const botRollCount = useRef<number>(0) // Safety counter to prevent infinite loops

  // PowerUp Confirmation/Info Modal
  const [showPowerUpModal, setShowPowerUpModal] = useState(false)
  const [powerUpModalConfig, setPowerUpModalConfig] = useState<any>({
    type: 'info',
    title: '',
    message: '',
    icon: '',
    onConfirm: undefined,
    confirmText: 'OK',
    cancelText: 'Batal'
  })

  // Timer refresh for power-up cooldowns
  const [timerTick, setTimerTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTimerTick(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Function to handle bot turn (can be called recursively for bonus roll)
  const executeBotTurn = (botPlayerId: string, sessionId: number, isRecursiveCall = false) => {
    // SAFETY CHECK: Abort if session changed (game was reset)
    if (sessionId !== gameSessionId.current) {
      globalBotProcessingLock = null
      processingBotId.current = null
      return
    }

    // SAFETY CHECK: Prevent infinite loops - max 10 rolls per turn sequence
    botRollCount.current += 1
    if (botRollCount.current > 10) {
      console.warn('Bot roll count exceeded limit, aborting')
      globalBotProcessingLock = null
      processingBotId.current = null
      botRollCount.current = 0
      return
    }

    const state = useGameStore.getState()
    if (state.gameStatus !== 'playing' || state.isPaused || state.isAnimating) {
      globalBotProcessingLock = null
      processingBotId.current = null
      return
    }

    const botPlayer = state.players.find(p => p.id === botPlayerId)
    if (!botPlayer || !botPlayer.id.startsWith('bot-')) {
      globalBotProcessingLock = null
      processingBotId.current = null
      return
    }

    // CRITICAL FIX: Always reset hasBonusRoll at the start of bot turn to prevent stale state
    // This ensures bot doesn't get bonus rolls from previous turns
    if (state.hasBonusRoll) {
      console.log('Resetting stale hasBonusRoll state for bot at turn start')
      useGameStore.setState({ hasBonusRoll: false })
    }

    // Roll dice for bot
    const diceResult = Math.floor(Math.random() * 6) + 1
    console.log(`[Bot Turn] ${botPlayer.name} rolled ${diceResult}`)
    setBotName(botPlayer.name)
    setBotDiceResult(diceResult)
    setShowBotDiceModal(true)

    // Process bot move after showing dice
    setTimeout(() => {
      // SAFETY CHECK: Abort if session changed
      if (sessionId !== gameSessionId.current) {
        globalBotProcessingLock = null
        processingBotId.current = null
        setShowBotDiceModal(false)
        return
      }

      setShowBotDiceModal(false)

      const latestState = useGameStore.getState()
      if (latestState.gameStatus !== 'playing') {
        globalBotProcessingLock = null
        processingBotId.current = null
        return
      }

      const latestBot = latestState.players.find(p => p.id === botPlayerId)
      if (!latestBot) {
        globalBotProcessingLock = null
        processingBotId.current = null
        return
      }

      const startPosition = latestBot.position
      const moveResult = latestState.processMove(botPlayerId, diceResult)

      if (moveResult) {
        setAnimating(true, botPlayerId)

        // Animate bot movement
        const animateBot = async () => {
          // SAFETY CHECK: Abort if session changed
          if (sessionId !== gameSessionId.current) {
            setAnimating(false, null)
            globalBotProcessingLock = null
            processingBotId.current = null
            return
          }

          const steps: number[] = []
          let currentPos = startPosition

          for (let i = 0; i < diceResult; i++) {
            currentPos++
            if (currentPos <= 100) steps.push(currentPos)
          }

          for (let i = 0; i < steps.length; i++) {
            if (sessionId !== gameSessionId.current) {
              setAnimating(false, null)
              globalBotProcessingLock = null
              processingBotId.current = null
              return
            }
            setAnimationPosition(steps[i])
            await new Promise(resolve => setTimeout(resolve, 200))
          }

          if (moveResult.position !== steps[steps.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 250))
            setAnimationPosition(moveResult.position)
            await new Promise(resolve => setTimeout(resolve, 300))
          }

          setAnimating(false, null)

          // Handle collision
          if (moveResult.collision) {
            setCollisionInfo({
              bumpedPlayerName: moveResult.collision.bumpedPlayerName,
              fromPosition: moveResult.collision.bumpedFromPosition,
              toPosition: moveResult.collision.bumpedToPosition,
            })
            applyCollision(moveResult.collision)
            setShowCollisionModal(true)
          } else if (moveResult.moveType === 'snake') {
            playSnakeSound()
            setShowSnakeModal(true)
          } else if (moveResult.moveType === 'ladder') {
            playLadderSound()
            setShowLadderModal(true)
          } else if (moveResult.moveType === 'bounce') {
            setShowBounceModal(true)
          }

          // Check win
          if (checkWin(moveResult.position)) {
            globalBotProcessingLock = null
            processingBotId.current = null
            botRollCount.current = 0
            return
          }

          // End turn after delay
          const delay = moveResult.collision ? 2500 : (moveResult.moveType !== 'normal' ? 2000 : 500)
          setTimeout(() => {
            // SAFETY CHECK: Abort if session changed
            if (sessionId !== gameSessionId.current) {
              globalBotProcessingLock = null
              processingBotId.current = null
              return
            }

            // CRITICAL FIX: Get state AFTER checking session ID to prevent race condition
            const stateBeforeEnd = useGameStore.getState()

            // SAFETY CHECK: Double check we're still playing and it's still bot's turn
            if (stateBeforeEnd.gameStatus !== 'playing' ||
              stateBeforeEnd.players[stateBeforeEnd.currentPlayerIndex]?.id !== botPlayerId) {
              globalBotProcessingLock = null
              processingBotId.current = null
              return
            }

            // CRITICAL FIX: Check if bot got bonus roll (rolled 6)
            // We should ONLY check the actual dice result, not the potentially stale hasBonusRoll state
            const actuallyHasBonusRoll = diceResult === 6

            // CRITICAL FIX: Always reset hasBonusRoll to prevent stale state
            if (stateBeforeEnd.hasBonusRoll) {
              console.log('Resetting hasBonusRoll state for bot')
              useGameStore.setState({ hasBonusRoll: false })
            }

            // CRITICAL FIX: Only end turn if bot didn't roll a 6
            if (!actuallyHasBonusRoll) {
              useGameStore.setState({ hasBonusRoll: false })
              endPlayerTurn()
              globalBotProcessingLock = null
              processingBotId.current = null
              botRollCount.current = 0 // Reset counter when turn ends normally
            } else {
              // If bot rolled a 6, execute another turn after delay
              console.log(`[Bot Turn] Bonus roll triggered for ${botPlayerId}`)
              setTimeout(() => {
                executeBotTurn(botPlayerId, sessionId, true) // Mark as recursive call
              }, 1000)
            }
          }, delay)
        }

        animateBot()
      } else {
        globalBotProcessingLock = null
        processingBotId.current = null
      }
    }, 1500)
  }

  // Bot turn handler
  useEffect(() => {
    // Skip if not playing or paused or animating
    if (gameStatus !== 'playing' || isPaused || isAnimating) return

    const currentBot = players[currentPlayerIndex]
    // Skip if no player or not a bot
    if (!currentBot || !currentBot.id.startsWith('bot-')) return

    // Prevent double processing
    if (processingBotId.current === currentBot.id) {
      // console.log(`[Effect] Skipping ${currentBot.id}, already processing`) // Optional: too noisy?
      return
    }

    // Capture current session ID
    const currentSessionId = gameSessionId.current

    console.log(`[Effect] Scheduling bot turn for ${currentBot.name} (ID: ${currentBot.id})`)
    const botTimer = setTimeout(() => {
      console.log(`[Effect] Timer fired for ${currentBot.name}. ProcessingId: ${processingBotId.current}`)

      // SAFETY CHECK: Abort if session changed (game was reset)
      if (currentSessionId !== gameSessionId.current) return

      // Re-check state inside timeout to avoid stale closure
      const state = useGameStore.getState()
      if (state.gameStatus !== 'playing' || state.isPaused || state.isAnimating) return

      const botPlayer = state.players[state.currentPlayerIndex]

      // Strict check: Is it actually this bot's turn right now?
      if (!botPlayer || !botPlayer.id.startsWith('bot-') || botPlayer.id !== currentBot.id) {
        console.log(`[Effect] Turn validation failed for ${currentBot.name}. Current: ${botPlayer?.name}`)
        return
      }

      // GLOBAL LOCK CHECK
      if (globalBotProcessingLock && globalBotProcessingLock === botPlayer.id && !processingBotId.current) {
        // This means another instance or previous timer already grabbed it
        console.log(`[Effect] Aborting execution - Global Lock held by ${globalBotProcessingLock}`)
        return
      }

      // Double check we're not already processing this bot
      if (processingBotId.current === botPlayer.id) {
        console.log(`[Effect] Aborting execution - Bot ${botPlayer.name} already processing (Ref check)`)
        return
      }

      if (processingBotId.current && processingBotId.current !== botPlayer.id) {
        console.log(`[Effect] Busy with another player: ${processingBotId.current}`)
        return
      }

      if (globalBotProcessingLock && globalBotProcessingLock !== botPlayer.id) {
        console.log(`[Effect] Busy with global lock: ${globalBotProcessingLock}`)
        return
      }

      console.log(`[Effect] LOCKING processing for ${botPlayer.name}`)
      processingBotId.current = botPlayer.id
      globalBotProcessingLock = botPlayer.id
      botRollCount.current = 0

      executeBotTurn(botPlayer.id, currentSessionId)
    }, 1000)

    return () => {
      console.log(`[Effect] Cleanup - Cancelling timer for ${currentBot.name}`)
      clearTimeout(botTimer)
    }
  }, [currentPlayerIndex, gameStatus, players, isPaused, isAnimating])

  /* Hook moved to top */

  const currentPlayer = getCurrentPlayer()
  const canRoll = gameStatus === 'playing' && isMyTurn() && !isPaused && !isAnimating
  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null

  // Add bot player for single player mode
  // Add bot player for single player mode
  // Add bot player for single player mode
  useEffect(() => {
    const hasBot = players.some(p => p.id.startsWith('bot-'))
    if (players.length === 1 && gameStatus === 'waiting' && !hasBot) {
      const botColors = ['#45B7D1', '#96CEB4', '#DDA0DD']
      const botNames = ['Bot Alice', 'Bot Bob', 'Bot Charlie']

      useGameStore.setState((state) => {
        // Double check inside setState to prevent race conditions
        if (state.players.some(p => p.id.startsWith('bot-'))) return state

        // Find human player to set as currentPlayerId
        const humanPlayer = state.players.find(p => !p.id.startsWith('bot-'))

        return {
          players: [
            ...state.players,
            { id: `bot-${Date.now()}`, name: botNames[0], color: botColors[0], position: 1, isCurrentTurn: false, joinedAt: new Date() },
          ],
          currentPlayerId: humanPlayer?.id || state.currentPlayerId, // Ensure currentPlayerId is set
        }
      })
    }
  }, [players.length, gameStatus, players])

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

    // Teleport or simple jump logic
    if (diceRoll === 0) {
      // Teleport animation (just wait then jump)
      await new Promise(resolve => setTimeout(resolve, 500))
      setAnimationPosition(endPos)
      await new Promise(resolve => setTimeout(resolve, 500))
      setAnimating(false, null)
      onComplete()
      return
    }

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

  const handleDiceRoll = async (result: number, isCustom = false) => {
    console.log(`[Player Turn] Dice rolled: ${result} (Custom: ${isCustom})`)
    if (!currentPlayerId) return
    const player = players.find(p => p.id === currentPlayerId)
    if (!player) return

    // Cooldown check for custom dice
    if (isCustom) {
      setCustomDiceCooldownEnd(Date.now() + 60000) // 60s cooldown
    }

    const startPosition = player.position

    // Predict snake using helpers
    const prediction = calculateNewPosition(
      startPosition,
      result,
      CUSTOM_BOARD_CONFIG.snakes,
      CUSTOM_BOARD_CONFIG.ladders
    )

    let ignoreSnakes = false
    if (prediction.moveType === 'snake' && shieldCharges > 0) {
      setShieldCharges(prev => {
        const newVal = prev - 1
        return newVal
      })
      ignoreSnakes = true
      // Check cooldown after decrement? 
      // Requirement: "delay 2 menit ketika sudah di gunakan". 
      // If we depleted last charge:
      if (shieldCharges === 1) { // 1 -> 0
        setShieldCooldownEnd(Date.now() + 120000)
      }
      setPowerUpModalConfig({
        type: 'success',
        title: '🛡️ Perisai Aktif!',
        message: 'Kamu berhasil menghindari ular!',
        icon: '🛡️',
      })
      setShowPowerUpModal(true)
    }

    // Education Mode Logic Interception
    if (isEducationMode) {
      if (prediction.moveType === 'snake') {
        const question = await educationService.getRandomQuestion(undefined, 'medium')
        if (question) {
          setPendingMove({ result, prediction })
          setEducationType('quiz')
          setEducationData(question)
          setShowEducationModal(true)
          return
        }
      } else if (prediction.moveType === 'ladder') {
        const question = await educationService.getRandomQuestion(undefined, 'hard') // Harder for ladders!
        if (question) {
          setPendingMove({ result, prediction })
          setEducationType('quiz')
          setEducationData(question)
          setShowEducationModal(true)
          return
        }
      } else if (prediction.moveType === 'normal' && Math.random() < 0.3) {
        // 30% chance for Fun Fact on normal moves
        const fact = await educationService.getRandomFact()
        if (fact) {
          // Highlight the square with glow effect before showing fact
          setHighlightedSquare(prediction.position)
          await new Promise(resolve => setTimeout(resolve, 1500)) // Blink for 1.5s
          setHighlightedSquare(null)

          setPendingMove({ result, prediction })
          setEducationType('fact')
          setEducationData(fact)
          setShowEducationModal(true)
          return
        }
      }
    }

    const moveResult = processMove(currentPlayerId, result, { ignoreSnakes })

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

  const handleActivateShield = () => {
    if (Date.now() < shieldCooldownEnd) {
      setPowerUpModalConfig({
        type: 'info',
        title: 'Pendinginan ❄️',
        message: 'Perisai sedang pendinginan! Sabar ya.',
        icon: '⏳'
      })
      setShowPowerUpModal(true)
      return
    }
    // Activate
    setShieldCharges(3)
    setShieldCooldownEnd(Date.now() + 120000)

    setPowerUpModalConfig({
      type: 'success',
      title: 'Perisai Diaktifkan',
      message: 'Kamu memiliki 3x ketahanan terhadap ular!',
      icon: '🛡️'
    })
    setShowPowerUpModal(true)
  }

  const handleTeleport = () => {
    if (teleportUsed) return
    if (!currentPlayerId) return
    if (!canRoll) return

    // Pre-check for nearest ladder to validate beforehand
    const ladders = CUSTOM_BOARD_CONFIG.ladders
    const sortedLadderBottoms = Object.keys(ladders).map(Number).sort((a, b) => a - b)
    const player = players.find(p => p.id === currentPlayerId)
    if (!player) return

    // Check if player is already in restricted zone for teleport checks logic generally
    // (Though the prompt specifically said restricted DESTINATIONS for teleport)

    const nextLadderBottom = sortedLadderBottoms.find(b => b > player.position)

    // Validation logic moved here to give alert BEFORE confirming
    if (nextLadderBottom) {
      const targetPos = ladders[nextLadderBottom]
      if ([91, 93, 99].includes(targetPos)) {
        setPowerUpModalConfig({
          type: 'error',
          title: 'Sinyal Kacau 📡',
          message: 'Tangga ini terlalu dekat dengan garis finish! Teleport tidak dapat mengunci target.',
          icon: '🚫'
        })
        setShowPowerUpModal(true)
        return
      }
    }

    // confirm
    setPowerUpModalConfig({
      type: 'confirmation',
      title: 'Teleport 🚀',
      message: 'Pindah ke tangga terdekat di depanmu? Hanya bisa dipakai 1x.',
      icon: '🚀',
      confirmText: 'Teleport',
      cancelText: 'Batal',
      onConfirm: () => {
        const result = teleportPlayer(currentPlayerId)
        if (!result) {
          setPowerUpModalConfig({
            type: 'error',
            title: 'Gagal',
            message: 'Tidak ada tangga di depanmu!',
            icon: '❌'
          })
          setShowPowerUpModal(true)
          return
        }
        setTeleportUsed(true)
        playLadderSound()

        // Animate
        animateMovement(currentPlayerId, player?.position || 1, result.position, 0, () => {
          if (result.collision) {
            // handle collision
            setCollisionInfo({
              bumpedPlayerName: result.collision.bumpedPlayerName,
              fromPosition: result.collision.bumpedFromPosition,
              toPosition: result.collision.bumpedToPosition,
            })
            applyCollision(result.collision)
            setShowCollisionModal(true)
          }
          if (checkWin(result.position)) return
          setTimeout(() => endPlayerTurn(), 1000)
        })
      }
    })
    setShowPowerUpModal(true)
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

    // Reset all bot-related state - CRITICAL for preventing infinite loop
    processingBotId.current = null
    gameSessionId.current += 1 // Increment session to invalidate any pending callbacks
    botRollCount.current = 0 // Reset roll counter
    setShowBotDiceModal(false)
    setBotDiceResult(1)
    setBotName('')

    // Reset powerups
    setShieldCharges(0)
    setShieldCooldownEnd(0)
    setCustomDiceCooldownEnd(0)
    setTeleportUsed(false)

    // CRITICAL FIX: Completely reset all game state to prevent any carryover
    // This ensures no stale state from previous game affects the new game
    useGameStore.setState((state) => {
      // Find human player (non-bot) to set as currentPlayerId
      const humanPlayer = state.players.find(p => !p.id.startsWith('bot-'))

      // CRITICAL: Create completely fresh player objects to prevent any state carryover
      const freshPlayers = state.players.map((p, i) => {
        // Human player starts first
        const isFirstPlayer = !p.id.startsWith('bot-')
        return {
          ...p,
          position: 1,
          isCurrentTurn: isFirstPlayer,
          diceResult: undefined, // CRITICAL: Explicitly undefined for all players
        }
      })

      // Find the index of the human player to set as currentPlayerIndex
      const humanPlayerIndex = freshPlayers.findIndex(p => !p.id.startsWith('bot-'))

      return {
        players: freshPlayers,
        currentPlayerIndex: humanPlayerIndex >= 0 ? humanPlayerIndex : 0,
        gameStatus: 'playing',
        winner: null,
        moveHistory: [],
        hasBonusRoll: false, // CRITICAL: Explicitly reset to false
        lastCollision: null,
        isAnimating: false,
        animatingPlayerId: null,
        isPaused: false,
        currentPlayerId: humanPlayer?.id || null // Set human player as currentPlayerId
      }
    })
  }
  const handleExitGame = () => { setShowWinModal(false); setShowWinnerModal(false); resetGame(); navigation.navigate('Home') }

  // Timers Format
  const getCooldownText = (end: number) => {
    const diff = Math.ceil((end - Date.now()) / 1000)
    if (diff <= 0) return ''
    return `${diff}s`
  }

  const renderPowerUps = () => {
    // Debug: Check why power-ups are not showing
    const myTurn = isMyTurn()
    const currentPlayer = getCurrentPlayer()

    if (!myTurn || gameStatus !== 'playing') return null

    const shieldReady = Date.now() > shieldCooldownEnd
    const customDiceReady = Date.now() > customDiceCooldownEnd

    // Check if in restricted zone (91-100)
    const playerInGame = players.find(p => p.id === currentPlayerId)
    const isRestrictedZone = (playerInGame?.position || 0) >= 91

    const showRestrictedAlert = () => {
      setPowerUpModalConfig({
        type: 'info',
        title: 'Zona Berbahaya ⚠️',
        message: 'Power Up tidak dapat digunakan di area krusial (91-100). Buktikan kemampuan murnimu!',
        icon: '🚫'
      })
      setShowPowerUpModal(true)
    }

    return (
      <View style={styles.powerUpsRow}>
        {/* Custom Dice */}
        <Pressable
          style={[styles.powerUpBtn, (!customDiceReady || isRestrictedZone) && styles.powerUpDisabled]}
          onPress={() => {
            if (isRestrictedZone) {
              showRestrictedAlert()
              return
            }
            if (customDiceReady && canRoll) setShowCustomDiceModal(true)
          }}
        >
          <Text style={styles.powerUpIcon}>🎲</Text>
          {isRestrictedZone ? (
            <Text style={[styles.powerUpLabel, { fontSize: 8 }]}>Zona Akhir</Text>
          ) : customDiceReady ? (
            <Text style={styles.powerUpLabel}>Pilih</Text>
          ) : (
            <Text style={styles.powerUpTimer}>{getCooldownText(customDiceCooldownEnd)}</Text>
          )}
        </Pressable>

        {/* Shield */}
        <Pressable
          style={[styles.powerUpBtn, ((!shieldReady && shieldCharges === 0) || isRestrictedZone) && styles.powerUpDisabled, shieldCharges > 0 && styles.powerUpActive]}
          onPress={() => {
            if (shieldCharges > 0) {
              setPowerUpModalConfig({
                type: 'info',
                title: 'Perisai Aktif 🛡️',
                message: `Sisa ${shieldCharges}x tahan ular! Aman terkendali.`,
                icon: '🛡️'
              })
              setShowPowerUpModal(true)
              return
            }

            if (isRestrictedZone) {
              showRestrictedAlert()
              return
            }

            // Only allowing activation if ready and not already stacked?
            // "delay 2 mins when USED". 
            if (shieldReady && shieldCharges === 0) handleActivateShield()
            else if (!shieldReady && shieldCharges === 0) {
              setPowerUpModalConfig({
                type: 'info',
                title: 'Pendinginan ❄️',
                message: `Tunggu ${getCooldownText(shieldCooldownEnd)} lagi yaa!`,
                icon: '⏳'
              })
              setShowPowerUpModal(true)
            }
          }}
        >
          <Text style={styles.powerUpIcon}>🛡️</Text>
          {shieldCharges > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{shieldCharges}</Text>
            </View>
          ) : isRestrictedZone ? (
            <Text style={[styles.powerUpLabel, { fontSize: 8 }]}>Zona Akhir</Text>
          ) : (!shieldReady && (
            <Text style={styles.powerUpTimer}>{getCooldownText(shieldCooldownEnd)}</Text>
          )
          )}
          <Text style={[styles.powerUpLabel, shieldCharges > 0 && { color: '#fff', fontWeight: 'bold' }]}>
            {shieldCharges > 0 ? "Aktif" : (isRestrictedZone ? "🚫" : "Anti Ular")}
          </Text>
        </Pressable>

        {/* Teleport */}
        <Pressable
          style={[styles.powerUpBtn, teleportUsed && styles.powerUpDisabled]}
          onPress={handleTeleport}
        >
          <Text style={styles.powerUpIcon}>🚀</Text>
          <Text style={styles.powerUpLabel}>{teleportUsed ? "Habis" : "Teleport"}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" translucent={false} />
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
        <GameBoard players={players} highlightedSquare={highlightedSquare} />
      </View>

      {/* Power Ups (Floating or Row) */}
      {renderPowerUps()}

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
              onRoll={(v) => handleDiceRoll(v, false)}
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
                  {lastMove.moveType === 'teleport' && ' 🚀'}
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
              <Pressable
                style={[styles.modalButton, { backgroundColor: isEducationMode ? '#4ECDC4' : '#e0e0e0', marginBottom: 10 }]}
                onPress={() => setEducationMode(!isEducationMode)}
              >
                <Text style={[styles.modalButtonText, { color: isEducationMode ? 'white' : '#666' }]}>
                  {isEducationMode ? '🎓 Mode Edukasi: ON' : '🎓 Mode Edukasi: OFF'}
                </Text>
              </Pressable>

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

      {/* Custom Dice Modal */}
      <Modal visible={showCustomDiceModal} transparent animationType="fade" onRequestClose={() => setShowCustomDiceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Angka Dadu</Text>
            <View style={styles.diceGrid}>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <Pressable
                  key={num}
                  style={styles.diceOption}
                  onPress={() => {
                    setShowCustomDiceModal(false)
                    handleDiceRoll(num, true)
                  }}
                >
                  <DiceFace value={num} />
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.modalButton, styles.exitButton, { marginTop: 16 }]} onPress={() => setShowCustomDiceModal(false)}>
              <Text style={[styles.modalButtonText, styles.exitButtonText]}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showBotDiceModal} transparent animationType="fade" onRequestClose={() => { }}>
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

      <GenericModal
        visible={showPowerUpModal}
        type={powerUpModalConfig.type}
        title={powerUpModalConfig.title}
        message={powerUpModalConfig.message}
        icon={powerUpModalConfig.icon}
        confirmText={powerUpModalConfig.confirmText}
        cancelText={powerUpModalConfig.cancelText}
        onConfirm={powerUpModalConfig.onConfirm}
        onClose={() => setShowPowerUpModal(false)}
      />

      <EducationModal
        visible={showEducationModal}
        type={educationType}
        data={educationData}
        onClose={(success) => {
          setShowEducationModal(false)

          if (!pendingMove || !currentPlayerId) return
          const { result, prediction } = pendingMove
          const startPosition = players.find(p => p.id === currentPlayerId)?.position || 1

          let ignoreSnakes = false
          let ignoreLadders = false

          if (educationType === 'quiz') {
            if (success) {
              // Correct answer!
              if (prediction.moveType === 'snake') {
                // Immunity!
                ignoreSnakes = true
                setPowerUpModalConfig({
                  type: 'success',
                  title: 'Jawaban Benar!',
                  message: 'Kamu lolos dari ular! 🐍✨',
                  icon: '✅'
                })
                setShowPowerUpModal(true)
              } else if (prediction.moveType === 'ladder') {
                // Climb!
                // Default behavior is climbing, so nothing to change
                setPowerUpModalConfig({
                  type: 'success',
                  title: 'Hebat!',
                  message: 'Kamu naik tangga! 🪜🚀',
                  icon: '🎉'
                })
                setShowPowerUpModal(true)
              }
            } else {
              // Wrong answer
              if (prediction.moveType === 'snake') {
                // Slide down (default)
                setPowerUpModalConfig({
                  type: 'error',
                  title: 'Salah...',
                  message: 'Yah, kamu harus turun... 😢',
                  icon: '❌'
                })
                setShowPowerUpModal(true)
              } else if (prediction.moveType === 'ladder') {
                // Denied!
                ignoreLadders = true
                setPowerUpModalConfig({
                  type: 'error',
                  title: 'Sayang Sekali',
                  message: 'Gagal naik tangga. Coba lagi nanti! 🛑',
                  icon: '🔒'
                })
                setShowPowerUpModal(true)
              }
            }
          }

          // Execute Move after delay to let feedback show
          setTimeout(() => {
            const moveResult = processMove(currentPlayerId, result, { ignoreSnakes, ignoreLadders })
            if (moveResult) {
              animateMovement(currentPlayerId, startPosition, moveResult.position, result, () => {
                if (moveResult.collision) {
                  setCollisionInfo({
                    bumpedPlayerName: moveResult.collision.bumpedPlayerName,
                    fromPosition: moveResult.collision.bumpedFromPosition,
                    toPosition: moveResult.collision.bumpedToPosition,
                  })
                  applyCollision(moveResult.collision)
                  setShowCollisionModal(true)
                } else if (moveResult.moveType === 'snake') {
                  playSnakeSound()
                  setShowSnakeModal(true)
                } else if (moveResult.moveType === 'ladder') {
                  playLadderSound()
                  setShowLadderModal(true)
                } else if (moveResult.moveType === 'bounce') {
                  setShowBounceModal(true)
                }

                if (checkWin(moveResult.position)) return

                const delay = moveResult.collision ? 2500 : (moveResult.moveType !== 'normal' ? 2000 : 500)
                setTimeout(() => endPlayerTurn(), delay)
              })
            }
          }, 1500)

          setPendingMove(null)
        }}
      />
    </View>
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
  // Power Ups
  powerUpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: '#fff',
  },
  powerUpBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    minHeight: 60,
    justifyContent: 'center',
  },
  powerUpActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  powerUpDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  powerUpIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  powerUpLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  powerUpTimer: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E53935',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E53935',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  diceOption: {
    transform: [{ scale: 0.8 }],
  }
})
