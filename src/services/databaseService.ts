import { supabase } from '../config/supabase'
import { GameRoom, Player, MoveEvent, LeaderboardEntry } from '../types/game'

/**
 * Service for handling database operations via Supabase
 */
export class DatabaseService {
  /**
   * Create a new game room
   */
  async createGameRoom(roomName: string, oderId: string): Promise<GameRoom | null> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          name: roomName,
          created_by: oderId,
          status: 'waiting',
          max_players: 4,
          current_players: 1,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating game room:', error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        players: [],
        currentTurnPlayerId: '',
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error('Error creating game room:', error)
      return null
    }
  }

  /**
   * Get a game room by ID
   */
  async getGameRoom(roomId: string): Promise<GameRoom | null> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error) {
        console.error('Error getting game room:', error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        players: [],
        currentTurnPlayerId: '',
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error('Error getting game room:', error)
      return null
    }
  }

  /**
   * Get all available (waiting) game rooms
   */
  async getAvailableRooms(): Promise<GameRoom[]> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error getting available rooms:', error)
        return []
      }

      return data.map((room) => ({
        id: room.id,
        name: room.name,
        players: [],
        currentTurnPlayerId: '',
        status: room.status,
        createdAt: new Date(room.created_at),
        updatedAt: new Date(room.updated_at),
      }))
    } catch (error) {
      console.error('Error getting available rooms:', error)
      return []
    }
  }

  /**
   * Add a player to a game room
   */
  async addPlayerToGame(
    roomId: string,
    oderId: string,
    playerName: string,
    playerColor: string
  ): Promise<Player | null> {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .insert({
          room_id: roomId,
          user_id: oderId,
          player_name: playerName,
          player_color: playerColor,
          position: 1,
          is_current_turn: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding player to game:', error)
        return null
      }

      // Update room player count
      await supabase.rpc('increment_player_count', { room_id: roomId })

      return {
        id: data.id,
        name: data.player_name,
        color: data.player_color,
        position: data.position,
        isCurrentTurn: data.is_current_turn,
        joinedAt: new Date(data.joined_at),
      }
    } catch (error) {
      console.error('Error adding player to game:', error)
      return null
    }
  }

  /**
   * Get all players in a room
   */
  async getPlayersInRoom(roomId: string): Promise<Player[]> {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

      if (error) {
        console.error('Error getting players in room:', error)
        return []
      }

      return data.map((player) => ({
        id: player.id,
        name: player.player_name,
        color: player.player_color,
        position: player.position,
        isCurrentTurn: player.is_current_turn,
        joinedAt: new Date(player.joined_at),
      }))
    } catch (error) {
      console.error('Error getting players in room:', error)
      return []
    }
  }

  /**
   * Record a move in the game history
   */
  async recordMove(
    roomId: string,
    playerId: string,
    oderId: string,
    previousPos: number,
    newPos: number,
    diceRoll: number,
    moveType: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('move_history').insert({
        room_id: roomId,
        player_id: playerId,
        user_id: oderId,
        previous_position: previousPos,
        new_position: newPos,
        dice_roll: diceRoll,
        move_type: moveType,
      })

      if (error) {
        console.error('Error recording move:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error recording move:', error)
      return false
    }
  }

  /**
   * Update game room status
   */
  async updateGameStatus(
    roomId: string,
    status: 'waiting' | 'playing' | 'finished',
    winnerId?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'playing') {
        updateData.started_at = new Date().toISOString()
      }

      if (status === 'finished') {
        updateData.ended_at = new Date().toISOString()
        if (winnerId) {
          updateData.winner_id = winnerId
        }
      }

      const { error } = await supabase
        .from('game_rooms')
        .update(updateData)
        .eq('id', roomId)

      if (error) {
        console.error('Error updating game status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating game status:', error)
      return false
    }
  }

  /**
   * Get game move history
   */
  async getGameHistory(roomId: string): Promise<MoveEvent[]> {
    try {
      const { data, error } = await supabase
        .from('move_history')
        .select('*, game_players(player_name)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting game history:', error)
        return []
      }

      return data.map((move) => ({
        playerId: move.player_id,
        playerName: move.game_players?.player_name || 'Unknown',
        previousPosition: move.previous_position,
        newPosition: move.new_position,
        diceRoll: move.dice_roll,
        timestamp: new Date(move.created_at),
        moveType: move.move_type as 'normal' | 'snake' | 'ladder',
      }))
    } catch (error) {
      console.error('Error getting game history:', error)
      return []
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(limit)

      if (error) {
        console.error('Error getting leaderboard:', error)
        return []
      }

      return data.map((entry) => ({
        id: entry.id,
        username: entry.username,
        avatarUrl: entry.avatar_url,
        totalGamesPlayed: entry.total_games_played || 0,
        totalGamesWon: entry.total_games_won || 0,
        totalGamesLost: entry.total_games_lost || 0,
        winPercentage: entry.win_percentage || 0,
        rank: entry.rank,
      }))
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  }

  /**
   * Update player statistics after a game
   */
  async updatePlayerStats(
    oderId: string,
    won: boolean,
    gameDuration: number,
    totalMoves: number
  ): Promise<boolean> {
    try {
      // First, get current stats
      const { data: currentStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', oderId)
        .single()

      if (currentStats) {
        // Update existing stats
        const newGamesPlayed = currentStats.total_games_played + 1
        const newGamesWon = currentStats.total_games_won + (won ? 1 : 0)
        const newGamesLost = currentStats.total_games_lost + (won ? 0 : 1)
        const newAvgMoves = Math.round(
          (currentStats.average_moves * currentStats.total_games_played + totalMoves) /
            newGamesPlayed
        )

        const { error } = await supabase
          .from('player_stats')
          .update({
            total_games_played: newGamesPlayed,
            total_games_won: newGamesWon,
            total_games_lost: newGamesLost,
            average_moves: newAvgMoves,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', oderId)

        if (error) {
          console.error('Error updating player stats:', error)
          return false
        }
      } else {
        // Create new stats record
        const { error } = await supabase.from('player_stats').insert({
          user_id: oderId,
          total_games_played: 1,
          total_games_won: won ? 1 : 0,
          total_games_lost: won ? 0 : 1,
          average_moves: totalMoves,
        })

        if (error) {
          console.error('Error creating player stats:', error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error updating player stats:', error)
      return false
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()
