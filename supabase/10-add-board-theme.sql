-- Add board_theme column to game_rooms table
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS board_theme TEXT DEFAULT 'default';

-- Update create_game_room function to accept board_theme
CREATE OR REPLACE FUNCTION create_game_room(
  p_name TEXT, 
  p_host_name TEXT,
  p_board_theme TEXT DEFAULT 'default'
)
RETURNS TABLE (
  room_id UUID,
  room_code VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id UUID;
  v_room_code VARCHAR(6);
  v_count INT;
BEGIN
  -- Generate unique room code
  LOOP
    v_room_code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT count(*) INTO v_count FROM game_rooms gr WHERE gr.room_code = v_room_code;
    EXIT WHEN v_count = 0;
  END LOOP;

  -- Create room
  INSERT INTO game_rooms (room_code, name, host_name, status, current_players, max_players, board_theme)
  VALUES (v_room_code, p_name, p_host_name, 'waiting', 1, 4, p_board_theme)
  RETURNING id INTO v_room_id;

  RETURN QUERY SELECT v_room_id, v_room_code;
END;
$$;
