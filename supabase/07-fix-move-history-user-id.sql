-- Fix move_history table for anonymous multiplayer
-- Remove user_id requirement since we're using anonymous multiplayer

-- 1. Make user_id nullable in move_history (for backward compatibility)
ALTER TABLE move_history ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add default value for user_id (can be null for anonymous)
ALTER TABLE move_history ALTER COLUMN user_id SET DEFAULT NULL;

-- 3. Update existing records to have null user_id if needed
UPDATE move_history SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

-- 4. Ensure player_name is not null (we need this for anonymous multiplayer)
UPDATE move_history SET player_name = 'Unknown Player' WHERE player_name IS NULL;
ALTER TABLE move_history ALTER COLUMN player_name SET NOT NULL;

-- 5. Create index for player_name for better performance
CREATE INDEX IF NOT EXISTS idx_move_history_player_name ON move_history(player_name);

-- 6. Update RLS policies to work with anonymous users
DROP POLICY IF EXISTS "Users can view moves in their games" ON move_history;
DROP POLICY IF EXISTS "System can insert moves" ON move_history;

-- Allow anonymous users to view and insert moves
CREATE POLICY "Allow all on move_history" ON move_history FOR ALL USING (true) WITH CHECK (true);