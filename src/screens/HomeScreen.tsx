import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import { useGameStore } from '../store/gameStore'
import { AVATAR_COLORS } from '../types/game'
import {
  playClickSound,
  startBackgroundMusic,
  stopBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  isBackgroundMusicPlaying,
} from '../utils/soundUtils'
import AvatarPicker from '../components/AvatarPicker'

interface HomeScreenProps {
  navigation: any
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets()
  const [playerName, setPlayerName] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [isMusicOn, setIsMusicOn] = useState(true)

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' })
  const scaleAnim = useRef(new Animated.Value(0)).current

  const { createGameRoom, login, isAuthenticated, currentUser, user } = useGameStore()

  // Custom Alert Helper
  const showCustomAlert = (title: string, message: string) => {
    setAlertConfig({ title, message })
    setAlertVisible(true)
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start()
    playClickSound() // Reuse click sound for alert pop
  }

  const hideCustomAlert = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => setAlertVisible(false))
  }

  // Get color based on avatar
  const getAvatarColor = (avatar: number) => {
    return AVATAR_COLORS[avatar] || AVATAR_COLORS[1]
  }

  // Effect to handle music
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        })
        await startBackgroundMusic()
        setIsMusicOn(true)
      } catch (error) {
        console.log('Error setting up audio:', error)
      }
    }
    setupAudio()
    return () => { }
  }, [])

  // Auto-fill if user is logged in
  useEffect(() => {
    if (currentUser) {
      setPlayerName(currentUser.username)
      setSelectedAvatar(currentUser.avatar || 1)
    } else if (user?.email) {
      // Fallback for non-pin auth users
      setPlayerName(user.email)
    }
  }, [currentUser, user])

  const toggleMusic = async () => {
    playClickSound()
    const isPlaying = await isBackgroundMusicPlaying()
    if (isPlaying) {
      await pauseBackgroundMusic()
      setIsMusicOn(false)
    } else {
      await resumeBackgroundMusic()
      setIsMusicOn(true)
    }
  }

  const handleLogin = async (): Promise<boolean> => {
    if (isAuthenticated && currentUser) return true

    if (!playerName.trim() || !pin.trim()) {
      showCustomAlert(
        'Eits, Tunggu Dulu! ✋',
        'Kamu wajib isi Nama & PIN dulu ya sebelum main. Ini biar progress main kamu kesimpen! 😉'
      )
      return false
    }

    if (pin.length < 4) {
      showCustomAlert('PIN Kurang Panjang', 'PIN minimal 4 angka biar aman ya! 🔒')
      return false
    }

    setIsLoading(true)
    const { success, error } = await login(playerName.trim(), pin.trim(), selectedAvatar)
    setIsLoading(false)

    if (!success) {
      showCustomAlert('Gagal Masuk', error || 'Terjadi kesalahan')
      return false
    }
    return true
  }

  const handleQuickPlay = async () => {
    playClickSound()
    const success = await handleLogin()
    if (!success) return

    await stopBackgroundMusic()
    createGameRoom(
      `Game-${Date.now().toString(36)}`,
      playerName.trim(),
      getAvatarColor(selectedAvatar),
      selectedAvatar
    )
    navigation.navigate('Game')
  }

  const handleNavigateLobby = async () => {
    playClickSound()
    const success = await handleLogin()
    if (!success) return

    await stopBackgroundMusic()
    navigation.navigate('Lobby')
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" translucent={false} />

      {/* Custom Modal Alert */}
      <Modal
        transparent
        visible={alertVisible}
        animationType="none"
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.modalEmoji}>🚨</Text>
            <Text style={styles.modalTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalMessage}>{alertConfig.message}</Text>
            <Pressable style={styles.modalButton} onPress={hideCustomAlert}>
              <Text style={styles.modalButtonText}>Oke, Siap!</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Header Section */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 16 : insets.top }]}>
        <View style={styles.titleWrapper}>
          <Text style={styles.emojiTitle}>🐍🎲🪜</Text>
          <Text style={styles.gameTitle}>ULAR TANGGA</Text>
          <Text style={styles.gameSubtitle}>SUPER SERU</Text>
        </View>
      </View>

      {/* Main Content Area - Scrollable */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerActions}>
                <Text style={styles.cardTitle}>
                  {isAuthenticated ? `Halo, ${currentUser?.username || playerName}!` : 'Mulai Petualangan'}
                </Text>
                <View style={styles.miniActions}>
                  <Pressable style={styles.miniBtn} onPress={toggleMusic}>
                    <Text style={{ fontSize: 16 }}>{isMusicOn ? '🔊' : '🔇'}</Text>
                  </Pressable>
                  <Pressable style={[styles.miniBtn, { backgroundColor: '#FFD700' }]} onPress={() => navigation.navigate('Leaderboard')}>
                    <Text style={{ fontSize: 16 }}>🏆</Text>
                  </Pressable>
                </View>
              </View>
              {!isAuthenticated && <Text style={styles.cardSubtitle}>Isi nama & PIN untuk simpan progress</Text>}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nama Panggilan</Text>
                <TextInput
                  style={[styles.input, isAuthenticated && styles.inputDisabled]}
                  placeholder="Contoh: Jagoan123"
                  value={playerName}
                  onChangeText={setPlayerName}
                  maxLength={12}
                  editable={!isAuthenticated}
                  placeholderTextColor="#A0AEC0"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>PIN Rahasia</Text>
                <TextInput
                  style={[styles.input, isAuthenticated && styles.inputDisabled]}
                  placeholder="minimal 4 angka"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  editable={!isAuthenticated}
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <AvatarPicker
              selectedAvatar={selectedAvatar}
              onSelect={(av) => {
                if (!isAuthenticated) setSelectedAvatar(av)
              }}
              size="medium"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar - Always visible */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.btnSecondary,
              pressed && styles.btnPressed,
            ]}
            onPress={handleQuickPlay}
          >
            <Text style={styles.btnSecondaryText}>🤖 VS Bot</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.btnPrimary,
              pressed && styles.btnPressed,
            ]}
            onPress={handleNavigateLobby}
          >
            {isLoading ? (
              <Text style={styles.btnPrimaryText}>Loading...</Text>
            ) : (
              <Text style={styles.btnPrimaryText}>🌏 Multiplayer</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.versionText}>v1.0.0 • Online & Offline</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Light green minty background
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#15803D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#F0FDF4',
    zIndex: 10,
  },
  titleWrapper: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emojiTitle: {
    fontSize: 42,
    marginBottom: 0,
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#15803D', // Strong Green
    letterSpacing: 1,
    textShadowColor: 'rgba(21, 128, 61, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  gameSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    letterSpacing: 4,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140, // Space for bottom bar
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  inputGroup: {
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    borderWidth: 2,
    borderColor: '#EEEEEE',
  },
  inputDisabled: {
    backgroundColor: '#FAFAFA',
    color: '#9CA3AF',
    borderColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnPrimary: {
    backgroundColor: '#15803D', // Green
    flex: 1.5, // Bigger than secondary
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnSecondary: {
    backgroundColor: '#F0FDF4', // Light Green
    borderWidth: 2,
    borderColor: '#15803D',
    flex: 1,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnSecondaryText: {
    color: '#15803D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
})
