# 📚 Panduan Teknis & Dokumentasi Lengkap — Fitur MATERI EDUKASI (Buku Interaktif Dinamis)

Dokumen ini adalah **panduan spesifikasi teknis dan blueprint arsitektur lengkap** untuk pengembangan fitur **MATERI EDUKASI DINAMIS** pada aplikasi Islamic Millionaire Webapp.

---

## 🗺️ 1. Hierarki Data & User Flow

Sistem materi disusun dalam **3 tingkatan bertingkat (3-level hierarchy)**:

```
[Level 1: Kategori Materi] (Contoh: Shalat, Rukun Islam, Aqidah, dll - sudah ada di DB)
    │
    ▼ Siswa klik kategori (misal: "Shalat 🧎")
    │
[Level 2: Daftar Bab / Chapter] (Contoh: Bab 1: Syarat & Rukun, Bab 2: Bacaan Shalat)
    │
    ▼ Siswa klik Bab (misal: "Bab 1: Syarat & Rukun")
    │
[Level 3: Buku Digital Interaktif] (Halaman 1, 2, 3... berbentuk buku 2 sisi)
    ├── SISI KIRI (Modular): Media Visual (Video/GIF/Gambar) + Audio Narator TTS (atau Teks)
    └── SISI KANAN (Modular): Headline + Teks Penjelasan + Poin-Poin + Dalil + Tahukah Kamu?
```

---

## 🎨 2. Arsitektur Tampilan Buku: Elemen Statis vs Konten Dinamis

Buku didesain dengan format **buku terbuka 2 halaman (*Open Book Canvas*)** menggunakan aset grafis resmi di folder `/image/elemenbuku/`:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔴 [kembalibutton.png]          📖 [backgroundChapter.png: Judul Bab]    🔊 [onspeak/offspeak.png] │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ╭─────────────────────────────────────────╮╭─────────────────────────────────────────╮     │
│  │ 📘 SISI KIRI (MODULAR - PILIHAN GURU)   ││ 📙 SISI KANAN (MODULAR - PILIHAN GURU)  │     │
│  │                                         ││                                         │     │
│  │  • Video / GIF / Gambar (Box Frame)     ││  • [backgroundheadline.png: Title]      │     │
│  │  • [buttonnarator.png + visualaudio.png]││  • Teks Penjelasan / Narasi Cerita      │     │
│  │  • Atau: Title / Teks / Poin / Dalil    ││  • [backgroundpoin.png: Poin 1 & 2]     │     │
│  │    (Guru bebas tentukan isi kiri/kanan) ││  • [buttondalil.png: Baca Dalil]        │     │
│  │                                         ││  • [buttontahukahkamu.png: Fakta Unik]  │     │
│  ╰─────────────────────────────────────────╯╰─────────────────────────────────────────╯     │
│                                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│   [back.png: Sebelumnya]             [ nohalaman.png: Hal 1/4 ]              [next.png: Lanjut] │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### A. Elemen Statis (Posisi & Fungsi Tetap di Setiap Halaman)
Elemen ini selalu muncul di posisi yang sama dan tidak berubah strukturnya:

| Komponen | Posisi | Aset Grafis | Fungsi |
|---|---|---|---|
| **Tombol Kembali** | Pojok Kiri Atas | `/image/elemenbuku/kembalibutton.png` | Kembali ke halaman daftar Bab kategori |
| **Header Bab** | Tengah Atas | `/image/elemenbuku/backgroundChapter.png` | Menampilkan nama Bab/Chapter yang sedang dibaca (dari database) |
| **Speaker Audio Toggle** | Pojok Kanan Atas | `/image/elemenbuku/onspeak.png` & `offspeak.png` | Mengaktifkan/mematikan suara narator & BGM |
| **Navigasi Halaman Sebelumnya** | Bawah Kiri Buku | `/image/elemenbuku/back.png` | Berpindah ke halaman sebelumnya (disabled pada hal. 1) |
| **Nomor Halaman** | Bawah Tengah Buku | `/image/elemenbuku/nohalaman.png` | Menampilkan indikator `"Halaman X dari Y"` |
| **Navigasi Halaman Selanjutnya** | Bawah Kanan Buku | `/image/elemenbuku/next.png` | Berpindah ke halaman berikutnya / selesai |
| **Kanvas Buku Terbuka** | Background Buku | `/image/elemenbuku/buku.png` | Frame buku 2 halaman (kiri dan kanan) |

---

### B. Elemen Konten Dinamis / Modular (Dapat Diatur Bebas oleh Guru per Halaman)
Setiap halaman buku bersifat fleksibel (tidak kaku), guru bebas menentukan isi sisi kiri dan sisi kanan:

1. **Media Box (Video / GIF / Gambar)**:
   - Ditampilkan di dalam frame box (`/image/elemenbuku/boxisibuku.png` atau `boxkertas.png`).
   - Mendukung: Video singkat `.mp4` / `.webm` (dengan kontrol/loop/autoplay), animasi `.gif`, atau gambar `.png` / `.jpg` / `.webp`.
2. **Narator Audio TTS (Text-to-Speech)**:
   - Muncul otomatis bersama tombol `/image/elemenbuku/buttonnarator.png` dan icon `/image/elemenbuku/visualaudio.png`.
   - Membaca teks narasi yang diinput guru menggunakan Web Speech API (suara Bahasa Indonesia).
3. **Judul / Headline Halaman**:
   - Ditampilkan di atas pita headline `/image/elemenbuku/backgroundheadline.png`.
4. **Teks Cerita / Penjelasan Materi**:
   - Paragraf uraian materi dengan tipografi kartun yang bersih dan mudah dibaca.
5. **Poin-Poin Penting**:
   - Ditampilkan menggunakan background pita `/image/elemenbuku/backgroundpoin.png` & `backgroundpoin2.png` dengan nomor badge `/image/elemenbuku/logonomor1.png` & `logonomor2.png`.
6. **Tombol Dalil Al-Qur'an / Hadits**:
   - Tombol interaktif `/image/elemenbuku/buttondalil.png` $\rightarrow$ membuka modal pop-up berisi teks Arab, Latin, Terjemahan, dan Sumber.
7. **Tombol "Tahukah Kamu?" (Fun Fact)**:
   - Tombol interaktif `/image/elemenbuku/buttontahukahkamu.png` (dengan icon `tahukahkamuicon.png`) $\rightarrow$ membuka modal pop-up fakta unik.

---

## 🗄️ 3. Skema Database Supabase (SQL)

Jalankan script SQL berikut pada **Supabase SQL Editor** untuk membuat tabel materi:

```sql
-- =======================================================
-- 1. TABEL BAB MATERI (materi_chapters)
-- =======================================================
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
    is_published BOOLEAN DEFAULT false,
    total_pages INT DEFAULT 0,
    created_by UUID REFERENCES public.players(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- 2. TABEL HALAMAN BUKU (materi_pages) - Dinamis & Modular
-- =======================================================
CREATE TABLE IF NOT EXISTS public.materi_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.materi_chapters(id) ON DELETE CASCADE,
    page_number INT NOT NULL DEFAULT 1,
    
    -- KONTEN SISI KIRI (Media Visual / Audio / Teks)
    left_content_type VARCHAR(20) DEFAULT 'media' CHECK (left_content_type IN ('media', 'text', 'empty')),
    left_media_url TEXT,
    left_media_type VARCHAR(20) DEFAULT 'image' CHECK (left_media_type IN ('image', 'video', 'gif')),
    left_audio_text TEXT,
    left_title VARCHAR(200),
    left_text TEXT,
    
    -- KONTEN SISI KANAN (Headline, Teks, Poin-Poin)
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

-- =======================================================
-- 3. INDEX QUERY & ROW LEVEL SECURITY (RLS)
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_materi_chapters_category ON public.materi_chapters(category_id);
CREATE INDEX IF NOT EXISTS idx_materi_chapters_theme ON public.materi_chapters(theme_id);
CREATE INDEX IF NOT EXISTS idx_materi_chapters_published ON public.materi_chapters(is_published);
CREATE INDEX IF NOT EXISTS idx_materi_pages_chapter ON public.materi_pages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_materi_pages_order ON public.materi_pages(chapter_id, page_number);

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
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin all pages" ON public.materi_pages;
CREATE POLICY "Allow admin all pages" ON public.materi_pages
    FOR ALL USING (auth.role() = 'authenticated');

-- =======================================================
-- 4. TRIGGER OTOMATIS: Update total_pages di materi_chapters
-- =======================================================
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
```

---

## 📦 4. Definisi Types TypeScript (`src/types/education.ts`)

```typescript
// Interface Bab Materi
export interface MateriChapter {
  id: string;                        // UUID dari Supabase
  category_id: string;               // FK ke tabel categories
  category_name: string;             // Nama kategori (redundansi performa)
  theme_id: 'islamic' | 'independence' | 'culture';
  chapter_number: number;            // Urutan bab (1, 2, 3...)
  title: string;                     // Judul Bab
  description: string;               // Deskripsi singkat
  cover_icon: string;                // Icon / Cover Bab
  cover_image_url?: string;          // URL gambar sampul (opsional)
  total_pages: number;               // Total halaman buku (auto-updated)
  is_published: boolean;             // Draft / Published
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Interface Halaman Buku Digital Modular
export interface MateriPage {
  id: string;
  chapter_id: string;                // FK ke materi_chapters
  page_number: number;               // Urutan halaman (1, 2, 3...)
  
  // Konten Sisi Kiri (Modular)
  left_content_type?: 'media' | 'text' | 'empty';
  left_media_url?: string;           // URL Video (.mp4/.webm), GIF, atau Gambar (.png/.jpg)
  left_media_type?: 'image' | 'video' | 'gif';
  left_audio_text?: string;          // Teks yang dibaca Narator TTS
  left_title?: string;
  left_text?: string;
  
  // Konten Sisi Kanan (Modular)
  right_title?: string;              // Judul Headline (di atas backgroundheadline.png)
  right_story_text?: string;         // Teks narasi / cerita materi
  bullet_points?: string[];          // Poin-poin penting (di atas backgroundpoin.png)
  
  // Modal Interaktif
  dalil_title?: string;
  dalil_arabic?: string;
  dalil_latin?: string;
  dalil_translation?: string;
  dalil_source?: string;
  
  fun_fact_title?: string;
  fun_fact_description?: string;
  
  created_at: string;
  updated_at?: string;
}
```

---

## 🛠️ 5. Rancangan Service CRUD (`src/lib/educationService.ts`)

File service untuk mengelola komunikasi antara aplikasi dan Supabase (dengan sinkronisasi LocalStorage):

```typescript
export class EducationService {
  // Bab / Chapters
  static async getChaptersByCategory(categoryId: string, includeUnpublished = false): Promise<MateriChapter[]>
  static async getAllChaptersAdmin(): Promise<MateriChapter[]>
  static async saveChapter(chapter: Partial<MateriChapter>): Promise<MateriChapter>
  static async deleteChapter(chapterId: string): Promise<void>
  
  // Halaman / Pages
  static async getPagesByChapter(chapterId: string): Promise<MateriPage[]>
  static async savePage(page: Partial<MateriPage>): Promise<MateriPage>
  static async deletePage(pageId: string): Promise<void>
  static async reorderPages(chapterId: string, pageIdsInOrder: string[]): Promise<void>
}
```

---

## 🖥️ 6. Rancangan Antarmuka Guru di Admin Panel (`/admin`)

Pada halaman Admin `/admin`, ditambahkan tab baru **"MATERI EDUKASI"**:

```
[Tab Admin: SOAL | KATEGORI | 📖 MATERI EDUKASI | ROOMS | PLAYERS]
─────────────────────────────────────────────────────────────────
[1. Pilih Kategori: (Dropdown / Grid Kategori)] 
    ↓
[2. Daftar Bab dalam Kategori Terpilih]
    • Card Bab: Judul, Jumlah Halaman, Status [Draft / Published]
    • Tombol: [+ Tambah Bab Baru] | [✏️ Edit Bab] | [🗑️ Hapus] | [📖 Kelola Halaman Buku]
    ↓
[3. Page Builder / Form Editor Halaman Buku (Saat Bab Diklik)]
    ┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
    │ FORM INPUT GURU (Sisi Kiri Editor)           │ LIVE PREVIEW BUKU (Sisi Kanan Editor)        │
    │                                              │                                              │
    │ [Tab Halaman: Page 1 | Page 2 | + Tambah]   │  Tampilan Buku Interaktif 2 Halaman          │
    │                                              │  dengan aset grafis asli yang otomatis       │
    │ ⚙️ Sisi Kiri:                                │  berubah saat guru mengetik data             │
    │  • Radio: [Media (Video/GIF/Gambar) | Teks]  │                                              │
    │  • Input: URL Media + Tipe                   │  [Visual Kiri]        [Headline Kanan]       │
    │  • Input: Teks Narator TTS                   │  [Frame Media]        [Teks Cerita]          │
    │                                              │  [Speaker TTS]        [Poin 1, Poin 2]       │
    │ ⚙️ Sisi Kanan:                               │                       [Dalil] [FunFact]      │
    │  • Input: Judul Headline                     │                                              │
    │  • Input: Teks Cerita Penjelasan             │                                              │
    │  • List: Poin-Poin Materi (+ / - baris)      │                                              │
    │                                              │                                              │
    │ 🌟 Modal Tambahan (Opsional):                │                                              │
    │  • [x] Sertakan Dalil (Arab, Latin, Arti)    │                                              │
    │  • [x] Sertakan Fakta Unik (Tahukah Kamu?)   │                                              │
    │                                              │                                              │
    │ [💾 Simpan Halaman]   [🗑️ Hapus Halaman]     │                                              │
    └──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 📋 7. Struktur File & Urutan Pengerjaan

### Daftar File:
| Status | Lokasi File | Deskripsi Perubahan |
|---|---|---|
| 🔄 Update | `dokumen/schema.sql` | Penambahan tabel `materi_chapters` & `materi_pages` |
| 🔄 Update | `src/types/education.ts` | Definisi interface `MateriChapter` & `MateriPage` |
| 🔄 Update | `src/types/game.ts` | Penambahan state `EDUCATION_CHAPTERS` & `EDUCATION_BOOK` |
| 🆕 Baru | `src/lib/educationService.ts` | Service CRUD Supabase & LocalStorage untuk Bab & Halaman |
| 🆕 Baru | `src/components/EducationBook.tsx` | Komponen Buku Interaktif Dinamis dengan aset `/image/elemenbuku/` |
| 🆕 Baru | `src/components/EducationChapterList.tsx` | Komponen Daftar Bab per Kategori |
| 🔄 Update | `src/components/EducationPortal.tsx` | Mengarahkan klik kategori ke `EducationChapterList` |
| 🔄 Update | `src/app/page.tsx` | Routing state game untuk alur materi |
| 🔄 Update | `src/app/admin/page.tsx` | Penambahan Tab Manajemen Materi & Page Builder |

### Urutan Pengerjaan Bertahap:
1. **Step 1:** Jalankan script SQL di Supabase SQL Editor.
2. **Step 2:** Update file tipe data (`types/education.ts` & `types/game.ts`).
3. **Step 3:** Buat service CRUD (`lib/educationService.ts`).
4. **Step 4:** Bangun komponen Buku Interaktif (`EducationBook.tsx`) menggunakan aset `/image/elemenbuku/`.
5. **Step 5:** Bangun komponen Daftar Bab (`EducationChapterList.tsx`).
6. **Step 6:** Hubungkan alur navigasi di `EducationPortal.tsx` dan `page.tsx`.
7. **Step 7:** Implementasikan Tab "Materi Edukasi" dan Page Builder di `admin/page.tsx`.