import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native'

interface GameEventModalProps {
  visible: boolean
  type: 'snake' | 'ladder' | 'winner'
  playerName?: string
  onClose?: () => void
}

/**
 * GameEventModal - Animated modal for snake, ladder, and winner events
 */
export default function GameEventModal({ visible, type, playerName, onClose }: GameEventModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const bounceAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0)
      rotateAnim.setValue(0)
      bounceAnim.setValue(0)
      opacityAnim.setValue(0)

      // Start entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      // Icon-specific animation
      if (type === 'snake') {
        // Wiggle animation for snake
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 150,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -1,
              duration: 300,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 150,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ).start()
      } else if (type === 'ladder') {
        // Bounce up animation for ladder
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -20,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ).start()
      } else if (type === 'winner') {
        // Spin and bounce for winner
        Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(bounceAnim, {
                toValue: -15,
                duration: 250,
                useNativeDriver: true,
              }),
              Animated.timing(bounceAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }),
              Animated.timing(bounceAnim, {
                toValue: -15,
                duration: 250,
                useNativeDriver: true,
              }),
              Animated.timing(bounceAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }),
            ]),
          ]),
          { iterations: -1 }
        ).start()
      }

      // Auto close after delay (except winner)
      if (type !== 'winner') {
        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose?.()
          })
        }, 1800)

        return () => clearTimeout(timer)
      }
    }
  }, [visible, type])

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  })

  const getContent = () => {
    switch (type) {
      case 'snake':
        return {
          emoji: '🐍',
          title: 'Oops! Ular!',
          subtitle: 'Kamu turun ke bawah!',
          bgColor: '#FF6B6B',
          borderColor: '#E53935',
        }
      case 'ladder':
        return {
          emoji: '🪜',
          title: 'Yeay! Tangga!',
          subtitle: 'Kamu naik ke atas!',
          bgColor: '#4CAF50',
          borderColor: '#388E3C',
        }
      case 'winner':
        return {
          emoji: '🏆',
          title: 'MENANG!',
          subtitle: playerName || 'Player',
          bgColor: '#FFD700',
          borderColor: '#FFA000',
        }
      default:
        return {
          emoji: '🎮',
          title: '',
          subtitle: '',
          bgColor: '#666',
          borderColor: '#444',
        }
    }
  }

  const content = getContent()

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: content.bgColor,
              borderColor: content.borderColor,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.emoji,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { translateY: bounceAnim },
                ],
              },
            ]}
          >
            {content.emoji}
          </Animated.Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={[styles.subtitle, type === 'winner' && styles.winnerName]}>
            {content.subtitle}
          </Text>
          {type === 'winner' && (
            <Text style={styles.winnerSubtext}>mencapai kotak 100!</Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 4,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  winnerSubtext: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
  },
})
