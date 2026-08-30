'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Volume2,
  Image as ImageIcon,
  ArrowLeft,
  Save,
  X,
  FileText,
  Youtube,
  Music,
  ExternalLink,
  Upload,
  Loader2,
} from 'lucide-react';
import { MateriChapter, MateriPage } from '@/types/education';
import { Category } from '@/types/game';
import { EducationService } from '@/lib/educationService';
import { GameService } from '@/lib/gameService';
import { getYouTubeThumbnailUrl, getYouTubeWatchUrl, isYouTubeUrl } from '@/lib/youtubeHelper';
import EducationBook from '@/components/EducationBook';

const STICKER_PRESETS = [
  { label: 'Masjid', url: '/image/sticker/islami/masjid.png' },
  { label: 'Al-Qur\'an', url: '/image/sticker/islami/alquran2.png' },
  { label: 'Tasbih', url: '/image/sticker/islami/tasbihscreen.png' },
  { label: 'Buku Biru', url: '/image/sticker/islami/bukubiru.png' },
];

const EMOJI_PRESETS = ['📖', '🕌', '🧎', '👳', '📜', '🌙', '🤲', '🦅', '🎖️', '🎭', '🏠', '🍛', '📚', '🪕', '✨'];

export const AdminMateriManager: React.FC = () => {
  // Main Data States
  const [chapters, setChapters] = useState<MateriChapter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Filters & Search
  const [themeFilter, setThemeFilter] = useState<'ALL' | 'islamic' | 'independence' | 'culture'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Chapter Modal State
  const [isChapterModalOpen, setIsChapterModalOpen] = useState<boolean>(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState<Partial<MateriChapter>>({
    title: '',
    description: '',
    category_id: '',
    category_name: 'Materi Islami',
    theme_id: 'islamic',
    chapter_number: 1,
    cover_icon: '📖',
    cover_image_url: '',
    is_published: true,
  });

  // Page Management Sub-View State
  const [activeChapter, setActiveChapter] = useState<MateriChapter | null>(null);
  const [pages, setPages] = useState<MateriPage[]>([]);
  const [loadingPages, setLoadingPages] = useState<boolean>(false);

  // Page Modal State
  const [isPageModalOpen, setIsPageModalOpen] = useState<boolean>(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageFormTab, setPageFormTab] = useState<'CONTENT' | 'INTERACTIVE' | 'PREVIEW'>('CONTENT');
  const [pageForm, setPageForm] = useState<Partial<MateriPage>>({
    page_number: 1,
    left_content_type: 'media',
    left_media_type: 'image',
    left_media_url: '/image/sticker/islami/masjid.png',
    left_audio_text: '',
    left_title: '',
    left_text: '',
    right_title: '',
    right_story_text: '',
    bullet_points: ['Poin materi 1'],
    dalil_title: '',
    dalil_arabic: '',
    dalil_latin: '',
    dalil_translation: '',
    dalil_source: '',
    fun_fact_title: '',
    fun_fact_description: '',
  });

  // Book Preview Modal State
  const [isPreviewBookOpen, setIsPreviewBookOpen] = useState<boolean>(false);
  const [previewChapter, setPreviewChapter] = useState<MateriChapter | null>(null);
  const [previewPages, setPreviewPages] = useState<MateriPage[]>([]);

  // TTS Speech Test State & Upload States
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);

  // Preview Handlers
  const handleOpenChapterPreview = async (chapter: MateriChapter) => {
    setPreviewChapter(chapter);
    try {
      const pList = await EducationService.getPagesByChapter(chapter.id);
      setPreviewPages(pList);
      setIsPreviewBookOpen(true);
    } catch (err: any) {
      alert(`Gagal memuat pratinjau buku: ${err.message}`);
    }
  };

  const handleOpenCurrentPagesPreview = () => {
    if (!activeChapter) return;
    setPreviewChapter(activeChapter);
    setPreviewPages(pages);
    setIsPreviewBookOpen(true);
  };

  const createDraftPageFromForm = (): MateriPage => {
    return {
      id: editingPageId || 'draft-page-preview',
      chapter_id: activeChapter?.id || '',
      page_number: pageForm.page_number || 1,
      left_content_type: pageForm.left_content_type || 'media',
      left_media_type: pageForm.left_media_type || 'image',
      left_media_url: pageForm.left_media_url || '',
      left_audio_url: pageForm.left_audio_url || '',
      left_audio_text: pageForm.left_audio_text || '',
      left_title: pageForm.left_title || '',
      left_text: pageForm.left_text || '',
      right_title: pageForm.right_title || '',
      right_story_text: pageForm.right_story_text || '',
      bullet_points: pageForm.bullet_points || [],
      dalil_title: pageForm.dalil_title || '',
      dalil_arabic: pageForm.dalil_arabic || '',
      dalil_latin: pageForm.dalil_latin || '',
      dalil_translation: pageForm.dalil_translation || '',
      dalil_source: pageForm.dalil_source || '',
      fun_fact_title: pageForm.fun_fact_title || '',
      fun_fact_description: pageForm.fun_fact_description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handlePreviewCurrentDraftPage = () => {
    if (!activeChapter) return;
    const draft = createDraftPageFromForm();
    const existingIndex = pages.findIndex((p) => p.id === editingPageId);
    let updatedPreviewPages: MateriPage[] = [];
    if (existingIndex >= 0) {
      updatedPreviewPages = [...pages];
      updatedPreviewPages[existingIndex] = draft;
    } else {
      updatedPreviewPages = [...pages, draft];
    }
    updatedPreviewPages.sort((a, b) => a.page_number - b.page_number);
    setPreviewChapter(activeChapter);
    setPreviewPages(updatedPreviewPages);
    setIsPreviewBookOpen(true);
  };

  const handleUploadMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const publicUrl = await EducationService.uploadMateriAsset(file, 'images');
      const detectedType = file.name.toLowerCase().endsWith('.gif') ? 'gif' : 'image';

      setPageForm((prev) => ({
        ...prev,
        left_media_url: publicUrl,
        left_media_type: detectedType as any,
      }));
      setSuccessMessage(`File "${file.name}" berhasil diunggah ke Supabase Storage!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Gagal upload berkas: ${err.message}`);
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleUploadAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    try {
      const publicUrl = await EducationService.uploadMateriAsset(file, 'audios');
      setPageForm((prev) => ({
        ...prev,
        left_audio_url: publicUrl,
      }));
      setSuccessMessage(`File suara "${file.name}" berhasil diunggah ke Supabase Storage!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Gagal upload file suara: ${err.message}`);
    } finally {
      setIsUploadingAudio(false);
      e.target.value = '';
    }
  };

  // Load Categories & Chapters on Mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [cats, chaps] = await Promise.all([
        GameService.getCategories(),
        EducationService.getAllChaptersAdmin(),
      ]);
      setCategories(cats);
      setChapters(chaps);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat data dari Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const loadChapterPages = async (chapter: MateriChapter) => {
    setActiveChapter(chapter);
    setLoadingPages(true);
    try {
      const pList = await EducationService.getPagesByChapter(chapter.id);
      setPages(pList);
    } catch (err: any) {
      alert(`Gagal memuat halaman: ${err.message}`);
    } finally {
      setLoadingPages(false);
    }
  };

  // Chapter Handlers
  const handleOpenNewChapterModal = () => {
    setEditingChapterId(null);
    const defaultCat = categories.length > 0 ? categories[0] : null;
    setChapterForm({
      title: '',
      description: '',
      category_id: defaultCat ? defaultCat.id : '',
      category_name: defaultCat ? defaultCat.name : 'Materi Islami',
      theme_id: themeFilter !== 'ALL' ? themeFilter : 'islamic',
      chapter_number: chapters.length + 1,
      cover_icon: '📖',
      cover_image_url: '',
      is_published: true,
    });
    setIsChapterModalOpen(true);
  };

  const handleEditChapter = (ch: MateriChapter) => {
    setEditingChapterId(ch.id);
    setChapterForm({ ...ch });
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm.title?.trim()) {
      alert('Judul Bab tidak boleh kosong!');
      return;
    }

    try {
      const selectedCat = categories.find((c) => c.id === chapterForm.category_id);
      const prepared: Partial<MateriChapter> = {
        ...chapterForm,
        category_name: selectedCat ? selectedCat.name : (chapterForm.category_name || 'Materi Islami'),
        theme_id: chapterForm.theme_id || selectedCat?.theme_id || 'islamic',
      };

      if (editingChapterId) {
        prepared.id = editingChapterId;
      }

      const saved = await EducationService.saveChapter(prepared);

      setChapters((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        } else {
          return [...prev, saved];
        }
      });

      setIsChapterModalOpen(false);
      setSuccessMessage(editingChapterId ? 'Bab materi berhasil diperbarui!' : 'Bab materi baru berhasil ditambahkan ke Supabase!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Gagal menyimpan bab: ${err.message}`);
    }
  };

  const handleDeleteChapter = async (chapterId: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Bab "${title}" secara permanen dari Supabase?\n\nSemua halaman buku di dalam bab ini juga akan terhapus!`)) {
      try {
        await EducationService.deleteChapter(chapterId);
        setChapters((prev) => prev.filter((c) => c.id !== chapterId));
        if (activeChapter?.id === chapterId) {
          setActiveChapter(null);
          setPages([]);
        }
        setSuccessMessage(`Bab "${title}" berhasil dihapus.`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err: any) {
        alert(`Gagal menghapus bab: ${err.message}`);
      }
    }
  };

  const handleTogglePublishChapter = async (chapter: MateriChapter) => {
    try {
      const updated = await EducationService.saveChapter({
        ...chapter,
        is_published: !chapter.is_published,
      });
      setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      alert(`Gagal mengubah status bab: ${err.message}`);
    }
  };

  // Page Handlers
  const handleOpenNewPageModal = () => {
    if (!activeChapter) return;
    setEditingPageId(null);
    setPageFormTab('CONTENT');
    setPageForm({
      chapter_id: activeChapter.id,
      page_number: pages.length + 1,
      left_content_type: 'media',
      left_media_type: 'image',
      left_media_url: '/image/sticker/islami/masjid.png',
      left_audio_text: '',
      left_title: '',
      left_text: '',
      right_title: '',
      right_story_text: '',
      bullet_points: ['Poin materi 1'],
      dalil_title: '',
      dalil_arabic: '',
      dalil_latin: '',
      dalil_translation: '',
      dalil_source: '',
      fun_fact_title: '',
      fun_fact_description: '',
    });
    setIsPageModalOpen(true);
  };

  const handleEditPage = (page: MateriPage) => {
    setEditingPageId(page.id);
    setPageFormTab('CONTENT');
    setPageForm({
      ...page,
      bullet_points: page.bullet_points && page.bullet_points.length > 0 ? page.bullet_points : [''],
    });
    setIsPageModalOpen(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChapter) return;

    try {
      const cleanBullets = (pageForm.bullet_points || []).filter((b) => b.trim() !== '');

      const pageToSave: Partial<MateriPage> = {
        ...pageForm,
        chapter_id: activeChapter.id,
        bullet_points: cleanBullets,
      };

      if (editingPageId) {
        pageToSave.id = editingPageId;
      }

      const saved = await EducationService.savePage(pageToSave);

      setPages((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated.sort((a, b) => a.page_number - b.page_number);
        } else {
          return [...prev, saved].sort((a, b) => a.page_number - b.page_number);
        }
      });

      // Update local chapters count
      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapter.id ? { ...c, total_pages: pages.length + (editingPageId ? 0 : 1) } : c
        )
      );

      setIsPageModalOpen(false);
      setSuccessMessage(editingPageId ? 'Halaman buku berhasil diperbarui!' : 'Halaman buku baru berhasil disimpan ke Supabase!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Gagal menyimpan halaman: ${err.message}`);
    }
  };

  const handleDeletePage = async (pageId: string, pageNum: number) => {
    if (confirm(`Hapus Halaman ${pageNum} dari Supabase?`)) {
      try {
        await EducationService.deletePage(pageId);
        setPages((prev) => prev.filter((p) => p.id !== pageId));
        if (activeChapter) {
          setChapters((prev) =>
            prev.map((c) => (c.id === activeChapter.id ? { ...c, total_pages: Math.max(0, c.total_pages - 1) } : c))
          );
        }
        setSuccessMessage(`Halaman ${pageNum} berhasil dihapus.`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err: any) {
        alert(`Gagal menghapus halaman: ${err.message}`);
      }
    }
  };

  // Audio Tester (Audio File or TTS Web Speech)
  const handleTestTTS = (textToSpeak?: string, audioFileUrl?: string) => {
    const audioUrl = audioFileUrl || pageForm.left_audio_url;
    const text = textToSpeak || pageForm.left_audio_text;

    // 1. Play Custom Audio File if specified
    if (audioUrl && audioUrl.trim()) {
      try {
        if (isPlayingTTS) {
          setIsPlayingTTS(false);
          return;
        }
        const audio = new Audio(audioUrl.trim());
        audio.onended = () => setIsPlayingTTS(false);
        audio.onerror = () => {
          setIsPlayingTTS(false);
          alert('Gagal memuat berkas audio. Pastikan URL file .mp3 / .wav valid.');
        };
        audio.play().then(() => setIsPlayingTTS(true)).catch(() => setIsPlayingTTS(false));
        return;
      } catch (e) {
        console.warn('Audio test failed:', e);
      }
    }

    // 2. Play Web Speech Synthesis TTS
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser Anda tidak mendukung Web Speech Synthesis (TTS).');
      return;
    }

    if (!text || !text.trim()) {
      alert('Masukkan Teks Audio TTS atau URL File Audio (.mp3/.wav) terlebih dahulu.');
      return;
    }

    window.speechSynthesis.cancel();

    if (isPlayingTTS) {
      setIsPlayingTTS(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsPlayingTTS(true);
    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);

    window.speechSynthesis.speak(utterance);
  };

  // Bullet Point Array Handlers
  const handleAddBulletPoint = () => {
    setPageForm((prev) => ({
      ...prev,
      bullet_points: [...(prev.bullet_points || []), ''],
    }));
  };

  const handleUpdateBulletPoint = (index: number, val: string) => {
    setPageForm((prev) => {
      const arr = [...(prev.bullet_points || [])];
      arr[index] = val;
      return { ...prev, bullet_points: arr };
    });
  };

  const handleRemoveBulletPoint = (index: number) => {
    setPageForm((prev) => {
      const arr = (prev.bullet_points || []).filter((_, i) => i !== index);
      return { ...prev, bullet_points: arr };
    });
  };

  // Filtered Chapters
  const filteredChapters = chapters.filter((ch) => {
    if (themeFilter !== 'ALL' && ch.theme_id !== themeFilter) return false;
    if (categoryFilter !== 'ALL' && ch.category_id !== categoryFilter && ch.category_name !== categoryFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return ch.title.toLowerCase().includes(q) || (ch.description && ch.description.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm font-extrabold flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900 font-bold text-xs">
              ✕
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-sm font-extrabold flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900 font-bold text-xs">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW LEVEL 1: CHAPTERS LIST */}
      {!activeChapter ? (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl text-lg font-black">📖</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Kelola Bab Materi Edukasi</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Kelola bab dan konten buku digital interaktif langsung tersimpan di Supabase Database.
              </p>
            </div>

            <button
              onClick={handleOpenNewChapterModal}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>TAMBAH BAB MATERI BARU</span>
            </button>
          </div>

          {/* Theme & Category Filters */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Theme Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              <button
                onClick={() => setThemeFilter('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${themeFilter === 'ALL'
                    ? 'bg-[#2D6A4F] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
              >
                🌐 Semua Tema ({chapters.length})
              </button>
              <button
                onClick={() => setThemeFilter('islamic')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${themeFilter === 'islamic'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
              >
                🕌 Islami ({chapters.filter((c) => c.theme_id === 'islamic').length})
              </button>
              <button
                onClick={() => setThemeFilter('independence')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${themeFilter === 'independence'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                  }`}
              >
                🇮🇩 Kemerdekaan ({chapters.filter((c) => c.theme_id === 'independence').length})
              </button>
              <button
                onClick={() => setThemeFilter('culture')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${themeFilter === 'culture'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                  }`}
              >
                🎭 Kebudayaan ({chapters.filter((c) => c.theme_id === 'culture').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul bab..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Chapters List Grid */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Memuat daftar bab dari Supabase...</p>
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mx-auto text-slate-400">
                📖
              </div>
              <h3 className="text-base font-black text-slate-800">Belum Ada Bab Materi</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || themeFilter !== 'ALL'
                  ? 'Tidak ada bab yang sesuai dengan filter pencarian.'
                  : 'Klik tombol "+ TAMBAH BAB MATERI BARU" di atas untuk membuat modul materi pertama Anda di Supabase.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredChapters.map((ch) => {
                const themeBadge =
                  ch.theme_id === 'independence'
                    ? { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: '🇲🇨 Kemerdekaan' }
                    : ch.theme_id === 'culture'
                      ? { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: '🎭 Kebudayaan' }
                      : { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '🕌 Islami' };

                return (
                  <motion.div
                    key={ch.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-5 space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${themeBadge.bg}`}>
                          {themeBadge.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTogglePublishChapter(ch)}
                            title={ch.is_published ? 'Klik untuk simpan ke Draft' : 'Klik untuk Publikasikan'}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 transition cursor-pointer ${ch.is_published
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                          >
                            {ch.is_published ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-700" />
                                <span>PUBLISHED</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-500" />
                                <span>DRAFT</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Chapter Main Details */}
                      <div className="flex items-start gap-3 pt-1">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition">
                          {ch.cover_icon || '📖'}
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Bab {ch.chapter_number} • {ch.category_name}
                          </div>
                          <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                            {ch.title}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                        {ch.description || 'Tidak ada deskripsi.'}
                      </p>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{ch.total_pages || 0} Halaman</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenChapterPreview(ch)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Pratinjau Tampilan Buku Pemain"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pratinjau</span>
                        </button>
                        <button
                          onClick={() => loadChapterPages(ch)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Halaman</span>
                        </button>
                        <button
                          onClick={() => handleEditChapter(ch)}
                          className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                          title="Edit Bab"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(ch.id, ch.title)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title="Hapus Bab dari Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW LEVEL 2: PAGE MANAGEMENT FOR SELECTED CHAPTER */
        <div className="space-y-6">
          {/* Top Back Navigation Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => setActiveChapter(null)}
                className="inline-flex items-center gap-2 text-xs font-black text-[#2D6A4F] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Bab
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCurrentPagesPreview}
                  className="bg-amber-500 hover:bg-amber-600 text-amber-950 border border-amber-300 px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  title="Pratinjau seluruh halaman dalam Bab ini"
                >
                  <Eye className="w-4 h-4 text-amber-950" />
                  <span>PRATINJAU TAMPILAN BUKU</span>
                </button>

                <button
                  onClick={handleOpenNewPageModal}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>TAMBAH HALAMAN BUKU BARU</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-2 border-t border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-2xl">
                {activeChapter.cover_icon || '📖'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Bab {activeChapter.chapter_number}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{activeChapter.category_name}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900">{activeChapter.title}</h2>
              </div>
            </div>
          </div>

          {/* Pages List */}
          {loadingPages ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Memuat halaman buku dari Supabase...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mx-auto text-slate-400">
                📄
              </div>
              <h3 className="text-base font-black text-slate-800">Bab Ini Belum Memiliki Halaman</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Klik tombol "+ TAMBAH HALAMAN BUKU BARU" di atas untuk menambahkan slide halaman membaca pertama.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Page Number Badge */}
                    <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex-shrink-0 flex flex-col items-center justify-center shadow-xs">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-80">HAL</span>
                      <span className="text-lg font-black leading-none">{p.page_number}</span>
                    </div>

                    <div className="space-y-1.5 max-w-2xl">
                      <h4 className="text-base font-black text-slate-900 leading-snug">
                        {p.right_title || `Halaman ${p.page_number}`}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                        {p.right_story_text || p.left_audio_text || 'Tidak ada teks narasi.'}
                      </p>

                      {/* Content Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {isYouTubeUrl(p.left_media_url, p.left_media_type) ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                            <Youtube className="w-3.5 h-3.5 text-rose-600" /> Video YouTube 🔴
                          </span>
                        ) : p.left_media_url ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Media: {p.left_media_type || 'image'}
                          </span>
                        ) : null}

                        {p.left_audio_url && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-bold flex items-center gap-1">
                            <Music className="w-3 h-3 text-purple-600" /> Voice File (.mp3)
                          </span>
                        )}

                        {p.left_audio_text && !p.left_audio_url && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Audio TTS
                          </span>
                        )}

                        {p.bullet_points && p.bullet_points.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                            • {p.bullet_points.length} Poin
                          </span>
                        )}

                        {p.dalil_title && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            📖 Dalil
                          </span>
                        )}

                        {p.fun_fact_title && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            💡 Fun Fact
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-shrink-0 justify-end">
                    {(p.left_audio_url || p.left_audio_text) && (
                      <button
                        onClick={() => handleTestTTS(p.left_audio_text, p.left_audio_url)}
                        className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Uji suara audio / TTS"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Uji Audio</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleEditPage(p)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeletePage(p.id, p.page_number)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                      title="Hapus Halaman"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHAPTER MODAL (CREATE / EDIT BAB) */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8 text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingChapterId ? 'Edit Bab Materi' : 'Tambah Bab Materi Baru'}
              </h3>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-4">
              {/* Tema & Kategori Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Tema Pembelajaran *
                  </label>
                  <select
                    value={chapterForm.theme_id}
                    onChange={(e) => setChapterForm({ ...chapterForm, theme_id: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="islamic">🕌 Islami</option>
                    <option value="independence">🇮🇩 Kemerdekaan</option>
                    <option value="culture">🎭 Kebudayaan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Kategori Bab *
                  </label>
                  <select
                    value={chapterForm.category_id}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const catObj = categories.find((c) => c.id === catId);
                      setChapterForm({
                        ...chapterForm,
                        category_id: catId,
                        category_name: catObj ? catObj.name : chapterForm.category_name,
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '🏷️'} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter Number & Cover Icon */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nomor Bab *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={chapterForm.chapter_number || 1}
                    onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Ikon Cover Bab
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chapterForm.cover_icon || '📖'}
                      onChange={(e) => setChapterForm({ ...chapterForm, cover_icon: e.target.value })}
                      className="w-16 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-bold"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto py-1 custom-scrollbar">
                      {EMOJI_PRESETS.slice(0, 7).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setChapterForm({ ...chapterForm, cover_icon: emoji })}
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm flex items-center justify-center flex-shrink-0"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Judul Bab Materi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 1 - Mengenal Rukun Islam"
                  value={chapterForm.title || ''}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Deskripsi Singkat Bab
                </label>
                <textarea
                  rows={3}
                  placeholder="Penjelasan ringkas isi materi di bab ini..."
                  value={chapterForm.description || ''}
                  onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Publish Checkbox */}
              <label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chapterForm.is_published || false}
                  onChange={(e) => setChapterForm({ ...chapterForm, is_published: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 block">Publikasikan Bab Ini</span>
                  <span className="text-[10px] font-medium text-slate-500 block">
                    Jika di centang, bab materi akan langsung dapat diakses oleh pemain di buku digital.
                  </span>
                </div>
              </label>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingChapterId ? 'SIMPAN PERUBAHAN BAB' : 'SIMPAN BAB BARU'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* PAGE MODAL (CREATE / EDIT HALAMAN BUKU) */}
      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingPageId ? `Edit Halaman ${pageForm.page_number}` : 'Tambah Halaman Buku Baru'}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Bab: {activeChapter?.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviewCurrentDraftPage}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Buka Pratinjau Buku Layar Penuh dengan halaman ini"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Uji Pratinjau Buku</span>
                </button>
                <button
                  onClick={() => setIsPageModalOpen(false)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setPageFormTab('CONTENT')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition ${pageFormTab === 'CONTENT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                📖 Konten Utama
              </button>
              <button
                type="button"
                onClick={() => setPageFormTab('INTERACTIVE')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition ${pageFormTab === 'INTERACTIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                ✨ Modal Interaktif
              </button>
              <button
                type="button"
                onClick={() => setPageFormTab('PREVIEW')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition ${pageFormTab === 'PREVIEW' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                👁️ Pratinjau Live Buku
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-4">
              {pageFormTab === 'CONTENT' ? (
                <div className="space-y-4">
                  {/* Page Number */}
                  <div className="w-32">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Nomor Halaman *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={pageForm.page_number || 1}
                      onChange={(e) => setPageForm({ ...pageForm, page_number: parseInt(e.target.value) || 1 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Section Left Content (Visual Media & Audio) */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-700" />
                      <span>1. Konten Sisi Kiri (Media & Audio Voice / TTS)</span>
                    </h4>

                    {/* Tipe Media & URL Media */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                          Tipe Media
                        </label>
                        <select
                          value={pageForm.left_media_type || 'image'}
                          onChange={(e) => setPageForm({ ...pageForm, left_media_type: e.target.value as any })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="image">🖼️ Gambar / Stiker</option>
                          <option value="youtube">🔴 Link Video YouTube</option>
                          <option value="video">🎬 File Video Direct (.mp4)</option>
                          <option value="gif">✨ Gambar GIF</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                            {pageForm.left_media_type === 'youtube' || isYouTubeUrl(pageForm.left_media_url, pageForm.left_media_type)
                              ? 'URL Link Video YouTube *'
                              : 'URL Media Gambar / Video'}
                          </label>

                          <label className={`cursor-pointer px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition ${isUploadingMedia ? 'bg-slate-400 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}>
                            {isUploadingMedia ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            <span>{isUploadingMedia ? 'Mengunggah...' : '📁 Upload Berkas'}</span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleUploadMediaFile}
                              className="hidden"
                              disabled={isUploadingMedia}
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder={
                            pageForm.left_media_type === 'youtube'
                              ? 'https://www.youtube.com/watch?v=... atau https://youtu.be/...'
                              : '/image/sticker/islami/masjid.png atau https://...'
                          }
                          value={pageForm.left_media_url || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const isYt = isYouTubeUrl(val);
                            setPageForm({
                              ...pageForm,
                              left_media_url: val,
                              left_media_type: isYt ? 'youtube' : pageForm.left_media_type,
                            });
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* YouTube Auto-Preview Box */}
                    {isYouTubeUrl(pageForm.left_media_url, pageForm.left_media_type) && (
                      <div className="p-3 bg-white rounded-xl border border-rose-200 flex items-center gap-3">
                        <div className="relative w-24 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                          <img
                            src={getYouTubeThumbnailUrl(pageForm.left_media_url) || ''}
                            alt="Preview Thumbnail YouTube"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Youtube className="w-6 h-6 text-rose-600 drop-shadow" />
                          </div>
                        </div>
                        <div className="overflow-hidden flex-1">
                          <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1">
                            <Youtube className="w-3.5 h-3.5 text-rose-600" /> Pratinjau Link YouTube
                          </span>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            Thumbnail otomatis terdeteksi dari link.
                          </p>
                          <a
                            href={getYouTubeWatchUrl(pageForm.left_media_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 font-extrabold hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <span>Tes Buka Video YouTube</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Preset Stiker Buttons (jika tipe gambar) */}
                    {pageForm.left_media_type !== 'youtube' && (
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                          Preset Stiker Cepat
                        </label>
                        <div className="flex items-center gap-1.5 py-1">
                          {STICKER_PRESETS.map((st) => (
                            <button
                              key={st.url}
                              type="button"
                              onClick={() => setPageForm({ ...pageForm, left_media_url: st.url, left_media_type: 'image' })}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-slate-700"
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audio Section: Custom Audio Voice File & TTS Text */}
                    <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                            <Music className="w-3.5 h-3.5 text-purple-600" />
                            <span>Pilihan 1: URL Berkas File Audio Voice (MP3 / WAV)</span>
                          </label>
                          <label className={`cursor-pointer px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition ${isUploadingAudio ? 'bg-slate-400 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                            }`}>
                            {isUploadingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            <span>{isUploadingAudio ? 'Mengunggah...' : '🎵 Upload Audio'}</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleUploadAudioFile}
                              className="hidden"
                              disabled={isUploadingAudio}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTestTTS(pageForm.left_audio_text, pageForm.left_audio_url)}
                          className="text-[10px] font-extrabold text-purple-700 hover:underline flex items-center gap-1"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isPlayingTTS ? 'Menghentikan Audio' : 'Uji Pemutar Audio / Voice'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: https://domain.com/suaradanil.mp3 atau upload file di atas"
                        value={pageForm.left_audio_url || ''}
                        onChange={(e) => setPageForm({ ...pageForm, left_audio_url: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-[10px] text-slate-500 font-semibold">
                        *Jika diisi URL file `.mp3` atau `.wav`, aplikasi akan memutar rekaman suara asli tersebut saat tombol Dengarkan diklik.
                      </p>
                    </div>

                    {/* Audio TTS Text Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pilihan 2: Teks Naskah Suara TTS (Generator Suara Robot)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Kalimat yang akan dibacakan oleh pembaca suara otomatis jika file audio MP3 tidak diisi..."
                        value={pageForm.left_audio_text || ''}
                        onChange={(e) => setPageForm({ ...pageForm, left_audio_text: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Section Right Content (Headline & Story) */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-700" />
                      <span>2. Konten Sisi Kanan (Judul & Teks Cerita)</span>
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Judul Headline Halaman
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Apa itu Rukun Islam?"
                        value={pageForm.right_title || ''}
                        onChange={(e) => setPageForm({ ...pageForm, right_title: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Teks Narasi Cerita Utama
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Penjelasan narasi materi halaman..."
                        value={pageForm.right_story_text || ''}
                        onChange={(e) => setPageForm({ ...pageForm, right_story_text: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Bullet Points Dynamic Manager */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                          Poin-Poin Penting (Bullet Points)
                        </label>
                        <button
                          type="button"
                          onClick={handleAddBulletPoint}
                          className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Poin
                        </button>
                      </div>

                      {(pageForm.bullet_points || []).map((bp, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">•</span>
                          <input
                            type="text"
                            placeholder={`Poin materi ${idx + 1}`}
                            value={bp}
                            onChange={(e) => handleUpdateBulletPoint(idx, e.target.value)}
                            className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBulletPoint(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : pageFormTab === 'PREVIEW' ? (
                /* LIVE PREVIEW TAB */
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-amber-900">
                        👁️ Pratinjau Live Halaman Buku (Draft)
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-md">
                        Sizing & Visual 100% Persis Pemain
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handlePreviewCurrentDraftPage}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Layar Penuh</span>
                    </button>
                  </div>

                  <div className="w-full rounded-2xl overflow-hidden border-2 border-amber-300 shadow-lg relative bg-slate-900 h-[480px]">
                    <EducationBook
                      chapter={activeChapter || { id: 'preview', title: 'Pratinjau', description: '', category_id: '', category_name: '', theme_id: 'islamic', chapter_number: 1, is_published: true, total_pages: 1, created_at: '', updated_at: '' }}
                      initialPages={[createDraftPageFromForm()]}
                      onBack={() => setPageFormTab('CONTENT')}
                      isPreviewMode={true}
                    />
                  </div>
                </div>
              ) : (
                /* INTERACTIVE TAB (DALIL & FUN FACT) */
                <div className="space-y-4">
                  {/* Dalil Sub-Form */}
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                      📖 Modal Dalil (Al-Qur'an / Hadits)
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Judul Dalil
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Hadits Rukun Islam (HR. Bukhari & Muslim)"
                        value={pageForm.dalil_title || ''}
                        onChange={(e) => setPageForm({ ...pageForm, dalil_title: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Teks Arab Dalil
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        placeholder="بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ..."
                        value={pageForm.dalil_arabic || ''}
                        onChange={(e) => setPageForm({ ...pageForm, dalil_arabic: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                          Teks Transliterasi Latin
                        </label>
                        <input
                          type="text"
                          placeholder="Buniyal-islaamu 'alaa khamsin..."
                          value={pageForm.dalil_latin || ''}
                          onChange={(e) => setPageForm({ ...pageForm, dalil_latin: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                          Sumber Dalil
                        </label>
                        <input
                          type="text"
                          placeholder="Hadits Shahih Bukhari No. 8"
                          value={pageForm.dalil_source || ''}
                          onChange={(e) => setPageForm({ ...pageForm, dalil_source: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Arti / Terjemahan Bahasa Indonesia
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Islam dibangun di atas lima perkara..."
                        value={pageForm.dalil_translation || ''}
                        onChange={(e) => setPageForm({ ...pageForm, dalil_translation: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Fun Fact Sub-Form */}
                  <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                      💡 Modal Fun Fact (Tahukah Kamu?)
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Judul Fun Fact
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Tahukah Kamu?"
                        value={pageForm.fun_fact_title || ''}
                        onChange={(e) => setPageForm({ ...pageForm, fun_fact_title: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Deskripsi Fakta Unik
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Sama seperti bangunan rumah, jika salah satu tiang pondasinya roboh..."
                        value={pageForm.fun_fact_description || ''}
                        onChange={(e) => setPageForm({ ...pageForm, fun_fact_description: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPageId ? 'SIMPAN HALAMAN' : 'TAMBAH HALAMAN'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* FULL SCREEN BOOK PREVIEW MODAL OVERLAY */}
      <AnimatePresence>
        {isPreviewBookOpen && previewChapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col justify-between"
          >
            <EducationBook
              chapter={previewChapter}
              initialPages={previewPages}
              onBack={() => setIsPreviewBookOpen(false)}
              isPreviewMode={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMateriManager;
