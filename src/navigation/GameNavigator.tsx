import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '../screens/HomeScreen'
import GameScreen from '../screens/GameScreen'
import LeaderboardScreen from '../screens/LeaderboardScreen'
import LobbyScreen from '../screens/LobbyScreen'
import OnlineGameScreen from '../screens/OnlineGameScreen'
import { OnlineRoom, OnlinePlayer } from '../services/multiplayerService'

// Define navigation param types
export type RootStackParamList = {
  Home: undefined
  Game: { roomId?: string }
  Leaderboard: undefined
  Lobby: undefined
  OnlineGame: {
    room: OnlineRoom
    player: OnlinePlayer
    players?: OnlinePlayer[]
    isHost: boolean
  }
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
      <Stack.Screen
        name="Lobby"
        component={LobbyScreen}
        options={{
          title: 'Multiplayer Lobby',
        }}
      />
      <Stack.Screen
        name="OnlineGame"
        component={OnlineGameScreen}
        options={{
          title: 'Online Game',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}
