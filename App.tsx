import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import GameNavigator from './src/navigation/GameNavigator'

/**
 * App - Main entry point for Snake & Ladder game
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <GameNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
