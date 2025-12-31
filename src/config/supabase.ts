import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Supabase configuration from environment variables
// For production builds, these come from app.json extra config
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  'https://xsqdyfexvwomwjqheskv.supabase.co'

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcWR5ZmV4dndvbXdqcWhlc2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzYyNjAsImV4cCI6MjA4Mjc1MjI2MH0.Je_ZUbiVTSHunVFtQ7PEonBac548lM7WikTFcrg7_8s'

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
