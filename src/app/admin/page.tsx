'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Upload, Download, RefreshCw, ShieldAlert, ArrowLeft, Save, CheckCircle2, FileSpreadsheet, Info, Lock, User, X, ExternalLink, Search, Layers, Radio, Users, BookOpen } from 'lucide-react';
import { Question, Category, QuizRoom } from '@/types/game';
import { GameService } from '@/lib/gameService';
import { RoomService } from '@/lib/roomService';
import { ProfileService } from '@/lib/profileService';
import { AuthService } from '@/lib/authService';
import { parseUniversalCSVText, ParsedQuestionResult } from '@/lib/csvParser';
import { exportQuestionsToCSV } from '@/lib/csvExporter';
import { INITIAL_QUESTIONS, INITIAL_CATEGORIES } from '@/data/seedQuestions';
import { RoomHostView } from '@/components/RoomHostView';
import AdminMateriManager from '@/components/AdminMateriManager';

const DEFAULT_THEME_CATEGORIES: Record<string, string[]> = {
  islamic: ['Aqidah', 'Akhlak', 'Adab', "Al-Qur'an", 'Fiqih', 'Sejarah Islam'],
  independence: ['Sejarah Perjuangan', 'Tokoh Pahlawan', 'Simbol Negara', 'UUD & Pancasila', 'Peristiwa Bersejarah'],
  culture: ['Bahasa Jawa', 'Seni & Tarian', 'Rumah & Pakaian Adat', 'Cerita Rakyat & Kerajaan', 'Alat Musik Tradisional'],
};

export default function AdminPage() {
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [adminTab, setAdminTab] = useState<'QUESTIONS' | 'CATEGORIES' | 'ROOMS' | 'PLAYERS' | 'MATERI'>('QUESTIONS');
  const [activeHostRoom, setActiveHostRoom] = useState<QuizRoom | null>(null);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState<boolean>(false);
  const [newRoomTitle, setNewRoomTitle] = useState<string>('Kuis Live Sosialisasi KKN');
  const [newRoomTheme, setNewRoomTheme] = useState<'islamic' | 'independence' | 'culture'>('islamic');
  const [newRoomCategory, setNewRoomCategory] = useState<string>('Rukun Islam');
  const [roomQuestionSelectionMode, setRoomQuestionSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [roomSelectedQuestionIds, setRoomSelectedQuestionIds] = useState<string[]>([]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [playersList, setPlayersList] = useState<any[]>([]);
  const [adminRooms, setAdminRooms] = useState<QuizRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State Soal
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionThemeFilter, setQuestionThemeFilter] = useState<'ALL' | 'islamic' | 'independence' | 'culture'>('ALL');
  const [formValidationError, setFormValidationError] = useState<string>('');

  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
    theme_id: '' as any, // Mandatory: must be selected when creating a question!
    category_name: 'Aqidah',
    difficulty: 'medium',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    dalil: '',
    ustadz_hint: '',
  });

  // Smart Universal Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importModalTab, setImportModalTab] = useState<'PASTE' | 'FILE'>('PASTE');
  const [importTargetTheme, setImportTargetTheme] = useState<'islamic' | 'independence' | 'culture' | ''>('');
  const [importValidationError, setImportValidationError] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [parsedPreviewResults, setParsedPreviewResults] = useState<ParsedQuestionResult[]>([]);

  // Form State Kategori
  const [categoryThemeFilter, setCategoryThemeFilter] = useState<'ALL' | 'islamic' | 'independence' | 'culture'>('ALL');
  const [isCatFormOpen, setIsCatFormOpen] = useState<boolean>(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatOldName, setEditingCatOldName] = useState<string>('');
  const [catFormData, setCatFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    icon: '🕌',
    description: '',
    theme_id: 'islamic',
  });

  // Mobile Drawer Navigation State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Guide Interactive Modal State
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'SOAL' | 'KATEGORI' | 'ROOMS' | 'PLAYERS'>('SOAL');
  const [guideSubTab, setGuideSubTab] = useState<number>(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Mounted state for SSR Hydration sync
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const checkAdminSession = async () => {
      const p = await ProfileService.fetchProfileFromServer();
      if (p && p.role === 'admin') {
        setIsAuthenticated(true);
        loadQuestions();
      }
    };
    checkAdminSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMessage('');
    setAuthLoading(true);

    try {
      await AuthService.signInWithUsername(adminUsername, adminPassword);
      const p = await ProfileService.fetchProfileFromServer();

      if (p && p.role === 'admin') {
        setIsAuthenticated(true);
        setAuthErrorMessage('');
        loadQuestions();
      } else {
        await AuthService.signOut();
        ProfileService.clearLocalProfile();
        setAuthErrorMessage('Akses ditolak: Akun Anda bukan merupakan Admin KKN.');
      }
    } catch (err: any) {
      let msg = err.message || 'Gagal masuk ke panel admin.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Username atau kata sandi admin salah. Silakan coba lagi.';
      }
      setAuthErrorMessage(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Bulk Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const loadQuestions = async () => {
    setLoading(true);
    GameService.clearLegacyLocalCache();
    const data = await GameService.getAllQuestionsAdmin();
    setQuestions(data);
    await loadCategories();
    await loadPlayers();
    await loadAdminRooms();
    setLoading(false);
  };

  const handleSeedQuestions = async () => {
    if (confirm('Apakah Anda ingin menyinkronkan 15 soal awal ke database Supabase agar bisa diedit, dihapus, dan dipakai secara permanen?')) {
      setLoading(true);
      const res = await GameService.seedInitialQuestionsToSupabase();
      if (res.error) {
        alert(`Gagal menyinkronkan soal: ${res.error}`);
      } else {
        setMessage(`Berhasil menyinkronkan ${res.count} soal awal ke Supabase!`);
        await loadQuestions();
      }
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedQuestionIds.length} soal terpilih secara permanen?`)) {
      try {
        await GameService.deleteQuestionsBatch(selectedQuestionIds);
        setSelectedQuestionIds([]);
        await loadQuestions();
        setMessage(`Berhasil menghapus ${selectedQuestionIds.length} soal terpilih secara permanen!`);
      } catch (err: any) {
        alert(`Error saat menghapus soal: ${err.message}`);
      }
    }
  };

  const handleToggleSelectAll = () => {
    const visibleQuestions = questions.filter((q) => {
      if (questionThemeFilter !== 'ALL' && (q.theme_id || 'islamic') !== questionThemeFilter) return false;
      return true;
    });

    if (selectedQuestionIds.length >= visibleQuestions.length && visibleQuestions.length > 0) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(visibleQuestions.map((q) => q.id));
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((qid) => qid !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const loadCategories = async () => {
    const cats = await GameService.getCategories();
    setCategories(cats.length > 0 ? cats : INITIAL_CATEGORIES);
  };

  const loadPlayers = async () => {
    const data = await GameService.getAllPlayersAdmin();
    setPlayersList(data);
  };

  const loadAdminRooms = async () => {
    const rooms = await RoomService.getAllRoomsAdmin();
    setAdminRooms(rooms);
  };

  const handleSelectiveResetPoints = async (targetTheme: 'islamic' | 'independence' | 'culture' | 'ALL') => {
    const label =
      targetTheme === 'independence'
        ? 'Poin Wawasan Kemerdekaan 🇲🇨'
        : targetTheme === 'culture'
          ? 'Poin Budaya 🎭'
          : targetTheme === 'islamic'
            ? 'Poin Amal Islami 💚'
            : 'SELURUH Poin & Statistik Pemain 🌐';

    if (confirm(`Apakah Anda yakin ingin MERESET ${label} seluruh pemain?`)) {
      setLoading(true);
      await GameService.resetPlayerPointsByTheme(targetTheme);
      await loadPlayers();
      setMessage(`Berhasil mereset ${label}!`);
      setLoading(false);
    }
  };

  const handleCloseRoomAdmin = async (roomId: string) => {
    if (confirm('Tutup sesi room ini dan tandai sebagai selesai (finished)?')) {
      await RoomService.closeRoomAdmin(roomId);
      await loadAdminRooms();
      setMessage('Sesi room berhasil ditutup (finished).');
    }
  };

  const handleDeleteRoomAdmin = async (roomId: string) => {
    if (confirm('Hapus sesi room ini secara permanen dari database?')) {
      await RoomService.deleteRoomAdmin(roomId);
      await loadAdminRooms();
      setMessage('Sesi room berhasil dihapus.');
    }
  };

  const handleExportQuestions = () => {
    const visibleQuestions = questions.filter((q) => {
      if (questionThemeFilter !== 'ALL' && (q.theme_id || 'islamic') !== questionThemeFilter) return false;
      return true;
    });

    const themeTag = questionThemeFilter === 'ALL' ? 'semua_tema' : questionThemeFilter;
    exportQuestionsToCSV(visibleQuestions, `soal_kuis_kkn_${themeTag}.csv`);
  };

  const getFilteredCategoriesByTheme = (themeId?: string): string[] => {
    if (!themeId) return ['Rukun Islam'];
    const matching = categories
      .filter((c) => !c.theme_id || c.theme_id === themeId)
      .map((c) => c.name);
    const defaults = DEFAULT_THEME_CATEGORIES[themeId] || ['Rukun Islam'];
    const combined = Array.from(new Set([...matching, ...defaults]));
    return combined.length > 0 ? combined : ['Rukun Islam'];
  };

  const handleOpenNewCategoryForm = () => {
    const defaultTheme = categoryThemeFilter !== 'ALL' ? categoryThemeFilter : 'islamic';
    const defaultIcon = defaultTheme === 'independence' ? '🇲🇨' : defaultTheme === 'culture' ? '🎭' : '🕌';
    setEditingCatId(null);
    setEditingCatOldName('');
    setCatFormData({
      name: '',
      icon: defaultIcon,
      description: '',
      theme_id: defaultTheme as any,
    });
    setIsCatFormOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatOldName(cat.name);
    setCatFormData({
      name: cat.name,
      icon: cat.icon || '🕌',
      description: cat.description || '',
      theme_id: cat.theme_id || 'islamic',
    });
    setIsCatFormOpen(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) {
      await GameService.deleteCategory(cat.id, cat.name);
      await loadCategories();
      setMessage(`Kategori "${cat.name}" berhasil dihapus.`);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name.trim()) return;

    try {
      const savedCat = await GameService.saveCategory(
        {
          id: editingCatId || `cat-${Date.now()}`,
          ...catFormData,
        },
        editingCatOldName
      );

      // Optimistically update categories React state immediately!
      setCategories((prevCategories) => {
        const targetId = editingCatId || savedCat.id;
        const targetOldName = (editingCatOldName || '').toLowerCase().trim();
        const idx = prevCategories.findIndex(
          (c) => c.id === targetId || (targetOldName && c.name.toLowerCase().trim() === targetOldName)
        );
        if (idx >= 0) {
          const updated = [...prevCategories];
          updated[idx] = { ...updated[idx], ...savedCat };
          return updated;
        } else {
          return [...prevCategories, savedCat];
        }
      });

      await loadCategories();
      await loadQuestions();
      setIsCatFormOpen(false);
      const wasEditing = !!editingCatId;
      setEditingCatId(null);
      setEditingCatOldName('');
      setMessage(wasEditing ? 'Kategori berhasil diperbarui!' : 'Kategori baru berhasil ditambahkan!');
    } catch (err: any) {
      alert(`Gagal menyimpan kategori: ${err.message}`);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomQuestionSelectionMode === 'manual' && roomSelectedQuestionIds.length === 0) {
      alert('Pilih setidaknya 1 soal untuk dimasukkan ke dalam sesi kuis!');
      return;
    }
    const created = await RoomService.createRoom(
      newRoomTitle || 'Kuis Live Sosialisasi KKN',
      newRoomCategory || 'Campuran',
      10,
      undefined,
      roomQuestionSelectionMode === 'manual' ? roomSelectedQuestionIds : undefined,
      newRoomTheme
    );
    if (created) {
      setActiveHostRoom(created);
      setIsRoomFormOpen(false);
      setMessage(`Sesi Kuis Live Kahoot berhasil dibuat! Kode PIN Proyektor: ${created.room_code}`);
    }
  };

  const handleOpenNewForm = () => {
    setEditingId(null);
    setFormValidationError('');
    setFormData({
      theme_id: '' as any, // Unset initially so admin must select theme!
      category_name: 'Campuran',
      game_type: 'millionaire',
      difficulty: 'medium',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      explanation: '',
      dalil: '',
      ustadz_hint: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setFormValidationError('');

    // Auto-fix category_name if corrupted by shifted CSV columns (e.g. 'A', 'B', 'C', 'D', 'easy')
    let validCat = (q.category_name || 'Campuran').trim();
    const isInvalidCatName = ['A', 'B', 'C', 'D', 'easy', 'medium', 'hard'].includes(validCat);
    if (isInvalidCatName) {
      validCat = 'Campuran';
    }

    // Auto-fix explanation if corrupted
    let validExp = (q.explanation || '').trim();
    if (['easy', 'medium', 'hard'].includes(validExp.toLowerCase())) {
      validExp = 'Penjelasan edukatif kuis.';
    }

    setFormData({
      theme_id: q.theme_id || 'islamic',
      category_name: validCat,
      game_type: q.game_type || 'millionaire',
      difficulty: q.difficulty || 'medium',
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      explanation: validExp,
      dalil: q.dalil || '',
      ustadz_hint: q.ustadz_hint || '',
    });
    setIsFormOpen(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus soal ini secara permanen?')) {
      try {
        await GameService.deleteQuestion(id);
        await loadQuestions();
        setMessage('Soal berhasil dihapus secara permanen.');
      } catch (err: any) {
        alert(`Error saat menghapus soal: ${err.message}`);
      }
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.theme_id || formData.theme_id.trim() === '') {
      setFormValidationError('⚠️ Informasi Tema belum lengkap! Silakan pilih Tema Soal (Islami / Kemerdekaan / Kebudayaan) terlebih dahulu.');
      return;
    }
    setFormValidationError('');

    try {
      const qToSave: Question = {
        ...formData,
        id: editingId || '',
      };

      const saved = await GameService.saveQuestion(qToSave);

      // Optimistically update questions list state immediately
      setQuestions((prevQuestions) => {
        const targetId = editingId || saved.id;
        const idx = prevQuestions.findIndex((q) => q.id === targetId || (targetId && q.id === targetId));
        if (idx >= 0) {
          const updated = [...prevQuestions];
          updated[idx] = { ...updated[idx], ...saved };
          return updated;
        } else {
          return [saved, ...prevQuestions];
        }
      });

      await loadQuestions();
      setIsFormOpen(false);
      const wasEditing = !!editingId;
      setEditingId(null);
      setMessage(wasEditing ? 'Soal berhasil diperbarui!' : 'Soal baru berhasil ditambahkan!');
    } catch (err: any) {
      alert(`Gagal menyimpan soal: ${err.message}`);
    }
  };

  // Smart Universal Import Handlers
  const handleProcessPaste = () => {
    if (!pasteText.trim()) {
      alert('Silakan tempelkan (paste) teks tabel dari Excel/Google Sheets terlebih dahulu.');
      return;
    }
    const results = parseUniversalCSVText(pasteText);
    setParsedPreviewResults(results);
  };

  const handleProcessFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const results = parseUniversalCSVText(text);
        setParsedPreviewResults(results);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = async () => {
    if (!importTargetTheme) {
      setImportValidationError('⚠️ Informasi Tema belum lengkap! Silakan pilih Tema Target Soal terlebih dahulu sebelum meng-import.');
      return;
    }
    setImportValidationError('');

    const validQuestions = parsedPreviewResults.filter((r) => r.isValid).map((r) => ({
      ...r.question,
      theme_id: importTargetTheme as any,
    }));

    if (validQuestions.length === 0) {
      alert('Tidak ada soal valid yang dapat disimpan.');
      return;
    }

    const res = await GameService.saveQuestionsBatch(validQuestions);
    await loadQuestions();
    setIsImportModalOpen(false);
    setParsedPreviewResults([]);
    setPasteText('');

    if (res.errorCount > 0) {
      alert(`⚠️ Peringatan: ${res.count} soal berhasil disimpan ke lokal, tetapi ${res.errorCount} soal mengalami error saat insert ke Supabase DB:\n\n${res.errors.join('\n')}\n\nHarap pastikan skrip dokumen/schema.sql telah dijalankan di Supabase SQL Editor.`);
      setMessage(`Impor selesai (${res.count} tersimpan di DB, ${res.errorCount} gagal di DB Supabase).`);
    } else {
      setMessage(`Berhasil mengimpor ${res.count} soal ke database bertema ${importTargetTheme}!`);
    }
  };

  const handleResetLeaderboard = async () => {
    if (confirm('Apakah Anda yakin ingin mereset papan peringkat leaderboard untuk sesi baru?')) {
      await GameService.resetLeaderboard();
      alert('Papan peringkat leaderboard berhasil direset!');
    }
  };

  const handleAdminLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
      await AuthService.signOut();
      ProfileService.clearLocalProfile();
      setIsAuthenticated(false);
      window.location.reload();
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F7F9F6] text-slate-800 flex items-center justify-center p-4 font-sans select-none" suppressHydrationWarning>
        <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F9F6] text-slate-800 flex items-center justify-center p-4 font-sans select-none" suppressHydrationWarning>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200/80 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-6 text-slate-800"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#2D6A4F] flex items-center justify-center mx-auto mb-2 shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Panel Admin KKN</h2>
            <p className="text-xs text-slate-500 font-medium">Masuk dengan kredensial pengelola Wedomartani</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{authErrorMessage}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Username Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className={`bg-[#2D6A4F] hover:bg-[#1B4332] w-full py-3.5 rounded-xl text-white font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-2 transition ${authLoading ? 'opacity-70 pointer-events-none' : ''
                }`}
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>MASUK PANEL ADMIN</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F7F9F6] text-slate-800 font-sans select-none overflow-hidden" style={{ backgroundColor: '#F7F9F6' }} suppressHydrationWarning>
      {/* LEFT SIDEBAR NAVIGATION (DESKTOP) */}
      <aside className="w-64 h-full bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between hidden lg:flex flex-shrink-0 z-30 shadow-xs overflow-y-auto">
        <div className="space-y-6">
          {/* Brand & Status Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#2D6A4F] flex items-center justify-center font-black text-xl shadow-2xs">
                📖
              </div>
              <div>
                <h1 className="text-base font-black text-[#1B5E20] leading-tight">
                  Admin KKN
                </h1>
                <p className="text-[11px] font-semibold text-slate-500">Panel Pengelola Kuis</p>
              </div>
            </div>

            <a href="/" className="inline-flex items-center gap-1.5 text-[11px] text-[#2D6A4F] font-bold hover:underline transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke App Game
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setAdminTab('QUESTIONS')}
              className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition cursor-pointer ${adminTab === 'QUESTIONS'
                ? 'bg-[#E8F5E9] text-[#1B5E20] shadow-2xs border border-[#C8E6C9]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-bold'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📚</span>
                <span>Bank Soal Kuis</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-black border border-slate-200">
                {questions.length}
              </span>
            </button>

            <button
              onClick={() => setAdminTab('CATEGORIES')}
              className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition cursor-pointer ${adminTab === 'CATEGORIES'
                ? 'bg-[#FEF3C7] text-[#92400E] shadow-2xs border border-[#FDE68A]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-bold'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🏷️</span>
                <span>Kelola Kategori</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-black border border-slate-200">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => {
                setAdminTab('ROOMS');
                loadAdminRooms();
              }}
              className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition cursor-pointer ${adminTab === 'ROOMS'
                ? 'bg-[#DBEAFE] text-[#1E40AF] shadow-2xs border border-[#BFDBFE]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-bold'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎮</span>
                <span>Sesi Room Live</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-black border border-slate-200">
                {adminRooms.length}
              </span>
            </button>

            <button
              onClick={() => {
                setAdminTab('PLAYERS');
                loadPlayers();
              }}
              className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition cursor-pointer ${adminTab === 'PLAYERS'
                ? 'bg-[#F3E8FF] text-[#6B21A8] shadow-2xs border border-[#E9D5FF]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-bold'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">👥</span>
                <span>Pemain & Skor</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-black border border-slate-200">
                {playersList.length}
              </span>
            </button>

            <button
              onClick={() => setAdminTab('MATERI')}
              className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition cursor-pointer ${adminTab === 'MATERI'
                ? 'bg-[#E0F2F1] text-[#00796B] shadow-2xs border border-[#B2DFDB]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-bold'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📖</span>
                <span>Buku & Materi</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-black border border-slate-200">
                Modul
              </span>
            </button>
          </nav>

          {/* Guide Card Box with Mascot Graphic */}
          <div className="p-4 bg-[#F4F9F2] rounded-2xl border border-[#D0E8CB] text-center space-y-2 relative overflow-hidden">
            <img
              src="/image/tanyaustadz.png"
              alt="Panduan Admin"
              className="w-14 h-14 object-contain mx-auto drop-shadow-xs"
            />
            <div>
              <p className="text-xs font-black text-[#1B5E20]">Panduan Panel Admin</p>
              <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">Petunjuk penggunaan lengkap 4 modul kuis.</p>
            </div>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="w-full py-2 rounded-xl bg-[#2D6A4F] text-white text-[11px] font-extrabold hover:bg-[#1B4332] transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>📖 Buka Panduan Lengkap</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white font-black text-xs flex items-center justify-center shadow-2xs">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-slate-800 truncate">Admin KKN</p>
              <p className="text-[10px] font-semibold text-slate-500 truncate">Wedomartani</p>
            </div>
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SLIDE-OVER SIDEBAR DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex lg:hidden">
          <div className="w-72 h-full bg-white p-5 flex flex-col justify-between shadow-2xl overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#2D6A4F] flex items-center justify-center font-black text-lg shadow-2xs">
                    📖
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-[#1B5E20]">Admin KKN</h1>
                    <p className="text-[10px] text-slate-500 font-semibold">Panel Pengelola</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 bg-slate-100 rounded-xl text-slate-600 font-black text-xs"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => { setAdminTab('QUESTIONS'); setIsMobileSidebarOpen(false); }}
                  className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between ${adminTab === 'QUESTIONS' ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]' : 'text-slate-600 bg-slate-50'}`}
                >
                  <span>📚 Bank Soal Kuis</span>
                  <span className="px-2 py-0.5 bg-white rounded-full text-[10px] border border-slate-200">{questions.length}</span>
                </button>
                <button
                  onClick={() => { setAdminTab('CATEGORIES'); setIsMobileSidebarOpen(false); }}
                  className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between ${adminTab === 'CATEGORIES' ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' : 'text-slate-600 bg-slate-50'}`}
                >
                  <span>🏷️ Kelola Kategori</span>
                  <span className="px-2 py-0.5 bg-white rounded-full text-[10px] border border-slate-200">{categories.length}</span>
                </button>
                <button
                  onClick={() => { setAdminTab('ROOMS'); loadAdminRooms(); setIsMobileSidebarOpen(false); }}
                  className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between ${adminTab === 'ROOMS' ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]' : 'text-slate-600 bg-slate-50'}`}
                >
                  <span>🎮 Sesi Room Live</span>
                  <span className="px-2 py-0.5 bg-white rounded-full text-[10px] border border-slate-200">{adminRooms.length}</span>
                </button>
                <button
                  onClick={() => { setAdminTab('PLAYERS'); loadPlayers(); setIsMobileSidebarOpen(false); }}
                  className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between ${adminTab === 'PLAYERS' ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]' : 'text-slate-600 bg-slate-50'}`}
                >
                  <span>👥 Pemain & Skor</span>
                  <span className="px-2 py-0.5 bg-white rounded-full text-[10px] border border-slate-200">{playersList.length}</span>
                </button>
                <button
                  onClick={() => { setAdminTab('MATERI'); setIsMobileSidebarOpen(false); }}
                  className={`w-full px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between ${adminTab === 'MATERI' ? 'bg-[#E0F2F1] text-[#00796B] border border-[#B2DFDB]' : 'text-slate-600 bg-slate-50'}`}
                >
                  <span>📖 Buku & Materi</span>
                  <span className="px-2 py-0.5 bg-white rounded-full text-[10px] border border-slate-200">Modul</span>
                </button>
              </nav>
            </div>

            <button
              onClick={handleAdminLogout}
              className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 mt-6"
            >
              <Lock className="w-4 h-4" /> Keluar Sesi
            </button>
          </div>
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto p-3 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0 bg-[#F7F9F6] custom-scrollbar" style={{ backgroundColor: '#F7F9F6' }}>
        {/* MOBILE TOP NAV (Visible only on small screens) */}
        <div className="block lg:hidden space-y-3 bg-[#FFFDF3] p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="px-3 py-2 bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <span>☰ Menu</span>
              </button>
              <h2 className="text-base font-black text-slate-900">Admin KKN</h2>
            </div>
            <button
              onClick={handleAdminLogout}
              className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
            <button
              onClick={() => setAdminTab('QUESTIONS')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${adminTab === 'QUESTIONS' ? 'bg-[#2D6A4F] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              📚 Soal ({questions.length})
            </button>
            <button
              onClick={() => setAdminTab('CATEGORIES')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${adminTab === 'CATEGORIES' ? 'bg-[#D97706] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              🏷️ Kategori ({categories.length})
            </button>
            <button
              onClick={() => { setAdminTab('ROOMS'); loadAdminRooms(); }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${adminTab === 'ROOMS' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              🎮 Room Live ({adminRooms.length})
            </button>
            <button
              onClick={() => { setAdminTab('PLAYERS'); loadPlayers(); }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${adminTab === 'PLAYERS' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              👥 Pemain ({playersList.length})
            </button>
            <button
              onClick={() => setAdminTab('MATERI')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${adminTab === 'MATERI' ? 'bg-[#00796B] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              📖 Materi
            </button>
          </div>
        </div>

        {/* DESKTOP HEADER & QUICK ACTIONS BAR WITH MASCOT */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <img
              src="/image/mascot/salam.png"
              alt="Mascot Greeting"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md hidden sm:block pointer-events-none flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-emerald-50 text-[#1B5E20] border border-[#C8E6C9] rounded-full font-black text-[11px] flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                  Online
                </span>
                <span className="text-xs font-bold text-slate-400">• Panel Pengelola</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Assalamu'alaikum, Admin KKN!
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {adminTab === 'QUESTIONS' && 'Kelola, tambah, edit, dan hapus soal kuis untuk peserta.'}
                {adminTab === 'CATEGORIES' && 'Atur topik kategori dan ikon emoji sesuai masing-masing tema.'}
                {adminTab === 'ROOMS' && 'Buat dan jalankan sesi kuis live bersama peserta dari HP/Device.'}
                {adminTab === 'PLAYERS' && 'Pantau perolehan Poin Amal, Wawasan, Budaya, dan akumulasi statistik.'}
                {adminTab === 'MATERI' && 'Kelola bab modul belajar & halaman buku digital untuk anak-anak.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 z-10">
            {/* Google Sheets Template */}
            <a
              href="https://docs.google.com/spreadsheets/d/1-M0P2G3BJxoJtsYjgMrwxS4Gbsk6AFBGlLmKRDftYds/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Buka Template Kuis di Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Download CSV Template */}
            <a
              href="/template_soal.csv"
              download="template_soal_kkn.csv"
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Unduh Berkas Template CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Download CSV</span>
            </a>

            {/* Export Questions CSV */}
            <button
              onClick={handleExportQuestions}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Unduh seluruh atau soal hasil filter ke file CSV"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Ekspor (CSV)</span>
            </button>

            {/* Smart Import Button */}
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setParsedPreviewResults([]);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Impor (CSV)</span>
            </button>

            {/* Sync Initial Questions Button */}
            <button
              onClick={handleSeedQuestions}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Masukkan 15 soal awal ke database Supabase agar dapat diedit/dihapus"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Sync 15 Soal</span>
            </button>

            {/* Add Action Button per Tab */}
            {adminTab === 'QUESTIONS' ? (
              <button
                onClick={handleOpenNewForm}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Soal Baru</span>
              </button>
            ) : adminTab === 'CATEGORIES' ? (
              <button
                onClick={handleOpenNewCategoryForm}
                className="bg-[#D97706] hover:bg-[#B45309] px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori Baru</span>
              </button>
            ) : adminTab === 'ROOMS' ? (
              <button
                onClick={() => setIsRoomFormOpen(true)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Room Live</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* DEDICATED TAILORED KPI CARD PER SECTION */}
        {adminTab === 'QUESTIONS' ? (
          /* Card Bank Soal */
          <div className="p-5 sm:p-6 bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl shadow-xs relative overflow-hidden flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-black flex-shrink-0 shadow-2xs">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#15803D] tracking-wider">TOTAL SOAL TERSEDIA</p>
                <div className="flex items-baseline gap-2 my-0.5">
                  <h3 className="text-3xl sm:text-4xl font-black text-[#14532D]">{questions.length}</h3>
                  <span className="text-xs sm:text-sm text-[#166534] font-bold">Soal Siap Dimainkan</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-extrabold text-slate-600 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#166534] border border-[#BBF7D0]">🕌 Islami ({questions.filter(q => (q.theme_id || 'islamic') === 'islamic').length})</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#991B1B] border border-[#FECDD3]">🇲🇨 Kemerdekaan ({questions.filter(q => q.theme_id === 'independence').length})</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#92400E] border border-[#FDE68A]">🎭 Kebudayaan ({questions.filter(q => q.theme_id === 'culture').length})</span>
                </div>
              </div>
            </div>

            <img
              src="/image/mascot/quran.png"
              alt="Mascot Soal"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md pointer-events-none z-10 flex-shrink-0 opacity-90 hidden sm:block"
            />
          </div>
        ) : adminTab === 'CATEGORIES' ? (
          /* Card Kategori */
          <div className="p-5 sm:p-6 bg-[#FFFBEB] border border-[#FEF3C7] rounded-3xl shadow-xs relative overflow-hidden flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-black flex-shrink-0 shadow-2xs">
                <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#B45309] tracking-wider">KATEGORI KUIS AKTIF</p>
                <div className="flex items-baseline gap-2 my-0.5">
                  <h3 className="text-3xl sm:text-4xl font-black text-[#78350F]">{categories.length}</h3>
                  <span className="text-xs sm:text-sm text-[#92400E] font-bold">Kategori Terdaftar</span>
                </div>
                <p className="text-xs text-[#B45309] font-semibold mt-1">Tersebar di 3 tema kuis (Islami 🕌, Kemerdekaan 🇲🇨, & Kebudayaan 🎭)</p>
              </div>
            </div>

            <img
              src="/image/mascot/angklungbudaya.png"
              alt="Mascot Kategori"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md pointer-events-none z-10 flex-shrink-0 opacity-90 hidden sm:block"
            />
          </div>
        ) : adminTab === 'ROOMS' ? (
          /* Card Room Live */
          <div className="p-5 sm:p-6 bg-[#EFF6FF] border border-[#DBEAFE] rounded-3xl shadow-xs relative overflow-hidden flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-black flex-shrink-0 shadow-2xs">
                <Radio className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#1D4ED8] tracking-wider">SESI ROOM LIVE PROYEKTOR</p>
                <div className="flex items-baseline gap-2 my-0.5">
                  <h3 className="text-3xl sm:text-4xl font-black text-[#1E40AF]">{adminRooms.length}</h3>
                  <span className="text-xs sm:text-sm text-[#1E3A8A] font-bold">Sesi Pernah Dibuat</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-extrabold">
                  <span className="text-[#15803D] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 {adminRooms.filter(r => r.status !== 'finished').length} Aktif / Berjalan</span>
                  <span className="text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">🔴 {adminRooms.filter(r => r.status === 'finished').length} Selesai</span>
                </div>
              </div>
            </div>

            <img
              src="/image/mascot/banggamerdeka.png"
              alt="Mascot Room"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md pointer-events-none z-10 flex-shrink-0 opacity-90 hidden sm:block"
            />
          </div>
        ) : (
          /* Card Pemain & Skor */
          <div className="p-5 sm:p-6 bg-[#F5F3FF] border border-[#DDD6FE] rounded-3xl shadow-xs relative overflow-hidden flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#DDD6FE] text-[#7C3AED] flex items-center justify-center font-black flex-shrink-0 shadow-2xs">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#6D28D9] tracking-wider">PEMAIN TERDAFTAR</p>
                <div className="flex items-baseline gap-2 my-0.5">
                  <h3 className="text-3xl sm:text-4xl font-black text-[#5B21B6]">{playersList.length}</h3>
                  <span className="text-xs sm:text-sm text-[#4C1D95] font-bold">Akun Terkoneksi</span>
                </div>
                <p className="text-xs text-[#6D28D9] font-semibold mt-1">Terhubung langsung dengan akumulasi Poin Amal, Wawasan, Budaya, & Leaderboard Utama</p>
              </div>
            </div>

            <img
              src="/image/mascot/read.png"
              alt="Mascot Pemain"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md pointer-events-none z-10 flex-shrink-0 opacity-90 hidden sm:block"
            />
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {adminTab === 'QUESTIONS' ? (
          <>
            {/* CSV Helper Info Banner with Mascot */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl text-xs shadow-2xs flex items-center justify-between gap-4 relative overflow-hidden">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 font-black text-[#1B5E20]">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Panduan Impor Soal Massal (CSV / Excel):</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Panitia KKN dapat mengunduh berkas contoh via tombol <strong className="text-emerald-700">Download CSV</strong> atau membuka <a href="https://docs.google.com/spreadsheets/d/1-M0P2G3BJxoJtsYjgMrwxS4Gbsk6AFBGlLmKRDftYds/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-extrabold underline inline-flex items-center gap-1">Google Sheets Template <ExternalLink className="w-3 h-3 inline" /></a> untuk melihat format soal. Setelah diisi, simpan/copas dan tekan tombol <strong className="text-emerald-700">Impor (CSV)</strong>.
                </p>
                <div className="text-[11px] text-slate-700 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar">
                  Urutan Kolom CSV: theme_id, category_name, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, dalil, ustadz_hint
                </div>
              </div>
              <img
                src="/image/mascot/ok.png"
                alt="Mascot CSV Guide"
                className="w-20 h-20 object-contain hidden md:block flex-shrink-0 drop-shadow-xs"
              />
            </div>

            {/* Modal Form Tambah/Edit Soal */}
            {isFormOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-slate-800">
                <h3 className="text-lg font-black text-slate-900">{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>

                <form onSubmit={handleSaveQuestion} className="space-y-4">
                  {formValidationError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{formValidationError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                        <span>Tema Soal</span>
                        <span className="text-rose-600 font-bold">*Wajib</span>
                      </label>
                      <select
                        value={formData.theme_id || ''}
                        onChange={(e) => {
                          const newTheme = e.target.value as any;
                          const themeCats = categories.filter((c) => (c.theme_id || 'islamic') === newTheme);
                          const defaultCat = themeCats[0]?.name || 'Campuran';
                          setFormData({ ...formData, theme_id: newTheme, category_name: defaultCat });
                          setFormValidationError('');
                        }}
                        className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-extrabold transition cursor-pointer ${!formData.theme_id
                          ? 'border-rose-300 text-rose-700 bg-rose-50'
                          : formData.theme_id === 'independence'
                            ? 'border-rose-300 text-rose-800'
                            : formData.theme_id === 'culture'
                              ? 'border-amber-300 text-amber-800'
                              : 'border-emerald-300 text-emerald-800'
                          }`}
                      >
                        <option value="" disabled>-- Pilih Tema --</option>
                        <option value="islamic">🕌 Mode Islami</option>
                        <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                        <option value="culture">🎭 Mode Kebudayaan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Kategori (Sesuai Tema)</label>
                      <select
                        value={formData.category_name}
                        onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                      >
                        {getFilteredCategoriesByTheme(formData.theme_id).map((catName) => (
                          <option key={catName} value={catName}>
                            {catName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Tingkat Kesulitan</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                      >
                        <option value="easy">Mudah (Easy)</option>
                        <option value="medium">Sedang (Medium)</option>
                        <option value="hard">Sulit (Hard)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Teks Pertanyaan</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.question_text}
                      onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                      <div key={opt}>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">Opsi ({opt.toUpperCase()})</label>
                        <input
                          type="text"
                          required
                          value={formData[`option_${opt}` as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Jawaban Benar</label>
                    <select
                      value={formData.correct_option}
                      onChange={(e) => setFormData({ ...formData, correct_option: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Penjelasan Edukatif</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.explanation}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Dalil / Referensi (Opsional)</label>
                    <input
                      type="text"
                      value={formData.dalil}
                      onChange={(e) => setFormData({ ...formData, dalil: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingId(null);
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-[#2D6A4F] hover:bg-[#1B4332] px-6 py-2 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                    >
                      <Save className="w-4 h-4" /> {editingId ? 'Simpan Perubahan' : 'Simpan Permanen'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Filter Toolbar & Real-Time Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Filter Tema:</span>
                <button
                  onClick={() => setQuestionThemeFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${questionThemeFilter === 'ALL'
                    ? 'bg-[#2D6A4F] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  Semua Soal ({questions.length})
                </button>
                <button
                  onClick={() => setQuestionThemeFilter('islamic')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${questionThemeFilter === 'islamic'
                    ? 'bg-[#1B5E20] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  🕌 Aqidah & Islami ({questions.filter((q) => (q.theme_id || 'islamic') === 'islamic').length})
                </button>
                <button
                  onClick={() => setQuestionThemeFilter('independence')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${questionThemeFilter === 'independence'
                    ? 'bg-[#991B1B] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  🇲🇨 Kemerdekaan ({questions.filter((q) => q.theme_id === 'independence').length})
                </button>
                <button
                  onClick={() => setQuestionThemeFilter('culture')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${questionThemeFilter === 'culture'
                    ? 'bg-[#B45309] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  🎭 Kebudayaan ({questions.filter((q) => q.theme_id === 'culture').length})
                </button>
              </div>

              {/* Search Bar Input */}
              <div className="relative min-w-[220px] flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari soal, kata kunci, atau dalil..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Question List Table */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-900">Bank Soal Terdaftar ({questions.length} Soal)</h3>
                  {selectedQuestionIds.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer animate-pulse border border-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus ({selectedQuestionIds.length}) Soal Terpilih</span>
                    </button>
                  )}
                </div>
                <button onClick={loadQuestions} className="text-xs text-[#2D6A4F] font-bold flex items-center gap-1 hover:underline">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Data
                </button>
              </div>

              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#FAFBF9] text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={handleToggleSelectAll}
                        checked={
                          questions.filter((q) => {
                            const matchTheme = questionThemeFilter === 'ALL' || (q.theme_id || 'islamic') === questionThemeFilter;
                            if (!matchTheme) return false;
                            if (searchQuery.trim()) {
                              const qLower = searchQuery.toLowerCase();
                              return q.question_text.toLowerCase().includes(qLower) || (q.category_name || '').toLowerCase().includes(qLower);
                            }
                            return true;
                          }).length > 0 &&
                          selectedQuestionIds.length >=
                          questions.filter((q) => {
                            const matchTheme = questionThemeFilter === 'ALL' || (q.theme_id || 'islamic') === questionThemeFilter;
                            if (!matchTheme) return false;
                            if (searchQuery.trim()) {
                              const qLower = searchQuery.toLowerCase();
                              return q.question_text.toLowerCase().includes(qLower) || (q.category_name || '').toLowerCase().includes(qLower);
                            }
                            return true;
                          }).length
                        }
                        className="w-4 h-4 accent-[#2D6A4F] cursor-pointer rounded"
                      />
                    </th>
                    <th className="p-3">No</th>
                    <th className="p-3">Pertanyaan</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Tingkat</th>
                    <th className="p-3">Tema</th>
                    <th className="p-3">Kunci</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions
                    .filter((q) => {
                      const matchTheme = questionThemeFilter === 'ALL' || (q.theme_id || 'islamic') === questionThemeFilter;
                      if (!matchTheme) return false;
                      if (searchQuery.trim()) {
                        const qLower = searchQuery.toLowerCase();
                        return q.question_text.toLowerCase().includes(qLower) || (q.category_name || '').toLowerCase().includes(qLower);
                      }
                      return true;
                    })
                    .map((q, idx) => (
                      <tr key={q.id || idx} className={`hover:bg-[#F4F7F3] transition ${selectedQuestionIds.includes(q.id) ? 'bg-emerald-50/60' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(q.id)}
                            onChange={() => handleToggleSelectQuestion(q.id)}
                            className="w-4 h-4 accent-[#2D6A4F] cursor-pointer rounded"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 max-w-md">
                          <p className="font-extrabold text-slate-900 leading-snug">{q.question_text}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span>A. {q.option_a}</span>
                            <span>B. {q.option_b}</span>
                            <span>C. {q.option_c}</span>
                            <span>D. {q.option_d}</span>
                          </div>
                          <p className="text-[10px] text-[#2D6A4F] font-black mt-0.5">Kunci: {q.correct_option}</p>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] font-black text-xs inline-flex items-center gap-1">
                            🏷️ {q.category_name || 'Campuran'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black inline-block ${q.difficulty === 'easy'
                              ? 'bg-[#E8F5E9] text-[#2E7D32]'
                              : q.difficulty === 'hard'
                                ? 'bg-[#FFEBEE] text-[#C62828]'
                                : 'bg-[#FFF8E1] text-[#F57F17]'
                              }`}
                          >
                            {q.difficulty === 'easy' ? 'Mudah' : q.difficulty === 'hard' ? 'Sulit' : 'Sedang'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${q.theme_id === 'independence'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : q.theme_id === 'culture'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                          >
                            {q.theme_id === 'independence' ? '🇮🇩 Kemerdekaan' : q.theme_id === 'culture' ? '🎭 Kebudayaan' : '🕌 Islami'}
                          </span>
                        </td>
                        <td className="p-3 font-black text-[#2D6A4F] text-sm">{q.correct_option}</td>
                        <td className="p-3 text-right space-x-1.5">
                          <button onClick={() => handleEdit(q)} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-[#2D6A4F] border border-emerald-200 rounded-xl cursor-pointer transition shadow-2xs">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(q.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer transition shadow-2xs">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        ) : adminTab === 'CATEGORIES' ? (
          <>
            {/* Modal Form Tambah/Edit Kategori */}
            {isCatFormOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-slate-800">
                <h3 className="text-lg font-black text-slate-900">{editingCatId ? 'Edit Kategori Kuis' : 'Tambah Kategori Baru'}</h3>

                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Tema Kategori</label>
                      <select
                        value={catFormData.theme_id || 'islamic'}
                        onChange={(e) => setCatFormData({ ...catFormData, theme_id: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="islamic">🕌 Mode Islami</option>
                        <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                        <option value="culture">🎭 Mode Kebudayaan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Ikon Emoji</label>
                      <input
                        type="text"
                        required
                        placeholder="🕌"
                        value={catFormData.icon}
                        onChange={(e) => setCatFormData({ ...catFormData, icon: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg text-slate-800 text-center font-bold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Nama Kategori</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Tajwid & Qira'at"
                        value={catFormData.name}
                        onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      placeholder="Penjelasan singkat mengenai materi kategori..."
                      value={catFormData.description}
                      onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCatFormOpen(false);
                        setEditingCatId(null);
                        setEditingCatOldName('');
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-[#D97706] hover:bg-[#B45309] px-6 py-2 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                    >
                      <Save className="w-4 h-4" /> {editingCatId ? 'Simpan Perubahan' : 'Simpan Kategori'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Category Cards Grid with Theme Filter */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Daftar Kategori Kuis Terdaftar ({categories.length})</h3>
                  <p className="text-xs text-slate-500 font-medium">Kategori ini dikelompokkan secara rapi berdasarkan 3 Tema Kuis.</p>
                </div>
                <button onClick={loadCategories} className="text-xs text-amber-700 font-bold flex items-center gap-1 hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" /> Reload Kategori
                </button>
              </div>

              {/* THEME FILTER PILLS FOR CATEGORIES */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                <button
                  onClick={() => setCategoryThemeFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer whitespace-nowrap ${categoryThemeFilter === 'ALL'
                    ? 'bg-[#2D6A4F] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  Semua Tema ({categories.length})
                </button>

                <button
                  onClick={() => setCategoryThemeFilter('islamic')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer whitespace-nowrap ${categoryThemeFilter === 'islamic'
                    ? 'bg-[#1B5E20] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  🕌 Mode Islami ({categories.filter((c) => (!c.theme_id || c.theme_id === 'islamic')).length})
                </button>

                <button
                  onClick={() => setCategoryThemeFilter('independence')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer whitespace-nowrap ${categoryThemeFilter === 'independence'
                    ? 'bg-[#991B1B] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  🇲🇨 Mode Kemerdekaan ({categories.filter((c) => c.theme_id === 'independence').length})
                </button>

                <button
                  onClick={() => setCategoryThemeFilter('culture')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer whitespace-nowrap ${categoryThemeFilter === 'culture'
                    ? 'bg-[#B45309] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                    }`}
                >
                  🎭 Mode Kebudayaan ({categories.filter((c) => c.theme_id === 'culture').length})
                </button>
              </div>

              {/* GRID CATEGORY CARDS */}
              {(() => {
                const displayedCategories = categories.filter((c) => {
                  if (categoryThemeFilter === 'ALL') return true;
                  if (categoryThemeFilter === 'islamic') return !c.theme_id || c.theme_id === 'islamic';
                  return c.theme_id === categoryThemeFilter;
                });

                if (displayedCategories.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                      Belum ada kategori terdaftar untuk tema ini. Klik <strong className="text-amber-700">+ Tambah Kategori</strong> di atas!
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {displayedCategories.map((cat) => {
                      const themeId = cat.theme_id || 'islamic';
                      const themeBadgeLabel =
                        themeId === 'independence'
                          ? '🇲🇨 Kemerdekaan'
                          : themeId === 'culture'
                            ? '🎭 Kebudayaan'
                            : '🕌 Islami';
                      const themeBadgeColor =
                        themeId === 'independence'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : themeId === 'culture'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                      return (
                        <div
                          key={cat.id || cat.name}
                          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400/80 transition flex items-start justify-between gap-3 shadow-xs relative"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-3xl p-2 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] flex-shrink-0 shadow-2xs">
                              {cat.icon || '🕌'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-slate-900 text-sm truncate">{cat.name}</h4>
                                <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-md border ${themeBadgeColor}`}>
                                  {themeBadgeLabel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                                {cat.description || 'Tidak ada deskripsi.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="p-2 bg-emerald-50 text-[#2D6A4F] hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer transition shadow-2xs"
                              title="Edit Kategori"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer transition shadow-2xs"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </>
        ) : adminTab === 'ROOMS' ? (
          /* ROOMS MANAGEMENT TAB */
          <div className="space-y-6">
            {/* Modal Create Room Form */}
            {isRoomFormOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-slate-800">
                <h3 className="text-lg font-black text-slate-900">Buat Sesi Room Kuis Live Baru (Kahoot-Style)</h3>

                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Judul Acara / Room Kuis</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kuis Sosialisasi KKN RT 02"
                      value={newRoomTitle}
                      onChange={(e) => setNewRoomTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Tema Room Kuis Live</label>
                      <select
                        value={newRoomTheme}
                        onChange={(e) => {
                          const theme = e.target.value as any;
                          setNewRoomTheme(theme);
                          const themeCats = categories.filter((c) => (c.theme_id || 'islamic') === theme);
                          setNewRoomCategory(themeCats[0]?.name || 'Campuran');
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="islamic">🕌 Mode Islami</option>
                        <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                        <option value="culture">🎭 Mode Kebudayaan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Kategori Soal (Sesuai Tema)</label>
                      <select
                        value={newRoomCategory}
                        onChange={(e) => setNewRoomCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                      >
                        {categories
                          .filter((c) => (c.theme_id || 'islamic') === newRoomTheme)
                          .map((c) => (
                            <option key={c.id || c.name} value={c.name}>
                              {c.icon || '🕌'} {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-2">Metode Pemilihan Soal</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                        <input type="radio" name="selectionMode" value="auto" checked={roomQuestionSelectionMode === 'auto'} onChange={() => setRoomQuestionSelectionMode('auto')} className="accent-[#2D6A4F]" />
                        Acak Otomatis (10 Soal)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                        <input type="radio" name="selectionMode" value="manual" checked={roomQuestionSelectionMode === 'manual'} onChange={() => setRoomQuestionSelectionMode('manual')} className="accent-[#2D6A4F]" />
                        Pilih Manual
                      </label>
                    </div>
                  </div>

                  {roomQuestionSelectionMode === 'manual' && (
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-black text-slate-800">Pilih Soal ({roomSelectedQuestionIds.length} terpilih):</div>
                        <button
                          type="button"
                          onClick={() => {
                            const filteredIds = questions
                              .filter(q => (q.theme_id || 'islamic') === newRoomTheme && (newRoomCategory === 'Campuran' || q.category_name === newRoomCategory))
                              .map(q => q.id || '');
                            if (roomSelectedQuestionIds.length === filteredIds.length && filteredIds.length > 0) {
                              setRoomSelectedQuestionIds([]);
                            } else {
                              setRoomSelectedQuestionIds(filteredIds);
                            }
                          }}
                          className="text-[10px] bg-slate-200 px-2 py-1 rounded-md text-slate-700 font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          Pilih Semua / Batal
                        </button>
                      </div>
                      <div className="space-y-1">
                        {questions
                          .filter(q => (q.theme_id || 'islamic') === newRoomTheme && (newRoomCategory === 'Campuran' || q.category_name === newRoomCategory))
                          .map(q => (
                            <label key={q.id} className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200">
                              <input
                                type="checkbox"
                                className="mt-0.5 accent-[#2D6A4F] cursor-pointer"
                                checked={roomSelectedQuestionIds.includes(q.id || '')}
                                onChange={(e) => {
                                  if (e.target.checked) setRoomSelectedQuestionIds(prev => [...prev, q.id || '']);
                                  else setRoomSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                                }}
                              />
                              <span>{q.question_text} <span className="text-slate-500 font-normal ml-1">({q.difficulty})</span></span>
                            </label>
                          ))}
                        {questions.filter(q => newRoomCategory === 'Campuran' || q.category_name === newRoomCategory).length === 0 && (
                          <div className="text-center text-slate-500 py-4 text-[10px]">Tidak ada soal untuk kategori ini.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRoomFormOpen(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] px-6 py-2 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                    >
                      <Plus className="w-4 h-4" /> Buat & Tampilkan Layar Proyektor
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Live QuRoom Sessions Control Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>🎮 Daftar Sesi Room QuRoom Live ({adminRooms.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Kontrol room kuis proyektor yang sedang aktif atau tutup room yang sudah selesai.
                  </p>
                </div>
                <button
                  onClick={loadAdminRooms}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-slate-200 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Sesi Room</span>
                </button>
              </div>

              {adminRooms.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                  Belum ada sesi room live yang dibuat. Klik <strong className="text-blue-600">Buat Room Live</strong> di atas!
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#FAFBF9] text-slate-500 uppercase text-[10px] font-black">
                        <th className="py-2.5 px-3">PIN Room</th>
                        <th className="py-2.5 px-3">Judul Room</th>
                        <th className="py-2.5 px-3">Tema Kuis</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Soal</th>
                        <th className="py-2.5 px-3 text-right">Aksi Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminRooms.map((r) => {
                        const themeLabel =
                          r.theme_id === 'independence'
                            ? 'Kemerdekaan 🇲🇨'
                            : r.theme_id === 'culture'
                              ? 'Kebudayaan 🎭'
                              : 'Islami 🕌';
                        const themeColor =
                          r.theme_id === 'independence'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : r.theme_id === 'culture'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                        return (
                          <tr key={r.id} className="hover:bg-[#F4F7F3] transition">
                            <td className="py-3 px-3">
                              <span className="bg-amber-100 text-amber-900 font-black px-2.5 py-1 rounded-lg text-xs border border-amber-200">
                                #{r.room_code}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-900 truncate max-w-[200px]">
                              {r.title}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10.5px] border font-black ${themeColor}`}>
                                {themeLabel}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-black ${r.status === 'finished'
                                  ? 'bg-slate-100 text-slate-500'
                                  : 'bg-[#2E7D32] text-white animate-pulse'
                                  }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 font-bold">
                              {r.total_questions || 10}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setActiveHostRoom(r)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-black cursor-pointer shadow-xs transition"
                                >
                                  Host Proyektor
                                </button>
                                {r.status !== 'finished' && (
                                  <button
                                    onClick={() => handleCloseRoomAdmin(r.id)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition border border-slate-200"
                                  >
                                    Tutup Room
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteRoomAdmin(r.id)}
                                  className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition border border-rose-200"
                                  title="Hapus Room"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : adminTab === 'PLAYERS' ? (
          /* PLAYERS MANAGEMENT TAB */
          <div className="space-y-6">
            {/* SELECTIVE RESET ACTION BAR BANNER */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>👥 Kelola Pemain & Papan Peringkat Skor</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Pantau statistik seluruh pemain terdaftar & lakukan reset poin selektif per tema jika dibutuhkan untuk sesi sosialisasi baru.
                  </p>
                </div>

                <button
                  onClick={loadPlayers}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-slate-200 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Pemain</span>
                </button>
              </div>

              {/* SELECTIVE RESET ACTION BUTTONS */}
              <div className="p-4 bg-[#FAFBF9] border border-slate-200/80 rounded-2xl space-y-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  ⚡ Opsi Reset Poin Selektif Per Tema:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelectiveResetPoints('independence')}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reset Poin Wawasan 🇲🇨</span>
                  </button>

                  <button
                    onClick={() => handleSelectiveResetPoints('culture')}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reset Poin Budaya 🎭</span>
                  </button>

                  <button
                    onClick={() => handleSelectiveResetPoints('islamic')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1B5E20] border border-[#C8E6C9] text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reset Poin Amal 💚</span>
                  </button>

                  <button
                    onClick={() => handleSelectiveResetPoints('ALL')}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                    <span>Reset Seluruh Poin & Statistik 🌐</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PLAYERS LIST TABLE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
              <h4 className="text-base font-black text-slate-900">Daftar Pemain Terdaftar ({playersList.length})</h4>

              {playersList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                  Belum ada data pemain terdaftar di database.
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar max-h-[450px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead className="sticky top-0 bg-[#FAFBF9] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black z-10">
                      <tr>
                        <th className="py-2.5 px-3">Pemain</th>
                        <th className="py-2.5 px-3 text-center">Level / XP</th>
                        <th className="py-2.5 px-3 text-right">Poin Amal 💚</th>
                        <th className="py-2.5 px-3 text-right">Poin Wawasan 🇲🇨</th>
                        <th className="py-2.5 px-3 text-right">Poin Budaya 🎭</th>
                        <th className="py-2.5 px-3 text-right">Total Poin Combined</th>
                        <th className="py-2.5 px-3 text-center">Kuis Selesai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {playersList.map((p) => {
                        const amal = p.amal_points || 0;
                        const wawasan = p.wawasan_points || 0;
                        const budaya = p.budaya_points || 0;
                        const totalComb = amal + wawasan + budaya;

                        return (
                          <tr key={p.id} className="hover:bg-[#F4F7F3] transition">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-2xs">
                                  {p.avatar && p.avatar.startsWith('/') ? (
                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm">{p.avatar || '👦🏻'}</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 block leading-tight">{p.name}</span>
                                  <span className="text-[9.5px] text-slate-500 font-semibold block">{p.title_tag || 'Muslim Cerdas'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10.5px] border border-amber-200">
                                Lvl {p.level || 1} ({p.xp || 0} XP)
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-[#15803D]">
                              {amal.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-right font-black text-[#B91C1C]">
                              {wawasan.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-right font-black text-[#B45309]">
                              {budaya.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                              {totalComb.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600">
                              {p.total_games || 0} Kuis
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : adminTab === 'MATERI' ? (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
            <AdminMateriManager />
          </div>
        ) : null}

        {/* SMART UNIVERSAL IMPORT MODAL (PASTE / FILE + PREVIEW TABLE) */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans select-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] flex flex-col text-slate-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#2D6A4F] border border-[#C8E6C9]">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Impor Soal Massal Cerdas (Smart Import)</h3>
                    <p className="text-xs text-slate-500 font-medium">Dukungan Otomatis: Koma (,), Titik Koma (;), TAB Excel (\t), & Copas Langsung</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MANDATORY THEME TARGET SELECTOR FOR BULK IMPORT */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>Pilih Tema Target Import Soal:</span>
                  <span className="text-rose-600 font-bold">*Wajib Pilih</span>
                </label>
                <select
                  value={importTargetTheme}
                  onChange={(e) => {
                    setImportTargetTheme(e.target.value as any);
                    setImportValidationError('');
                  }}
                  className={`w-full p-2.5 bg-white border rounded-xl text-xs font-extrabold transition cursor-pointer ${!importTargetTheme
                    ? 'border-rose-300 text-rose-700 bg-rose-50'
                    : importTargetTheme === 'independence'
                      ? 'border-rose-300 text-rose-800'
                      : importTargetTheme === 'culture'
                        ? 'border-amber-300 text-amber-800'
                        : 'border-emerald-300 text-emerald-800'
                    }`}
                >
                  <option value="" disabled>-- PILIH TEMA TARGET IMPORT --</option>
                  <option value="islamic">🕌 Mode Islami</option>
                  <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                  <option value="culture">🎭 Mode Kebudayaan</option>
                </select>
                {importValidationError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{importValidationError}</span>
                  </div>
                )}
              </div>

              {/* TAB CONTENT & PREVIEW */}
              {parsedPreviewResults.length === 0 ? (
                <>
                  {/* TAB SWITCHER */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <button
                      onClick={() => setImportModalTab('PASTE')}
                      className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${importModalTab === 'PASTE'
                        ? 'bg-[#2D6A4F] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                        }`}
                    >
                      <span>📋 Copas Langsung dari Excel / Google Sheets</span>
                    </button>
                    <button
                      onClick={() => setImportModalTab('FILE')}
                      className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${importModalTab === 'FILE'
                        ? 'bg-[#2D6A4F] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold'
                        }`}
                    >
                      <span>📄 Upload Berkas (.CSV / .TXT / .TSV)</span>
                    </button>
                  </div>

                  {importModalTab === 'PASTE' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 font-medium">
                        Buka tabel di Microsoft Excel atau Google Sheets ➔ Blok baris soal ➔ Tekan <strong className="text-amber-800 font-extrabold">Ctrl + C</strong> ➔ Tempelkan (<strong className="text-amber-800 font-extrabold">Ctrl + V</strong>) di kotak bawah ini:
                      </p>
                      <textarea
                        rows={6}
                        placeholder={`Contoh tempelkan dari Excel:\nislamic,Rukun Islam,easy,Berapakah jumlah Rukun Islam?,4 perkara,5 perkara,6 perkara,7 perkara,B,Rukun Islam ada 5,HR. Bukhari,Syahadat`}
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleProcessPaste}
                          className="bg-[#2D6A4F] hover:bg-[#1B4332] px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-2 transition"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>PRATINJAU & VALIDASI TEKS</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3 bg-slate-50">
                      <Upload className="w-12 h-12 text-[#2D6A4F] mx-auto" />
                      <div>
                        <p className="text-base font-black text-slate-900">Pilih File CSV / TXT / TSV Soal</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">Sistem otomatis membaca format koma (,), titik-koma (;), maupun TAB Excel</p>
                      </div>
                      <label className="bg-[#2D6A4F] hover:bg-[#1B4332] px-8 py-3 rounded-xl text-white font-extrabold text-xs shadow-md cursor-pointer inline-flex items-center gap-2 transition">
                        <span>PILIH BERKAS FILE</span>
                        <input type="file" accept=".csv,.txt,.tsv" onChange={handleProcessFile} className="hidden" />
                      </label>
                    </div>
                  )}
                </>
              ) : (
                /* ENLARGED FULL PREVIEW TABLE VIEW (NO UPLOAD BOX) */
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-800 text-sm font-black">
                        📊 Hasil Pratinjau Dideteksi: {parsedPreviewResults.length} Soal
                      </span>
                      <span className="bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-0.5 rounded-full text-xs font-black border border-[#C8E6C9]">
                        {parsedPreviewResults.filter((r) => r.isValid).length} Valid & Siap Simpan
                      </span>
                    </div>
                    <button
                      onClick={() => setParsedPreviewResults([])}
                      className="text-xs text-slate-500 hover:text-amber-800 flex items-center gap-1 underline cursor-pointer font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Upload File Lain
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-[380px] border border-slate-200 rounded-2xl bg-white custom-scrollbar">
                    <table className="w-full text-left text-[11px] text-slate-700">
                      <thead className="bg-[#FAFBF9] text-slate-500 uppercase text-[9.5px] font-black sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center w-10">No</th>
                          <th className="p-3">Tema</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3 text-center">Kesulitan</th>
                          <th className="p-3">Pertanyaan</th>
                          <th className="p-3 text-center">Kunci</th>
                          <th className="p-3">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreviewResults.map((res, idx) => {
                          const themeKey = res.question.theme_id || importTargetTheme || 'islamic';
                          const themeLabel =
                            themeKey === 'independence'
                              ? '🇲🇨 Kemerdekaan'
                              : themeKey === 'culture'
                                ? '🎭 Kebudayaan'
                                : '🕌 Islami';
                          const themeColor =
                            themeKey === 'independence'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : themeKey === 'culture'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                          return (
                            <tr key={idx} className={res.isValid ? 'hover:bg-[#F4F7F3]' : 'bg-rose-50/60'}>
                              <td className="p-3 font-bold text-center text-slate-500">{idx + 1}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${themeColor}`}>
                                  {themeLabel}
                                </span>
                              </td>
                              <td className="p-3 font-extrabold text-slate-800">{res.question.category_name || 'Campuran'}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9.5px] font-black ${res.question.difficulty === 'easy'
                                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                    : res.question.difficulty === 'hard'
                                      ? 'bg-[#FFEBEE] text-[#C62828]'
                                      : 'bg-[#FFF8E1] text-[#F57F17]'
                                    }`}
                                >
                                  {res.question.difficulty || 'medium'}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-slate-900 max-w-sm">
                                {res.question.question_text || '(Teks Kosong)'}
                              </td>
                              <td className="p-3 font-black text-center text-[#2D6A4F] text-sm">{res.question.correct_option}</td>
                              <td className="p-3">
                                {res.isValid ? (
                                  <span className="text-[#2E7D32] font-black flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Ready
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-bold text-[10px]">
                                    ⚠️ {res.missingFields.join(', ')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setParsedPreviewResults([])}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      Ganti File / Upload Ulang
                    </button>
                    <button
                      onClick={handleConfirmBulkImport}
                      disabled={parsedPreviewResults.filter((r) => r.isValid).length === 0}
                      className={`bg-[#2D6A4F] hover:bg-[#1B4332] px-7 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer transition ${parsedPreviewResults.filter((r) => r.isValid).length === 0 ? 'opacity-50 pointer-events-none' : ''
                        }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>SIMPAN {parsedPreviewResults.filter((r) => r.isValid).length} SOAL KE DATABASE</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* INTERACTIVE ADMIN GUIDE MODAL */}
        {isGuideModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
            >
              {/* MODAL HEADER */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#F4F9F2] via-white to-[#F0FDF4] border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/image/tanyaustadz.png"
                    alt="Panduan Admin"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-xs flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] font-black text-[10px]">
                        📖 DOKUMENTASI RESMI
                      </span>
                      <span className="text-xs font-bold text-slate-400">• Petunjuk Penggunaan</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight mt-0.5">
                      Panduan Lengkap Cara Penggunaan Panel Admin KKN
                    </h3>
                    <p className="text-xs text-slate-500 font-medium hidden sm:block">
                      Petunjuk operasional bertahap (*step-by-step*) untuk mengelola bank soal, kategori, sesi proyektor live, dan statistik pemain.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsGuideModalOpen(false)}
                  className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm flex items-center justify-center transition cursor-pointer flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* 4 MAIN TAB SWITCHERS */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => { setGuideActiveTab('SOAL'); setGuideSubTab(0); }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${guideActiveTab === 'SOAL'
                    ? 'bg-[#2D6A4F] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  <span>📚 1. Bank Soal & Impor CSV</span>
                </button>

                <button
                  onClick={() => { setGuideActiveTab('KATEGORI'); setGuideSubTab(0); }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${guideActiveTab === 'KATEGORI'
                    ? 'bg-[#D97706] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  <span>🏷️ 2. Kelola Kategori</span>
                </button>

                <button
                  onClick={() => { setGuideActiveTab('ROOMS'); setGuideSubTab(0); }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${guideActiveTab === 'ROOMS'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  <span>🎮 3. Sesi Room Live (Proyektor)</span>
                </button>

                <button
                  onClick={() => { setGuideActiveTab('PLAYERS'); setGuideSubTab(0); }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${guideActiveTab === 'PLAYERS'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  <span>👥 4. Pemain & Skor</span>
                </button>
              </div>

              {/* TAB CONTENT CONTAINER */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-slate-50/50">
                {/* TAB 1: BANK SOAL & IMPOR CSV */}
                {guideActiveTab === 'SOAL' && (
                  <div className="space-y-6">
                    {/* Sub-tab pills */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <button
                        onClick={() => setGuideSubTab(0)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 0 ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        📝 Step 1: Tambah Soal Manual
                      </button>
                      <button
                        onClick={() => setGuideSubTab(1)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 1 ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        📊 Step 2: Impor Massal Excel/CSV
                      </button>
                      <button
                        onClick={() => setGuideSubTab(2)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 2 ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        🔍 Step 3: Filter & Cari Soal
                      </button>
                    </div>

                    {guideSubTab === 0 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#1B5E20] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-xs font-black flex items-center justify-center">1</span>
                            Cara Menambahkan Soal Kuis Secara Manual
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li>Klik tombol <strong className="text-[#2D6A4F]">+ Tambah Soal Baru</strong> di pojok kanan atas halaman admin.</li>
                            <li>Pilih <strong>Tema Target</strong>: Mode Islami 🕌, Mode Kemerdekaan 🇲🇨, atau Mode Kebudayaan 🎭.</li>
                            <li>Isi <strong>Nama Kategori</strong> (misal: <em>Aqidah, Pahlawan Nasional, Rumah Adat</em>).</li>
                            <li>Tentukan <strong>Tingkat Kesulitan</strong>: Mudah (Easy), Sedang (Medium), atau Sulit (Hard).</li>
                            <li>Tuliskan teks <strong>Pertanyaan Kuis</strong> beserta 4 Opsi Jawaban (Pilihan A, B, C, D).</li>
                            <li>Pilih <strong>Kunci Jawaban yang Benar</strong> (opsi A / B / C / D).</li>
                            <li><em>(Sangat Direkomendasikan)</em> Sertakan Teks Penjelasan Pembahasan, Ayat Dalil/Hadits, dan Hint Bantuan Ustadz untuk pengalaman belajar peserta.</li>
                            <li>Tekan tombol <strong className="text-[#2D6A4F]">SIMPAN SOAL</strong>.</li>
                          </ol>
                        </div>

                        {/* Screenshot Step 1 */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Screenshots Step 1: Form Tambah & Edit Soal Manual</span>
                            </div>
                            <span className="text-[10px] text-[#2D6A4F] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/tambahsoal1.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-emerald-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/tambahsoal1.png"
                              alt="Panduan Tambah Soal Manual"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {guideSubTab === 1 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#1B5E20] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-xs font-black flex items-center justify-center">2</span>
                            Cara Impor Massal Ratusan Soal dari Excel / Google Sheets
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li>Klik tombol <strong className="text-[#2D6A4F]">Impor (CSV)</strong> di baris aksi cepat.</li>
                            <li>Pilih metode <strong className="text-amber-800">📋 Copas Langsung</strong> dari Excel/Google Sheets.</li>
                            <li>Buka Google Sheets Template atau Microsoft Excel kuis Anda ➔ Blok seluruh baris soal ➔ Tekan <strong className="text-slate-900 font-black">Ctrl + C</strong>.</li>
                            <li>Tempelkan (<strong className="text-slate-900 font-black">Ctrl + V</strong>) pada kotak teks impor ➔ Klik <strong className="text-[#2D6A4F]">PRATINJAU & VALIDASI TEKS</strong>.</li>
                            <li>Sistem akan otomatis mendeteksi kolom soal. Jika status berstatus <span className="text-[#2E7D32] font-black">Ready</span>, klik <strong className="text-[#2D6A4F]">SIMPAN SOAL KE DATABASE</strong>.</li>
                          </ol>
                        </div>

                        {/* Screenshot Step 2 */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Screenshots Step 2: Form & Pratinjau Impor Massal CSV</span>
                            </div>
                            <span className="text-[10px] text-[#2D6A4F] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/tambahsoal2.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-emerald-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/tambahsoal2.png"
                              alt="Panduan Impor Massal CSV"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {guideSubTab === 2 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#1B5E20] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-xs font-black flex items-center justify-center">3</span>
                            Cara Filter, Pencarian, dan Edit/Hapus Soal
                          </h4>
                          <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li><strong>Filter Tema</strong>: Gunakan tombol filter pill (<em>Semua Soal, Aqidah & Islami, Kemerdekaan, Kebudayaan</em>) untuk memilah soal per kuis.</li>
                            <li><strong>Pencarian Kata Kunci</strong>: Ketik kata kunci soal pada kolom pencarian di sebelah kanan.</li>
                            <li><strong>Edit Soal</strong>: Tekan tombol ikon pensil ✏️ pada kolom aksi soal yang ingin diperbarui.</li>
                            <li><strong>Hapus Soal</strong>: Tekan tombol ikon tong sampah 🗑️ untuk menghapus soal.</li>
                          </ul>
                        </div>

                        {/* Screenshot Step 3 */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Screenshots Step 3: Tabel Bank Soal, Filter Tema & Edit/Hapus</span>
                            </div>
                            <span className="text-[10px] text-[#2D6A4F] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/tambahsoal3.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-emerald-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/tambahsoal3.png"
                              alt="Panduan Tabel Bank Soal"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GALERI DESKTOP SCREENSHOTS OVERVIEW */}
                    <div className="p-5 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200 rounded-3xl space-y-4 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                          <span>Galeri Panduan Visual Bank Soal (Langkah 1 - 3)</span>
                        </div>
                        <span className="text-[11px] text-[#2D6A4F] font-bold">Pilih gambar untuk memperbesar</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div
                          onClick={() => { setGuideSubTab(0); setPreviewImageUrl('/image/panduan/desktop/tambahsoal1.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/tambahsoal1.png" alt="Langkah 1" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">1. Form Tambah Soal</p>
                        </div>

                        <div
                          onClick={() => { setGuideSubTab(1); setPreviewImageUrl('/image/panduan/desktop/tambahsoal2.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/tambahsoal2.png" alt="Langkah 2" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">2. Impor Massal CSV</p>
                        </div>

                        <div
                          onClick={() => { setGuideSubTab(2); setPreviewImageUrl('/image/panduan/desktop/tambahsoal3.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/tambahsoal3.png" alt="Langkah 3" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">3. Bank Soal & Filter</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: KELOLA KATEGORI */}
                {guideActiveTab === 'KATEGORI' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <button
                        onClick={() => setGuideSubTab(0)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 0 ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        ➕ Step 1: Membuat Kategori Baru
                      </button>
                      <button
                        onClick={() => setGuideSubTab(1)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 1 ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        ✏️ Step 2: Mengatur & Mengedit Kategori
                      </button>
                    </div>

                    {guideSubTab === 0 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#92400E] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-black flex items-center justify-center">1</span>
                            Langkah Menambahkan Kategori Kuis Baru
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li>Pindah ke tab menu <strong>🏷️ Kelola Kategori</strong> di navigasi sebelah kiri.</li>
                            <li>Klik tombol <strong className="text-[#D97706]">+ Tambah Kategori Baru</strong>.</li>
                            <li>Pilih <strong>Tema Kategori</strong> (Islamic Mode / Independence / Culture).</li>
                            <li>Isi <strong>Nama Kategori</strong> (misal: <em>Sejarah Islam, Pakaian Adat, Rumah Adat</em>).</li>
                            <li>Tentukan <strong>Ikon Emoji</strong> (misal: 🕌, 🇮🇩, 🎭, 📜, 🏆) dan deskripsi singkat.</li>
                            <li>Klik <strong className="text-[#D97706]">SIMPAN KATEGORI</strong>.</li>
                          </ol>
                        </div>

                        {/* Screenshot Step 1 Kategori */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Tangkapan Layar Step 1: Form Tambah Kategori & Emoji</span>
                            </div>
                            <span className="text-[10px] text-[#D97706] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/kategori1.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-amber-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/kategori1.png"
                              alt="Panduan Tambah Kategori Baru"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {guideSubTab === 1 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#92400E] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-black flex items-center justify-center">2</span>
                            Mengedit & Mengatur Tampilan Kategori
                          </h4>
                          <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li>Kategori yang telah dibuat akan otomatis mengelompokkan kuis di beranda permainan peserta.</li>
                            <li>Tekan tombol ✏️ Edit Kategori untuk memperbarui emoji atau nama topik kapan saja.</li>
                            <li>Tekan tombol 🗑️ Hapus Kategori untuk menghapus topik yang tidak digunakan.</li>
                          </ul>
                        </div>

                        {/* Screenshot Step 2 Kategori */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Tangkapan Layar Step 2: Form Edit Kategori & Emoji</span>
                            </div>
                            <span className="text-[10px] text-[#D97706] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/kategori2.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-amber-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/kategori2.png"
                              alt="Panduan Edit Kategori Kuis"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GALERI KATEGORI SCREENSHOTS OVERVIEW */}
                    <div className="p-5 bg-gradient-to-r from-amber-50 via-white to-amber-50 border border-amber-200 rounded-3xl space-y-4 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                          <Layers className="w-4 h-4 text-amber-600" />
                          <span>Galeri Panduan Visual Kelola Kategori (Langkah 1 - 2)</span>
                        </div>
                        <span className="text-[11px] text-[#D97706] font-bold">Pilih gambar untuk memperbesar</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div
                          onClick={() => { setGuideSubTab(0); setPreviewImageUrl('/image/panduan/desktop/kategori1.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-amber-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/kategori1.png" alt="Langkah 1 Kategori" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">1. Tambah Kategori Baru</p>
                        </div>

                        <div
                          onClick={() => { setGuideSubTab(1); setPreviewImageUrl('/image/panduan/desktop/kategori2.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-amber-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/kategori2.png" alt="Langkah 2 Kategori" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">2. Edit & Update Kategori</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SESI ROOM LIVE */}
                {guideActiveTab === 'ROOMS' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <button
                        onClick={() => setGuideSubTab(0)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 0 ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        🔑 Step 1: Membuat Kode PIN Room Live
                      </button>
                      <button
                        onClick={() => setGuideSubTab(1)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 1 ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        💻 Step 2: Menayangkan Layar Proyektor (Host)
                      </button>
                      <button
                        onClick={() => setGuideSubTab(2)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 2 ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        🏆 Step 3: Kontrol Live & Leaderboard
                      </button>
                    </div>

                    {guideSubTab === 0 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#1E40AF] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-black flex items-center justify-center">1</span>
                            Cara Membuat Sesi Kuis Live Interaktif
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li>Buka menu <strong>🎮 Sesi Room Live</strong> ➔ Klik <strong className="text-[#2563EB]">+ Buat Room Live</strong>.</li>
                            <li>Isi <strong>Judul Acara / Room Kuis</strong> dan pilih <strong>Tema Room Kuis Live</strong> (Islami / Kemerdekaan / Kebudayaan).</li>
                            <li>Pilih <strong>Kategori Soal</strong> serta <strong>Metode Pemilihan Soal</strong> (Acak 10 Soal atau Pilih Manual).</li>
                            <li>Klik <strong className="text-[#2563EB]">+ Buat & Tampilkan Layar Proyektor</strong>.</li>
                          </ol>
                        </div>

                        {/* Screenshot Step 1 Room */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Tangkapan Layar Step 1: Form Buat Room Live Kuis</span>
                            </div>
                            <span className="text-[10px] text-[#2563EB] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/room1.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-blue-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/room1.png"
                              alt="Panduan Buat Room Live"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {guideSubTab === 1 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#1E40AF] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-black flex items-center justify-center">2</span>
                            Menayangkan Layar Utama / Proyektor (Host View)
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li>Sambungkan layar laptop ke TV / Proyektor Utama di panggung kuis.</li>
                            <li>Layar proyektor akan menampilkan <strong>Kode PIN 6-Digit</strong> (contoh: <code>494 589</code>).</li>
                            <li>Minta peserta membuka web kuis di HP masing-masing ➔ Masukkan PIN 6-digit & nama panggilan.</li>
                            <li>Nama & avatar peserta yang terhubung akan muncul secara realtime di layar tunggu proyektor.</li>
                            <li>Setelah semua peserta bergabung, Host menekan tombol hijau <strong className="text-[#2563EB]">MULAI KUIS SOSIALISASI</strong>.</li>
                          </ol>
                        </div>

                        {/* Screenshot Step 2 Room */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Tangkapan Layar Step 2: Layar Proyektor PIN & Waiting Room</span>
                            </div>
                            <span className="text-[10px] text-[#2563EB] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/room2.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-blue-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/room2.png"
                              alt="Panduan Layar Proyektor Waiting Room"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {guideSubTab === 2 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                          <h4 className="text-sm font-black text-[#1E40AF] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-black flex items-center justify-center">3</span>
                            Alur Jalannya Pertandingan & Leaderboard Pemenang
                          </h4>
                          <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                            <li><strong>Sesi Pertanyaan</strong>: Tampilan soal, timer hitung mundur, & opsi jawaban A/B/C/D live.</li>
                            <li><strong>Sesi Penjelasan & Dalil</strong>: Menampilkan kunci jawaban benar, penjelasan edukatif, dan referensi dalil.</li>
                            <li><strong>Papan Peringkat Sementara</strong>: Menampilkan peringkat skor sementara peserta secara realtime.</li>
                            <li><strong>Selebrasi Podium Juara</strong>: Menampilkan juara 1, 2, dan 3 di akhir soal kuis secara spektakuler.</li>
                          </ul>
                        </div>

                        {/* Screenshot Step 3 Room */}
                        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                              <span>📸 Tangkapan Layar Step 3: Alur Pertandingan, Penjelasan & Leaderboard</span>
                            </div>
                            <span className="text-[10px] text-[#2563EB] font-bold">🔍 Klik gambar untuk memperbesar</span>
                          </div>
                          <div
                            onClick={() => setPreviewImageUrl('/image/panduan/desktop/room3.png')}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-blue-500 transition shadow-xs bg-slate-100"
                          >
                            <img
                              src="/image/panduan/desktop/room3.png"
                              alt="Panduan Alur Pertandingan Room Live"
                              className="w-full h-auto object-cover group-hover:scale-[1.01] transition duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-2">
                              <span>🔍 Klik untuk Perbesar Tangkapan Layar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GALERI ROOM LIVE SCREENSHOTS OVERVIEW */}
                    <div className="p-5 bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 rounded-3xl space-y-4 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-blue-900 font-black text-xs">
                          <Radio className="w-4 h-4 text-blue-600" />
                          <span>Galeri Panduan Visual Room Live & Proyektor (Langkah 1 - 3)</span>
                        </div>
                        <span className="text-[11px] text-[#2563EB] font-bold">Pilih gambar untuk memperbesar</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div
                          onClick={() => { setGuideSubTab(0); setPreviewImageUrl('/image/panduan/desktop/room1.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-blue-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/room1.png" alt="Langkah 1 Room" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">1. Form Buat Room</p>
                        </div>

                        <div
                          onClick={() => { setGuideSubTab(1); setPreviewImageUrl('/image/panduan/desktop/room2.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-blue-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/room2.png" alt="Langkah 2 Room" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">2. Layar Proyektor PIN</p>
                        </div>

                        <div
                          onClick={() => { setGuideSubTab(2); setPreviewImageUrl('/image/panduan/desktop/room3.png'); }}
                          className="bg-white p-2.5 rounded-2xl border border-slate-200 hover:border-blue-500 transition cursor-pointer group shadow-2xs space-y-1.5"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                            <img src="/image/panduan/desktop/room3.png" alt="Langkah 3 Room" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[11px] font-black text-slate-800 text-center">3. Alur Pertandingan & Leaderboard</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: PEMAIN & REKAP SKOR */}
                {guideActiveTab === 'PLAYERS' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <button
                        onClick={() => setGuideSubTab(0)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 0 ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        📊 Step 1: Memantau Akun & Perolehan Poin
                      </button>
                      <button
                        onClick={() => setGuideSubTab(1)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${guideSubTab === 1 ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        🔎 Step 2: Pencarian & Evaluasi Peringkat
                      </button>
                    </div>

                    {guideSubTab === 0 && (
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                        <h4 className="text-sm font-black text-[#6B21A8] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-xs font-black flex items-center justify-center">1</span>
                          Memantau Akun Terdaftar & Akumulasi Skor
                        </h4>
                        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                          <li>Buka menu <strong>👥 Pemain & Skor</strong> pada navigasi sebelah kiri.</li>
                          <li>Lihat daftar nama akun peserta yang telah terdaftar di aplikasi.</li>
                          <li>Pantau rincian poin: <strong>Poin Amal</strong> (Kuis Islami), <strong>Poin Wawasan</strong> (Kuis Kemerdekaan), <strong>Poin Budaya</strong> (Kuis Kebudayaan), serta <strong>Poin Total</strong>.</li>
                        </ol>
                      </div>
                    )}

                    {guideSubTab === 1 && (
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                        <h4 className="text-sm font-black text-[#6B21A8] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-xs font-black flex items-center justify-center">2</span>
                          Pencarian Nama & Evaluasi Peringkat Peserta
                        </h4>
                        <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                          <li>Gunakan kolom pencarian nama peserta untuk mengecek skor individu secara cepat.</li>
                          <li>Data poin ini terhubung langsung dengan Papan Peringkat (Leaderboard Utama) di aplikasi peserta.</li>
                        </ul>
                      </div>
                    )}

                    {/* SCREENSHOT PLACEHOLDER CONTAINER FOR PLAYERS */}
                    <div className="p-4 border-2 border-dashed border-purple-300 rounded-3xl bg-purple-50/60 text-center space-y-3">
                      <div className="flex items-center justify-center gap-2 text-purple-800 font-black text-xs">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>[SCREENSHOT PLACEHOLDER: PEMAIN & REKAP SKOR]</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium max-w-md mx-auto">
                        Gambar screenshot daftar pemain dan perolehan poin total akan ditayangkan di sini.
                      </p>
                      <img
                        src="/image/mascot/read.png"
                        alt="Preview Guide Pemain"
                        className="w-24 h-24 object-contain mx-auto drop-shadow-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>Tim KKN Wedomartani</span>
                  <span>•</span>
                  <span>Dokumentasi Sistem</span>
                </div>
                <button
                  onClick={() => setIsGuideModalOpen(false)}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md cursor-pointer transition"
                >
                  Selesai & Tutup Panduan
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </main>

      {/* FULLSCREEN ADMIN HOST VIEW (PROJECTOR) */}
      {activeHostRoom && (
        <RoomHostView room={activeHostRoom} onClose={() => setActiveHostRoom(null)} />
      )}

      {/* FULLSCREEN GUIDE IMAGE ZOOM LIGHTBOX */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white px-2">
              <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                🔍 Pratinjau Tangkapan Layar Panduan Admin
              </span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 font-black text-sm flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black/40">
              <img
                src={previewImageUrl}
                alt="Pratinjau Screenshot Panduan"
                className="max-h-[83vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
