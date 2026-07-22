'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit3, Upload, Download, RefreshCw, ShieldAlert, ArrowLeft, Save, CheckCircle2, FileSpreadsheet, Info } from 'lucide-react';
import { Question } from '@/types/game';
import { GameService } from '@/lib/gameService';
import { INITIAL_QUESTIONS } from '@/data/seedQuestions';

export default function AdminPage() {
  const [passcode, setPasscode] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<boolean>(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'ceritawedomartani' || passcode === 'admin' || passcode === 'kkn2026') {
      setIsAuthenticated(true);
      setAuthError(false);
      loadQuestions();
    } else {
      setAuthError(true);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    const data = await GameService.getQuestions('Campuran', 100);
    setQuestions(data.length > 0 ? data : INITIAL_QUESTIONS);
    setLoading(false);
  };

  const handleOpenNewForm = () => {
    setEditingId(null);
    setFormData({
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
    setIsFormOpen(true);
  };

  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setFormData({
      category_name: q.category_name || 'Campuran',
      difficulty: q.difficulty || 'medium',
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      explanation: q.explanation,
      dalil: q.dalil || '',
      ustadz_hint: q.ustadz_hint || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus soal ini secara permanen?')) {
      await GameService.deleteQuestion(id);
      await loadQuestions();
      setMessage('Soal berhasil dihapus secara permanen.');
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const qToSave: Question = {
      ...formData,
      id: editingId || 'custom-' + Date.now(),
    };

    await GameService.saveQuestion(qToSave);
    await loadQuestions();
    setIsFormOpen(false);
    setMessage(editingId ? 'Soal berhasil diperbarui di Database!' : 'Soal baru berhasil ditambahkan ke Database!');
  };

  // CSV Import Parser
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const parsedQuestions: Question[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV handling quotes
        const row = line.match(/(?:[^\s",]+|"(?:\\.|[^"])*")/g) || line.split(',');
        const cleanRow = row.map(cell => cell.replace(/^"|"$/g, '').trim());

        if (cleanRow.length >= 6) {
          parsedQuestions.push({
            id: 'csv-' + Date.now() + '-' + i,
            question_text: cleanRow[0] || '',
            option_a: cleanRow[1] || '',
            option_b: cleanRow[2] || '',
            option_c: cleanRow[3] || '',
            option_d: cleanRow[4] || '',
            correct_option: (cleanRow[5]?.toUpperCase() || 'A') as any,
            category_name: cleanRow[6] || 'Campuran',
            difficulty: (cleanRow[7]?.toLowerCase() || 'medium') as any,
            explanation: cleanRow[8] || 'Penjelasan kuis.',
            dalil: cleanRow[9] || '',
            ustadz_hint: cleanRow[10] || '',
          });
        }
      }

      if (parsedQuestions.length > 0) {
        await GameService.saveQuestionsBatch(parsedQuestions);
        await loadQuestions();
        setMessage(`Berhasil mengimpor ${parsedQuestions.length} soal dari file CSV!`);
      } else {
        alert('Format CSV tidak valid atau berkas kosong.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetLeaderboard = async () => {
    if (confirm('Apakah Anda yakin ingin mereset papan peringkat leaderboard untuk sesi baru?')) {
      await GameService.resetLeaderboard();
      alert('Papan peringkat leaderboard berhasil direset!');
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                placeholder="Masukkan Passcode (ceritawedomartani)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm text-center"
              />
              {authError && <p className="text-red-400 text-xs mt-2">Passcode salah! Silakan coba lagi.</p>}
            </div>

            <button
              type="submit"
              className="emerald-gradient-btn w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg cursor-pointer"
            >
              MASUK PANEL ADMIN
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

            {/* Import CSV Button */}
            <label className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import CSV Soal</span>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>

            {/* Add Question Button */}
            <button
              onClick={handleOpenNewForm}
              className="emerald-gradient-btn px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Soal</span>
            </button>

            {/* Reset Leaderboard Button */}
            <button
              onClick={handleResetLeaderboard}
              className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Leaderboard</span>
            </button>
          </div>
        </div>

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
            Urutan Kolom CSV: question_text, option_a, option_b, option_c, option_d, correct_option, category_name, difficulty, explanation, dalil, ustadz_hint
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Modal Form Tambah/Edit Soal */}
        {isFormOpen && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-gold-400">{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori</label>
                  <input
                    type="text"
                    required
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
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

        {/* Question List Table */}
        <div className="glass-card p-6 rounded-3xl border border-slate-700 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Bank Soal Terdaftar ({questions.length} Soal)</h3>
            <button onClick={loadQuestions} className="text-xs text-emerald-400 flex items-center gap-1 hover:underline">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload Data
            </button>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Pertanyaan</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Kesulitan</th>
                <th className="p-3">Kunci</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {questions.map((q, idx) => (
                <tr key={q.id || idx} className="hover:bg-slate-900/50 transition">
                  <td className="p-3 font-bold">{idx + 1}</td>
                  <td className="p-3 max-w-md font-medium text-white">{q.question_text}</td>
                  <td className="p-3">{q.category_name || 'Campuran'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      q.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                      q.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-gold-500/20 text-gold-400'
                    }`}>
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
      </div>
    </div>
  );
}
