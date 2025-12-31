import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native'
import { Audio } from 'expo-av'
import { useGameStore } from '../store/gameStore'
import { AVATAR_COLORS } from '../types/game'
import { playClickSound, startBackgroundMusic, stopBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic, isBackgroundMusicPlaying } from '../utils/soundUtils'
import AvatarPicker from '../components/AvatarPicker'

interface HomeScreenProps {
  navigation: any
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const isSmallScreen = SCREEN_HEIGHT < 700

/**
 * HomeScreen - Entry point for creating or joining game rooms
 * Redesigned for single-screen layout without scrolling
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [isMusicOn, setIsMusicOn] = useState(true)

  const { createGameRoom } = useGameStore()

  // Get color based on avatar
  const getAvatarColor = (avatar: number) => {
    return AVATAR_COLORS[avatar] || AVATAR_COLORS[1]
  }

  // Configure audio mode and play welcome intro music on mount
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
    return () => {}
  }, [])

  // Toggle music on/off
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

  const handleQuickPlay = async () => {
    playClickSound()
    if (!playerName.trim()) {
      Alert.alert('Error', 'Masukkan nama kamu')
      return
    }
    await stopBackgroundMusic()
    createGameRoom(`Game-${Date.now().toString(36)}`, playerName.trim(), getAvatarColor(selectedAvatar), selectedAvatar)
    navigation.navigate('Game')
  }

  const handleNavigate = async (screen: string) => {
    playClickSound()
    if (screen === 'Lobby') {
      await stopBackgroundMusic()
    }
    navigation.navigate(screen)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.musicToggle} onPress={toggleMusic}>
          <Text style={styles.musicToggleText}>{isMusicOn ? '🔊' : '🔇'}</Text>
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🐍 Ular & Tangga 🪜</Text>
          <Text style={styles.subtitle}>Permainan Papan Multiplayer</Text>
        </View>
        <Pressable style={styles.leaderboardBtn} onPress={() => handleNavigate('Leaderboard')}>
          <Text style={styles.leaderboardBtnText}>🏆</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Player Setup Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Pengaturan Pemain</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama kamu"
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={20}
            placeholderTextColor="#999"
          />
          <AvatarPicker
            selectedAvatar={selectedAvatar}
            onSelect={setSelectedAvatar}
            size={isSmallScreen ? 'small' : 'medium'}
          />
        </View>

        {/* Game Mode Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.gameButton,
              styles.quickPlayButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleQuickPlay}
          >
            <Text style={styles.gameButtonEmoji}>🤖</Text>
            <View style={styles.gameButtonTextContainer}>
              <Text style={styles.gameButtonTitle}>Main vs Bot</Text>
              <Text style={styles.gameButtonDesc}>Main cepat melawan komputer</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.gameButton,
              styles.onlineButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleNavigate('Lobby')}
          >
            <Text style={styles.gameButtonEmoji}>🌐</Text>
            <View style={styles.gameButtonTextContainer}>
              <Text style={styles.gameButtonTitle}>Multiplayer Online</Text>
              <Text style={styles.gameButtonDesc}>Main bareng teman</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Footer - Game Rules */}
      <View style={styles.footer}>
        <View style={styles.rulesRow}>
          <Text style={styles.ruleItem}>🎲 Lempar dadu</Text>
          <Text style={styles.ruleItem}>🪜 Naik tangga</Text>
          <Text style={styles.ruleItem}>🐍 Turun ular</Text>
          <Text style={styles.ruleItem}>🏆 Sampai 100!</Text>
        </View>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  musicToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  musicToggleText: {
    fontSize: 20,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  leaderboardBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leaderboardBtnText: {
    fontSize: 20,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  buttonContainer: {
    gap: 12,
  },
  gameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  quickPlayButton: {
    backgroundColor: '#4CAF50',
  },
  onlineButton: {
    backgroundColor: '#2196F3',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gameButtonEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  gameButtonTextContainer: {
    flex: 1,
  },
  gameButtonTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  gameButtonDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  rulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  ruleItem: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
  },
})
