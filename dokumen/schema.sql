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
    question_ids JSONB DEFAULT '[]'::jsonb,
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

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS category_name VARCHAR(100) DEFAULT 'Campuran';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS game_type VARCHAR(20) DEFAULT 'millionaire';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS dalil TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS ustadz_hint TEXT;

ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';

ALTER TABLE public.quiz_rooms ADD COLUMN IF NOT EXISTS theme_id VARCHAR(50) DEFAULT 'islamic';
ALTER TABLE public.quiz_rooms ADD COLUMN IF NOT EXISTS question_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.quiz_room_players ADD COLUMN IF NOT EXISTS bg_profile VARCHAR(255);

ALTER TABLE public.quiz_rooms DROP CONSTRAINT IF EXISTS quiz_rooms_status_check;
ALTER TABLE public.quiz_rooms ADD CONSTRAINT quiz_rooms_status_check CHECK (status IN ('waiting', 'question', 'feedback', 'standing', 'finished', 'in_progress'));

-- Ensure existing default questions without theme_id get set to 'islamic'
UPDATE public.questions SET theme_id = 'islamic' WHERE theme_id IS NULL;
UPDATE public.categories SET theme_id = 'islamic' WHERE theme_id IS NULL;

-- ==========================================
-- 12. MATERI EDUKASI (BUKU DIGITAL INTERAKTIF)
-- Fitur Buku Digital Edukatif Modular Dinamis
-- ==========================================

-- ------------------------------------------
-- 12.1 TABEL BAB MATERI (materi_chapters)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.materi_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) NOT NULL,
    theme_id VARCHAR(50) DEFAULT 'islamic',
    chapter_number INT NOT NULL DEFAULT 1,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_icon VARCHAR(50) DEFAULT '📖',
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    total_pages INT DEFAULT 0,
    created_by UUID REFERENCES public.players(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- 12.2 TABEL HALAMAN BUKU (materi_pages)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.materi_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.materi_chapters(id) ON DELETE CASCADE,
    page_number INT NOT NULL DEFAULT 1,
    
    -- KONTEN SISI KIRI (Media Visual & Audio)
    left_content_type VARCHAR(20) DEFAULT 'media' CHECK (left_content_type IN ('media', 'text', 'empty')),
    left_media_url TEXT,
    left_media_type VARCHAR(20) DEFAULT 'image' CHECK (left_media_type IN ('image', 'video', 'gif', 'youtube')),
    left_audio_url TEXT,
    left_audio_text TEXT,
    left_title VARCHAR(200),
    left_text TEXT,
    
    -- KONTEN SISI KANAN (Headline, Teks Cerita, Poin-Poin)
    right_title VARCHAR(200),
    right_story_text TEXT,
    bullet_points JSONB DEFAULT '[]'::jsonb,
    
    -- MODAL INTERAKTIF: DALIL (Al-Qur'an / Hadits)
    dalil_title VARCHAR(200),
    dalil_arabic TEXT,
    dalil_latin TEXT,
    dalil_translation TEXT,
    dalil_source VARCHAR(200),
    
    -- MODAL INTERAKTIF: TAHUKAH KAMU? (Fun Fact)
    fun_fact_title VARCHAR(200),
    fun_fact_description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chapter_id, page_number)
);

-- ------------------------------------------
-- 12.3 INDEX PERFORMA QUERY
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_materi_chapters_category ON public.materi_chapters(category_id);
CREATE INDEX IF NOT EXISTS idx_materi_chapters_theme ON public.materi_chapters(theme_id);
CREATE INDEX IF NOT EXISTS idx_materi_chapters_published ON public.materi_chapters(is_published);
CREATE INDEX IF NOT EXISTS idx_materi_pages_chapter ON public.materi_pages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_materi_pages_order ON public.materi_pages(chapter_id, page_number);

-- ------------------------------------------
-- 12.4 ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------
ALTER TABLE public.materi_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi_pages ENABLE ROW LEVEL SECURITY;

-- Siswa bisa membaca Bab & Halaman yang sudah dipublish
DROP POLICY IF EXISTS "Allow public read published chapters" ON public.materi_chapters;
CREATE POLICY "Allow public read published chapters" ON public.materi_chapters
    FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Allow public read pages" ON public.materi_pages;
CREATE POLICY "Allow public read pages" ON public.materi_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.materi_chapters mc
            WHERE mc.id = materi_pages.chapter_id AND mc.is_published = true
        )
    );

-- Admin / Guru memiliki akses penuh (CRUD) ke semua Bab & Halaman
DROP POLICY IF EXISTS "Allow admin all chapters" ON public.materi_chapters;
CREATE POLICY "Allow admin all chapters" ON public.materi_chapters
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow admin all pages" ON public.materi_pages;
CREATE POLICY "Allow admin all pages" ON public.materi_pages
    FOR ALL USING (true);

-- ------------------------------------------
-- 12.5 TRIGGER OTOMATIS: Update total_pages di materi_chapters
-- ------------------------------------------
CREATE OR REPLACE FUNCTION update_chapter_total_pages()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.materi_chapters
    SET 
        total_pages = (
            SELECT COUNT(*) FROM public.materi_pages
            WHERE chapter_id = COALESCE(NEW.chapter_id, OLD.chapter_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.chapter_id, OLD.chapter_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_chapter_pages ON public.materi_pages;
CREATE TRIGGER trigger_update_chapter_pages
    AFTER INSERT OR DELETE ON public.materi_pages
    FOR EACH ROW EXECUTE FUNCTION update_chapter_total_pages();

-- ------------------------------------------
-- 12.6 SUPABASE REALTIME
-- ------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.materi_chapters;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.materi_pages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------
-- 12.7 INITIAL SEEDER: MATERI EDUKASI ISLAMI
-- ------------------------------------------
DO $$
DECLARE
    v_cat_rukun UUID;
    v_cat_shalat UUID;
    v_cat_nabi UUID;
    v_ch1_id UUID;
    v_ch2_id UUID;
    v_ch3_id UUID;
BEGIN
    -- Dapatkan ID kategori
    SELECT id INTO v_cat_rukun FROM public.categories WHERE name = 'Rukun Islam' LIMIT 1;
    SELECT id INTO v_cat_shalat FROM public.categories WHERE name = 'Shalat' LIMIT 1;
    SELECT id INTO v_cat_nabi FROM public.categories WHERE name = 'Nabi dan Rasul' LIMIT 1;

    -- 1. BAB 1: Mengenal Rukun Islam & Rukun Iman
    IF NOT EXISTS (SELECT 1 FROM public.materi_chapters WHERE title = 'Mengenal Rukun Islam & Rukun Iman') THEN
        INSERT INTO public.materi_chapters (
            category_id, category_name, theme_id, chapter_number, title, description, cover_icon, is_published
        ) VALUES (
            v_cat_rukun, 'Rukun Islam', 'islamic', 1,
            'Mengenal Rukun Islam & Rukun Iman',
            'Pelajari 5 Pondasi Utama Agama Islam dan 6 Kepercayaan Hakiki Umat Muslim dengan cara visual dan menyenangkan.',
            '🕌', true
        ) RETURNING id INTO v_ch1_id;

        -- Halaman 1 Bab 1
        INSERT INTO public.materi_pages (
            chapter_id, page_number, left_content_type, left_media_url, left_media_type, left_audio_text,
            right_title, right_story_text, bullet_points,
            dalil_title, dalil_arabic, dalil_latin, dalil_translation, dalil_source,
            fun_fact_title, fun_fact_description
        ) VALUES (
            v_ch1_id, 1, 'media', '/image/sticker/islami/masjid.png', 'image',
            'Rukun Islam adalah lima amalan pokok yang wajib dilaksanakan oleh setiap muslim. Nabi Muhammad mengibaratkan Islam seperti sebuah rumah yang berdiri kokoh di atas lima tiang utama.',
            'Apa itu Rukun Islam?',
            'Rukun Islam adalah 5 pondasi utama dalam beragama Islam. Tanpa tiang pondasi ini, keislaman seseorang menjadi tidak kokoh.',
            '["Rukun Islam adalah 5 amalan pokok yang wajib dilaksanakan setiap muslim.", "Nabi Muhammad SAW mengibaratkan Islam seperti rumah kokoh di atas 5 tiang.", "Tanpa tiang ini, bangunan keislaman seseorang menjadi tidak sempurna."]'::jsonb,
            'Hadits Rukun Islam (HR. Bukhari & Muslim)',
            'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ',
            'Buniyal-islaamu ''alaa khamsin: syahaadati al-laa ilaaha illallaah wa anna Muhammadar-rasuulullaah...',
            'Islam dibangun di atas lima perkara: bersaksi bahwa tiada tuhan selain Allah dan Muhammad utusan Allah, mendirikan shalat, menunaikan zakat, berhaji, dan puasa Ramadhan.',
            'Hadits Shahih Bukhari No. 8 & Muslim No. 16',
            'Tahukah Kamu?',
            'Sama seperti bangunan rumah, jika salah satu tiang pondasinya roboh, maka rumah tersebut akan mudah runtuh!'
        );

        -- Halaman 2 Bab 1
        INSERT INTO public.materi_pages (
            chapter_id, page_number, left_content_type, left_media_url, left_media_type, left_audio_text,
            right_title, right_story_text, bullet_points,
            fun_fact_title, fun_fact_description
        ) VALUES (
            v_ch1_id, 2, 'media', '/image/sticker/islami/alquran2.png', 'image',
            'Rincian lima rukun Islam meliputi Syahadat, Sholat lima waktu, Zakat bagi yang berhak, Puasa di bulan Ramadhan, dan Haji ke Baitullah bagi yang mampu.',
            'Rincian 5 Rukun Islam',
            'Berikut adalah urutan lima rukun Islam yang wajib kita laksanakan dalam kehidupan sehari-hari:',
            '["1. Syahadat: Mengucapkan persaksian tiada Tuhan selain Allah & Muhammad utusan Allah.", "2. Shalat: Beribadah 5 waktu sehari semalam (Subuh, Dzuhur, Ashar, Maghrib, Isya).", "3. Zakat: Menyisihkan sebagian harta untuk saudara yang membutuhkan.", "4. Puasa Ramadhan: Menahan makan, minum, dan hawa nafsu dari fajar hingga maghrib.", "5. Naik Haji: Beribadah ke Baitullah di Makkah bagi yang mampu."]'::jsonb,
            'Keutamaan Puasa',
            'Pintu surga khusus bernama Ar-Rayyan disediakan Allah khusus bagi orang-orang yang rajin berpuasa!'
        );
    END IF;

    -- 2. BAB 2: Panduan Sholat 5 Waktu
    IF NOT EXISTS (SELECT 1 FROM public.materi_chapters WHERE title = 'Panduan Sholat 5 Waktu') THEN
        INSERT INTO public.materi_chapters (
            category_id, category_name, theme_id, chapter_number, title, description, cover_icon, is_published
        ) VALUES (
            v_cat_shalat, 'Shalat', 'islamic', 1,
            'Panduan Sholat 5 Waktu',
            'Panduan visual ibadah sholat fardhu harian lengkap dengan keutamaan shalat tepat waktu.',
            '🧎', true
        ) RETURNING id INTO v_ch2_id;

        -- Halaman 1 Bab 2
        INSERT INTO public.materi_pages (
            chapter_id, page_number, left_content_type, left_media_url, left_media_type, left_audio_text,
            right_title, right_story_text, bullet_points,
            dalil_title, dalil_arabic, dalil_latin, dalil_translation, dalil_source,
            fun_fact_title, fun_fact_description
        ) VALUES (
            v_ch2_id, 1, 'media', '/image/sticker/islami/tasbihscreen.png', 'image',
            'Sholat adalah tiang agama dan bentuk komunikasi langsung seorang hamba dengan Allah SWT.',
            'Sholat 5 Waktu Harian Kita',
            'Sholat fardhu wajib dikerjakan oleh setiap muslim yang sudah baligh sebanyak 5 waktu sehari semalam.',
            '["1. Subuh: 2 Rakaat di waktu fajar sebelum terbit matahari.", "2. Dzuhur: 4 Rakaat di siang hari saat matahari tergelincir.", "3. Ashar: 4 Rakaat di sore hari.", "4. Maghrib: 3 Rakaat saat matahari terbenam.", "5. Isya: 4 Rakaat di malam hari."]'::jsonb,
            'Kewajiban Sholat Tepat Waktu',
            'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
            'Innas-shalaata kaanat ''alal-mu''miniina kitaabam-mauquutaa.',
            'Sesungguhnya shalat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman.',
            'QS. An-Nisa: 103',
            'Pahala Berjamaah',
            'Sholat berjamaah di masjid atau bersama keluarga melipatgandakan pahala hingga 27 derajat!'
        );
    END IF;

    -- 3. BAB 3: Kisah Singkat Nabi & Rasul
    IF NOT EXISTS (SELECT 1 FROM public.materi_chapters WHERE title = 'Kisah Singkat Nabi & Rasul Utusan Allah') THEN
        INSERT INTO public.materi_chapters (
            category_id, category_name, theme_id, chapter_number, title, description, cover_icon, is_published
        ) VALUES (
            v_cat_nabi, 'Nabi dan Rasul', 'islamic', 1,
            'Kisah Singkat Nabi & Rasul Utusan Allah',
            'Meneladani keberanian, kesabaran, dan akhlak mulia para Nabi Ulul Azmi melalui kisah bergambar.',
            '📜', true
        ) RETURNING id INTO v_ch3_id;

        -- Halaman 1 Bab 3
        INSERT INTO public.materi_pages (
            chapter_id, page_number, left_content_type, left_media_url, left_media_type, left_audio_text,
            right_title, right_story_text, bullet_points,
            fun_fact_title, fun_fact_description
        ) VALUES (
            v_ch3_id, 1, 'media', '/image/sticker/islami/bukubiru.png', 'image',
            'Nabi Adam AS adalah manusia pertama yang diciptakan Allah SWT dari tanah sebagai khalifah di bumi.',
            'Nabi Adam AS - Manusia Pertama',
            'Nabi Adam AS diciptakan sebagai nenek moyang seluruh umat manusia dan diajarkan nama-nama benda oleh Allah SWT.',
            '["Nabi Adam AS diciptakan oleh Allah SWT dari tanah.", "Allah mengajarkan nama-nama benda kepada Nabi Adam sehingga malaikat pun kagum.", "Nabi Adam mengajarkan kita untuk senantiasa bertobat ketika berbuat salah."]'::jsonb,
            'Pelajaran Berharga',
            'Jika kita berbuat salah, jangan malu untuk segera memohon ampunan kepada Allah dan meminta maaf!'
        );
    END IF;
END $$;

