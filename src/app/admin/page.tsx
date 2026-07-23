'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Upload, Download, RefreshCw, ShieldAlert, ArrowLeft, Save, CheckCircle2, FileSpreadsheet, Info, Lock, User, X } from 'lucide-react';
import { Question, Category, QuizRoom } from '@/types/game';
import { GameService } from '@/lib/gameService';
import { RoomService } from '@/lib/roomService';
import { ProfileService } from '@/lib/profileService';
import { AuthService } from '@/lib/authService';
import { parseUniversalCSVText, ParsedQuestionResult } from '@/lib/csvParser';
import { INITIAL_QUESTIONS, INITIAL_CATEGORIES } from '@/data/seedQuestions';
import { RoomHostView } from '@/components/RoomHostView';

export default function AdminPage() {
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [adminTab, setAdminTab] = useState<'QUESTIONS' | 'CATEGORIES' | 'ROOMS'>('QUESTIONS');
  const [activeHostRoom, setActiveHostRoom] = useState<QuizRoom | null>(null);
  const [isRoomFormOpen, setIsRoomFormOpen] = useState<boolean>(false);
  const [newRoomTitle, setNewRoomTitle] = useState<string>('Kuis Live Sosialisasi KKN');
  const [newRoomCategory, setNewRoomCategory] = useState<string>('Campuran');
  const [roomQuestionSelectionMode, setRoomQuestionSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [roomSelectedQuestionIds, setRoomSelectedQuestionIds] = useState<string[]>([]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Form State Soal
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionGameTypeFilter, setQuestionGameTypeFilter] = useState<'ALL' | 'millionaire' | 'kahoot'>('ALL');
  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
    category_name: 'Aqidah',
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

  // Smart Universal Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importModalTab, setImportModalTab] = useState<'PASTE' | 'FILE'>('PASTE');
  const [pasteText, setPasteText] = useState<string>('');
  const [parsedPreviewResults, setParsedPreviewResults] = useState<ParsedQuestionResult[]>([]);

  // Form State Kategori
  const [isCatFormOpen, setIsCatFormOpen] = useState<boolean>(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catFormData, setCatFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    icon: '🕌',
    description: '',
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
      if (questionGameTypeFilter === 'millionaire') return (q.game_type || 'millionaire') === 'millionaire';
      if (questionGameTypeFilter === 'kahoot') return q.game_type === 'kahoot';
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

  const handleOpenNewCategoryForm = () => {
    setEditingCatId(null);
    setCatFormData({
      name: '',
      icon: '🕌',
      description: '',
    });
    setIsCatFormOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatFormData({
      name: cat.name,
      icon: cat.icon || '🕌',
      description: cat.description || '',
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
      roomQuestionSelectionMode === 'manual' ? roomSelectedQuestionIds : undefined
    );
    if (created) {
      setActiveHostRoom(created);
      setIsRoomFormOpen(false);
      setMessage(`Sesi Kuis Live Kahoot berhasil dibuat! Kode PIN Proyektor: ${created.room_code}`);
    }
  };

  const handleOpenNewForm = () => {
    setEditingId(null);
    setFormData({
      category_name: 'Aqidah',
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

    // Auto-fix category_name if corrupted by shifted CSV columns (e.g. 'A', 'B', 'C', 'D', 'easy')
    let validCat = (q.category_name || 'Campuran').trim();
    const isInvalidCatName = ['A', 'B', 'C', 'D', 'easy', 'medium', 'hard'].includes(validCat);
    if (isInvalidCatName || (validCat !== 'Campuran' && !categories.some(c => c.name === validCat))) {
      validCat = categories[0]?.name || 'Campuran';
    }

    // Auto-fix explanation if corrupted
    let validExp = (q.explanation || '').trim();
    if (['easy', 'medium', 'hard'].includes(validExp.toLowerCase())) {
      validExp = 'Penjelasan edukatif kuis Islami.';
    }

    setFormData({
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
    const validQuestions = parsedPreviewResults.filter((r) => r.isValid).map((r) => r.question);
    if (validQuestions.length === 0) {
      alert('Tidak ada soal valid yang dapat disimpan.');
      return;
    }

    await GameService.saveQuestionsBatch(validQuestions);
    await loadQuestions();
    setIsImportModalOpen(false);
    setParsedPreviewResults([]);
    setPasteText('');
    setMessage(`Berhasil mengimpor ${validQuestions.length} soal ke database!`);
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
            {/* Download Template CSV Button */}
            <a
              href="/template_soal.csv"
              download="template_soal_kkn.csv"
              className="px-4 py-2.5 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-500/40 hover:bg-gold-500/30 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-gold-400" />
              <span>Download Template CSV</span>
            </a>

            {/* Smart Import Button */}
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setParsedPreviewResults([]);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg hover:from-emerald-500 hover:to-teal-500 transition flex items-center gap-2 cursor-pointer border border-emerald-400"
            >
              <Upload className="w-4 h-4" />
              <span>Impor Soal Cerdas / Copas Excel</span>
            </button>

            {/* Sync Initial Questions Button */}
            <button
              onClick={handleSeedQuestions}
              className="px-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              title="Masukkan 15 soal awal ke database Supabase agar dapat diedit/dihapus"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Sync 15 Soal ke Supabase</span>
            </button>

            {/* Add Action Button depends on active tab */}
            {adminTab === 'QUESTIONS' ? (
              <button
                onClick={handleOpenNewForm}
                className="emerald-gradient-btn px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Soal</span>
              </button>
            ) : adminTab === 'CATEGORIES' ? (
              <button
                onClick={handleOpenNewCategoryForm}
                className="bg-amber-600 hover:bg-amber-500 px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRoomFormOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 px-4 py-2.5 rounded-xl text-white font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Sesi Room PIN Baru</span>
              </button>
            )}

            {/* Reset Leaderboard Button */}
            <button
              onClick={handleResetLeaderboard}
              className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Leaderboard</span>
            </button>

            {/* Logout Admin Button */}
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Keluar Admin (Logout)</span>
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
            onClick={() => setAdminTab('ROOMS')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
              adminTab === 'ROOMS'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg border border-yellow-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <span>🎮 Sesi Room Live (Kahoot)</span>
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
                Panitia KKN dapat mengunduh berkas contoh via tombol <strong className="text-gold-300">Download Template CSV</strong> di atas, lalu membuka/mengeditnya menggunakan Google Sheets atau Microsoft Excel. Setelah diisi, simpan sebagai file <strong className="text-emerald-400">.CSV</strong> dan tekan tombol <strong className="text-emerald-400">Import CSV Soal</strong>.
              </p>
              <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                Urutan Kolom CSV: question_text, option_a, option_b, option_c, option_d, correct_option, category_name, game_type (millionaire/kahoot), difficulty, explanation, dalil, ustadz_hint
              </div>
            </div>

            {/* Modal Form Tambah/Edit Soal */}
            {isFormOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold text-gold-400">{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>

                <form onSubmit={handleSaveQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Target Mode Permainan</label>
                      <select
                        value={formData.game_type || 'millionaire'}
                        onChange={(e) => setFormData({ ...formData, game_type: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-300 focus:outline-none"
                      >
                        <option value="millionaire">🏆 Millionaire (Solo)</option>
                        <option value="kahoot">🎮 Kahoot (Live Room)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori</label>
                      <select
                        value={formData.category_name}
                        onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id || c.name} value={c.name}>
                            {c.icon || '🕌'} {c.name}
                          </option>
                        ))}
                        <option value="Campuran">🌀 Campuran</option>
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

            {/* Filter Tabs for Question Types */}
            <div className="flex items-center gap-2 pb-1 flex-wrap">
              <button
                onClick={() => setQuestionGameTypeFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  questionGameTypeFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-md border border-slate-500'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🌐 Semua Soal ({questions.length})
              </button>
              <button
                onClick={() => setQuestionGameTypeFilter('millionaire')}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  questionGameTypeFilter === 'millionaire'
                    ? 'bg-amber-600 text-white shadow-md border border-amber-400'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🏆 Millionaire Solo ({questions.filter((q) => (q.game_type || 'millionaire') === 'millionaire').length})
              </button>
              <button
                onClick={() => setQuestionGameTypeFilter('kahoot')}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  questionGameTypeFilter === 'kahoot'
                    ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🎮 Kahoot Live Room ({questions.filter((q) => q.game_type === 'kahoot').length})
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
                            if (questionGameTypeFilter === 'millionaire') return (q.game_type || 'millionaire') === 'millionaire';
                            if (questionGameTypeFilter === 'kahoot') return q.game_type === 'kahoot';
                            return true;
                          }).length > 0 &&
                          selectedQuestionIds.length >=
                            questions.filter((q) => {
                              if (questionGameTypeFilter === 'millionaire') return (q.game_type || 'millionaire') === 'millionaire';
                              if (questionGameTypeFilter === 'kahoot') return q.game_type === 'kahoot';
                              return true;
                            }).length
                        }
                        className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                      />
                    </th>
                    <th className="p-3">No</th>
                    <th className="p-3">Pertanyaan</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Kesulitan</th>
                    <th className="p-3">Kunci</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {questions
                    .filter((q) => {
                      if (questionGameTypeFilter === 'millionaire') return (q.game_type || 'millionaire') === 'millionaire';
                      if (questionGameTypeFilter === 'kahoot') return q.game_type === 'kahoot';
                      return true;
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
                              q.game_type === 'kahoot'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {q.game_type === 'kahoot' ? '🎮 Kahoot' : '🏆 Millionaire'}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Category Cards Grid */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Daftar Kategori Kuis Terdaftar ({categories.length})</h3>
                  <p className="text-xs text-slate-400">Kategori ini ditampilkan pada setup kuis pemain dan filter leaderboard.</p>
                </div>
                <button onClick={loadCategories} className="text-xs text-amber-400 flex items-center gap-1 hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" /> Reload Kategori
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id || cat.name}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition flex items-start justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-3xl p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
                        {cat.icon || '🕌'}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white text-sm truncate">{cat.name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
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
                ))}
              </div>
            </div>
          </>
        ) : (
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori Soal</label>
                    <select
                      value={newRoomCategory}
                      onChange={(e) => setNewRoomCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.icon || '🕌'} {c.name}
                        </option>
                      ))}
                      <option value="Campuran">🌀 Campuran</option>
                    </select>
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
                            const filteredIds = questions.filter(q => newRoomCategory === 'Campuran' || q.category_name === newRoomCategory).map(q => q.id || '');
                            if (roomSelectedQuestionIds.length === filteredIds.length && filteredIds.length > 0) {
                              setRoomSelectedQuestionIds([]);
                            } else {
                              setRoomSelectedQuestionIds(filteredIds);
                            }
                          }}
                          className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white"
                        >
                          Pilih Semua / Batal
                        </button>
                      </div>
                      <div className="space-y-1">
                        {questions.filter(q => newRoomCategory === 'Campuran' || q.category_name === newRoomCategory).map(q => (
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

            {/* Launch Room Host Display Banner */}
            <div className="glass-card p-8 rounded-3xl border border-slate-700 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border-2 border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                <span className="text-3xl">🎮</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Sesi Kuis Live Interaktif (Kahoot/Proyektor)</h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
                  Buat room kuis baru untuk menghasilkan kode PIN 6-angka. Tampilkan layar proyektor ke audiens agar peserta dapat bergabung menggunakan HP masing-masing!
                </p>
              </div>

              <button
                onClick={() => setIsRoomFormOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 px-8 py-3 rounded-2xl text-white font-black text-sm shadow-xl cursor-pointer flex items-center gap-2 mx-auto active:scale-95 transition"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>BUAT SESI ROOM PIN BARU</span>
              </button>
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

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
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

            {/* TAB CONTENT */}
            <div className="space-y-3">
              {importModalTab === 'PASTE' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Buka tabel di Microsoft Excel atau Google Sheets ➔ Blok baris soal ➔ Tekan <strong className="text-amber-400">Ctrl + C</strong> ➔ Tempelkan (<strong className="text-amber-400">Ctrl + V</strong>) di kotak bawah ini:
                  </p>
                  <textarea
                    rows={5}
                    placeholder={`Contoh tempelkan dari Excel:\nSiapakah Nabi terakhir?,Musa AS,Isa AS,Muhammad SAW,Ibrahim AS,C,Aqidah,kahoot,medium,Nabi Muhammad SAW nabi penutup.,QS. Al-Ahzab:40,Nabi penutup`}
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
                <div className="p-8 border-2 border-dashed border-slate-700 rounded-3xl text-center space-y-3 bg-slate-950/50">
                  <Upload className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white">Pilih File CSV / TXT Soal</p>
                    <p className="text-xs text-slate-400 mt-0.5">Sistem otomatis membaca format koma (,), titik-koma (;), maupun TAB Excel</p>
                  </div>
                  <label className="emerald-gradient-btn px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg cursor-pointer inline-flex items-center gap-2">
                    <span>PILIH BERKAS FILE</span>
                    <input type="file" accept=".csv,.txt,.tsv" onChange={handleProcessFile} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* INTERACTIVE PREVIEW TABLE */}
            {parsedPreviewResults.length > 0 && (
              <div className="space-y-3 border-t border-slate-800 pt-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-400">
                    Hasil Pratinjau Dideteksi: {parsedPreviewResults.length} Soal (
                    <strong className="text-emerald-400">
                      {parsedPreviewResults.filter((r) => r.isValid).length} Valid
                    </strong>
                    )
                  </span>
                  <span className="text-slate-400 text-[11px]">Periksa data sebelum disimpan ke database</span>
                </div>

                <div className="overflow-y-auto max-h-56 border border-slate-800 rounded-2xl bg-slate-950/80 custom-scrollbar">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[9.5px] sticky top-0">
                      <tr>
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">Pertanyaan</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Kunci</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsedPreviewResults.map((res, idx) => (
                        <tr key={idx} className={res.isValid ? 'hover:bg-slate-900/40' : 'bg-red-950/20'}>
                          <td className="p-2.5 font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-white max-w-xs truncate">{res.question.question_text || '(Teks Kosong)'}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${res.question.game_type === 'kahoot' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {res.question.game_type === 'kahoot' ? '🎮 Kahoot' : '🏆 Millionaire'}
                            </span>
                          </td>
                          <td className="p-2.5">{res.question.category_name}</td>
                          <td className="p-2.5 font-black text-emerald-400">{res.question.correct_option}</td>
                          <td className="p-2.5">
                            {res.isValid ? (
                              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                              </span>
                            ) : (
                              <span className="text-red-400 font-bold text-[10px]">
                                ⚠️ {res.missingFields.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setParsedPreviewResults([])}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal Pratinjau
                  </button>
                  <button
                    onClick={handleConfirmBulkImport}
                    disabled={parsedPreviewResults.filter((r) => r.isValid).length === 0}
                    className={`emerald-gradient-btn px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-xl flex items-center gap-2 cursor-pointer ${
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
