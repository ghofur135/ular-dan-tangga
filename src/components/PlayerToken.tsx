import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, Image } from 'react-native'
import { Audio } from 'expo-av'
import { Player, getAvatarSource } from '../types/game'

interface PlayerTokenProps {
  player: Player
  size?: number
  isAnimating?: boolean
}

/**
 * PlayerToken - Circular token representing a player on the board
 * Shows player avatar or initial with colored background and turn indicator
 */
export default function PlayerToken({ player, size = 24, isAnimating = false }: PlayerTokenProps) {
  const initial = player.name.charAt(0).toUpperCase()
  const isBot = player.id.startsWith('bot-')
  
  const hasAvatar = player.avatar && player.avatar > 0
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current
  const bounceAnim = useRef(new Animated.Value(0)).current


  // Bounce animation when moving
  useEffect(() => {
    if (isAnimating) {
      // Bounce effect
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isAnimating])
  
  return (
    <Animated.View
      style={[
        styles.token,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hasAvatar ? '#fff' : player.color,
          borderWidth: player.isCurrentTurn ? 2 : 1.5,
          borderColor: player.isCurrentTurn ? '#FFD700' : (hasAvatar ? player.color : '#FFF'),
          transform: [
            { scale: scaleAnim },
            { translateY: bounceAnim },
          ],
        },
      ]}
    >
      {hasAvatar && !isBot ? (
        <Image
          source={getAvatarSource(player.avatar)}
          style={[styles.avatarImage, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initial,
            {
              fontSize: size * 0.5,
            },
          ]}
        >
          {isBot ? '🤖' : initial}
        </Text>
      )}
      
      {/* Turn indicator glow */}
      {player.isCurrentTurn && (
        <View
          style={[
            styles.turnGlow,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
            },
          ]}
        />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  token: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    overflow: 'hidden',
  },
  initial: {
    color: '#FFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  avatarImage: {
    backgroundColor: '#f0f0f0',
  },
  turnGlow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD700',
    opacity: 0.6,
  },
})
