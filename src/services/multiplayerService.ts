import { supabase } from '../config/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface OnlineRoom {
  id: string
  roomCode: string
  name: string
  hostName: string
  status: 'waiting' | 'playing' | 'finished'
  currentPlayers: number
  maxPlayers: number
  createdAt: Date
}

export interface OnlinePlayer {
  id: string
  roomId: string
  playerName: string
  playerColor: string
  avatar?: number
  position: number
  isHost: boolean
  isCurrentTurn: boolean
  playerOrder: number
}

export interface GameUpdate {
  type: 'player_joined' | 'player_left' | 'game_started' | 'player_moved' | 'turn_changed' | 'game_ended'
  data: any
}

class MultiplayerService {
  private channel: RealtimeChannel | null = null
  private currentRoomId: string | null = null
  private currentPlayerId: string | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null

  /**
   * Start heartbeat to keep player session alive
   */
  private startHeartbeat(playerId: string): void {
    // Clear any existing heartbeat
    this.stopHeartbeat()
    
    this.currentPlayerId = playerId
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentPlayerId) {
        await this.sendHeartbeat(this.currentPlayerId)
      }
    }, 30000)
    
    // Send initial heartbeat
    this.sendHeartbeat(playerId)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Send heartbeat to update last_active
   */
  private async sendHeartbeat(playerId: string): Promise<void> {
    try {
      await supabase
        .from('game_players')
        .update({ last_active: new Date().toISOString() })
        .eq('id', playerId)
    } catch (error) {
      console.error('Heartbeat error:', error)
    }
  }

  /**
   * Create a new game room
   */
  async createRoom(roomName: string, hostName: string, hostColor: string, avatar: number = 1): Promise<{ room: OnlineRoom; player: OnlinePlayer } | null> {
    try {
      // Create room using function
      const { data: roomData, error: roomError } = await supabase
        .rpc('create_game_room', { p_name: roomName, p_host_name: hostName })

      if (roomError || !roomData || roomData.length === 0) {
        console.error('Error creating room:', roomError)
        return null
      }

      const { room_id, room_code } = roomData[0]

      // Add host as first player
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          room_id: room_id,
          player_name: hostName,
          player_color: hostColor,
          avatar: avatar,
          is_host: true,
          is_current_turn: true,
          player_order: 0,
        })
        .select()
        .single()

      if (playerError) {
        console.error('Error adding host player:', playerError)
        return null
      }

      const room: OnlineRoom = {
        id: room_id,
        roomCode: room_code,
        name: roomName,
        hostName: hostName,
        status: 'waiting',
        currentPlayers: 1,
        maxPlayers: 4,
        createdAt: new Date(),
      }

      const player: OnlinePlayer = {
        id: playerData.id,
        roomId: room_id,
        playerName: hostName,
        playerColor: hostColor,
        avatar: avatar,
        position: 1,
        isHost: true,
        isCurrentTurn: true,
        playerOrder: 0,
      }

      // Start heartbeat for this player
      this.startHeartbeat(playerData.id)

      return { room, player }
    } catch (error) {
      console.error('Error in createRoom:', error)
      return null
    }
  }

  /**
   * Join an existing room by code
   */
  async joinRoom(roomCode: string, playerName: string, playerColor: string, avatar: number = 1): Promise<{ room: OnlineRoom; player: OnlinePlayer; players: OnlinePlayer[] } | null> {
    try {
      // Find room by code
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single()

      if (roomError || !roomData) {
        console.error('Room not found:', roomError)
        return null
      }

      if (roomData.current_players >= roomData.max_players) {
        console.error('Room is full')
        return null
      }

      // Get current player count for order
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact' })
        .eq('room_id', roomData.id)

      const playerOrder = count || 0

      // Add player to room
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          room_id: roomData.id,
          player_name: playerName,
          player_color: playerColor,
          avatar: avatar,
          is_host: false,
          is_current_turn: false,
          player_order: playerOrder,
        })
        .select()
        .single()

      if (playerError) {
        console.error('Error joining room:', playerError)
        return null
      }

      // Update room player count
      await supabase
        .from('game_rooms')
        .update({ current_players: roomData.current_players + 1 })
        .eq('id', roomData.id)

      // Get all players in room
      const { data: playersData } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('player_order', { ascending: true })

      const room: OnlineRoom = {
        id: roomData.id,
        roomCode: roomData.room_code,
        name: roomData.name,
        hostName: roomData.host_name,
        status: roomData.status,
        currentPlayers: roomData.current_players + 1,
        maxPlayers: roomData.max_players,
        createdAt: new Date(roomData.created_at),
      }

      const player: OnlinePlayer = {
        id: playerData.id,
        roomId: roomData.id,
        playerName: playerName,
        playerColor: playerColor,
        avatar: avatar,
        position: 1,
        isHost: false,
        isCurrentTurn: false,
        playerOrder: playerOrder,
      }

      const players: OnlinePlayer[] = (playersData || []).map((p: any) => ({
        id: p.id,
        roomId: p.room_id,
        playerName: p.player_name,
        playerColor: p.player_color,
        avatar: p.avatar,
        position: p.position,
        isHost: p.is_host,
        isCurrentTurn: p.is_current_turn,
        playerOrder: p.player_order,
      }))

      // Start heartbeat for this player
      this.startHeartbeat(playerData.id)

      return { room, player, players }
    } catch (error) {
      console.error('Error in joinRoom:', error)
      return null
    }
  }

  /**
   * Get available rooms
   */
  async getAvailableRooms(): Promise<OnlineRoom[]> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error getting rooms:', error)
        return []
      }

      return data.map((room: any) => ({
        id: room.id,
        roomCode: room.room_code,
        name: room.name,
        hostName: room.host_name,
        status: room.status,
        currentPlayers: room.current_players,
        maxPlayers: room.max_players,
        createdAt: new Date(room.created_at),
      }))
    } catch (error) {
      console.error('Error in getAvailableRooms:', error)
      return []
    }
  }

  /**
   * Subscribe to room updates
   */
  subscribeToRoom(roomId: string, onUpdate: (update: GameUpdate) => void): void {
    this.currentRoomId = roomId

    this.channel = supabase
      .channel(`room:${roomId}`)
      .on('broadcast', { event: 'game_update' }, (payload) => {
        onUpdate(payload.payload as GameUpdate)
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            onUpdate({ type: 'player_joined', data: payload.new })
          } else if (payload.eventType === 'UPDATE') {
            onUpdate({ type: 'player_moved', data: payload.new })
          } else if (payload.eventType === 'DELETE') {
            onUpdate({ type: 'player_left', data: payload.old })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new.status === 'playing') {
            onUpdate({ type: 'game_started', data: payload.new })
          } else if (payload.new.status === 'finished') {
            onUpdate({ type: 'game_ended', data: payload.new })
          }
        }
      )
      .subscribe()
  }

  /**
   * Broadcast game update to all players
   */
  async broadcastUpdate(update: GameUpdate): Promise<void> {
    if (!this.channel) return

    await this.channel.send({
      type: 'broadcast',
      event: 'game_update',
      payload: update,
    })
  }

  /**
   * Start the game (host only)
   */
  async startGame(roomId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          status: 'playing', 
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('id', roomId)

      if (error) {
        console.error('Error starting game:', error)
        return false
      }

      await this.broadcastUpdate({ type: 'game_started', data: {} })
      return true
    } catch (error) {
      console.error('Error in startGame:', error)
      return false
    }
  }

  /**
   * Update player position
   */
  async updatePlayerPosition(playerId: string, position: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_players')
        .update({ position, last_active: new Date().toISOString() })
        .eq('id', playerId)

      return !error
    } catch (error) {
      console.error('Error updating position:', error)
      return false
    }
  }

  /**
   * Update current turn
   */
  async updateCurrentTurn(roomId: string, currentPlayerId: string, nextPlayerId: string): Promise<boolean> {
    try {
      // Remove turn from current player
      await supabase
        .from('game_players')
        .update({ is_current_turn: false })
        .eq('id', currentPlayerId)

      // Give turn to next player
      const { error } = await supabase
        .from('game_players')
        .update({ is_current_turn: true })
        .eq('id', nextPlayerId)

      return !error
    } catch (error) {
      console.error('Error updating turn:', error)
      return false
    }
  }

  /**
   * Record a move
   */
  async recordMove(
    roomId: string,
    playerId: string,
    playerName: string,
    previousPos: number,
    newPos: number,
    diceRoll: number,
    moveType: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('move_history').insert({
        room_id: roomId,
        player_id: playerId,
        player_name: playerName,
        previous_position: previousPos,
        new_position: newPos,
        dice_roll: diceRoll,
        move_type: moveType,
        user_id: null, // For anonymous multiplayer
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
   * End game with winner
   */
  async endGame(roomId: string, winnerName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({
          status: 'finished',
          winner_name: winnerName,
          ended_at: new Date().toISOString(),
        })
        .eq('id', roomId)

      if (!error) {
        await this.broadcastUpdate({ type: 'game_ended', data: { winnerName } })
        
        // Auto-delete room after 5 seconds
        setTimeout(() => {
          this.deleteRoom(roomId)
        }, 5000)
      }

      return !error
    } catch (error) {
      console.error('Error ending game:', error)
      return false
    }
  }

  /**
   * Leave room
   */
  async leaveRoom(playerId: string, roomId: string): Promise<void> {
    try {
      // Stop heartbeat
      this.stopHeartbeat()
      this.currentPlayerId = null

      await supabase.from('game_players').delete().eq('id', playerId)

      // Check remaining players
      const { data: remainingPlayers } = await supabase
        .from('game_players')
        .select('id')
        .eq('room_id', roomId)

      const playerCount = remainingPlayers?.length || 0

      if (playerCount === 0) {
        // No players left, delete the room
        await this.deleteRoom(roomId)
      } else {
        // Update player count
        await supabase
          .from('game_rooms')
          .update({ current_players: playerCount })
          .eq('id', roomId)
      }
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  }

  /**
   * Delete a room and all related data
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      // Delete move history first (foreign key constraint)
      await supabase.from('move_history').delete().eq('room_id', roomId)
      
      // Delete all players in room
      await supabase.from('game_players').delete().eq('room_id', roomId)
      
      // Delete the room
      const { error } = await supabase.from('game_rooms').delete().eq('id', roomId)
      
      if (error) {
        console.error('Error deleting room:', error)
        return false
      }
      
      console.log('Room deleted:', roomId)
      return true
    } catch (error) {
      console.error('Error in deleteRoom:', error)
      return false
    }
  }

  /**
   * Cleanup finished rooms and stale players (call periodically or on lobby load)
   */
  async cleanupFinishedRooms(): Promise<number> {
    try {
      let deletedCount = 0

      // 1. Cleanup stale players (inactive for more than 2 minutes)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      
      const { data: stalePlayers } = await supabase
        .from('game_players')
        .select('id, room_id')
        .lt('last_active', twoMinutesAgo)

      if (stalePlayers && stalePlayers.length > 0) {
        console.log(`Found ${stalePlayers.length} stale players to cleanup`)
        
        // Get unique room IDs
        const roomIds = [...new Set(stalePlayers.map(p => p.room_id))]
        
        // Delete stale players
        await supabase
          .from('game_players')
          .delete()
          .lt('last_active', twoMinutesAgo)

        // Update player counts for affected rooms
        for (const roomId of roomIds) {
          const { data: remainingPlayers } = await supabase
            .from('game_players')
            .select('id')
            .eq('room_id', roomId)

          const count = remainingPlayers?.length || 0
          
          if (count === 0) {
            // Delete empty room
            await this.deleteRoom(roomId)
            deletedCount++
          } else {
            await supabase
              .from('game_rooms')
              .update({ current_players: count })
              .eq('id', roomId)
          }
        }
      }

      // 2. Delete finished rooms
      const { data: finishedRooms } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('status', 'finished')

      if (finishedRooms) {
        for (const room of finishedRooms) {
          const success = await this.deleteRoom(room.id)
          if (success) deletedCount++
        }
      }

      // 3. Delete rooms with 0 players
      const { data: emptyRooms } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('current_players', 0)

      if (emptyRooms) {
        for (const room of emptyRooms) {
          const success = await this.deleteRoom(room.id)
          if (success) deletedCount++
        }
      }

      // 4. Delete waiting rooms with no activity for 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      
      const { data: staleWaitingRooms } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('status', 'waiting')
        .lt('last_activity', tenMinutesAgo)

      if (staleWaitingRooms) {
        for (const room of staleWaitingRooms) {
          const success = await this.deleteRoom(room.id)
          if (success) deletedCount++
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} rooms`)
      }
      return deletedCount
    } catch (error) {
      console.error('Error in cleanupFinishedRooms:', error)
      return 0
    }
  }

  /**
   * Unsubscribe from room
   */
  unsubscribe(): void {
    // Stop heartbeat
    this.stopHeartbeat()
    this.currentPlayerId = null

    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
      this.currentRoomId = null
    }
  }

  /**
   * Get players in room
   */
  async getPlayersInRoom(roomId: string): Promise<OnlinePlayer[]> {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomId)
        .order('player_order', { ascending: true })

      if (error) return []

      return data.map((p: any) => ({
        id: p.id,
        roomId: p.room_id,
        playerName: p.player_name,
        playerColor: p.player_color,
        avatar: p.avatar,
        position: p.position,
        isHost: p.is_host,
        isCurrentTurn: p.is_current_turn,
        playerOrder: p.player_order,
      }))
    } catch (error) {
      return []
    }
  }

  /**
   * Get taken avatars in a room by room code
   */
  async getTakenAvatarsInRoom(roomCode: string): Promise<number[]> {
    try {
      // First find the room by code
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (roomError || !roomData) {
        return []
      }

      // Get all players' avatars in the room
      const { data: players, error: playersError } = await supabase
        .from('game_players')
        .select('avatar')
        .eq('room_id', roomData.id)

      if (playersError || !players) {
        return []
      }

      return players.map((p: any) => p.avatar).filter((a: number) => a != null)
    } catch (error) {
      console.error('Error getting taken avatars:', error)
      return []
    }
  }
}

export const multiplayerService = new MultiplayerService()
