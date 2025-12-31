import { createClient, RealtimeChannel } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

/**
 * Supabase client instance
 * Configured for real-time game synchronization
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Subscribe to a game room for real-time updates
 * @param roomId - The unique identifier of the game room
 * @param callback - Function to handle incoming game updates
 * @returns RealtimeChannel instance for the subscription
 */
export const subscribeToGameRoom = (
  roomId: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  return supabase
    .channel(`game-room:${roomId}`)
    .on('broadcast', { event: 'game-update' }, (payload) => {
      callback(payload)
    })
    .subscribe()
}

/**
 * Broadcast a game update to all players in a room
 * @param roomId - The unique identifier of the game room
 * @param data - The game update data to broadcast
 */
export const broadcastGameUpdate = async (
  roomId: string,
  data: any
): Promise<void> => {
  const channel = supabase.channel(`game-room:${roomId}`)
  
  await channel.send({
    type: 'broadcast',
    event: 'game-update',
    payload: data,
  })
}
