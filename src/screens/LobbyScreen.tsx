import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native'
import { multiplayerService, OnlineRoom } from '../services/multiplayerService'
import { PLAYER_COLORS } from '../types/game'

interface LobbyScreenProps {
  navigation: any
}

export default function LobbyScreen({ navigation }: LobbyScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0])
  const [rooms, setRooms] = useState<OnlineRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    setLoading(true)
    const availableRooms = await multiplayerService.getAvailableRooms()
    setRooms(availableRooms)
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRooms()
    setRefreshing(false)
  }

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Masukkan nama kamu dulu')
      return
    }
    if (!newRoomName.trim()) {
      Alert.alert('Error', 'Masukkan nama room')
      return
    }

    setLoading(true)
    const result = await multiplayerService.createRoom(
      newRoomName.trim(),
      playerName.trim(),
      selectedColor
    )
    setLoading(false)

    if (result) {
      setShowCreateModal(false)
      navigation.navigate('OnlineGame', {
        room: result.room,
        player: result.player,
        isHost: true,
      })
    } else {
      Alert.alert('Error', 'Gagal membuat room. Coba lagi.')
    }
  }

  const handleJoinByCode = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Masukkan nama kamu dulu')
      return
    }
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Masukkan kode room')
      return
    }

    setLoading(true)
    const result = await multiplayerService.joinRoom(
      roomCode.trim().toUpperCase(),
      playerName.trim(),
      selectedColor
    )
    setLoading(false)

    if (result) {
      setShowJoinModal(false)
      navigation.navigate('OnlineGame', {
        room: result.room,
        player: result.player,
        players: result.players,
        isHost: false,
      })
    } else {
      Alert.alert('Error', 'Room tidak ditemukan atau sudah penuh')
    }
  }

  const handleJoinRoom = async (room: OnlineRoom) => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Masukkan nama kamu dulu')
      return
    }

    setLoading(true)
    const result = await multiplayerService.joinRoom(
      room.roomCode,
      playerName.trim(),
      selectedColor
    )
    setLoading(false)

    if (result) {
      navigation.navigate('OnlineGame', {
        room: result.room,
        player: result.player,
        players: result.players,
        isHost: false,
      })
    } else {
      Alert.alert('Error', 'Gagal join room. Mungkin sudah penuh.')
    }
  }

  return (
    <View style={styles.container}>
      {/* Player Setup */}
      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>👤 Setup Player</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama kamu"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
        />
        <View style={styles.colorPicker}>
          {PLAYER_COLORS.map((color) => (
            <Pressable
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, styles.createButton]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.actionButtonText}>➕ Buat Room</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => setShowJoinModal(true)}
        >
          <Text style={styles.actionButtonText}>🔑 Join Kode</Text>
        </Pressable>
      </View>

      {/* Room List */}
      <View style={styles.roomListContainer}>
        <Text style={styles.sectionTitle}>🎮 Room Tersedia</Text>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : (
          <ScrollView
            style={styles.roomList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {rooms.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Belum ada room tersedia</Text>
                <Text style={styles.emptySubtext}>Buat room baru atau refresh</Text>
              </View>
            ) : (
              rooms.map((room) => (
                <Pressable
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() => handleJoinRoom(room)}
                >
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomHost}>Host: {room.hostName}</Text>
                    <Text style={styles.roomCode}>Kode: {room.roomCode}</Text>
                  </View>
                  <View style={styles.roomMeta}>
                    <Text style={styles.playerCount}>
                      {room.currentPlayers}/{room.maxPlayers} 👥
                    </Text>
                    <Text style={styles.joinText}>Join →</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Create Room Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buat Room Baru</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nama Room"
              value={newRoomName}
              onChangeText={setNewRoomName}
              maxLength={30}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateRoom}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Buat</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join by Code Modal */}
      <Modal visible={showJoinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join dengan Kode</Text>
            <TextInput
              style={[styles.modalInput, styles.codeInput]}
              placeholder="XXXXXX"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleJoinByCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Join</Text>
                )}
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
    padding: 16,
  },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#333',
    transform: [{ scale: 1.15 }],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  joinButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  loader: {
    marginTop: 40,
  },
  roomList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roomHost: {
    fontSize: 14,
    color: '#666',
  },
  roomCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  roomMeta: {
    alignItems: 'flex-end',
  },
  playerCount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  joinText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
