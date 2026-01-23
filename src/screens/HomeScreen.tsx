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
  ScrollView,
  Modal,
  Animated,
  Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useGameStore } from '../store/gameStore'
import { AVATAR_COLORS, PLAYER_AVATARS } from '../types/game'
import {
  playClickSound,
  startBackgroundMusic,
  stopBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  isBackgroundMusicPlaying,
} from '../utils/soundUtils'
import AvatarPicker from '../components/AvatarPicker'
import BoardPicker from '../components/BoardPicker'
import EducationCategoryModal from '../components/EducationCategoryModal'

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

  const [showEduCategoryModal, setShowEduCategoryModal] = useState(false)
  const [showGameModeModal, setShowGameModeModal] = useState(false)
  
  const { createGameRoom, login, logout, checkSession, isAuthenticated, currentUser, user, selectedBoard, setSelectedBoard } = useGameStore()

  // Auto-fill if user is logged in
  useEffect(() => {
    if (currentUser) {
      setPlayerName(currentUser.username)
      setSelectedAvatar(currentUser.avatar || 1)
    } else if (user?.email) {
      setPlayerName(user.email)
    }
  }, [currentUser, user])
  
  // Check session on mount
  const sessionCheckRef = useRef(false)
  useEffect(() => {
     if (!sessionCheckRef.current) {
         sessionCheckRef.current = true
         checkSession()
     }
  }, [])


  // Audio Setup
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
  }, [])

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
    // Allow guest play but maybe warn? For now assume guest is OK or implement partial login
    // Since original code enforced name, let's keep it simple:
    if (!playerName.trim()) {
        // Maybe show a simple alert or just required field
        return false // Simplified for this view, logic can be enhanced
    }
    return true
  }

  const handlePlayButtonPress = async () => {
      playClickSound()
      setShowGameModeModal(true)
  }

  const handleStartGame = async (mode: 'vs-bot' | 'education' | 'multiplayer') => {
    playClickSound()
    setShowGameModeModal(false)

    // Simplified login check for UI demo
    if (!playerName && !currentUser) {
        // prompt login?
    }

    if (mode === 'multiplayer') {
        await stopBackgroundMusic()
        navigation.navigate('Lobby')
        return
    }

    if (mode === 'education') {
        setShowEduCategoryModal(true)
        return
    }

    // VS Bot
    await stopBackgroundMusic()
    useGameStore.getState().setEducationMode(false)
     createGameRoom(
      `Game-${Date.now().toString(36)}`,
      playerName.trim() || 'Guest',
      AVATAR_COLORS[selectedAvatar] || AVATAR_COLORS[1],
      selectedAvatar,
      selectedBoard
    )
    navigation.navigate('Game')
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Floating Particles/Stars (Static for now) */}
      <View style={[styles.particle, { top: 100, left: 40, backgroundColor: '#4ade80' }]} />
      <View style={[styles.particle, { top: 200, right: 60, backgroundColor: '#f472b6' }]} />
      <View style={[styles.particle, { bottom: 150, left: 100, backgroundColor: '#fbbf24' }]} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}>
        
        {/* Header Profile Card */}
        <View style={styles.header}>
            <View style={styles.profileCard}>
                <View style={[styles.profileAvatar, { backgroundColor: AVATAR_COLORS[currentUser?.avatar || 1] || '#ccc' }]}>
                    <Image 
                        source={PLAYER_AVATARS[currentUser?.avatar || selectedAvatar]} 
                        style={styles.profileImage} 
                    />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{currentUser?.username || playerName || 'Guest'}</Text>
                    <View style={styles.statsRow}>
                        <Text style={styles.statCoin}>🪙 1500</Text>
                        <Text style={styles.statGem}>💎 50</Text>
                    </View>
                </View>
            </View>
            <Pressable style={styles.settingsButton}>
                <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
        </View>

        {/* Floating Side Buttons */}
        <View style={styles.floatingButtons}>
             <Pressable style={styles.neonButton} onPress={toggleMusic}>
                <Text style={styles.neonIcon}>{isMusicOn ? '🔊' : '🔇'}</Text>
             </Pressable>
             <Pressable style={[styles.neonButton, { marginTop: 12 }]} onPress={() => navigation.navigate('Leaderboard')}>
                <Text style={styles.neonIcon}>🏆</Text>
             </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
            <Text style={styles.titleNeonGreen}>ULAR</Text>
            <Text style={styles.titleNeonPink}>TANGGA</Text>
            <Text style={styles.titleNeonOrange}>ADVENTURE</Text>
        </View>
        
        {/* Avatar Selection */}
        <View style={styles.sectionContainer}>
            <AvatarPicker 
                selectedAvatar={selectedAvatar}
                onSelect={setSelectedAvatar}
                variant="game-neon"
                size="medium"
            />
        </View>

        {/* Board Selection */}
        <View style={styles.sectionContainer}>
             <BoardPicker 
                selectedBoard={selectedBoard}
                onSelect={setSelectedBoard}
             />
        </View>

        {/* Footer Area */}
        <View style={styles.footerSpacer} />

      </ScrollView>

      {/* Play Button (Fixed at bottom above nav) */}
      <View style={[styles.playButtonContainer, { bottom: 80 + insets.bottom }]}>
          <Pressable 
            style={({pressed}) => [styles.playButton, pressed && styles.playButtonPressed]}
            onPress={handlePlayButtonPress}
          >
              <LinearGradient
                colors={['#84cc16', '#22c55e']}
                style={styles.playGradient}
              >
                  <Text style={styles.playText}>PLAY</Text>
              </LinearGradient>
          </Pressable>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
           <View style={styles.navItem}>
               <Text style={[styles.navIcon, { color: '#a3a3a3' }]}>🏠</Text>
               <Text style={[styles.navLabel, { color: '#a3a3a3' }]}>Beranda</Text>
           </View>
           <View style={styles.navItem}>
               <Text style={[styles.navIcon, { color: '#fff' }]}>🎮</Text>
               <Text style={[styles.navLabel, { color: '#fff', fontWeight: 'bold' }]}>Permainan</Text>
           </View>
           <View style={styles.navItem}>
               <Text style={[styles.navIcon, { color: '#a3a3a3' }]}>🏪</Text>
               <Text style={[styles.navLabel, { color: '#a3a3a3' }]}>Toko</Text>
           </View>
           <View style={styles.navItem}>
                <Pressable onPress={() => logout && logout()}>
                    <Text style={[styles.navIcon, { color: '#a3a3a3' }]}>👤</Text>
                    <Text style={[styles.navLabel, { color: '#a3a3a3' }]}>Profil</Text>
                </Pressable>
           </View>
      </View>

      {/* Game Mode Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showGameModeModal}
        onRequestClose={() => setShowGameModeModal(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowGameModeModal(false)} />
            
            <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Pilih Mode Permainan</Text>
                
                {/* VS BOT */}
                <Pressable 
                    style={({pressed}) => [styles.modeCard, pressed && styles.modeCardPressed]}
                    onPress={() => handleStartGame('vs-bot')}
                >
                    <LinearGradient
                        colors={['#4c1d95', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modeGradient}
                    >
                        <View style={styles.modeIconCircle}>
                            <Text style={styles.modeEmoji}>🤖</Text>
                        </View>
                        <View style={styles.modeInfo}>
                            <Text style={styles.modeName}>VS Bot (Normal)</Text>
                            <Text style={styles.modeDesc}>Main santai lawan komputer</Text>
                        </View>
                         <Text style={styles.modeArrow}>›</Text>
                    </LinearGradient>
                </Pressable>

                {/* Edu Mode */}
                <Pressable 
                    style={({pressed}) => [styles.modeCard, pressed && styles.modeCardPressed]}
                    onPress={() => handleStartGame('education')}
                >
                    <LinearGradient
                        colors={['#06b6d4', '#3b82f6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modeGradient}
                    >
                        <View style={styles.modeIconCircle}>
                            <Text style={styles.modeEmoji}>🎓</Text>
                        </View>
                        <View style={styles.modeInfo}>
                            <Text style={styles.modeName}>Mode Edukasi</Text>
                            <Text style={styles.modeDesc}>Main sambil belajar kuis & fakta</Text>
                        </View>
                        <Text style={styles.modeArrow}>›</Text>
                    </LinearGradient>
                </Pressable>

                {/* Multiplayer */}
                 <Pressable 
                    style={({pressed}) => [styles.modeCard, pressed && styles.modeCardPressed]}
                    onPress={() => handleStartGame('multiplayer')}
                >
                    <LinearGradient
                        colors={['#84cc16', '#10b981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modeGradient}
                    >
                        <View style={styles.modeIconCircle}>
                            <Text style={styles.modeEmoji}>🌏</Text>
                        </View>
                        <View style={styles.modeInfo}>
                            <Text style={styles.modeName}>Multiplayer Online</Text>
                            <Text style={styles.modeDesc}>Main bareng teman di lobby</Text>
                        </View>
                        <Text style={styles.modeArrow}>›</Text>
                    </LinearGradient>
                </Pressable>

            </View>
        </BlurView>
      </Modal>

      {/* Edu Modal */}
       <EducationCategoryModal
        visible={showEduCategoryModal}
        onClose={() => setShowEduCategoryModal(false)}
        onConfirm={(slug) => {
          setShowEduCategoryModal(false)
          useGameStore.getState().setEducationMode(true)
          useGameStore.getState().setEducationCategorySlug(slug)
          // Actually start game after selecting category (which maps to 'vs-bot' flow but with edu flag)
           createGameRoom(
            `Game-${Date.now().toString(36)}`,
            playerName.trim() || 'Guest',
            AVATAR_COLORS[selectedAvatar] || AVATAR_COLORS[1],
            selectedAvatar,
            selectedBoard
            )
            navigation.navigate('Game')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 150,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 8,
    paddingRight: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCoin: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  statGem: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  settingsIcon: {
    fontSize: 20,
    color: 'white',
  },
  floatingButtons: {
    position: 'absolute',
    right: 20,
    top: 120,
    zIndex: 10,
  },
  neonButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a78bfa', // Purple Neon default
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  neonIcon: {
    fontSize: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  titleNeonGreen: {
    fontSize: 40,
    fontWeight: '900',
    color: '#4ade80',
    textShadowColor: '#4ade80',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleNeonPink: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f472b6',
    textShadowColor: '#f472b6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginTop: -10,
  },
  titleNeonOrange: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fbbf24',
    textShadowColor: '#fbbf24',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 2,
    marginTop: 0,
  },
  sectionContainer: {
    paddingHorizontal: 20,
  },
  playButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  playButton: {
    width: 200,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  playButtonPressed: {
      transform: [{ scale: 0.95 }],
  },
  playGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#1a2e05',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 10,
  },
  footerSpacer: {
      height: 100,
  },
  // Modal Styles
  modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalContent: {
      width: '85%',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 30,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      overflow: 'hidden', // for blur effect if needed inside, but we rely on background
  },
  modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
      marginBottom: 20,
  },
  modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 24,
      textAlign: 'center',
  },
  modeCard: {
      width: '100%',
      height: 100,
      marginBottom: 16,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
  },
  modeCardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
  },
  modeGradient: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
  },
  modeIconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  modeEmoji: {
      fontSize: 24,
  },
  modeInfo: {
      flex: 1,
  },
  modeName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 4,
  },
  modeDesc: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
  },
  modeArrow: {
      fontSize: 24,
      color: 'white',
      opacity: 0.5,
  }
})
