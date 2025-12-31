-- Migration v5: Add leaderboard and player_stats tables
-- Run this SQL in Supabase SQL Editor
-- IMPORTANT: Run each section separately if you get errors

-- ============================================
-- STEP 1: Create player_stats table
-- ============================================
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name VARCHAR(100) NOT NULL,
  device_id VARCHAR(255),
  total_games_played INT DEFAULT 0,
  total_games_won INT DEFAULT 0,
  total_games_lost INT DEFAULT 0,
  total_moves INT DEFAULT 0,
  average_moves DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_wins ON player_stats(total_games_won DESC);

-- ============================================
-- STEP 3: Enable RLS and create policy
-- ============================================
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on player_stats" ON player_stats;
CREATE POLICY "Allow all on player_stats" ON player_stats FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STEP 4: Create leaderboard view
-- ============================================
DROP VIEW IF EXISTS leaderboard;

CREATE VIEW leaderboard AS
SELECT 
  id,
  player_name as username,
  NULL::VARCHAR as avatar_url,
  total_games_played,
  total_games_won,
  total_games_lost,
  CASE 
    WHEN total_games_played > 0 
    THEN ROUND((total_games_won::DECIMAL / total_games_played) * 100, 0)
    ELSE 0 
  END as win_percentage,
  ROW_NUMBER() OVER (ORDER BY total_games_won DESC, total_games_played ASC) as rank
FROM player_stats
WHERE total_games_played > 0
ORDER BY total_games_won DESC;

-- ============================================
-- STEP 5: Create function to update player stats
-- ============================================
CREATE OR REPLACE FUNCTION update_player_stats(
  p_player_name VARCHAR,
  p_won BOOLEAN,
  p_moves INT
)
RETURNS VOID AS $$
DECLARE
  existing_id UUID;
  current_games INT;
  current_moves INT;
BEGIN
  -- Check if player exists
  SELECT id, total_games_played, total_moves 
  INTO existing_id, current_games, current_moves 
  FROM player_stats 
  WHERE player_name = p_player_name 
  LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    -- Update existing stats
    UPDATE player_stats SET
      total_games_played = total_games_played + 1,
      total_games_won = total_games_won + CASE WHEN p_won THEN 1 ELSE 0 END,
      total_games_lost = total_games_lost + CASE WHEN p_won THEN 0 ELSE 1 END,
      total_moves = total_moves + p_moves,
      average_moves = ROUND((current_moves + p_moves)::DECIMAL / (current_games + 1), 2),
      updated_at = NOW()
    WHERE id = existing_id;
  ELSE
    -- Create new stats record
    INSERT INTO player_stats (player_name, total_games_played, total_games_won, total_games_lost, total_moves, average_moves)
    VALUES (p_player_name, 1, CASE WHEN p_won THEN 1 ELSE 0 END, CASE WHEN p_won THEN 0 ELSE 1 END, p_moves, p_moves);
  END IF;
END;
$$ LANGUAGE plpgsql;
