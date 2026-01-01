import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Animated, Easing, Pressable } from 'react-native'

interface GenericModalProps {
  visible: boolean
  type: 'snake' | 'ladder' | 'winner' | 'bounce' | 'collision' | 'info' | 'confirmation' | 'success' | 'error'
  title?: string
  message?: string
  icon?: string
  playerName?: string
  collisionInfo?: {
    bumpedPlayerName: string
    fromPosition: number
    toPosition: number
  }
  onClose?: () => void
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  onPlayAgain?: () => void
  onExit?: () => void
}

/**
 * GenericModal - Animated modal for game events and general notifications
 */
export default function GenericModal({
  visible,
  type,
  title,
  message,
  icon,
  playerName,
  collisionInfo,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Batal",
  onPlayAgain,
  onExit
}: GenericModalProps) {
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

      // Animation Logic
      if (['snake', 'error'].includes(type)) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -1, duration: 300, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]),
          { iterations: 3 }
        ).start()
      } else if (['ladder', 'success', 'info', 'confirmation'].includes(type)) {
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -10, duration: 200, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start()
      } else if (type === 'bounce') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
          { iterations: 2 }
        ).start()
      } else if (type === 'collision') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -1, duration: 160, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]),
          { iterations: 3 }
        ).start()
      } else if (type === 'winner') {
        Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(rotateAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.timing(rotateAnim, { toValue: 0, duration: 500, useNativeDriver: true })
            ]),
            Animated.sequence([
              Animated.timing(bounceAnim, { toValue: -15, duration: 250, useNativeDriver: true }),
              Animated.timing(bounceAnim, { toValue: 0, duration: 250, useNativeDriver: true })
            ])
          ]),
          { iterations: -1 }
        ).start()
      }

      // Auto close for game events (excluding winner and confirmation interaction)
      if (!['winner', 'confirmation', 'info', 'success', 'error'].includes(type) && !onConfirm) {
        const timer = setTimeout(() => {
          handleClose()
        }, 1800)
        return () => clearTimeout(timer)
      }
    }
  }, [visible, type])

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose?.())
  }

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  })

  // Content Configuration
  const getConfig = () => {
    switch (type) {
      case 'snake':
        return { emoji: '🐍', bg: '#FF6B6B', border: '#E53935', t: 'Oops! Ular!', st: 'Kamu turun ke bawah!' }
      case 'ladder':
        return { emoji: '🪜', bg: '#4CAF50', border: '#388E3C', t: 'Yeay! Tangga!', st: 'Kamu naik ke atas!' }
      case 'bounce':
        return { emoji: '↩️', bg: '#FF9800', border: '#F57C00', t: 'Memantul!', st: 'Kamu mundur dari 100!' }
      case 'collision':
        return {
          emoji: '💥',
          bg: '#9C27B0',
          border: '#7B1FA2',
          t: 'Tabrakan!',
          st: collisionInfo ? `${collisionInfo.bumpedPlayerName} mundur ke kotak ${collisionInfo.toPosition}!` : 'Tabrakan terjadi!'
        }
      case 'winner':
        return { emoji: '🏆', bg: '#FFD700', border: '#FFA000', t: 'MENANG!', st: playerName }
      case 'confirmation':
        return { emoji: icon || '❓', bg: '#3B82F6', border: '#2563EB', t: title || 'Konfirmasi', st: message || '' }
      case 'info':
        return { emoji: icon || 'ℹ️', bg: '#60A5FA', border: '#2563EB', t: title || 'Info', st: message || '' }
      case 'success':
        return { emoji: icon || '✅', bg: '#10B981', border: '#059669', t: title || 'Berhasil', st: message || '' }
      case 'error':
        return { emoji: icon || '❌', bg: '#EF4444', border: '#B91C1C', t: title || 'Error', st: message || '' }
      default:
        return { emoji: icon || '🎮', bg: '#666', border: '#444', t: title || '', st: message || '' }
    }
  }

  const config = getConfig()

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: config.bg,
              borderColor: config.border,
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
            {config.emoji}
          </Animated.Text>

          <Text style={styles.title}>{config.t}</Text>
          <Text style={[styles.subtitle, type === 'winner' && styles.winnerName]}>
            {config.st}
          </Text>

          {/* Winner Specific UI */}
          {type === 'winner' && (
            <>
              <Text style={styles.winnerSubtext}>mencapai kotak 100!</Text>
              <View style={styles.buttonContainer}>
                <Pressable style={styles.playAgainButton} onPress={onPlayAgain}>
                  <Text style={styles.buttonText}>🔄 Main Lagi</Text>
                </Pressable>
                <Pressable style={styles.exitButton} onPress={onExit}>
                  <Text style={styles.exitButtonText}>🏠 Kembali</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Confirmation / Action UI */}
          {type === 'confirmation' && (
            <View style={styles.buttonContainer}>
              <Pressable style={styles.confirmButton} onPress={() => {
                onConfirm?.()
                handleClose()
              }}>
                <Text style={styles.buttonText}>{confirmText}</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.buttonText}>{cancelText}</Text>
              </Pressable>
            </View>
          )}

          {/* Simple OK Button for Info/Success/Error */}
          {['info', 'success', 'error'].includes(type) && (
            <View style={styles.buttonContainer}>
              <Pressable style={styles.okButton} onPress={handleClose}>
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            </View>
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
    width: '85%',
    maxWidth: 340,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 22,
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
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exitButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#10B981', // Success Green
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
  },
})
