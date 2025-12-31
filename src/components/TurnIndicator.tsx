import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Player } from '../types/game'

interface TurnIndicatorProps {
  currentPlayer: Player | null
  allPlayers: Player[]
  gameStatus: 'waiting' | 'playing' | 'finished'
}

/**
 * TurnIndicator component - Displays current turn information and player list
 */
export default function TurnIndicator({
  currentPlayer,
  allPlayers,
  gameStatus,
}: TurnIndicatorProps) {
  const getStatusText = () => {
    switch (gameStatus) {
      case 'waiting':
        return 'Waiting for players...'
      case 'playing':
        return currentPlayer ? `${currentPlayer.name}'s Turn` : 'Game in progress'
      case 'finished':
        return 'Game Over!'
      default:
        return ''
    }
  }

  return (
    <View style={styles.container}>
      {/* Current turn display */}
      <View
        style={[
          styles.turnCard,
          currentPlayer && { borderLeftColor: currentPlayer.color },
        ]}
      >
        <Text style={styles.statusLabel}>
          {gameStatus === 'playing' ? 'Current Turn' : 'Status'}
        </Text>
        <Text style={styles.turnText}>{getStatusText()}</Text>
      </View>

      {/* Players list */}
      <View style={styles.playersContainer}>
        <Text style={styles.playersLabel}>Players ({allPlayers.length}/4)</Text>
        <View style={styles.playersList}>
          {allPlayers.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.playerItem,
                player.isCurrentTurn && styles.playerItemActive,
              ]}
            >
              <View
                style={[styles.playerDot, { backgroundColor: player.color }]}
              />
              <Text
                style={[
                  styles.playerName,
                  player.isCurrentTurn && styles.playerNameActive,
                ]}
                numberOfLines={1}
              >
                {player.name}
              </Text>
              <Text style={styles.playerPosition}>📍 {player.position}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  turnCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  turnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  playersContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  playerItemActive: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  playerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  playerNameActive: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  playerPosition: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
})
