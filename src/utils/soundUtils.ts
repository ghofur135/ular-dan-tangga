import { Audio } from 'expo-av'

// Global background music reference
let backgroundMusic: Audio.Sound | null = null

/**
 * Start background music (welcome intro)
 */
export const startBackgroundMusic = async () => {
  try {
    // Stop existing music first
    await stopBackgroundMusic()
    
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound/welcome-intro.mp3'),
      { shouldPlay: true, volume: 0.7, isLooping: true }
    )
    backgroundMusic = sound
    await sound.playAsync()
  } catch (error) {
    console.log('Error starting background music:', error)
  }
}

/**
 * Stop background music
 */
export const stopBackgroundMusic = async () => {
  try {
    if (backgroundMusic) {
      await backgroundMusic.stopAsync()
      await backgroundMusic.unloadAsync()
      backgroundMusic = null
    }
  } catch (error) {
    console.log('Error stopping background music:', error)
  }
}

/**
 * Pause background music
 */
export const pauseBackgroundMusic = async () => {
  try {
    if (backgroundMusic) {
      await backgroundMusic.pauseAsync()
    }
  } catch (error) {
    console.log('Error pausing background music:', error)
  }
}

/**
 * Resume background music
 */
export const resumeBackgroundMusic = async () => {
  try {
    if (backgroundMusic) {
      await backgroundMusic.playAsync()
    }
  } catch (error) {
    console.log('Error resuming background music:', error)
  }
}

/**
 * Check if background music is playing
 */
export const isBackgroundMusicPlaying = async (): Promise<boolean> => {
  try {
    if (backgroundMusic) {
      const status = await backgroundMusic.getStatusAsync()
      return status.isLoaded && status.isPlaying
    }
    return false
  } catch (error) {
    return false
  }
}

/**
 * Play click sound effect
 */
export const playClickSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound/click.mp3')
    )
    await sound.playAsync()
    // Unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync()
      }
    })
  } catch (error) {
    console.log('Error playing click sound:', error)
  }
}

/**
 * Play game start sound effect
 */
export const playGameStartSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound/game-start.mp3')
    )
    await sound.playAsync()
    // Unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync()
      }
    })
  } catch (error) {
    console.log('Error playing game start sound:', error)
  }
}

/**
 * Play turn bell sound effect when it's player's turn
 */
export const playTurnBellSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound/bell-turn.mp3'),
      { volume: 0.8 } // Slightly lower volume for bell
    )
    await sound.playAsync()
    // Unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync()
      }
    })
  } catch (error) {
    console.log('Error playing turn bell sound:', error)
  }
}

/**
 * Play snake sound effect when player lands on snake
 */
export const playSnakeSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound/snake-sound.mp3'),
      { volume: 0.9 }
    )
    await sound.playAsync()
    // Unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync()
      }
    })
  } catch (error) {
    console.log('Error playing snake sound:', error)
  }
}

/**
 * Play ladder sound effect when player lands on ladder
 */
export const playLadderSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sound/ladder-sound.mp3'),
      { volume: 0.9 }
    )
    await sound.playAsync()
    // Unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync()
      }
    })
  } catch (error) {
    console.log('Error playing ladder sound:', error)
  }
}
