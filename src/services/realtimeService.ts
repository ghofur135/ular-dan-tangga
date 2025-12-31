import { supabase } from '../config/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { GameUpdatePayload } from '../types/game'

/**
 * Service for handling real-time game synchronization via Supabase Realtime
 */
export class RealtimeGameService {
  private channel: RealtimeChannel | null = null
  private roomId: string = ''

  /**
   * Subscribe to a game room for real-time updates
   * @param roomId - Unique identifier of the game room
   * @param onUpdate - Callback function to handle game updates
   * @returns RealtimeChannel instance
   */
  subscribeToGameRoom(
    roomId: string,
    onUpdate: (payload: GameUpdatePayload) => void
  ): RealtimeChannel {
    this.roomId = roomId

    this.channel = supabase
      .channel(`game-room:${roomId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: roomId },
        },
      })
      .on('broadcast', { event: 'game-update' }, (payload) => {
        console.log('Received game update:', payload)
        onUpdate(payload.payload as GameUpdatePayload)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState()
        console.log('Presence sync - Players in room:', state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Player joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Player left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to room:', roomId)
        }
      })

    return this.channel
  }

  /**
   * Track user presence in the room
   * @param userId - User's unique identifier
   * @param playerName - Player's display name
   */
  async trackPresence(userId: string, playerName: string): Promise<void> {
    if (!this.channel) {
      console.error('No channel to track presence')
      return
    }

    try {
      await this.channel.track({
        userId,
        playerName,
        status: 'online',
        joinedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to track presence:', error)
    }
  }

  /**
   * Broadcast a player move to all players in the room
   */
  async broadcastPlayerMove(
    playerId: string,
    playerName: string,
    previousPos: number,
    newPos: number,
    diceRoll: number,
    moveType: string
  ): Promise<void> {
    if (!this.channel) {
      console.error('No channel to broadcast')
      return
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'game-update',
        payload: {
          event: 'player_moved',
          playerId,
          playerName,
          data: {
            previousPosition: previousPos,
            newPosition: newPos,
            diceRoll,
            moveType,
          },
          timestamp: Date.now(),
        } as GameUpdatePayload,
      })
    } catch (error) {
      console.error('Failed to broadcast player move:', error)
    }
  }

  /**
   * Broadcast turn change to all players
   */
  async broadcastTurnChange(
    nextPlayerId: string,
    nextPlayerName: string,
    nextPlayerIndex: number
  ): Promise<void> {
    if (!this.channel) {
      console.error('No channel to broadcast')
      return
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'game-update',
        payload: {
          event: 'turn_changed',
          playerId: nextPlayerId,
          playerName: nextPlayerName,
          data: {
            nextPlayerIndex,
          },
          timestamp: Date.now(),
        } as GameUpdatePayload,
      })
    } catch (error) {
      console.error('Failed to broadcast turn change:', error)
    }
  }

  /**
   * Broadcast game end to all players
   */
  async broadcastGameEnd(winnerId: string, winnerName: string): Promise<void> {
    if (!this.channel) {
      console.error('No channel to broadcast')
      return
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'game-update',
        payload: {
          event: 'game_ended',
          playerId: winnerId,
          playerName: winnerName,
          data: {
            winnerId,
            winnerName,
          },
          timestamp: Date.now(),
        } as GameUpdatePayload,
      })
    } catch (error) {
      console.error('Failed to broadcast game end:', error)
    }
  }

  /**
   * Broadcast player joined event
   */
  async broadcastPlayerJoined(
    playerId: string,
    playerName: string,
    playerColor: string
  ): Promise<void> {
    if (!this.channel) {
      console.error('No channel to broadcast')
      return
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'game-update',
        payload: {
          event: 'player_joined',
          playerId,
          playerName,
          data: {
            playerId,
            playerName,
            playerColor,
            position: 1,
          },
          timestamp: Date.now(),
        } as GameUpdatePayload,
      })
    } catch (error) {
      console.error('Failed to broadcast player joined:', error)
    }
  }

  /**
   * Broadcast game start event
   */
  async broadcastGameStart(): Promise<void> {
    if (!this.channel) {
      console.error('No channel to broadcast')
      return
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'game-update',
        payload: {
          event: 'game_started' as any,
          playerId: '',
          playerName: '',
          data: {},
          timestamp: Date.now(),
        },
      })
    } catch (error) {
      console.error('Failed to broadcast game start:', error)
    }
  }

  /**
   * Unsubscribe from the current room
   */
  unsubscribeFromRoom(): void {
    if (this.channel) {
      console.log('Unsubscribing from room:', this.roomId)
      supabase.removeChannel(this.channel)
      this.channel = null
      this.roomId = ''
    }
  }

  /**
   * Get current presence state in the room
   */
  getPresence(): Record<string, any> | undefined {
    return this.channel?.presenceState()
  }

  /**
   * Check if currently subscribed to a room
   */
  isSubscribed(): boolean {
    return this.channel !== null
  }

  /**
   * Get current room ID
   */
  getRoomId(): string {
    return this.roomId
  }
}

// Export singleton instance
export const realtimeService = new RealtimeGameService()
