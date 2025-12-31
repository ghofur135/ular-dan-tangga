import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { LeaderboardEntry } from '../types/game'

// Mock data for demonstration (replace with databaseService.getLeaderboard() when connected)
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', username: 'Champion', totalGamesPlayed: 50, totalGamesWon: 35, totalGamesLost: 15, winPercentage: 70, rank: 1 },
  { id: '2', username: 'ProPlayer', totalGamesPlayed: 45, totalGamesWon: 28, totalGamesLost: 17, winPercentage: 62, rank: 2 },
  { id: '3', username: 'GameMaster', totalGamesPlayed: 60, totalGamesWon: 32, totalGamesLost: 28, winPercentage: 53, rank: 3 },
  { id: '4', username: 'LuckyDice', totalGamesPlayed: 30, totalGamesWon: 15, totalGamesLost: 15, winPercentage: 50, rank: 4 },
  { id: '5', username: 'Newbie', totalGamesPlayed: 10, totalGamesWon: 3, totalGamesLost: 7, winPercentage: 30, rank: 5 },
]

/**
 * LeaderboardScreen - Displays player rankings and statistics
 */
export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeaderboard = async () => {
    try {
      // TODO: Replace with actual database call
      // const data = await databaseService.getLeaderboard()
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
      setLeaderboard(MOCK_LEADERBOARD)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLeaderboard()
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={[styles.row, item.rank <= 3 && styles.topRow]}>
      <View style={styles.rankCell}>
        <Text style={[styles.rankText, item.rank <= 3 && styles.topRankText]}>
          {getRankEmoji(item.rank)}
        </Text>
      </View>
      <View style={styles.nameCell}>
        <Text style={styles.nameText} numberOfLines={1}>
          {item.username}
        </Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.statText}>{item.totalGamesPlayed}</Text>
      </View>
      <View style={styles.statCell}>
        <Text style={[styles.statText, styles.winText]}>{item.totalGamesWon}</Text>
      </View>
      <View style={styles.statCell}>
        <Text style={[styles.statText, styles.lossText]}>{item.totalGamesLost}</Text>
      </View>
      <View style={styles.percentCell}>
        <Text style={styles.percentText}>{item.winPercentage}%</Text>
      </View>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <View style={styles.rankCell}>
        <Text style={styles.headerText}>Rank</Text>
      </View>
      <View style={styles.nameCell}>
        <Text style={styles.headerText}>Player</Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.headerText}>Games</Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.headerText}>Wins</Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.headerText}>Losses</Text>
      </View>
      <View style={styles.percentCell}>
        <Text style={styles.headerText}>Win%</Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Pressable style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </Pressable>
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        {renderHeader()}
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No players yet</Text>
              <Text style={styles.emptySubtext}>Be the first to play!</Text>
            </View>
          }
        />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Rankings are based on total wins. Play more games to climb the leaderboard!
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topRow: {
    backgroundColor: '#f8fff8',
  },
  rankCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    color: '#666',
  },
  topRankText: {
    fontSize: 20,
  },
  nameCell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  winText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  lossText: {
    color: '#f44336',
  },
  percentCell: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  infoContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
})
