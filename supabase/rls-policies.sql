-- Row Level Security Policies for Snake & Ladder Game
-- Run this SQL in Supabase SQL Editor AFTER creating tables

-- Enable RLS on all tables
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Game Rooms Policies
CREATE POLICY "Users can see all public game rooms"
  ON game_rooms FOR SELECT
  TO authenticated
  USING (status = 'waiting' OR created_by = auth.uid());

CREATE POLICY "Users can create game rooms"
  ON game_rooms FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Room creators can update their rooms"
  ON game_rooms FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Game Players Policies
CREATE POLICY "Users can view game players they're in"
  ON game_players FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR room_id IN (
    SELECT id FROM game_rooms WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can join games"
  ON game_players FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own player data"
  ON game_players FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Move History Policies
CREATE POLICY "Users can view moves in their games"
  ON move_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR room_id IN (
    SELECT id FROM game_rooms WHERE created_by = auth.uid()
  ));

CREATE POLICY "System can insert moves"
  ON move_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Player Stats Policies
CREATE POLICY "Users can view all stats"
  ON player_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own stats"
  ON player_stats FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stats"
  ON player_stats FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
