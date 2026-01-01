import { supabase } from '../config/supabase'

export interface RegisteredUser {
  id: string
  username: string
  avatar: number
  created_at: string
}

export const authService = {
  /**
   * Login or Register a user with Username and PIN
   */
  async loginOrRegister(username: string, pin: string, avatar: number): Promise<{ user: RegisteredUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('login_or_register_player', {
        p_username: username,
        p_pin: pin,
        p_avatar: avatar
      })

      if (error) {
        console.error('Auth RPC error:', error)
        return { user: null, error: error.message }
      }

      // Check if the function returned a custom error object
      if (data && data.error) {
        return { user: null, error: data.error }
      }

      return { user: data as RegisteredUser, error: null }
    } catch (e) {
      console.error('Auth exception:', e)
      return { user: null, error: 'Terjadi kesalahan saat menghubungi server.' }
    }
  }
}
