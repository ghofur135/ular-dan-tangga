-- Create registered_players table
CREATE TABLE IF NOT EXISTS registered_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  avatar INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (though we primarily access via RPC)
ALTER TABLE registered_players ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read basic info (needed for leaderboards etc)
CREATE POLICY "Public profiles are viewable by everyone" 
ON registered_players FOR SELECT 
USING (true);

-- Function to handle login/register atomically
CREATE OR REPLACE FUNCTION login_or_register_player(
  p_username TEXT, 
  p_pin TEXT, 
  p_avatar INT
) 
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  v_player_id UUID;
  v_stored_pin TEXT;
  v_player RECORD;
BEGIN
  -- Normalize username to lowercase for uniqueness check
  -- But keep original display name preference if possible? 
  -- For now let's just use exact match to avoid complexity, or case-insensitive?
  -- Let's do case-insensitive search but store as is? 
  -- Simplest: Exact match.
  
  -- Check if player exists
  SELECT id, pin INTO v_player_id, v_stored_pin
  FROM registered_players
  WHERE username = p_username;
  
  IF FOUND THEN
    -- Player exists, check pin
    IF v_stored_pin = p_pin THEN
        -- Login success, update avatar and last login
        UPDATE registered_players 
        SET 
          avatar = p_avatar, 
          last_login_at = NOW() 
        WHERE id = v_player_id
        RETURNING * INTO v_player;
        
        RETURN row_to_json(v_player);
    ELSE
        -- Pin mismatch
        RETURN json_build_object('error', 'Username sudah terdaftar. PIN salah!');
    END IF;
  ELSE
    -- New player, register
    INSERT INTO registered_players (username, pin, avatar)
    VALUES (p_username, p_pin, p_avatar)
    RETURNING * INTO v_player;
    
    RETURN row_to_json(v_player);
  END IF;
END;
$$;
