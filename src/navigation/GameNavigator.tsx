import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '../screens/HomeScreen'
import GameScreen from '../screens/GameScreen'
import LeaderboardScreen from '../screens/LeaderboardScreen'

// Define navigation param types
export type RootStackParamList = {
  Home: undefined
  Game: { roomId?: string }
  Leaderboard: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * GameNavigator - Main navigation stack for the app
 */
export default function GameNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#f0f4f8',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Snake & Ladder',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{
          title: 'Game',
          headerBackTitle: 'Exit',
        }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          title: 'Leaderboard',
        }}
      />
    </Stack.Navigator>
  )
}
