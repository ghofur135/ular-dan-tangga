-- Snake & Ladder Game Database Schema
-- Run this SQL in Supabase SQL Editor

-- 1. Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create game_rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting',
  max_players INT DEFAULT 4,
  current_players INT DEFAULT 0,
  winner_id UUID,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create game_players table
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  player_color VARCHAR(20) NOT NULL,
  position INT DEFAULT 1,
  is_current_turn BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 4. Create move_history table
CREATE TABLE IF NOT EXISTS move_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_position INT NOT NULL,
  new_position INT NOT NULL,
  dice_roll INT NOT NULL,
  move_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_games_played INT DEFAULT 0,
  total_games_won INT DEFAULT 0,
  total_games_lost INT DEFAULT 0,
  average_moves INT DEFAULT 0,
  longest_game_duration INT,
  shortest_game_duration INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  ps.total_games_played,
  ps.total_games_won,
  ps.total_games_lost,
  ROUND((ps.total_games_won::NUMERIC / NULLIF(ps.total_games_played, 0) * 100), 2) AS win_percentage,
  ps.average_moves,
  ROW_NUMBER() OVER (ORDER BY ps.total_games_won DESC, ps.total_games_played DESC) AS rank
FROM users u
LEFT JOIN player_stats ps ON u.id = ps.user_id
ORDER BY ps.total_games_won DESC;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_created_by ON game_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_game_players_room_id ON game_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_move_history_room_id ON move_history(room_id);
CREATE INDEX IF NOT EXISTS idx_move_history_player_id ON move_history(player_id);
CREATE INDEX IF NOT EXISTS idx_move_history_created_at ON move_history(created_at);

-- 8. Create helper function to increment player count
CREATE OR REPLACE FUNCTION increment_player_count(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE game_rooms
  SET current_players = current_players + 1,
      updated_at = NOW()
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql;
