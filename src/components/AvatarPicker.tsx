import React from 'react'
import { View, Image, Pressable, StyleSheet, Text } from 'react-native'
import { PLAYER_AVATARS } from '../types/game'
import { LinearGradient } from 'expo-linear-gradient'

interface AvatarPickerProps {
  selectedAvatar: number
  onSelect: (avatarIndex: number) => void
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'game-neon'
}

/**
 * AvatarPicker - Component for selecting player avatar
 */
export default function AvatarPicker({ selectedAvatar, onSelect, size = 'medium', variant = 'default' }: AvatarPickerProps) {
  const avatarSize = size === 'small' ? 40 : size === 'medium' ? 56 : 72
  const avatarKeys = Object.keys(PLAYER_AVATARS).map(Number)

  if (variant === 'game-neon') {
    return (
        <View style={styles.neonContainer}>
            <Text style={styles.neonLabel}>Pilih Avatar</Text>
            <View style={styles.neonGrid}>
                {avatarKeys.map((index) => {
                    const isSelected = selectedAvatar === index
                    return (
                        <Pressable
                            key={index}
                            style={[
                                styles.neonOption,
                                isSelected && styles.neonOptionSelected
                            ]}
                            onPress={() => onSelect(index)}
                        >
                            <LinearGradient
                                colors={isSelected ? ['#4ade80', '#22c55e'] : ['#374151', '#1f2937']}
                                style={styles.neonGradient}
                            >
                                <Image
                                    source={PLAYER_AVATARS[index]}
                                    style={[styles.avatarImage, { width: 60, height: 60 }]}
                                    resizeMode="contain"
                                />
                                {isSelected && (
                                    <View style={styles.neonCheck}>
                                        <Text style={styles.neonCheckText}>✓</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pilih Avatar</Text>
      <View style={styles.avatarGrid}>
        {avatarKeys.map((index) => (
          <Pressable
            key={index}
            style={[
              styles.avatarOption,
              { width: avatarSize + 8, height: avatarSize + 8 },
              selectedAvatar === index && styles.avatarSelected,
            ]}
            onPress={() => onSelect(index)}
          >
            <Image
              source={PLAYER_AVATARS[index]}
              style={[styles.avatarImage, { width: avatarSize, height: avatarSize }]}
              resizeMode="contain"
            />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  avatarOption: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarSelected: {
    borderColor: '#4CAF50',
    transform: [{ scale: 1.1 }],
  },
  avatarImage: {
    borderRadius: 8,
  },
  // Neon Variants
  neonContainer: {
      marginBottom: 24,
  },
  neonLabel: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
      marginLeft: 4,
  },
  neonGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
  },
  neonOption: {
      width: 80,
      height: 80,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
  },
  neonOptionSelected: {
      borderColor: '#4ade80', // Green neon border
      shadowColor: '#4ade80',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 5,
  },
  neonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  neonCheck: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: '#22c55e',
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'white',
  },
  neonCheckText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
  }
})
