-- Snake & Ladder Game Database Schema v2
-- Simplified for anonymous multiplayer (no auth required)
-- Run this SQL in Supabase SQL Editor

-- Drop existing tables if needed (uncomment if you want fresh start)
-- DROP TABLE IF EXISTS move_history CASCADE;
-- DROP TABLE IF EXISTS game_players CASCADE;
-- DROP TABLE IF EXISTS game_rooms CASCADE;

-- 1. Create game_rooms table (simplified, no auth required)
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  host_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  max_players INT DEFAULT 4,
  current_players INT DEFAULT 0,
  winner_name VARCHAR(100),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create game_players table (simplified)
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  player_color VARCHAR(20) NOT NULL,
  position INT DEFAULT 1,
  is_host BOOLEAN DEFAULT FALSE,
  is_current_turn BOOLEAN DEFAULT FALSE,
  player_order INT DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create move_history table (simplified)
CREATE TABLE IF NOT EXISTS move_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  previous_position INT NOT NULL,
  new_position INT NOT NULL,
  dice_roll INT NOT NULL,
  move_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_players_room_id ON game_players(room_id);
CREATE INDEX IF NOT EXISTS idx_move_history_room_id ON move_history(room_id);

-- 5. Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * 36 + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to create room with auto-generated code
CREATE OR REPLACE FUNCTION create_game_room(p_name VARCHAR, p_host_name VARCHAR)
RETURNS TABLE(room_id UUID, room_code VARCHAR) AS $$
DECLARE
  new_code VARCHAR(6);
  new_id UUID;
BEGIN
  -- Generate unique code
  LOOP
    new_code := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM game_rooms WHERE game_rooms.room_code = new_code);
  END LOOP;
  
  -- Insert room
  INSERT INTO game_rooms (room_code, name, host_name, current_players)
  VALUES (new_code, p_name, p_host_name, 1)
  RETURNING id INTO new_id;
  
  RETURN QUERY SELECT new_id, new_code;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable Row Level Security (allow all for anonymous play)
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_history ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for anonymous access
CREATE POLICY "Allow all on game_rooms" ON game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on game_players" ON game_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on move_history" ON move_history FOR ALL USING (true) WITH CHECK (true);

-- 9. Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE move_history;
