# 🔧 Panduan Setup Supabase untuk Snake & Ladder Game

Dokumentasi lengkap untuk menghubungkan aplikasi Snake & Ladder dengan Supabase sebagai backend database dan real-time service.

---

## 📋 Daftar Isi

1. [Membuat Project Supabase](#1-membuat-project-supabase)
2. [Mendapatkan API Keys](#2-mendapatkan-api-keys)
3. [Konfigurasi Environment Variables](#3-konfigurasi-environment-variables)
4. [Setup Database Tables](#4-setup-database-tables)
5. [Setup Row Level Security](#5-setup-row-level-security)
6. [Enable Realtime](#6-enable-realtime)
7. [Testing Koneksi](#7-testing-koneksi)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Membuat Project Supabase

### Step 1: Buat Akun Supabase
1. Buka https://supabase.com
2. Klik **Start your project** atau **Sign In**
3. Login menggunakan GitHub, GitLab, atau email

### Step 2: Buat Project Baru
1. Di dashboard, klik **New Project**
2. Pilih organization (atau buat baru)
3. Isi detail project:
   - **Name**: `snake-ladder-game`
   - **Database Password**: Buat password yang kuat (simpan baik-baik!)
   - **Region**: Pilih yang terdekat (Singapore untuk Indonesia)
   - **Pricing Plan**: Free tier cukup untuk development

4. Klik **Create new project**
5. Tunggu 1-2 menit sampai project selesai dibuat

---

## 2. Mendapatkan API Keys

### Step 1: Buka Settings API
1. Di sidebar kiri, klik **Project Settings** (ikon gear ⚙️)
2. Pilih **API** dari menu

### Step 2: Copy Credentials
Kamu akan melihat beberapa nilai penting:

| Field | Keterangan | Contoh |
|-------|------------|--------|
| **Project URL** | URL untuk koneksi ke Supabase | `https://abcdefgh.supabase.co` |
| **anon public** | API key untuk client-side (aman di-expose) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **service_role** | API key untuk server-side (JANGAN expose!) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

⚠️ **PENTING**: Hanya gunakan `anon public` key di aplikasi client. Jangan pernah expose `service_role` key!

---

## 3. Konfigurasi Environment Variables

### Step 1: Edit File .env.local
Buka file `SnakeLadderGame/.env.local` dan update dengan nilai dari Supabase:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_HERE
```

### Step 2: Contoh Konfigurasi
```env
# Contoh (JANGAN gunakan nilai ini, pakai milikmu sendiri!)
EXPO_PUBLIC_SUPABASE_URL=https://xyzabcdef.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5MDAwMDAwLCJleHAiOjIwMTQ1NzYwMDB9.abcdefghijklmnopqrstuvwxyz123456
```

### Step 3: Verifikasi
Pastikan file `.env.local` ada di `.gitignore` agar tidak ter-commit ke repository!

---

## 4. Setup Database Tables

### Step 1: Buka SQL Editor
1. Di sidebar Supabase, klik **SQL Editor**
2. Klik **New query**

### Step 2: Jalankan Schema SQL
Copy-paste seluruh isi file `supabase/schema.sql` ke SQL Editor:

```sql
-- Snake & Ladder Game Database Schema

-- 1. Create users table
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

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_created_by ON game_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_game_players_room_id ON game_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_move_history_room_id ON move_history(room_id);
CREATE INDEX IF NOT EXISTS idx_move_history_player_id ON move_history(player_id);
CREATE INDEX IF NOT EXISTS idx_move_history_created_at ON move_history(created_at);

-- 8. Create helper function
CREATE OR REPLACE FUNCTION increment_player_count(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE game_rooms
  SET current_players = current_players + 1,
      updated_at = NOW()
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql;
```

3. Klik **Run** atau tekan `Ctrl+Enter`
4. Pastikan tidak ada error (akan muncul "Success" di bawah)

---

## 5. Setup Row Level Security

### Step 1: Jalankan RLS Policies
Di SQL Editor yang sama, buat query baru dan paste isi file `supabase/rls-policies.sql`:

```sql
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
```

2. Klik **Run**

### Step 2: Verifikasi RLS
1. Pergi ke **Database** → **Tables**
2. Klik pada setiap table
3. Pastikan ada ikon 🔒 yang menandakan RLS aktif

---

## 6. Enable Realtime

Untuk multiplayer real-time, kita perlu enable Realtime pada tables tertentu.

### Step 1: Buka Replication Settings
1. Di sidebar, klik **Database**
2. Pilih **Replication**

### Step 2: Enable Tables
1. Di bagian **Source**, klik toggle untuk enable tables berikut:
   - ✅ `game_rooms`
   - ✅ `game_players`
   - ✅ `move_history`

### Step 3: Verifikasi
Setelah enable, kamu akan melihat tables tersebut di daftar "Enabled tables".

---

## 7. Testing Koneksi

### Step 1: Restart Aplikasi
```bash
# Stop server yang sedang berjalan (Ctrl+C)
cd SnakeLadderGame
npx expo start --web
```

### Step 2: Test di Browser Console
Buka browser DevTools (F12) → Console, dan cek apakah ada error koneksi Supabase.

### Step 3: Test Query Sederhana
Di SQL Editor Supabase, jalankan:
```sql
SELECT * FROM game_rooms LIMIT 5;
```

Jika tidak ada error, koneksi berhasil!

---

## 8. Troubleshooting

### Error: "Invalid API key"
- Pastikan `EXPO_PUBLIC_SUPABASE_ANON_KEY` di `.env.local` benar
- Jangan ada spasi atau karakter tambahan
- Restart dev server setelah mengubah `.env.local`

### Error: "relation does not exist"
- Pastikan sudah menjalankan `schema.sql` di SQL Editor
- Cek apakah tables sudah terbuat di **Database** → **Tables**

### Error: "permission denied"
- Pastikan sudah menjalankan `rls-policies.sql`
- Cek RLS policies di **Authentication** → **Policies**

### Realtime tidak bekerja
- Pastikan tables sudah di-enable di **Database** → **Replication**
- Cek WebSocket connection di browser DevTools → Network → WS

### Environment variables tidak terbaca
- Pastikan nama variable dimulai dengan `EXPO_PUBLIC_`
- Restart dev server setelah mengubah `.env.local`
- Cek file tidak ada di `.gitignore` (seharusnya ada!)

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist Setup

- [ ] Buat project Supabase
- [ ] Copy Project URL dan anon key
- [ ] Update `.env.local` dengan credentials
- [ ] Jalankan `schema.sql` di SQL Editor
- [ ] Jalankan `rls-policies.sql` di SQL Editor
- [ ] Enable Realtime untuk tables yang diperlukan
- [ ] Restart aplikasi dan test koneksi

---

**Selamat! Supabase sudah terhubung dengan aplikasi Snake & Ladder Game.** 🎉
