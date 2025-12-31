-- Migration to v2 Schema for Multiplayer
-- Run this in Supabase SQL Editor

-- 1. Add new columns to game_rooms if not exists
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS room_code VARCHAR(6) UNIQUE;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS host_name VARCHAR(100);
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS winner_name VARCHAR(100);

-- 2. Add new columns to game_players if not exists
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT FALSE;
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS player_order INT DEFAULT 0;

-- 3. Add player_name to move_history if not exists
ALTER TABLE move_history ADD COLUMN IF NOT EXISTS player_name VARCHAR(100);

-- 4. Create index for room_code
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code ON game_rooms(room_code);

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

-- 7. Drop existing policies if they exist (ignore errors)
DROP POLICY IF EXISTS "Allow all on game_rooms" ON game_rooms;
DROP POLICY IF EXISTS "Allow all on game_players" ON game_players;
DROP POLICY IF EXISTS "Allow all on move_history" ON move_history;

-- 8. Enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_history ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for anonymous access
CREATE POLICY "Allow all on game_rooms" ON game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on game_players" ON game_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on move_history" ON move_history FOR ALL USING (true) WITH CHECK (true);

-- 10. Enable realtime (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE move_history;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Done! Your database is now ready for multiplayer
SELECT 'Migration complete! Multiplayer is ready.' as status;
