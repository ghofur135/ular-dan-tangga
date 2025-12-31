import React, { useCallback, useEffect, useState } from 'react'
import { View, Image, StyleSheet, Animated, Platform } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import GameNavigator from './src/navigation/GameNavigator'

// Keep the splash screen visible while we fetch resources (only works on native)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync()
}

/**
 * Custom Splash Screen Component for Web
 */
function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeAnim] = useState(new Animated.Value(1))

  useEffect(() => {
    // Wait 2 seconds then fade out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish()
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Image
        source={require('./assets/splash.png')}
        style={styles.splashImage}
        resizeMode="contain"
      />
    </Animated.View>
  )
}

/**
 * App - Main entry point for Snake & Ladder game
 */
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

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && Platform.OS !== 'web') {
      // Hide native splash screen (only on mobile)
      await SplashScreen.hideAsync()
    }
  }, [appIsReady])

  // Show custom splash screen on web, or while app is loading
  if (!appIsReady || (showSplash && Platform.OS === 'web')) {
    if (Platform.OS === 'web' && appIsReady) {
      return <CustomSplashScreen onFinish={() => setShowSplash(false)} />
    }
    return null
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NavigationContainer>
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
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
})
