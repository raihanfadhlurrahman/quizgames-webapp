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
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    amal_points INT DEFAULT 0,
    total_games INT DEFAULT 0,
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

-- Allow public access
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow public read leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public insert game_sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert leaderboard" ON public.leaderboard FOR INSERT WITH CHECK (true);

-- Allow all operations for authenticated admin users
CREATE POLICY "Allow admin all categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all questions" ON public.questions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all players" ON public.players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all game_sessions" ON public.game_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all leaderboard" ON public.leaderboard FOR ALL USING (auth.role() = 'authenticated');


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
