'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  BookOpen,
  Trophy,
  Settings,
  Gift,
  Calendar,
  Shield,
  ShoppingBag,
  Volume2,
  VolumeX,
  Info,
  X,
  Star,
  Heart,
  ChevronRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { audioManager } from '@/lib/audioManager';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { UserProfileModal } from './UserProfileModal';
import { LeaderboardView } from './LeaderboardView';

interface WelcomeScreenProps {
  onStart: () => void;
  onOpenLeaderboard?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  userProfile?: UserProfileData;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onOpenLeaderboard,
  isMuted,
  onToggleMute,
  userProfile: initialProfile,
}) => {
  const [profile, setProfile] = useState<UserProfileData>(initialProfile || ProfileService.getProfile());
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<
    'MATERI' | 'PENGATURAN' | 'DAILY' | 'BADGE' | 'TOKO' | 'ABOUT' | null
  >(null);

  useEffect(() => {
    setProfile(ProfileService.getProfile());
  }, []);

  const handleButtonClick = (action: () => void) => {
    audioManager.playClick();
    action();
  };

  const handleProfileUpdated = (updated: UserProfileData) => {
    setProfile(updated);
  };

  return (
    <div
      className="relative w-full min-h-screen main-menu-bg select-none flex flex-col justify-between font-sans overflow-hidden"
      style={{
        backgroundImage: `url('/image/mainmenubg1.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark Subtle Overlay for Optimal Contrast */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="relative z-10 w-full p-4 md:p-6 flex items-start justify-between">
        {/* Left Spacer / Decorative */}
        <div className="hidden md:block" />

        {/* Right Top User Profile Card (Clicking Opens "Profil Saya" Modal) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleButtonClick(() => setShowProfileModal(true))}
          className="relative rounded-2xl p-2.5 md:p-3 flex items-center gap-3 ml-auto cursor-pointer hover:scale-105 active:scale-95 transition shadow-xl border-2 border-[#FDE68A] overflow-hidden"
          style={{
            backgroundImage: `url('${profile.bg_profile || '/image/bgprofile/1.jpg'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle contrast overlay so custom background image POPS clearly */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px] pointer-events-none" />
          {/* Avatar Icon / PNG Image with Dynamic PNG Border Overlay */}
          <div className="relative z-10 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
            <div className="w-[82%] h-[82%] rounded-full bg-[#FEF3C7] flex items-center justify-center overflow-hidden shadow-inner border border-amber-300">
              {profile.avatar.startsWith('/') ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl md:text-3xl">{profile.avatar}</span>
              )}
            </div>
            <img
              src={profile.border_frame || profile.border_color || '/image/border/1.png'}
              alt="Bingkai Profile"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
            />
          </div>

          {/* Real User Info */}
          <div className="relative z-10 space-y-1 bg-[#FFFDF3]/90 px-2.5 py-1 rounded-xl backdrop-blur-xs border border-amber-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#451A03] text-sm md:text-base leading-none">
                {profile.name}
              </span>
              <span className="bg-[#FBBF24] text-[#78350F] text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                Lv. {profile.level}
              </span>
            </div>

            {/* Level XP Bar */}
            <div className="w-28 md:w-36 bg-[#E2E8F0] h-2 rounded-full overflow-hidden border border-[#CBD5E1]">
              <div
                className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((profile.amal_points % 500) / 500) * 100, 100)}%` }}
              />
            </div>

            {/* Amal Point Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#047857]">
              <div className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px]">
                💚
              </div>
              <span>{profile.amal_points.toLocaleString()} Amal</span>
            </div>
          </div>

          {/* Gift Box Icon Button (Locked / Coming Soon) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick(() => setActiveModal('DAILY'));
            }}
            className="relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 border-2 border-slate-600 text-slate-400 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Gift className="w-5 h-5 md:w-6 md:h-6 text-slate-400 opacity-60" />
            <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-1 border border-amber-300">
              <Lock className="w-2.5 h-2.5" />
            </div>
          </button>
        </motion.div>
      </header>

      {/* MAIN MENU CONTENT AREA (LEFT SIDE NAVIGATION & BUTTONS) */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-2 flex flex-col justify-center flex-1">
        <div className="max-w-md space-y-3.5 md:space-y-4">
          {/* GAME LOGO IMAGE WITH SMOOTH ENTRANCE & FLOATING ANIMATION */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 },
              y: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
            }}
            className="relative pb-1 flex justify-start"
          >
            <img
              src="/image/logo.png"
              alt="Islamic Millionaire Logo"
              className="w-full max-w-[360px] sm:max-w-[460px] md:max-w-[540px] lg:max-w-[580px] h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] pointer-events-none"
            />
          </motion.div>

          {/* MAIN VERTICAL BUTTON MENU */}
          <div className="space-y-2.5 md:space-y-3">
            {/* 🟢 MULAI BERMAIN (BIG GREEN BUTTON - ACTIVE) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleButtonClick(onStart)}
              className="w-full py-3.5 md:py-4 px-5 rounded-2xl md:rounded-3xl green-btn-3d font-extrabold text-lg md:text-xl flex items-center justify-between transition cursor-pointer"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                <Play className="w-6 h-6 md:w-7 md:h-7 fill-current text-white translate-x-0.5" />
              </div>
              <span className="tracking-wide text-white drop-shadow-md">MULAI BERMAIN</span>
              <ChevronRight className="w-6 h-6 text-white/80" />
            </motion.button>

            {/* 📜 MATERI ISLAMI (LOCKED / COMING SOON) */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleButtonClick(() => setActiveModal('MATERI'))}
              className="w-full py-3 md:py-3.5 px-5 rounded-2xl bg-[#FFFDF3]/90 border-4 border-slate-300 shadow-[0_4px_0_#94A3B8] text-slate-600 font-bold text-base md:text-lg flex items-center justify-between transition cursor-pointer relative"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-lg grayscale">
                  📖
                </div>
                <span className="tracking-wide text-slate-600">MATERI ISLAMI</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-800 text-[10px] md:text-xs font-extrabold px-2.5 py-1 rounded-full border border-amber-400">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>COMING SOON</span>
              </div>
            </motion.button>

            {/* 🏆 LEADERBOARD (ACTIVE) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleButtonClick(() => setShowLeaderboardModal(true))}
              className="w-full py-3 md:py-3.5 px-5 rounded-2xl cream-btn-3d font-bold text-base md:text-lg flex items-center justify-between transition cursor-pointer"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#FEF3C7] border-2 border-[#F59E0B] flex items-center justify-center text-lg">
                🏆
              </div>
              <span className="tracking-wide">LEADERBOARD</span>
              <ChevronRight className="w-5 h-5 text-[#B45309]" />
            </motion.button>

            {/* ⚙️ PENGATURAN (ACTIVE) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleButtonClick(() => setActiveModal('PENGATURAN'))}
              className="w-full py-3 md:py-3.5 px-5 rounded-2xl cream-btn-3d font-bold text-base md:text-lg flex items-center justify-between transition cursor-pointer"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#E0F2FE] border-2 border-[#38BDF8] flex items-center justify-center text-lg">
                ⚙️
              </div>
              <span className="tracking-wide">PENGATURAN</span>
              <ChevronRight className="w-5 h-5 text-[#B45309]" />
            </motion.button>
          </div>

          {/* BOTTOM QUICK WIDGET BUTTONS (Daily Challenge, Badge, Toko - LOCKED) */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Daily Challenge (Locked) */}
            <button
              onClick={() => handleButtonClick(() => setActiveModal('DAILY'))}
              className="p-2.5 rounded-2xl bg-[#FFFDF3]/80 border-2 border-slate-300 shadow-[0_3px_0_#94A3B8] hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition relative"
            >
              <div className="absolute top-1.5 right-1.5 text-amber-600 bg-amber-100 p-0.5 rounded-full border border-amber-300">
                <Lock className="w-2.5 h-2.5" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-base grayscale">
                📅
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-500">
                Daily Challenge
              </span>
            </button>

            {/* Badge (Locked) */}
            <button
              onClick={() => handleButtonClick(() => setActiveModal('BADGE'))}
              className="p-2.5 rounded-2xl bg-[#FFFDF3]/80 border-2 border-slate-300 shadow-[0_3px_0_#94A3B8] hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition relative"
            >
              <div className="absolute top-1.5 right-1.5 text-amber-600 bg-amber-100 p-0.5 rounded-full border border-amber-300">
                <Lock className="w-2.5 h-2.5" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-base grayscale">
                🛡️
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-500">Badge</span>
            </button>

            {/* Toko (Locked) */}
            <button
              onClick={() => handleButtonClick(() => setActiveModal('TOKO'))}
              className="p-2.5 rounded-2xl bg-[#FFFDF3]/80 border-2 border-slate-300 shadow-[0_3px_0_#94A3B8] hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition relative"
            >
              <div className="absolute top-1.5 right-1.5 text-amber-600 bg-amber-100 p-0.5 rounded-full border border-amber-300">
                <Lock className="w-2.5 h-2.5" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-base grayscale">
                🏪
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-500">Toko</span>
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-10 w-full p-3 md:p-4 flex items-center justify-between bg-black/30 backdrop-blur-sm border-t border-white/10 text-white text-[11px] md:text-xs font-semibold">
        <span>© 2026 KKN Wedomartani • Versi 1.0</span>

        <button
          onClick={() => handleButtonClick(() => setActiveModal('ABOUT'))}
          className="px-3 py-1.5 rounded-full bg-[#FFFDF3] text-[#78350F] border-2 border-[#FDE68A] hover:bg-amber-50 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Tentang Kami</span>
        </button>
      </footer>

      {/* "PROFIL SAYA" MODAL POPUP */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* LEADERBOARD MODAL POPUP */}
      <LeaderboardView
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
      />

      {/* INTERACTIVE MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FFFDF3] max-w-lg w-full rounded-3xl p-6 border-4 border-[#FDE68A] shadow-2xl text-[#451A03] relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#FEF3C7] text-[#78350F] hover:bg-amber-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* MODAL LOCKED / COMING SOON (FOR MATERI, DAILY, BADGE, TOKO) */}
              {(activeModal === 'MATERI' || activeModal === 'DAILY' || activeModal === 'BADGE' || activeModal === 'TOKO') && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="inline-block bg-amber-200 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full mb-2 border border-amber-400">
                      🔒 FITUR SEGERA HADIR
                    </span>
                    <h3 className="text-2xl font-black text-[#78350F]">Coming Soon!</h3>
                    <p className="text-xs text-amber-900 mt-2 leading-relaxed max-w-xs mx-auto">
                      Fitur{' '}
                      <strong>
                        {activeModal === 'MATERI' && 'Materi Islami'}
                        {activeModal === 'DAILY' && 'Daily Challenge'}
                        {activeModal === 'BADGE' && 'Badge Pencapaian'}
                        {activeModal === 'TOKO' && 'Toko Amal Point'}
                      </strong>{' '}
                      sedang dalam pengembangan dan akan segera dibuka pada pembaruan versi berikutnya.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-800">
                    Fokus saat ini: Mode Kuis & Live Leaderboard Sosialisasi KKN 2026 ✨
                  </div>

                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 rounded-2xl bg-[#10B981] text-white font-bold text-sm shadow-md cursor-pointer"
                  >
                    MENGERTI
                  </button>
                </div>
              )}

              {/* MODAL PENGATURAN */}
              {activeModal === 'PENGATURAN' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-amber-200 pb-3">
                    <span className="text-3xl">⚙️</span>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#78350F]">Pengaturan Permainan</h3>
                      <p className="text-xs text-amber-800">Atur efek suara dan preferensi aplikasi</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#FEF3C7] rounded-2xl border border-[#F59E0B]">
                      <div className="flex items-center gap-3">
                        {isMuted ? <VolumeX className="w-6 h-6 text-red-500" /> : <Volume2 className="w-6 h-6 text-emerald-600" />}
                        <div>
                          <span className="font-bold text-sm text-[#78350F]">Efek Suara & Musik</span>
                          <p className="text-[11px] text-amber-800">Aktifkan suara tombol dan audio ambient</p>
                        </div>
                      </div>
                      <button
                        onClick={onToggleMute}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${isMuted ? 'bg-red-500 text-white' : 'bg-[#10B981] text-white'
                          }`}
                      >
                        {isMuted ? 'MUTE' : 'AKTIF'}
                      </button>
                    </div>

                    <div className="p-3 bg-[#F3E8FF] rounded-2xl border border-[#C084FC] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-[#6B21A8]">Panel Admin KKN</span>
                        <p className="text-[11px] text-purple-800">Khusus panitia mengelola bank soal</p>
                      </div>
                      <a
                        href="/admin"
                        className="px-3 py-1.5 bg-[#9333EA] text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
                      >
                        BUKA ADMIN
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL ABOUT */}
              {activeModal === 'ABOUT' && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#FEF3C7] border-2 border-[#F59E0B] text-4xl flex items-center justify-center mx-auto">
                    🕌
                  </div>
                  <h3 className="text-xl font-extrabold text-[#78350F]">Islamic Millionaire</h3>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Aplikasi web mini game edukasi keislaman yang mengadaptasi konsep kuis *Who Wants to Be a Millionaire*. Dibuat sebagai media sosialisasi interaktif pada kegiatan <strong>KKN Wedomartani 2026</strong>.
                  </p>

                  <div className="p-3 bg-[#DCFCE7] rounded-2xl border border-[#34D399] text-xs font-semibold text-[#065F46]">
                    Dikembangkan oleh Tim KKN Wedomartani 2026
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
