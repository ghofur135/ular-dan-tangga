import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  Share,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GameBoard from '../components/GameBoard'
import DiceRoller from '../components/DiceRoller'
import GameEventModal from '../components/GameEventModal'
import { multiplayerService, OnlineRoom, OnlinePlayer, GameUpdate } from '../services/multiplayerService'
import { calculateNewPosition, checkWin } from '../utils/boardLogic'
import { Player } from '../types/game'
import { CUSTOM_BOARD_CONFIG } from '../config/boardConfig'
import {
  playGameStartSound,
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
  const insets = useSafeAreaInsets()

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
  const [showLeaveModal, setShowLeaveModal] = useState(false)

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

      case 'host_left':
        // Host has left, show alert and end game
        Alert.alert(
          'Game Berakhir',
          update.data.message || 'Host telah meninggalkan permainan. Game berakhir.',
          [
            {
              text: 'OK',
              onPress: () => {
                multiplayerService.unsubscribe()
                navigation.goBack()
              },
            },
          ]
        )
        setGameStatus('finished')
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
    }, modalDelay)
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
    setShowLeaveModal(true)
  }

  const confirmLeaveRoom = async () => {
    setShowLeaveModal(false)
    await multiplayerService.leaveRoom(myPlayer.id, room.id)
    multiplayerService.unsubscribe()
    navigation.goBack()
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" translucent={false} />
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.turnInfo}>
          <Text style={styles.turnLabel}>GILIRAN</Text>
          <View style={styles.turnNameRow}>
            <Text style={styles.turnName} numberOfLines={1}>{currentPlayer?.name || 'Menunggu...'}</Text>
          </View>
        </View>
        <Pressable style={styles.leaveButton} onPress={handleLeaveRoom}>
          <Text style={styles.leaveButtonText}>✕</Text>
        </Pressable>
      </View>

      {/* Players Row */}
      <View style={styles.playersRow}>
        {gamePlayers.map((p) => (
          <View key={p.id} style={[styles.playerBadge, p.isCurrentTurn && styles.playerBadgeActive]}>
            <View style={[styles.playerDot, { backgroundColor: p.color }]} />
            <Text style={styles.playerBadgeName} numberOfLines={1}>{p.name.substring(0, 8)}</Text>
            <Text style={styles.playerBadgePos}>📍{p.position}</Text>
          </View>
        ))}
      </View>

      {/* Game Board - Flex to fill available space */}
      <View style={styles.boardContainer}>
        <GameBoard players={gamePlayers} />
      </View>

      {/* Bottom Section - Dice & History */}
      <View style={styles.bottomSection}>
        {gameStatus === 'waiting' ? (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Pemain: {players.length}/4</Text>
            <Text style={styles.roomCodeText}>Kode: {room.roomCode}</Text>
            {isHost ? (
              <Pressable
                style={[styles.startButton, players.length < 2 && styles.buttonDisabled]}
                onPress={handleStartGame}
                disabled={players.length < 2}
              >
                <Text style={styles.startButtonText}>🎮 Mulai Game</Text>
              </Pressable>
            ) : (
              <Text style={styles.waitingHostText}>Menunggu host memulai...</Text>
            )}
          </View>
        ) : (
          <>
            <DiceRoller
              onRoll={handleDiceRoll}
              isDisabled={!isMyTurn() || isAnimating}
              isMyTurn={isMyTurn() && !isAnimating}
            />
            {!isMyTurn() && (
              <Text style={styles.waitTurnText}>
                ⏳ Menunggu {currentPlayer?.name}...
              </Text>
            )}
          </>
        )}
      </View>

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
      {/* Leave Confirmation Modal */}
      <Modal visible={showLeaveModal} transparent animationType="fade">
        <View style={styles.winnerOverlay}>
          <View style={styles.winnerContent}>
            <Text style={styles.winnerEmoji}>🚪</Text>
            <Text style={styles.winnerTitle}>
              {isHost ? 'Akhiri Permainan?' : 'Keluar Room?'}
            </Text>
            <Text style={styles.waitTurnText}>
              {isHost
                ? 'Jika host keluar, room akan dihapus dan permainan berakhir untuk semua.'
                : 'Yakin mau keluar dari permainan ini?'}
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={styles.modalBtnTextAux}>Batal</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnDestructive]}
                onPress={confirmLeaveRoom}
              >
                <Text style={styles.modalBtnTextWhite}>
                  {isHost ? 'Akhiri Game' : 'Keluar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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

  leaveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },

  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  turnInfo: {
    flex: 1,
  },
  turnLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  turnNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
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
  waitingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roomCodeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  waitingHostText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  waitTurnText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
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
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalBtnDestructive: {
    backgroundColor: '#E53935',
  },
  modalBtnTextAux: {
    color: '#4B5563',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBtnTextWhite: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
})
