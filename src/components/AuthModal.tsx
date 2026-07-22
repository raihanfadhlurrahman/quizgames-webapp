'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, Check, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { AuthService } from '@/lib/authService';
import { audioManager } from '@/lib/audioManager';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [username, setUsername] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleTabChange = (tab: 'login' | 'register') => {
    audioManager.playClick();
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const validateInputs = (): boolean => {
    // Basic username validation
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('Username wajib diisi.');
      return false;
    }
    if (cleanUsername.length < 3) {
      setErrorMsg('Username minimal harus 3 karakter.');
      return false;
    }
    if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
      setErrorMsg('Username hanya boleh berisi huruf, angka, titik (.), underscore (_), atau strip (-). Tanpa spasi.');
      return false;
    }

    if (activeTab === 'register') {
      if (!name.trim()) {
        setErrorMsg('Nama lengkap wajib diisi.');
        return false;
      }
      if (name.trim().length < 2) {
        setErrorMsg('Nama lengkap minimal harus 2 karakter.');
        return false;
      }
    }

    if (!password) {
      setErrorMsg('Kata sandi wajib diisi.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal harus 6 karakter.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playClick();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateInputs()) return;

    setLoading(true);

    try {
      if (activeTab === 'login') {
        await AuthService.signInWithUsername(username, password);
        setSuccessMsg('Login berhasil! Mengalihkan...');
        setTimeout(() => {
          setLoading(false);
          onSuccess();
          onClose();
        }, 1500);
      } else {
        await AuthService.signUpWithUsername(username, name, password, 'player');
        setSuccessMsg('Pendaftaran berhasil! Akun Anda telah siap, silakan Masuk.');
        setUsername('');
        setName('');
        setPassword('');
        setTimeout(() => {
          setActiveTab('login');
          setSuccessMsg('');
          setLoading(false);
        }, 3000);
      }
    } catch (err: any) {
      setLoading(false);
      // Simplify common Supabase errors for user display
      let msg = err.message || 'Terjadi kesalahan sistem.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Username atau kata sandi salah. Silakan coba lagi.';
      } else if (msg.includes('User already exists')) {
        msg = 'Username sudah terdaftar. Silakan pilih username lain.';
      }
      setErrorMsg(msg);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#FFFDF3] border-4 border-[#FDE68A] max-w-md w-full rounded-[28px] p-6 shadow-2xl text-[#1E293B] relative"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FEF3C7] hover:bg-amber-200 text-[#78350F] flex items-center justify-center border border-[#F59E0B]/30 shadow-sm transition cursor-pointer z-10"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Icon Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-inner text-amber-700">
              <KeyRound className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-[#78350F] tracking-wide">
              {activeTab === 'login' ? 'Masuk ke Arena Kuis' : 'Daftar Akun Baru'}
            </h3>
            <p className="text-xs text-amber-900 font-semibold leading-relaxed">
              {activeTab === 'login'
                ? 'Gunakan username Anda untuk memuat kemudahan kuis dan statistik'
                : 'Buat akun untuk menyimpan perolehan Poin Amal & sertifikat Anda'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-amber-200/60 mb-5">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 pb-2.5 text-sm font-extrabold text-center border-b-2 transition ${
                activeTab === 'login'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 pb-2.5 text-sm font-extrabold text-center border-b-2 transition ${
                activeTab === 'register'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Daftar (Register)
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-start gap-2"
              >
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Raihan Fadhlurrahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border-2 border-amber-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-[#451A03] focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="font-bold text-xs select-none">@</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: raihan123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border-2 border-amber-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-[#451A03] focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-amber-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-[#451A03] focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl green-btn-3d font-black text-white text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg transition ${
                loading ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>{activeTab === 'login' ? 'MASUK SEKARANG' : 'DAFTAR SEKARANG'}</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
