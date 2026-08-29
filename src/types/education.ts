export type EducationThemeId = 'islamic' | 'independence' | 'culture';

export interface EducationSlide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  visualIcon: string; // Emoji or image URL
  visualBadge: string;
  bulletPoints: string[];
  audioUrl?: string; // Optional audio recitation / narration snippet
  audioLabel?: string;
  
  // Interactive Modal Data (Tanpa Kuis)
  dalil?: {
    title: string;
    arabicText?: string;
    latinText?: string;
    translation: string;
    source: string;
  };
  funFact?: {
    title: string;
    description: string;
    icon?: string;
  };
}

export interface EducationChapter {
  id: string;
  themeId: EducationThemeId;
  chapterNumber: number;
  title: string;
  description: string;
  icon: string;
  targetAudience: 'SD' | 'SMP' | 'SD-SMP';
  colorGradient: string;
  borderColor: string;
  totalSlides: number;
  slides: EducationSlide[];
}

// Interface Bab Materi (Sistem Database Baru)
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
  left_media_url?: string;           // URL GIF, Gambar (.png/.jpg), atau Link YouTube
  left_media_type?: 'image' | 'gif' | 'youtube';
  left_audio_url?: string;           // URL file audio rekaman suara kustom (.mp3/.wav)
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

