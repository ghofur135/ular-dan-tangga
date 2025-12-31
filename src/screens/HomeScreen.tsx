import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import { Audio } from 'expo-av'
import { useGameStore } from '../store/gameStore'
import { PLAYER_COLORS } from '../types/game'

interface HomeScreenProps {
  navigation: any
}

/**
 * HomeScreen - Entry point for creating or joining game rooms
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0])
  const soundRef = useRef<Audio.Sound | null>(null)

  const { createGameRoom, players } = useGameStore()

  // Play welcome intro music on mount
  useEffect(() => {
    const playWelcomeMusic = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sound/welcome-intro.mp3'),
          { shouldPlay: true, volume: 0.7 }
        )
        soundRef.current = sound
      } catch (error) {
        console.log('Error playing welcome music:', error)
      }
    }

    playWelcomeMusic()

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [])

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name')
      return
    }
    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name')
      return
    }

    createGameRoom(roomName.trim(), playerName.trim(), selectedColor)
    navigation.navigate('Game')
  }

  const handleQuickPlay = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name')
      return
    }

    // Create a quick game with default room name
    createGameRoom(`Game-${Date.now().toString(36)}`, playerName.trim(), selectedColor)
    navigation.navigate('Game')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🐍 Snake & Ladder 🪜</Text>
        <Text style={styles.subtitle}>Multiplayer Board Game</Text>
      </View>

      {/* Player Setup */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Player Setup</Text>
        
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
        />

        <Text style={styles.label}>Choose Color</Text>
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

      {/* Create Game */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create New Game</Text>
        
        <Text style={styles.label}>Room Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter room name"
          value={roomName}
          onChangeText={setRoomName}
          maxLength={30}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleCreateGame}
        >
          <Text style={styles.buttonText}>Create Game Room</Text>
        </Pressable>
      </View>

      {/* Quick Play */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Play</Text>
        <Text style={styles.cardDescription}>
          Main cepat melawan Bot
        </Text>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleQuickPlay}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            🤖 Main vs Bot
          </Text>
        </Pressable>
      </View>

      {/* Multiplayer Online */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌐 Multiplayer Online</Text>
        <Text style={styles.cardDescription}>
          Main bareng teman secara online!
        </Text>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.onlineButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('Lobby')}
        >
          <Text style={styles.buttonText}>
            🎮 Masuk Lobby
          </Text>
        </Pressable>
      </View>

      {/* Game Rules */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How to Play</Text>
        <View style={styles.rulesList}>
          <Text style={styles.rule}>🎲 Roll the dice to move forward</Text>
          <Text style={styles.rule}>🪜 Land on ladder bottom to climb up</Text>
          <Text style={styles.rule}>🐍 Land on snake head to slide down</Text>
          <Text style={styles.rule}>🏆 First to reach 100 wins!</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={styles.leaderboardButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.leaderboardText}>🏆 View Leaderboard</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#4CAF50',
  },
  onlineButton: {
    backgroundColor: '#2196F3',
  },
  rulesList: {
    gap: 8,
  },
  rule: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  leaderboardButton: {
    padding: 12,
  },
  leaderboardText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
})
