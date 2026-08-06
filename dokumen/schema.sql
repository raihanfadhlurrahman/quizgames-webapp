-- ==========================================
-- MULTI-THEME QUIZ DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Modes Supported: Islamic (🕌), Independence (🇮🇩), Culture (🎭)
-- File Location: /dokumen/schema.sql
-- Instructions: Copy and paste this script directly into your Supabase SQL Editor.
-- ==========================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. CATEGORIES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10) DEFAULT '🕌',
    description TEXT,
    theme_id VARCHAR(50) DEFAULT 'islamic',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- 2. QUESTIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) DEFAULT 'Campuran',
    theme_id VARCHAR(50) DEFAULT 'islamic',
    game_type VARCHAR(20) DEFAULT 'millionaire' CHECK (game_type IN ('millionaire', 'kahoot')),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT NOT NULL,
    dalil TEXT,
    ustadz_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- 3. PLAYERS / USER PROFILES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT '👦🏻',
    border_frame VARCHAR(255) DEFAULT '/image/border/1.png',
    border_color VARCHAR(255) DEFAULT '/image/border/1.png',
    bg_profile VARCHAR(255) DEFAULT '/image/bgprofile/1.jpg',
    title_tag VARCHAR(100) DEFAULT 'Muslim Cerdas',
    bio_quote TEXT DEFAULT 'رَبِّ زِدْنِي عِلْمًا',
    bio_translation TEXT DEFAULT '"Ya Tuhanku, tambahkanlah kepadaku ilmu."',
    bio_reference VARCHAR(255) DEFAULT '(QS. Taha: 114)',
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    amal_points INT DEFAULT 0,
    wawasan_points INT DEFAULT 0,
    budaya_points INT DEFAULT 0,
    total_games INT DEFAULT 0,
    total_correct INT DEFAULT 0,
    total_questions_answered INT DEFAULT 0,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- 4. GAME SESSIONS & HISTORY
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    player_name VARCHAR(100) NOT NULL,
    player_avatar VARCHAR(255) DEFAULT '👦🏻',
    category_name VARCHAR(100) DEFAULT 'Campuran',
    theme_id VARCHAR(50) DEFAULT 'islamic',
    mode VARCHAR(50) DEFAULT 'Classic Millionaire',
    total_questions INT DEFAULT 15,
    correct_answers INT DEFAULT 0,
    wrong_answers INT DEFAULT 0,
    total_score INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    event_tag VARCHAR(100) DEFAULT 'General Sesi KKN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- 5. LEADERBOARD TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID UNIQUE REFERENCES public.players(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    player_name VARCHAR(100) NOT NULL,
    player_avatar VARCHAR(255) DEFAULT '👦🏻',
    theme_id VARCHAR(50) DEFAULT 'islamic',
    score INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    event_tag VARCHAR(100) DEFAULT 'General Sesi KKN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- 6. INDEXES FOR PERFORMANCE
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_theme ON public.questions(theme_id);
CREATE INDEX IF NOT EXISTS idx_categories_theme ON public.categories(theme_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC, duration_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON public.game_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_amal ON public.players(amal_points DESC);
CREATE INDEX IF NOT EXISTS idx_players_wawasan ON public.players(wawasan_points DESC);
CREATE INDEX IF NOT EXISTS idx_players_budaya ON public.players(budaya_points DESC);

-- ------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin all categories" ON public.categories;

DROP POLICY IF EXISTS "Allow public read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin all questions" ON public.questions;

DROP POLICY IF EXISTS "Allow public read players" ON public.players;
DROP POLICY IF EXISTS "Allow public insert players" ON public.players;
DROP POLICY IF EXISTS "Allow public update players" ON public.players;
DROP POLICY IF EXISTS "Allow admin all players" ON public.players;

DROP POLICY IF EXISTS "Allow public read game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Allow public insert game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Allow public update game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Allow admin all game_sessions" ON public.game_sessions;

DROP POLICY IF EXISTS "Allow public read leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow public insert leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow public update leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow admin all leaderboard" ON public.leaderboard;

CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read questions" ON public.questions FOR SELECT USING (true);

CREATE POLICY "Allow public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update players" ON public.players FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read game_sessions" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert game_sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update game_sessions" ON public.game_sessions FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public insert leaderboard" ON public.leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update leaderboard" ON public.leaderboard FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin all categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all questions" ON public.questions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all players" ON public.players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all game_sessions" ON public.game_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all leaderboard" ON public.leaderboard FOR ALL USING (auth.role() = 'authenticated');

-- Realtime publication for leaderboard
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------
-- 8. SEED CATEGORIES (3 TEMA)
-- ------------------------------------------
INSERT INTO public.categories (name, icon, description, theme_id) VALUES
-- Mode Islami 🕌
('Rukun Islam', '🕌', 'Pilar dasar pelaksanaan ibadah seorang Muslim', 'islamic'),
('Shalat', '🧎', 'Tata cara, keutamaan, dan syarat sah shalat', 'islamic'),
('Al-Qur''an', '📖', 'Pengetahuan ayat, surah, dan kandungan Al-Qur''an', 'islamic'),
('Nabi dan Rasul', '👳', 'Kisah perjalanan para Nabi dan Rasul Allah', 'islamic'),
('Aqidah', '🕌', 'Dasar-dasar keimanan dan keyakinan dalam Islam', 'islamic'),
('Doa Harian', '🍽', 'Doa-doa pendek untuk aktivitas sehari-hari', 'islamic'),
('Ramadhan', '🌙', 'Puasa, keutamaan, dan ibadah di bulan Ramadhan', 'islamic'),
('Akhlak', '🤲', 'Sikap, perilaku, dan kebiasaan terpuji', 'islamic'),
('Adab', '😊', 'Etika Islami dalam berinteraksi sosial', 'islamic'),
('Kehidupan Sehari-hari', '👨‍👩‍👧', 'Penerapan nilai Islam dalam hidup bermasyarakat', 'islamic'),

-- Mode Kemerdekaan 🇮🇩
('Proklamasi & BPUPKI', '📜', 'Peristiwa bersejarah seputar 17 Agustus 1945', 'independence'),
('Pahlawan Nasional', '🎖️', 'Biografi dan jasa para pahlawan kemerdekaan RI', 'independence'),
('Sejarah Perjuangan', '⚔️', 'Pertempuran dan perundingan mempertahankan RI', 'independence'),
('UUD 1945 & Pancasila', '🦅', 'Pengetahuan Garuda, Bendera, dan Lambang Negara', 'independence'),

-- Mode Kebudayaan 🎭
('Rumah & Pakaian Adat', '🏠', 'Arsitektur dan pakaian adat warisan leluhur', 'culture'),
('Tarian & Alat Musik', '🪕', 'Alat musik daerah dan tarian tradisional 38 provinsi', 'culture'),
('Kuliner Nusantara', '🍛', 'Makanan khas daerah dari Sabang sampai Merauke', 'culture'),
('Cerita Rakyat & Kerajaan', '📚', 'Legenda dan sejarah kerajaan Nusantara', 'culture')
ON CONFLICT (name) DO UPDATE SET theme_id = EXCLUDED.theme_id;

-- ------------------------------------------
-- 9. USER REGISTRATION TRIGGER (SUPABASE AUTH SYNC)
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.players (id, name, avatar, level, xp, amal_points, wawasan_points, budaya_points, total_games, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Pemain Baru'),
    '👦🏻',
    1, 0, 0, 0, 0, 0,
    COALESCE(new.raw_user_meta_data->>'role', 'player')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------
-- 10. MULTIPLAYER KAHOOT-STYLE QUIZ ROOMS
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    category_name VARCHAR(100) DEFAULT 'Campuran',
    theme_id VARCHAR(50) DEFAULT 'islamic',
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'question', 'feedback', 'standing', 'finished', 'in_progress')),
    current_question_index INT DEFAULT 0,
    total_questions INT DEFAULT 10,
    created_by UUID REFERENCES public.players(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.quiz_room_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.quiz_rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    player_name VARCHAR(100) NOT NULL,
    player_avatar VARCHAR(255),
    border_frame VARCHAR(255),
    bg_profile VARCHAR(255),
    score INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, player_id)
);

ALTER TABLE public.quiz_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_room_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to quiz_rooms" ON public.quiz_rooms;
CREATE POLICY "Allow all access to quiz_rooms" ON public.quiz_rooms FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to quiz_room_players" ON public.quiz_room_players;
CREATE POLICY "Allow all access to quiz_room_players" ON public.quiz_room_players FOR ALL USING (true);

-- Enable Supabase Realtime for Quiz Rooms
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_rooms;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_room_players;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- 11. SAFE MIGRATION & SEEDER SCRIPT FOR EXISTING DATABASES
-- Copy and run this section directly in your Supabase SQL Editor:
-- ==========================================
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS wawasan_points INT DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS budaya_points INT DEFAULT 0;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.quiz_rooms ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.quiz_room_players ADD COLUMN IF NOT EXISTS bg_profile VARCHAR(255);

ALTER TABLE public.quiz_rooms DROP CONSTRAINT IF EXISTS quiz_rooms_status_check;
ALTER TABLE public.quiz_rooms ADD CONSTRAINT quiz_rooms_status_check CHECK (status IN ('waiting', 'question', 'feedback', 'standing', 'finished', 'in_progress'));

-- Ensure existing default questions without theme_id get set to 'islamic'
UPDATE public.questions SET theme_id = 'islamic' WHERE theme_id IS NULL;
UPDATE public.categories SET theme_id = 'islamic' WHERE theme_id IS NULL;
