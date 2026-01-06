import React, { useCallback, useEffect, useState, useRef } from 'react'
import { View, Image, StyleSheet, Animated, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import GameNavigator from './src/navigation/GameNavigator'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
})

/**
 * Custom Splash Screen Component
 * Renders a full-screen image to replace the native splash screen
 * ensuring consistent look across Android 12+, iOS, and Web.
 */
function CustomSplashScreen({
  isAppReady,
  onFinish,
}: {
  isAppReady: boolean
  onFinish: () => void
}) {
  const fadeAnim = useRef(new Animated.Value(1)).current
  const [isAnimationStarted, setIsAnimationStarted] = useState(false)

  useEffect(() => {
    // Hide the native splash screen as soon as this component mounts
    // This allows our full-screen image to take over immediately
    async function hideNativeSplash() {
      try {
        await SplashScreen.hideAsync()
      } catch (e) {
        // ignore
      }
    }
    hideNativeSplash()
  }, [])

  useEffect(() => {
    // Once app is ready, start the fade out animation
    if (isAppReady && !isAnimationStarted) {
      setIsAnimationStarted(true)
      // Minimum display time check could go here if needed,
      // but 'isAppReady' usually includes our artificial delay.

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish()
      })
    }
  }, [isAppReady])

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Image
        source={require('./assets/splash.png')}
        style={styles.splashImage}
        resizeMode="cover"
      />
    </Animated.View>
  )
}

/**
 * App - Main entry point for Snake & Ladder game
 */
import * as Linking from 'expo-linking'

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Home: '',
      AdminLogin: 'managers-game',
      AdminDashboard: 'admin-dashboard',
      Game: 'game',
      Leaderboard: 'leaderboard',
      Lobby: 'lobby'
    },
  },
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // Simulate loading time (minimum 2 seconds for splash screen)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (e) {
        console.warn(e)
      } finally {
        // Tell the application to render
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  // While splash is showing, render the custom splash screen
  if (showSplash) {
    return (
      <CustomSplashScreen
        isAppReady={appIsReady}
        onFinish={() => setShowSplash(false)}
      />
    )
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer linking={linking}>
          <StatusBar style="auto" />
          <GameNavigator />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
})
