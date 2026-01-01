import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  Share,
} from 'react-native'
import GameBoard from '../components/GameBoard'
import DiceRoller from '../components/DiceRoller'
import GameEventModal from '../components/GameEventModal'
import { multiplayerService, OnlineRoom, OnlinePlayer, GameUpdate } from '../services/multiplayerService'
import { calculateNewPosition, checkWin } from '../utils/boardLogic'
import { STANDARD_BOARD, Player } from '../types/game'
import { CUSTOM_BOARD_CONFIG } from '../config/boardConfig'
import { 
  playGameStartSound, 
  playTurnBellSound, 
  playSnakeSound, 
  playLadderSound,
  startGameBackgroundMusic,
  stopGameBackgroundMusic,
  playWinnerSound
} from '../utils/soundUtils'

interface OnlineGameScreenProps {
  navigation: any
  route: {
    params: {
      room: OnlineRoom
      player: OnlinePlayer
      players?: OnlinePlayer[]
      isHost: boolean
    }
  }
}

export default function OnlineGameScreen({ navigation, route }: OnlineGameScreenProps) {
  const { room: initialRoom, player: myPlayer, isHost } = route.params

  const [room] = useState<OnlineRoom>(initialRoom)
  const [players, setPlayers] = useState<OnlinePlayer[]>(route.params.players || [myPlayer])
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>(initialRoom.status)
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  const [lastDiceRoll, setLastDiceRoll] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDiceResult, setShowDiceResult] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [showSnakeModal, setShowSnakeModal] = useState(false)
  const [showLadderModal, setShowLadderModal] = useState(false)
  const [showBounceModal, setShowBounceModal] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)

  // Subscribe to room updates
  // Cleanup game background music when component unmounts
  useEffect(() => {
    return () => {
      stopGameBackgroundMusic()
    }
  }, [])

  useEffect(() => {
    multiplayerService.subscribeToRoom(room.id, handleGameUpdate)

    // Load initial players if host
    if (isHost) {
      loadPlayers()
    }

    return () => {
      multiplayerService.unsubscribe()
    }
  }, [room.id])

  const loadPlayers = async () => {
    const roomPlayers = await multiplayerService.getPlayersInRoom(room.id)
    if (roomPlayers.length > 0) {
      setPlayers(roomPlayers)
    }
  }

  const handleGameUpdate = useCallback((update: GameUpdate) => {
    console.log('Game update received:', update)

    switch (update.type) {
      case 'player_joined':
        const newPlayer: OnlinePlayer = {
          id: update.data.id,
          roomId: update.data.room_id,
          playerName: update.data.player_name,
          playerColor: update.data.player_color,
          avatar: update.data.avatar,
          position: update.data.position || 1,
          isHost: update.data.is_host,
          isCurrentTurn: update.data.is_current_turn,
          playerOrder: update.data.player_order,
        }
        setPlayers((prev) => {
          if (prev.find((p) => p.id === newPlayer.id)) return prev
          return [...prev, newPlayer]
        })
        break

      case 'player_left':
        setPlayers((prev) => prev.filter((p) => p.id !== update.data.id))
        break

      case 'game_started':
        setGameStatus('playing')
        playGameStartSound()
        startGameBackgroundMusic() // Start game background music
        loadPlayers()
        break

      case 'player_moved':
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === update.data.id
              ? { ...p, position: update.data.position }
              : p
          )
        )
        break

      case 'turn_changed':
        setCurrentTurnIndex(update.data.nextTurnIndex)
        setPlayers((prev) =>
          prev.map((p, i) => ({ ...p, isCurrentTurn: i === update.data.nextTurnIndex }))
        )
        break

      case 'game_ended':
        setGameStatus('finished')
        setWinner(update.data.winnerName)
        playWinnerSound() // Play winner celebration sound for all players
        break
    }
  }, [])

  const isMyTurn = () => {
    if (gameStatus !== 'playing') return false
    const currentPlayer = players[currentTurnIndex]
    return currentPlayer?.id === myPlayer.id
  }

  const handleStartGame = async () => {
    if (!isHost) return
    if (players.length < 2) {
      Alert.alert('Tunggu', 'Minimal 2 pemain untuk mulai')
      return
    }

    const success = await multiplayerService.startGame(room.id)
    if (success) {
      playGameStartSound()
      startGameBackgroundMusic() // Start game background music
      setGameStatus('playing')
    }
  }

  const handleDiceRoll = async (value: number) => {
    if (!isMyTurn() || isAnimating) return

    setLastDiceRoll(value)
    setShowDiceResult(true)

    const currentPlayer = players.find((p) => p.id === myPlayer.id)
    if (!currentPlayer) return

    const previousPos = currentPlayer.position
    const result = calculateNewPosition(
      previousPos,
      value,
      CUSTOM_BOARD_CONFIG.snakes,
      CUSTOM_BOARD_CONFIG.ladders
    )

    // Animate movement
    await animateMovement(myPlayer.id, previousPos, result.position)

    // Show event modal for snake/ladder/bounce and play sounds
    if (result.moveType === 'snake') {
      playSnakeSound()
      setShowSnakeModal(true)
    } else if (result.moveType === 'ladder') {
      playLadderSound()
      setShowLadderModal(true)
    } else if (result.moveType === 'bounce') {
      setShowBounceModal(true)
    }

    // Update position in database
    await multiplayerService.updatePlayerPosition(myPlayer.id, result.position)

    // Record move
    await multiplayerService.recordMove(
      room.id,
      myPlayer.id,
      myPlayer.playerName,
      previousPos,
      result.position,
      value,
      result.moveType
    )

    // Broadcast move
    await multiplayerService.broadcastUpdate({
      type: 'player_moved',
      data: { id: myPlayer.id, position: result.position },
    })

    // Check win
    if (checkWin(result.position)) {
      await multiplayerService.endGame(room.id, myPlayer.playerName)
      playWinnerSound() // Play winner celebration sound
      setWinner(myPlayer.playerName)
      setShowWinnerModal(true)
      setGameStatus('finished')
      return
    }

    // Next turn (with delay for modal)
    const modalDelay = result.moveType !== 'normal' ? 2500 : 1500
    setTimeout(async () => {
      setShowDiceResult(false)
      const nextIndex = (currentTurnIndex + 1) % players.length
      const nextPlayer = players[nextIndex]

      await multiplayerService.updateCurrentTurn(room.id, myPlayer.id, nextPlayer.id)
      await multiplayerService.broadcastUpdate({
        type: 'turn_changed',
        data: { nextTurnIndex: nextIndex },
      })

      setCurrentTurnIndex(nextIndex)
      setPlayers((prev) =>
        prev.map((p, i) => ({ ...p, isCurrentTurn: i === nextIndex }))
      )
    }, 1500)
  }

  const animateMovement = async (playerId: string, from: number, to: number) => {
    setIsAnimating(true)

    const steps = []
    if (to > from) {
      for (let i = from; i <= to; i++) steps.push(i)
    } else {
      for (let i = from; i >= to; i--) steps.push(i)
    }

    for (const step of steps) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, position: step } : p))
      )
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    setIsAnimating(false)
  }

  const handleShareRoom = async () => {
    try {
      await Share.share({
        message: `Ayo main Ular & Tangga!\nKode Room: ${room.roomCode}\nNama Room: ${room.name}`,
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleLeaveRoom = () => {
    Alert.alert('Keluar Room', 'Yakin mau keluar dari room ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await multiplayerService.leaveRoom(myPlayer.id, room.id)
          multiplayerService.unsubscribe()
          navigation.goBack()
        },
      },
    ])
  }

  // Convert OnlinePlayer to Player for components
  const gamePlayers: Player[] = players.map((p) => ({
    id: p.id,
    name: p.playerName,
    color: p.playerColor,
    avatar: p.avatar,
    position: p.position,
    isCurrentTurn: p.isCurrentTurn,
    joinedAt: new Date(),
  }))

  const currentPlayer = gamePlayers[currentTurnIndex]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Pressable onPress={handleShareRoom}>
            <Text style={styles.roomCode}>Kode: {room.roomCode} 📋</Text>
          </Pressable>
        </View>
        <Pressable style={styles.leaveButton} onPress={handleLeaveRoom}>
          <Text style={styles.leaveButtonText}>✕</Text>
        </Pressable>
      </View>

      {/* Waiting Room */}
      {gameStatus === 'waiting' && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingTitle}>⏳ Menunggu Pemain</Text>
          <Text style={styles.waitingSubtitle}>
            {players.length}/4 pemain bergabung
          </Text>

          <View style={styles.playerList}>
            {players.map((p) => (
              <View key={p.id} style={styles.playerItem}>
                <View style={[styles.playerColor, { backgroundColor: p.playerColor }]} />
                <Text style={styles.playerName}>
                  {p.playerName} {p.isHost ? '👑' : ''} {p.id === myPlayer.id ? '(Kamu)' : ''}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.shareHint}>
            Bagikan kode room ke teman untuk bermain bersama!
          </Text>

          {isHost && (
            <Pressable
              style={[
                styles.startButton,
                players.length < 2 && styles.startButtonDisabled,
              ]}
              onPress={handleStartGame}
              disabled={players.length < 2}
            >
              <Text style={styles.startButtonText}>
                {players.length < 2 ? 'Tunggu Pemain Lain...' : '🎮 Mulai Game'}
              </Text>
            </Pressable>
          )}

          {!isHost && (
            <Text style={styles.waitingHost}>Menunggu host memulai game...</Text>
          )}
        </View>
      )}

      {/* Game Playing */}
      {gameStatus === 'playing' && (
        <View style={styles.gameContainer}>
          {/* Compact Header with Turn Info */}
          <View style={styles.gameHeader}>
            <View style={styles.turnInfo}>
              <Text style={styles.turnLabel}>GILIRAN</Text>
              <Text style={styles.turnName}>{currentPlayer?.name}</Text>
            </View>
            <View style={styles.playersRow}>
              {gamePlayers.map((p) => (
                <View key={p.id} style={styles.playerBadge}>
                  <View style={[styles.playerDot, { backgroundColor: p.color }]} />
                  <Text style={styles.playerBadgeName}>{p.name.substring(0, 6)}</Text>
                  <Text style={styles.playerBadgePos}>📍{p.position}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Game Board - Responsive Size */}
          <View style={styles.boardWrapper}>
            <GameBoard players={gamePlayers} />
          </View>

          {/* Dice Section - Fixed at Bottom */}
          <View style={styles.diceSection}>
            <DiceRoller
              onRoll={handleDiceRoll}
              isDisabled={!isMyTurn() || isAnimating}
              isMyTurn={isMyTurn() && !isAnimating}
            />
            />
            {!isMyTurn() && (
              <Text style={styles.waitTurnText}>
                Menunggu {currentPlayer?.name}...
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Dice Result Modal */}
      <Modal visible={showDiceResult} transparent animationType="fade">
        <View style={styles.diceModalOverlay}>
          <View style={styles.diceModalContent}>
            <Text style={styles.diceModalValue}>{lastDiceRoll}</Text>
            <Text style={styles.diceModalText}>🎲</Text>
          </View>
        </View>
      </Modal>

      {/* Winner Modal */}
      <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
        <View style={styles.winnerOverlay}>
          <View style={styles.winnerContent}>
            <Text style={styles.winnerEmoji}>🏆</Text>
            <Text style={styles.winnerTitle}>
              {winner === myPlayer.playerName ? 'Kamu Menang!' : `${winner} Menang!`}
            </Text>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                multiplayerService.unsubscribe()
                navigation.goBack()
              }}
            >
              <Text style={styles.backButtonText}>Kembali ke Lobby</Text>
            </Pressable>
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

      {/* Bounce Event Modal */}
      <GameEventModal
        visible={showBounceModal}
        type="bounce"
        onClose={() => setShowBounceModal(false)}
      />

      {/* Winner Event Modal */}
      <GameEventModal
        visible={showWinnerModal}
        type="winner"
        playerName={winner || ''}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  roomCode: {
    fontSize: 12,
    color: '#e8f5e9',
  },
  leaveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  waitingSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  playerList: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  playerName: {
    fontSize: 16,
    color: '#333',
  },
  shareHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingHost: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  // Game Playing Styles - Responsive
  gameContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gameHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#16213e',
  },
  turnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  turnLabel: {
    fontSize: 11,
    color: '#888',
    marginRight: 8,
  },
  turnName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  playersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  playerBadgeName: {
    fontSize: 11,
    color: '#fff',
    marginRight: 4,
  },
  playerBadgePos: {
    fontSize: 10,
    color: '#aaa',
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  diceSection: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#16213e',
  },
  waitTurnText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  diceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  diceModalValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  diceModalText: {
    fontSize: 48,
    marginTop: 8,
  },
  winnerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '85%',
  },
  winnerEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  winnerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
