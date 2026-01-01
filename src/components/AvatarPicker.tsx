import React from 'react'
import { View, Image, Pressable, StyleSheet, Text } from 'react-native'
import { PLAYER_AVATARS } from '../types/game'

interface AvatarPickerProps {
  selectedAvatar: number
  onSelect: (avatarIndex: number) => void
  size?: 'small' | 'medium' | 'large'
}

/**
 * AvatarPicker - Component for selecting player avatar
 */
export default function AvatarPicker({ selectedAvatar, onSelect, size = 'medium' }: AvatarPickerProps) {
  const avatarSize = size === 'small' ? 40 : size === 'medium' ? 56 : 72
  const avatarKeys = Object.keys(PLAYER_AVATARS).map(Number)

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
})
