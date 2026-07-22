-- ==========================================
-- ISLAMIC MILLIONAIRE DATABASE SCHEMA (SUPABASE / POSTGRESQL)
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- 2. QUESTIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) DEFAULT 'Campuran',
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
-- 3. PLAYERS / USER PROFILES TABLE (NEW)
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
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC, duration_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON public.game_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_amal ON public.players(amal_points DESC);

-- ------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent conflict errors
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin all categories" ON public.categories;

DROP POLICY IF EXISTS "Allow public read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin all questions" ON public.questions;

DROP POLICY IF EXISTS "Allow public read players" ON public.players;
DROP POLICY IF EXISTS "Allow public insert players" ON public.players;
DROP POLICY IF EXISTS "Allow public update players" ON public.players;
DROP POLICY IF EXISTS "Allow public select" ON public.players;
DROP POLICY IF EXISTS "Allow individual insert" ON public.players;
DROP POLICY IF EXISTS "Allow individual update" ON public.players;
DROP POLICY IF EXISTS "Allow admin all players" ON public.players;

DROP POLICY IF EXISTS "Allow public read game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Allow public insert game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Allow public update game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Allow admin all game_sessions" ON public.game_sessions;

DROP POLICY IF EXISTS "Allow public read leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow public insert leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow public update leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow admin all leaderboard" ON public.leaderboard;

-- Categories & Questions
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read questions" ON public.questions FOR SELECT USING (true);

-- Players
CREATE POLICY "Allow public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update players" ON public.players FOR UPDATE USING (true) WITH CHECK (true);

-- Game Sessions
CREATE POLICY "Allow public read game_sessions" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert game_sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update game_sessions" ON public.game_sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Leaderboard
CREATE POLICY "Allow public read leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public insert leaderboard" ON public.leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update leaderboard" ON public.leaderboard FOR UPDATE USING (true) WITH CHECK (true);

-- Admin Override
CREATE POLICY "Allow admin all categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all questions" ON public.questions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all players" ON public.players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all game_sessions" ON public.game_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all leaderboard" ON public.leaderboard FOR ALL USING (auth.role() = 'authenticated');

-- ------------------------------------------
-- 7.1 SUPABASE REALTIME PUBLICATION SETUP
-- ------------------------------------------
-- Enable Realtime broadcast for leaderboard table so connected clients get instant live updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;


-- ==========================================
-- 8. SEED DATA (KATEGORI & SOAL ISLAMI)
-- ==========================================

INSERT INTO public.categories (name, icon, description) VALUES
('Aqidah', '🕌', 'Dasar-dasar keimanan dan keyakinan dalam Islam'),
('Akhlak', '🤲', 'Sikap, perilaku, dan kebiasaan terpuji'),
('Al-Qur''an', '📖', 'Pengetahuan ayat, surah, dan kandungan Al-Qur''an'),
('Nabi dan Rasul', '👳', 'Kisah perjalanan para Nabi dan Rasul Allah'),
('Ramadhan', '🌙', 'Puasa, keutamaan, dan ibadah di bulan Ramadhan'),
('Rukun Islam', '🕌', 'Pilar dasar pelaksanaan ibadah seorang Muslim'),
('Shalat', '🧎', 'Tata cara, keutamaan, dan syarat sah shalat'),
('Doa Harian', '🍽', 'Doa-doa pendek untuk aktivitas sehari-hari'),
('Adab', '😊', 'Etika Islami dalam berinteraksi sosial'),
('Kehidupan Sehari-hari', '👨‍👩‍👧', 'Penerapan nilai Islam dalam hidup bermasyarakat')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.questions 
(category_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, dalil, ustadz_hint) 
VALUES
(
    (SELECT id FROM public.categories WHERE name = 'Rukun Islam' LIMIT 1),
    'easy',
    'Berapakah jumlah Rukun Islam yang wajib diyakini dan diamalkan oleh umat Muslim?',
    '4 perkara',
    '5 perkara',
    '6 perkara',
    '7 perkara',
    'B',
    'Rukun Islam terdiri dari 5 perkara: Syahadat, Shalat, Zakat, Puasa, dan Haji bagi yang mampu.',
    'Dari Abu Abdurrahman Abdullah bin Umar bin Al-Khattab RA, Rasulullah SAW bersabda: "Islam dibangun di atas lima perkara..." (HR. Bukhari & Muslim)',
    'Ingatlah rukun dasar yang diawali dengan Syahadat dan diakhiri dengan Ibadah Haji.'
),
(
    (SELECT id FROM public.categories WHERE name = 'Shalat' LIMIT 1),
    'easy',
    'Shalat fardhu yang dikerjakan pada saat fajar terbit sebanyak 2 rakaat adalah...',
    'Shalat Dzuhur',
    'Shalat Maghrib',
    'Shalat Subuh',
    'Shalat Isya',
    'C',
    'Shalat Subuh dikerjakan sebanyak 2 rakaat di waktu fajar sebelum matahari terbit.',
    'Dirikanlah shalat dari sesudah matahari tergelincir sampai gelap malam dan (dirikanlah pula shalat) Subuh... (QS. Al-Isra: 78)',
    'Waktu shalat ini berada di awal pagi hari dan jumlah rakaatnya paling sedikit.'
),
(
    (SELECT id FROM public.categories WHERE name = 'Al-Qur''an' LIMIT 1),
    'easy',
    'Surah apakah yang dijuluki sebagai "Ummul Qur''an" (Induk Al-Qur''an)?',
    'Surah Al-Ikhlas',
    'Surah Al-Fatihah',
    'Surah Yasin',
    'Surah Al-Baqarah',
    'B',
    'Surah Al-Fatihah dinamakan Ummul Qur''an karena memuat seluruh inti ajaran Al-Qur''an.',
    'Rasulullah SAW bersabda: "Alhamdulillah (Al-Fatihah) adalah Ummul Qur''an dan Ummul Kitab." (HR. Tirmidzi)',
    'Surah ini selalu kita baca di setiap rakaat shalat.'
);

-- ==========================================
-- 9. USER REGISTRATION TRIGGER (SUPABASE AUTH SYNC)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.players (id, name, avatar, level, xp, amal_points, total_games, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Pemain Baru'),
    '👦🏻',
    1, 0, 0, 0,
    COALESCE(new.raw_user_meta_data->>'role', 'player')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 10. MULTIPLAYER KAHOOT-STYLE QUIZ ROOMS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.quiz_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    category_name VARCHAR(100) DEFAULT 'Campuran',
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'question', 'feedback', 'standing', 'finished')),
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_room_players;

-- ==========================================
-- QUICK MIGRATION FIX FOR EXISTING DATABASES
-- Copy and run this in Supabase SQL Editor:
-- ==========================================
ALTER TABLE public.quiz_room_players DROP CONSTRAINT IF EXISTS quiz_room_players_player_id_fkey;
ALTER TABLE public.quiz_room_players ADD COLUMN IF NOT EXISTS bg_profile VARCHAR(255);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS game_type VARCHAR(20) DEFAULT 'millionaire' CHECK (game_type IN ('millionaire', 'kahoot'));

-- Fix quiz_rooms status check constraint safely:
UPDATE public.quiz_rooms SET status = 'waiting' WHERE status NOT IN ('waiting', 'question', 'feedback', 'standing', 'finished', 'in_progress') OR status IS NULL;
ALTER TABLE public.quiz_rooms DROP CONSTRAINT IF EXISTS quiz_rooms_status_check;
ALTER TABLE public.quiz_rooms ADD CONSTRAINT quiz_rooms_status_check CHECK (status IN ('waiting', 'question', 'feedback', 'standing', 'finished', 'in_progress'));



