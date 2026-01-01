import React, { useState, useRef, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, Platform, Modal } from 'react-native'
import { Audio } from 'expo-av'

interface DiceRollerProps {
  onRoll: (result: number) => void
  isDisabled?: boolean
  isMyTurn?: boolean // New prop to indicate if it's player's turn
}

// Dot positions for each dice face (1-6) - using percentages as numbers
const DOT_PATTERNS: { [key: number]: { top: number; left: number }[] } = {
  1: [{ top: 50, left: 50 }],
  2: [{ top: 25, left: 25 }, { top: 75, left: 75 }],
  3: [{ top: 25, left: 25 }, { top: 50, left: 50 }, { top: 75, left: 75 }],
  4: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
  5: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 50, left: 50 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
  6: [{ top: 25, left: 25 }, { top: 25, left: 75 }, { top: 50, left: 25 }, { top: 50, left: 75 }, { top: 75, left: 25 }, { top: 75, left: 75 }],
}

// Rotation values to show each face (rotateX, rotateY in degrees)
const FACE_ROTATIONS: { [key: number]: { x: number; y: number } } = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: 180 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 },
}

const DICE_SIZE = 80
const LARGE_DICE_SIZE = 140
const DOT_SIZE = 14
const LARGE_DOT_SIZE = 24

/**
 * DiceFace component - Single face of the dice with dots pattern
 */
const DiceFace = ({ value, size = DICE_SIZE, dotSize = DOT_SIZE }: { value: number; size?: number; dotSize?: number }) => (
  <View style={[styles.diceFace, { width: size, height: size }]}>
    {DOT_PATTERNS[value].map((pos, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            top: `${pos.top}%` as any,
            left: `${pos.left}%` as any,
            marginTop: -dotSize / 2,
            marginLeft: -dotSize / 2,
          },
        ]}
      />
    ))}
  </View>
)

/**
 * DiceRoller component - 3D-style Dice with realistic rolling animation
 * Shows large bouncing result after roll
 */
export default function DiceRoller({ onRoll, isDisabled = false, isMyTurn = false }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [diceResult, setDiceResult] = useState<number>(1)
  const [showResult, setShowResult] = useState(false)
  const [displayValue, setDisplayValue] = useState<number>(1)
  const [showResultModal, setShowResultModal] = useState(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  
  const rotateXAnim = useRef(new Animated.Value(0)).current
  const rotateYAnim = useRef(new Animated.Value(0)).current
  const bounceAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const resultScaleAnim = useRef(new Animated.Value(0)).current
  const resultOpacityAnim = useRef(new Animated.Value(0)).current
  
  // Blinking animation for when it's player's turn
  const blinkAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  // Load sound on mount
  useEffect(() => {
    return () => {
      // Cleanup sound on unmount
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [sound])

  // Blinking animation when it's player's turn
  useEffect(() => {
    if (isMyTurn && !isDisabled && !isRolling) {
      // Start blinking animation
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      )
      
      // Start glow animation
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      )
      
      blinkAnimation.start()
      glowAnimation.start()
      
      return () => {
        blinkAnimation.stop()
        glowAnimation.stop()
      }
    } else {
      // Reset animations when not player's turn
      blinkAnim.setValue(1)
      glowAnim.setValue(0)
    }
  }, [isMyTurn, isDisabled, isRolling])

  // Play dice roll sound
  const playDiceSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/sound/dice-roll.mp3')
      )
      setSound(newSound)
      await newSound.playAsync()
    } catch (error) {
      console.log('Error playing sound:', error)
    }
  }

  const handleRoll = () => {
    if (isRolling || isDisabled) return

    // Play dice roll sound
    playDiceSound()

    setIsRolling(true)
    setShowResult(false)
    setShowResultModal(false)

    // Generate result
    const result = Math.floor(Math.random() * 6) + 1
    const targetRotation = FACE_ROTATIONS[result]

    // Animate through random values during roll
    let rollCount = 0
    const rollInterval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1)
      rollCount++
      if (rollCount >= 15) {
        clearInterval(rollInterval)
        setDisplayValue(result)
      }
    }, 100)

    // Rolling animation
    Animated.parallel([
      // X rotation
      Animated.timing(rotateXAnim, {
        toValue: 720 + targetRotation.x,
        duration: 1600,
        useNativeDriver: true,
      }),
      // Y rotation
      Animated.timing(rotateYAnim, {
        toValue: 540 + targetRotation.y,
        duration: 1600,
        useNativeDriver: true,
      }),
      // Bounce effect
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -25,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -12,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      // Scale pulse
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Reset for next roll
      rotateXAnim.setValue(targetRotation.x)
      rotateYAnim.setValue(targetRotation.y)
      
      setDiceResult(result)
      setShowResult(true)
      setIsRolling(false)
      
      // Show large result modal with bounce animation
      setShowResultModal(true)
      resultScaleAnim.setValue(0)
      resultOpacityAnim.setValue(0)
      
      Animated.parallel([
        Animated.spring(resultScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(resultOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Auto hide after 1.5 seconds and trigger onRoll
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(resultScaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(resultOpacityAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowResultModal(false)
            onRoll(result)
          })
        }, 1200)
      })
    })
  }

  // Interpolate rotation values
  const rotateX = rotateXAnim.interpolate({
    inputRange: [-360, 0, 360, 720, 1080],
    outputRange: ['-360deg', '0deg', '360deg', '720deg', '1080deg'],
  })

  const rotateY = rotateYAnim.interpolate({
    inputRange: [-360, 0, 360, 720, 1080],
    outputRange: ['-360deg', '0deg', '360deg', '720deg', '1080deg'],
  })

  return (
    <View style={styles.container}>
      {/* 3D Dice Container */}
      <View style={styles.diceScene}>
        <Animated.View
          style={[
            styles.diceCube,
            {
              transform: [
                { perspective: 800 },
                { translateY: bounceAnim },
                { scale: scaleAnim },
                { rotateX: rotateX },
                { rotateY: rotateY },
              ],
            },
          ]}
        >
          {/* Main visible face */}
          <DiceFace value={displayValue} />
          
          {/* 3D edge effects */}
          <View style={styles.diceEdgeTop} />
          <View style={styles.diceEdgeRight} />
          <View style={styles.diceEdgeBottom} />
          <View style={styles.diceEdgeLeft} />
        </Animated.View>
      </View>

      {/* Shadow */}
      <Animated.View
        style={[
          styles.shadow,
          {
            transform: [
              { scaleX: scaleAnim },
              {
                scaleY: bounceAnim.interpolate({
                  inputRange: [-25, 0],
                  outputRange: [0.6, 1],
                  extrapolate: 'clamp',
                }),
              },
            ],
            opacity: bounceAnim.interpolate({
              inputRange: [-25, 0],
              outputRange: [0.2, 0.5],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />

      {/* Roll button with glassmorphism effect when it's player's turn */}
      <Animated.View
        style={[
          styles.buttonContainer,
          isMyTurn && !isDisabled && !isRolling && {
            opacity: blinkAnim,
            transform: [
              {
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        {/* Glassmorphism glow effect */}
        {isMyTurn && !isDisabled && !isRolling && (
          <Animated.View
            style={[
              styles.glassGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.8],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            isMyTurn && !isDisabled && !isRolling && styles.buttonMyTurn,
            isDisabled && styles.buttonDisabled,
            pressed && !isDisabled && styles.buttonPressed,
          ]}
          onPress={handleRoll}
          disabled={isDisabled || isRolling}
        >
          <Text style={[
            styles.buttonText, 
            isMyTurn && !isDisabled && !isRolling && styles.buttonTextMyTurn,
            isDisabled && styles.buttonTextDisabled
          ]}>
            {isRolling ? '🎲 Mengocok...' : isDisabled ? '⏳ Tunggu' : isMyTurn ? '🎲 GILIRAN KAMU!' : '🎲 Lempar Dadu'}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Status text */}
      {isDisabled && !isRolling && (
        <Text style={styles.statusText}>Bukan giliranmu</Text>
      )}

      {/* Large Result Modal */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="none"
        onRequestClose={() => {}}
      >
        <View style={styles.resultModalOverlay}>
          <Animated.View
            style={[
              styles.resultModalContent,
              {
                transform: [{ scale: resultScaleAnim }],
                opacity: resultOpacityAnim,
              },
            ]}
          >
            <Text style={styles.resultModalTitle}>Kamu dapat!</Text>
            <View style={styles.largeDiceContainer}>
              <DiceFace value={diceResult} size={LARGE_DICE_SIZE} dotSize={LARGE_DOT_SIZE} />
            </View>
            <Text style={styles.resultModalNumber}>{diceResult}</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  diceScene: {
    width: DICE_SIZE + 20,
    height: DICE_SIZE + 20,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceCube: {
    width: DICE_SIZE,
    height: DICE_SIZE,
    position: 'relative',
  },
  diceFace: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E8E8E8',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 20px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.1)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 12,
      },
    }),
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#2C2C2C',
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
      },
    }),
  },
  // 3D edge effects for depth illusion
  diceEdgeTop: {
    position: 'absolute',
    top: -4,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  diceEdgeRight: {
    position: 'absolute',
    top: 4,
    right: -4,
    bottom: 4,
    width: 4,
    backgroundColor: '#D8D8D8',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  diceEdgeBottom: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: '#C8C8C8',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  diceEdgeLeft: {
    position: 'absolute',
    top: 4,
    left: -4,
    bottom: 4,
    width: 4,
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  shadow: {
    width: DICE_SIZE * 0.7,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
    marginBottom: 15,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassGlow: {
    position: 'absolute',
    width: 200,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 30px rgba(76, 175, 80, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
      } as any,
      default: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
      },
    }),
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#45a049',
  },
  buttonMyTurn: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderColor: '#4CAF50',
    borderWidth: 3,
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(76, 175, 80, 0.8), inset 0 2px 10px rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(5px)',
      } as any,
      default: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 12,
      },
    }),
  },
  buttonPressed: {
    backgroundColor: '#45a049',
    transform: [{ scale: 0.96 }],
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    borderColor: '#bbbbbb',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  buttonTextMyTurn: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonTextDisabled: {
    color: '#888888',
  },
  statusText: {
    marginTop: 8,
    color: '#888888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Result Modal Styles
  resultModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  resultModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  largeDiceContainer: {
    marginBottom: 16,
  },
  resultModalNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
})
