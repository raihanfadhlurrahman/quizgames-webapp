'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Upload, Download, RefreshCw, ShieldAlert, ArrowLeft, Save, CheckCircle2, FileSpreadsheet, Info, Lock, User, X, ExternalLink } from 'lucide-react';
import { Question, Category, QuizRoom } from '@/types/game';
import { GameService } from '@/lib/gameService';
import { RoomService } from '@/lib/roomService';
import { ProfileService } from '@/lib/profileService';
import { AuthService } from '@/lib/authService';
import { parseUniversalCSVText, ParsedQuestionResult } from '@/lib/csvParser';
import { exportQuestionsToCSV } from '@/lib/csvExporter';
import { INITIAL_QUESTIONS, INITIAL_CATEGORIES } from '@/data/seedQuestions';
import { RoomHostView } from '@/components/RoomHostView';

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

  const [adminTab, setAdminTab] = useState<'QUESTIONS' | 'CATEGORIES' | 'ROOMS' | 'PLAYERS'>('QUESTIONS');
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
  const [catFormData, setCatFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    icon: '🕌',
    description: '',
    theme_id: 'islamic',
  });

  useEffect(() => {
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
    setCatFormData({
      name: cat.name,
      icon: cat.icon || '🕌',
      description: cat.description || '',
      theme_id: cat.theme_id || 'islamic',
    });
    setIsCatFormOpen(true);
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

    await GameService.saveCategory({
      id: editingCatId || `cat-${Date.now()}`,
      ...catFormData,
    });
    await loadCategories();
    setIsCatFormOpen(false);
    setMessage(editingCatId ? 'Kategori berhasil diperbarui!' : 'Kategori baru berhasil ditambahkan!');
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
    if (isInvalidCatName || (validCat !== 'Campuran' && !categories.some(c => c.name === validCat))) {
      validCat = categories[0]?.name || 'Campuran';
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
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus soal ini secara permanen?')) {
      try {
        await GameService.deleteQuestion(id);
        await loadQuestions();
        setMessage('Soal berhasil dihapus secara permanen dari Supabase.');
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

      await GameService.saveQuestion(qToSave);
      await loadQuestions();
      setIsFormOpen(false);
      setMessage(editingId ? 'Soal berhasil diperbarui di Database!' : 'Soal baru berhasil ditambahkan ke Database!');
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

    await GameService.saveQuestionsBatch(validQuestions);
    await loadQuestions();
    setIsImportModalOpen(false);
    setParsedPreviewResults([]);
    setPasteText('');
    setMessage(`Berhasil mengimpor ${validQuestions.length} soal ke database bertema ${importTargetTheme}!`);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-700/50 shadow-2xl text-center"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h2>
          <p className="text-xs text-slate-400 mb-6">Khusus Panitia KKN Wedomartani</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            {authErrorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-xs font-semibold text-red-400">
                {authErrorMessage}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Username Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <span className="font-bold text-xs select-none">@</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className={`emerald-gradient-btn w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-lg cursor-pointer flex items-center justify-center gap-2 transition ${
                authLoading ? 'opacity-70 pointer-events-none' : ''
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
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-700">
          <div>
            <a href="/" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Aplikasi Game
            </a>
            <h1 className="text-2xl md:text-3xl font-extrabold gold-gradient-text">Panel Admin KKN Wedomartani</h1>
            <p className="text-xs text-slate-400">Terhubung ke Supabase Database • Fitur CRUD & Persistence</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Google Sheets Template Link Button */}
            <a
              href="https://docs.google.com/spreadsheets/d/1-M0P2G3BJxoJtsYjgMrwxS4Gbsk6AFBGlLmKRDftYds/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Buka Template Kuis di Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheets Template</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>

            {/* Download Template CSV Button */}
            <a
              href="/template_soal.csv"
              download="template_soal_kkn.csv"
              className="px-3.5 py-2 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-500/40 hover:bg-gold-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Unduh Berkas Template CSV"
            >
              <Download className="w-3.5 h-3.5 text-gold-400" />
              <span>Download File CSV</span>
            </a>

            {/* Export Questions to CSV Button */}
            <button
              onClick={handleExportQuestions}
              className="px-3.5 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Unduh seluruh atau soal hasil filter ke file CSV"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export Soal (CSV)</span>
            </button>

            {/* Smart Import Button */}
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setParsedPreviewResults([]);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg hover:from-emerald-500 hover:to-teal-500 transition flex items-center gap-1.5 cursor-pointer border border-emerald-400"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Impor Soal / Copas Excel</span>
            </button>

            {/* Sync Initial Questions Button */}
            <button
              onClick={handleSeedQuestions}
              className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Masukkan 15 soal awal ke database Supabase agar dapat diedit/dihapus"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Sync 15 Soal</span>
            </button>

            {/* Add Action Button depends on active tab */}
            {adminTab === 'QUESTIONS' ? (
              <button
                onClick={handleOpenNewForm}
                className="emerald-gradient-btn px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Soal</span>
              </button>
            ) : adminTab === 'CATEGORIES' ? (
              <button
                onClick={handleOpenNewCategoryForm}
                className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </button>
            ) : adminTab === 'ROOMS' ? (
              <button
                onClick={() => setIsRoomFormOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 px-4 py-2 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Sesi Room PIN Baru</span>
              </button>
            ) : null}

            {/* Logout Admin Button */}
            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3 flex-wrap">
          <button
            onClick={() => setAdminTab('QUESTIONS')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
              adminTab === 'QUESTIONS'
                ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <span>📚 Bank Soal ({questions.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('CATEGORIES')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
              adminTab === 'CATEGORIES'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <span>🏷️ Kelola Kategori Kuis ({categories.length})</span>
          </button>

          <button
            onClick={() => {
              setAdminTab('ROOMS');
              loadAdminRooms();
            }}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
              adminTab === 'ROOMS'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg border border-yellow-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <span>🎮 Sesi Room Live ({adminRooms.length})</span>
          </button>

          <button
            onClick={() => {
              setAdminTab('PLAYERS');
              loadPlayers();
            }}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
              adminTab === 'PLAYERS'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <span>👥 Kelola Pemain & Skor ({playersList.length})</span>
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {adminTab === 'QUESTIONS' ? (
          <>
            {/* CSV Helper Info Banner */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-gold-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Panduan Impor Soal Massal (CSV / Excel):</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Panitia KKN dapat mengunduh berkas contoh via tombol <strong className="text-gold-300">Download File CSV</strong> atau membuka <a href="https://docs.google.com/spreadsheets/d/1-M0P2G3BJxoJtsYjgMrwxS4Gbsk6AFBGlLmKRDftYds/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold underline inline-flex items-center gap-1">Google Sheets Template <ExternalLink className="w-3 h-3 inline" /></a> untuk melihat format soal. Setelah diisi, simpan/copas dan tekan tombol <strong className="text-emerald-400">Impor Soal</strong>.
              </p>
              <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                Urutan Kolom CSV: theme_id, category_name, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, dalil, ustadz_hint
              </div>
            </div>

            {/* Modal Form Tambah/Edit Soal */}
            {isFormOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold text-gold-400">{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>

                <form onSubmit={handleSaveQuestion} className="space-y-4">
                  {formValidationError && (
                    <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs font-bold text-red-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{formValidationError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-black text-amber-300 mb-1 flex items-center gap-1">
                        <span>Tema Soal</span>
                        <span className="text-red-400 font-bold">*Wajib</span>
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
                        className={`w-full p-2.5 bg-slate-900 border rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          !formData.theme_id
                            ? 'border-red-500 text-red-300 shadow-red-950 shadow-md'
                            : formData.theme_id === 'independence'
                            ? 'border-red-400 text-red-300'
                            : formData.theme_id === 'culture'
                            ? 'border-amber-400 text-amber-300'
                            : 'border-emerald-400 text-emerald-300'
                        }`}
                      >
                        <option value="" disabled>-- Pilih Tema --</option>
                        <option value="islamic">🕌 Mode Islami</option>
                        <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                        <option value="culture">🎭 Mode Kebudayaan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori (Sesuai Tema)</label>
                      <select
                        value={formData.category_name}
                        onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold"
                      >
                        {getFilteredCategoriesByTheme(formData.theme_id).map((catName) => (
                          <option key={catName} value={catName}>
                            {catName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Tingkat Kesulitan</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      >
                        <option value="easy">Mudah (Easy)</option>
                        <option value="medium">Sedang (Medium)</option>
                        <option value="hard">Sulit (Hard)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Teks Pertanyaan</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.question_text}
                      onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                      <div key={opt}>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Opsi ({opt.toUpperCase()})</label>
                        <input
                          type="text"
                          required
                          value={formData[`option_${opt}` as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Jawaban Benar</label>
                    <select
                      value={formData.correct_option}
                      onChange={(e) => setFormData({ ...formData, correct_option: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Penjelasan Edukatif</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.explanation}
                      onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dalil / Referensi (Opsional)</label>
                    <input
                      type="text"
                      value={formData.dalil}
                      onChange={(e) => setFormData({ ...formData, dalil: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="emerald-gradient-btn px-6 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Simpan Permanen
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Filter Tabs for Question Types & Themes */}
            <div className="flex items-center gap-2 pb-1 flex-wrap">
              <span className="text-xs font-bold text-slate-400 mr-1">Filter Tema:</span>
              <button
                onClick={() => setQuestionThemeFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  questionThemeFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-md border border-slate-500'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🌐 Semua Tema ({questions.length})
              </button>
              <button
                onClick={() => setQuestionThemeFilter('islamic')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  questionThemeFilter === 'islamic'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🕌 Islami ({questions.filter((q) => (q.theme_id || 'islamic') === 'islamic').length})
              </button>
              <button
                onClick={() => setQuestionThemeFilter('independence')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  questionThemeFilter === 'independence'
                    ? 'bg-red-600 text-white shadow-md border border-red-400'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🇮🇩 Kemerdekaan ({questions.filter((q) => q.theme_id === 'independence').length})
              </button>
              <button
                onClick={() => setQuestionThemeFilter('culture')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  questionThemeFilter === 'culture'
                    ? 'bg-amber-600 text-white shadow-md border border-amber-400'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🎭 Kebudayaan ({questions.filter((q) => q.theme_id === 'culture').length})
              </button>

            </div>

            {/* Question List Table */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 shadow-xl overflow-x-auto">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">Bank Soal Terdaftar ({questions.length} Soal)</h3>
                  {selectedQuestionIds.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer animate-pulse border border-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus ({selectedQuestionIds.length}) Soal Terpilih</span>
                    </button>
                  )}
                </div>
                <button onClick={loadQuestions} className="text-xs text-emerald-400 flex items-center gap-1 hover:underline">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Data
                </button>
              </div>

              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={handleToggleSelectAll}
                        checked={
                          questions.filter((q) => {
                            const matchTheme = questionThemeFilter === 'ALL' || (q.theme_id || 'islamic') === questionThemeFilter;
                            return matchTheme;
                          }).length > 0 &&
                          selectedQuestionIds.length >=
                            questions.filter((q) => {
                              const matchTheme = questionThemeFilter === 'ALL' || (q.theme_id || 'islamic') === questionThemeFilter;
                              return matchTheme;
                            }).length
                        }
                        className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                      />
                    </th>
                    <th className="p-3">No</th>
                    <th className="p-3">Pertanyaan</th>
                    <th className="p-3">Tema</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Kesulitan</th>
                    <th className="p-3">Kunci</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {questions
                    .filter((q) => {
                      const matchTheme = questionThemeFilter === 'ALL' || (q.theme_id || 'islamic') === questionThemeFilter;
                      return matchTheme;
                    })
                    .map((q, idx) => (
                      <tr key={q.id || idx} className={`hover:bg-slate-900/50 transition ${selectedQuestionIds.includes(q.id) ? 'bg-emerald-950/30' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(q.id)}
                            onChange={() => handleToggleSelectQuestion(q.id)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                          />
                        </td>
                        <td className="p-3 font-bold">{idx + 1}</td>
                        <td className="p-3 max-w-md font-medium text-white">{q.question_text}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              q.theme_id === 'independence'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : q.theme_id === 'culture'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {q.theme_id === 'independence' ? '🇮🇩 Kemerdekaan' : q.theme_id === 'culture' ? '🎭 Kebudayaan' : '🕌 Islami'}
                          </span>
                        </td>
                        <td className="p-3">{q.category_name || 'Campuran'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.difficulty === 'easy'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : q.difficulty === 'hard'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gold-500/20 text-gold-400'
                            }`}
                          >
                            {q.difficulty || 'medium'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-400">{q.correct_option}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => handleEdit(q)} className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg cursor-pointer">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg cursor-pointer">
                          <Trash2 className="w-4 h-4" />
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl border border-amber-700/80 space-y-4">
                <h3 className="text-lg font-bold text-amber-400">{editingCatId ? 'Edit Kategori Kuis' : 'Tambah Kategori Baru'}</h3>

                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1">Tema Kategori</label>
                      <select
                        value={catFormData.theme_id || 'islamic'}
                        onChange={(e) => setCatFormData({ ...catFormData, theme_id: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
                      >
                        <option value="islamic">🕌 Mode Islami</option>
                        <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                        <option value="culture">🎭 Mode Kebudayaan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Ikon Emoji</label>
                      <input
                        type="text"
                        required
                        placeholder="🕌"
                        value={catFormData.icon}
                        onChange={(e) => setCatFormData({ ...catFormData, icon: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-lg text-white text-center"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Kategori</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Tajwid & Qira'at"
                        value={catFormData.name}
                        onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      placeholder="Penjelasan singkat mengenai materi kategori..."
                      value={catFormData.description}
                      onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCatFormOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-500 px-6 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <Save className="w-4 h-4" /> Simpan Kategori
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Category Cards Grid with Theme Filter */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Daftar Kategori Kuis Terdaftar ({categories.length})</h3>
                  <p className="text-xs text-slate-400">Kategori ini dikelompokkan secara rapi berdasarkan 3 Tema Kuis.</p>
                </div>
                <button onClick={loadCategories} className="text-xs text-amber-400 flex items-center gap-1 hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" /> Reload Kategori
                </button>
              </div>

              {/* THEME FILTER PILLS FOR CATEGORIES */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                <button
                  onClick={() => setCategoryThemeFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap ${
                    categoryThemeFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  🌐 Semua Tema ({categories.length})
                </button>

                <button
                  onClick={() => setCategoryThemeFilter('islamic')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap ${
                    categoryThemeFilter === 'islamic'
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  🕌 Mode Islami ({categories.filter((c) => (!c.theme_id || c.theme_id === 'islamic')).length})
                </button>

                <button
                  onClick={() => setCategoryThemeFilter('independence')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap ${
                    categoryThemeFilter === 'independence'
                      ? 'bg-red-600 text-white shadow-md border border-red-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  🇲🇨 Mode Kemerdekaan ({categories.filter((c) => c.theme_id === 'independence').length})
                </button>

                <button
                  onClick={() => setCategoryThemeFilter('culture')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer whitespace-nowrap ${
                    categoryThemeFilter === 'culture'
                      ? 'bg-amber-600 text-white shadow-md border border-amber-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
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
                    <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-800 rounded-2xl">
                      Belum ada kategori terdaftar untuk tema ini. Klik <strong className="text-amber-300">+ Tambah Kategori</strong> di atas!
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
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : themeId === 'culture'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                      return (
                        <div
                          key={cat.id || cat.name}
                          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition flex items-start justify-between gap-3 shadow-md relative"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-3xl p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
                              {cat.icon || '🕌'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-white text-sm truncate">{cat.name}</h4>
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md border ${themeBadgeColor}`}>
                                  {themeBadgeLabel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                                {cat.description || 'Tidak ada deskripsi.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl cursor-pointer"
                              title="Edit Kategori"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl cursor-pointer"
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl border border-amber-500/50 space-y-4">
                <h3 className="text-lg font-bold gold-gradient-text">Buat Sesi Room Kuis Live Baru (Kahoot-Style)</h3>

                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Judul Acara / Room Kuis</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kuis Sosialisasi KKN RT 02"
                      value={newRoomTitle}
                      onChange={(e) => setNewRoomTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-amber-300 mb-1">Tema Room Kuis Live</label>
                      <select
                        value={newRoomTheme}
                        onChange={(e) => {
                          const theme = e.target.value as any;
                          setNewRoomTheme(theme);
                          const themeCats = categories.filter((c) => (c.theme_id || 'islamic') === theme);
                          setNewRoomCategory(themeCats[0]?.name || 'Campuran');
                        }}
                        className="w-full p-2.5 bg-slate-900 border border-amber-400 rounded-xl text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
                      >
                        <option value="islamic">🕌 Mode Islami</option>
                        <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                        <option value="culture">🎭 Mode Kebudayaan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori Soal (Sesuai Tema)</label>
                      <select
                        value={newRoomCategory}
                        onChange={(e) => setNewRoomCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
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
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Metode Pemilihan Soal</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="radio" name="selectionMode" value="auto" checked={roomQuestionSelectionMode === 'auto'} onChange={() => setRoomQuestionSelectionMode('auto')} className="accent-amber-500" />
                        Acak Otomatis (10 Soal)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="radio" name="selectionMode" value="manual" checked={roomQuestionSelectionMode === 'manual'} onChange={() => setRoomQuestionSelectionMode('manual')} className="accent-amber-500" />
                        Pilih Manual
                      </label>
                    </div>
                  </div>

                  {roomQuestionSelectionMode === 'manual' && (
                    <div className="border border-slate-700 rounded-xl p-3 bg-slate-900 max-h-60 overflow-y-auto">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-semibold text-amber-400">Pilih Soal ({roomSelectedQuestionIds.length} terpilih):</div>
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
                          className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white cursor-pointer"
                        >
                          Pilih Semua / Batal
                        </button>
                      </div>
                      <div className="space-y-1">
                        {questions
                          .filter(q => (q.theme_id || 'islamic') === newRoomTheme && (newRoomCategory === 'Campuran' || q.category_name === newRoomCategory))
                          .map(q => (
                          <label key={q.id} className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer p-2 hover:bg-slate-800 rounded-lg transition">
                            <input 
                              type="checkbox" 
                              className="mt-0.5 accent-amber-500 cursor-pointer"
                              checked={roomSelectedQuestionIds.includes(q.id || '')}
                              onChange={(e) => {
                                if (e.target.checked) setRoomSelectedQuestionIds(prev => [...prev, q.id || '']);
                                else setRoomSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                              }}
                            />
                            <span>{q.question_text} <span className="text-slate-500 ml-1">({q.difficulty})</span></span>
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
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 px-6 py-2 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <Plus className="w-4 h-4" /> Buat & Tampilkan Layar Proyektor
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Live QuRoom Sessions Control Table */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🎮 Daftar Sesi Room QuRoom Live ({adminRooms.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kontrol room kuis proyektor yang sedang aktif atau tutup room yang sudah selesai.
                  </p>
                </div>
                <button
                  onClick={loadAdminRooms}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Sesi Room</span>
                </button>
              </div>

              {adminRooms.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-800 rounded-2xl">
                  Belum ada sesi room live yang dibuat. Klik <strong className="text-amber-300">Buat Sesi Room PIN Baru</strong> di atas!
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">PIN Room</th>
                        <th className="py-2.5 px-3">Judul Room</th>
                        <th className="py-2.5 px-3">Tema Kuis</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Soal</th>
                        <th className="py-2.5 px-3 text-right">Aksi Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {adminRooms.map((r) => {
                        const themeLabel =
                          r.theme_id === 'independence'
                            ? 'Kemerdekaan 🇲🇨'
                            : r.theme_id === 'culture'
                            ? 'Kebudayaan 🎭'
                            : 'Islami 🕌';
                        const themeColor =
                          r.theme_id === 'independence'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : r.theme_id === 'culture'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                        return (
                          <tr key={r.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3">
                              <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-lg text-xs">
                                #{r.room_code}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-white truncate max-w-[200px]">
                              {r.title}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10.5px] border ${themeColor}`}>
                                {themeLabel}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                                  r.status === 'finished'
                                    ? 'bg-slate-800 text-slate-400'
                                    : 'bg-emerald-600 text-white animate-pulse'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-300">
                              {r.total_questions || 10}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setActiveHostRoom(r)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black cursor-pointer shadow-xs"
                                >
                                  Host Proyektor
                                </button>
                                {r.status !== 'finished' && (
                                  <button
                                    onClick={() => handleCloseRoomAdmin(r.id)}
                                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Tutup Room
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteRoomAdmin(r.id)}
                                  className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg cursor-pointer"
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
        ) : (
          /* PLAYERS MANAGEMENT TAB */
          <div className="space-y-6">
            {/* SELECTIVE RESET ACTION BAR BANNER */}
            <div className="glass-card p-6 rounded-3xl border border-purple-500/50 space-y-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-black text-purple-300 flex items-center gap-2">
                    <span>👥 Kelola Pemain & Papan Peringkat Skor</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pantau statistik seluruh pemain terdaftar & lakukan reset poin selektif per tema jika dibutuhkan untuk sesi sosialisasi baru.
                  </p>
                </div>

                <button
                  onClick={loadPlayers}
                  className="px-3.5 py-1.5 bg-purple-900/50 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-extrabold flex items-center gap-1 border border-purple-400/40 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Pemain</span>
                </button>
              </div>

              {/* SELECTIVE RESET ACTION BUTTONS */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                  ⚡ Opsi Reset Poin Selektif Per Tema:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelectiveResetPoints('independence')}
                    className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                    <span>Reset Poin Wawasan 🇲🇨</span>
                  </button>

                  <button
                    onClick={() => handleSelectiveResetPoints('culture')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Poin Budaya 🎭</span>
                  </button>

                  <button
                    onClick={() => handleSelectiveResetPoints('islamic')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reset Poin Amal 💚</span>
                  </button>

                  <button
                    onClick={() => handleSelectiveResetPoints('ALL')}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/50 text-xs font-black transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Reset Seluruh Poin & Statistik 🌐</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PLAYERS LIST TABLE */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
              <h4 className="text-base font-bold text-white">Daftar Pemain Terdaftar ({playersList.length})</h4>

              {playersList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-800 rounded-2xl">
                  Belum ada data pemain terdaftar di database.
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar max-h-[450px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] z-10">
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
                    <tbody className="divide-y divide-slate-800/60">
                      {playersList.map((p) => {
                        const amal = p.amal_points || 0;
                        const wawasan = p.wawasan_points || 0;
                        const budaya = p.budaya_points || 0;
                        const totalComb = amal + wawasan + budaya;

                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                                  {p.avatar && p.avatar.startsWith('/') ? (
                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm">{p.avatar || '👦🏻'}</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-extrabold text-white block leading-tight">{p.name}</span>
                                  <span className="text-[9.5px] text-slate-400 font-normal block">{p.title_tag || 'Muslim Cerdas'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full text-[10.5px] border border-amber-500/30">
                                Lvl {p.level || 1} ({p.xp || 0} XP)
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-emerald-400">
                              {amal.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-right font-black text-red-400">
                              {wawasan.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-right font-black text-amber-400">
                              {budaya.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-right font-black text-amber-300 text-sm">
                              {totalComb.toLocaleString('id-ID')} Pt
                            </td>
                            <td className="py-3 px-3 text-center text-slate-300">
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
        )}
      </div>

      {/* SMART UNIVERSAL IMPORT MODAL (PASTE / FILE + PREVIEW TABLE) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans select-none overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Impor Soal Massal Cerdas (Smart Import)</h3>
                  <p className="text-xs text-slate-400">Dukungan Otomatis: Koma (,), Titik Koma (;), TAB Excel (\t), & Copas Langsung</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY THEME TARGET SELECTOR FOR BULK IMPORT */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/50 space-y-1.5">
              <label className="block text-xs font-black text-amber-300 flex items-center gap-1.5">
                <span>Pilih Tema Target Import Soal:</span>
                <span className="text-red-400 font-bold">*Wajib Pilih</span>
              </label>
              <select
                value={importTargetTheme}
                onChange={(e) => {
                  setImportTargetTheme(e.target.value as any);
                  setImportValidationError('');
                }}
                className={`w-full p-2.5 bg-slate-900 border rounded-xl text-xs font-black transition cursor-pointer ${
                  !importTargetTheme
                    ? 'border-red-500 text-red-300 shadow-red-950 shadow-md animate-pulse'
                    : importTargetTheme === 'independence'
                    ? 'border-red-400 text-red-300'
                    : importTargetTheme === 'culture'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-emerald-400 text-emerald-300'
                }`}
              >
                <option value="" disabled>-- PILIH TEMA TARGET IMPORT --</option>
                <option value="islamic">🕌 Mode Islami</option>
                <option value="independence">🇮🇩 Mode Kemerdekaan</option>
                <option value="culture">🎭 Mode Kebudayaan</option>
              </select>
              {importValidationError && (
                <div className="p-2 bg-red-950/90 border border-red-500/60 rounded-xl text-xs font-bold text-red-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{importValidationError}</span>
                </div>
              )}
            </div>

            {/* TAB CONTENT & PREVIEW */}
            {parsedPreviewResults.length === 0 ? (
              <>
                {/* TAB SWITCHER */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <button
                    onClick={() => setImportModalTab('PASTE')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      importModalTab === 'PASTE'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📋 Copas Langsung dari Excel / Google Sheets</span>
                  </button>
                  <button
                    onClick={() => setImportModalTab('FILE')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      importModalTab === 'FILE'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📄 Upload Berkas (.CSV / .TXT / .TSV)</span>
                  </button>
                </div>

                {importModalTab === 'PASTE' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300">
                      Buka tabel di Microsoft Excel atau Google Sheets ➔ Blok baris soal ➔ Tekan <strong className="text-amber-400">Ctrl + C</strong> ➔ Tempelkan (<strong className="text-amber-400">Ctrl + V</strong>) di kotak bawah ini:
                    </p>
                    <textarea
                      rows={6}
                      placeholder={`Contoh tempelkan dari Excel:\nislamic,Rukun Islam,easy,Berapakah jumlah Rukun Islam?,4 perkara,5 perkara,6 perkara,7 perkara,B,Rukun Islam ada 5,HR. Bukhari,Syahadat`}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleProcessPaste}
                        className="emerald-gradient-btn px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>PRATINJAU & VALIDASI TEKS</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed border-slate-700 rounded-3xl text-center space-y-3 bg-slate-950/50">
                    <Upload className="w-12 h-12 text-emerald-400 mx-auto" />
                    <div>
                      <p className="text-base font-bold text-white">Pilih File CSV / TXT / TSV Soal</p>
                      <p className="text-xs text-slate-400 mt-1">Sistem otomatis membaca format koma (,), titik-koma (;), maupun TAB Excel</p>
                    </div>
                    <label className="emerald-gradient-btn px-8 py-3 rounded-xl text-white font-extrabold text-xs shadow-lg cursor-pointer inline-flex items-center gap-2">
                      <span>PILIH BERKAS FILE</span>
                      <input type="file" accept=".csv,.txt,.tsv" onChange={handleProcessFile} className="hidden" />
                    </label>
                  </div>
                )}
              </>
            ) : (
              /* ENLARGED FULL PREVIEW TABLE VIEW (NO UPLOAD BOX) */
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between text-xs font-bold bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm font-black">
                      📊 Hasil Pratinjau Dideteksi: {parsedPreviewResults.length} Soal
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-extrabold border border-emerald-500/30">
                      {parsedPreviewResults.filter((r) => r.isValid).length} Valid & Siap Simpan
                    </span>
                  </div>
                  <button
                    onClick={() => setParsedPreviewResults([])}
                    className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 underline cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Upload File Lain
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[380px] border border-slate-800 rounded-2xl bg-slate-950/90 custom-scrollbar">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[9.5px] sticky top-0 z-10 shadow-sm">
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
                    <tbody className="divide-y divide-slate-800">
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
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : themeKey === 'culture'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

                        return (
                          <tr key={idx} className={res.isValid ? 'hover:bg-slate-900/60' : 'bg-red-950/30'}>
                            <td className="p-3 font-bold text-center">{idx + 1}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${themeColor}`}>
                                {themeLabel}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-200">{res.question.category_name || 'Campuran'}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                  res.question.difficulty === 'easy'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : res.question.difficulty === 'hard'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-gold-500/20 text-gold-400'
                                }`}
                              >
                                {res.question.difficulty || 'medium'}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-white max-w-sm">
                              {res.question.question_text || '(Teks Kosong)'}
                            </td>
                            <td className="p-3 font-black text-center text-emerald-400 text-sm">{res.question.correct_option}</td>
                            <td className="p-3">
                              {res.isValid ? (
                                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Ready
                                </span>
                              ) : (
                                <span className="text-red-400 font-bold text-[10px]">
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

                <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setParsedPreviewResults([])}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Ganti File / Upload Ulang
                  </button>
                  <button
                    onClick={handleConfirmBulkImport}
                    disabled={parsedPreviewResults.filter((r) => r.isValid).length === 0}
                    className={`emerald-gradient-btn px-7 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-xl flex items-center gap-2 cursor-pointer ${
                      parsedPreviewResults.filter((r) => r.isValid).length === 0 ? 'opacity-50 pointer-events-none' : ''
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

      {/* FULLSCREEN ADMIN HOST VIEW (PROJECTOR) */}
      {activeHostRoom && (
        <RoomHostView room={activeHostRoom} onClose={() => setActiveHostRoom(null)} />
      )}
    </div>
  );
}
