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
import { AppTheme, THEME_CONFIGS, getThemeConfig } from '@/lib/themeConfig';
import { UserProfileModal } from './UserProfileModal';
import { LeaderboardView } from './LeaderboardView';
import { AuthModal } from './AuthModal';
import { ThemeSelectModal } from './ThemeSelectModal';

interface WelcomeScreenProps {
  onStart: () => void;
  onOpenRoomJoin?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenEducation?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  userProfile?: UserProfileData;
  onProfileUpdated?: (updated: UserProfileData) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onOpenRoomJoin,
  onOpenLeaderboard,
  onOpenEducation,
  isMuted,
  onToggleMute,
  userProfile: initialProfile,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfileData | null>(initialProfile || ProfileService.getProfile());
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showThemeSelectModal, setShowThemeSelectModal] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<
    'MATERI' | 'PENGATURAN' | 'DAILY' | 'BADGE' | 'TOKO' | 'ABOUT' | null
  >(null);

  const [activeTheme, setActiveTheme] = useState<AppTheme>('islamic');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    // Load saved theme preference, or show Theme Selection Modal if not set yet
    const savedTheme = localStorage.getItem('app_theme') as AppTheme;
    if (savedTheme && savedTheme in THEME_CONFIGS) {
      setActiveTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      setShowThemeSelectModal(true);
    }
    // Check local storage and sync with Supabase
    ProfileService.fetchProfileFromServer().then((p) => {
      if (p) {
        setProfile(p);
        if (onProfileUpdated) onProfileUpdated(p);
      } else {
        const local = ProfileService.getProfile();
        setProfile(local);
        if (!local) {
          setShowAuthModal(true); // Popup Login/Register modal automatically when not logged in
        }
      }
    });
  }, []);

  const handleSelectTheme = (themeId: AppTheme) => {
    audioManager.playClick();
    setActiveTheme(themeId);
    localStorage.setItem('app_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const themeConfig = getThemeConfig(activeTheme);

  const handleButtonClick = (action: () => void) => {
    audioManager.playClick();
    action();
  };

  const handleProfileUpdated = (updated: UserProfileData) => {
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleAuthSuccess = async () => {
    const p = await ProfileService.fetchProfileFromServer();
    if (p) {
      setProfile(p);
      if (onProfileUpdated) onProfileUpdated(p);
    }
  };


  return (
    <div
      suppressHydrationWarning
      className="relative w-full h-screen max-h-screen main-menu-bg select-none flex flex-col justify-between font-sans overflow-hidden transition-all duration-700"
      style={{
        backgroundImage: `url('${themeConfig.bgImage || '/image/mainmenubg1.jpg'}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark Subtle Overlay for Optimal Contrast */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="relative z-10 w-full p-2.5 md:p-3.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Ganti Tema Button (Triggers Theme Selection Modal) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleButtonClick(() => setShowThemeSelectModal(true))}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/50 backdrop-blur-md border-2 border-amber-300/60 shadow-lg text-white font-extrabold text-xs md:text-sm transition cursor-pointer hover:border-amber-400"
        >
          <span className="text-base">🎨</span>
          <span>Tema:</span>
          <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black text-xs flex items-center gap-1 shadow-sm">
            <span>{themeConfig.icon}</span>
            <span>{themeConfig.name}</span>
          </span>
        </motion.button>

        {/* Right Top User Profile Card (Clicking Opens "Profil Saya" Modal) */}
        {isMounted && profile && profile.id ? (
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
              <div className="w-[82%] h-[82%] rounded-full flex items-center justify-center overflow-hidden absolute z-0 -translate-y-0.5">
                {profile.avatar.startsWith('/') ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover object-center scale-105"
                  />
                ) : (
                  <span className="text-2xl md:text-3xl">{profile.avatar}</span>
                )}
              </div>
              <img
                src={profile.border_frame || profile.border_color || '/image/border/1.png'}
                alt="Bingkai Profile"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-125"
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
                  Lv. {ProfileService.calculateLevelInfo(ProfileService.getTotalPoints(profile)).level}
                </span>
              </div>

              {/* Level XP Bar */}
              <div className="w-28 md:w-36 bg-[#E2E8F0] h-2 rounded-full overflow-hidden border border-[#CBD5E1]">
                <div
                  className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                  style={{ width: `${ProfileService.calculateLevelInfo(ProfileService.getTotalPoints(profile)).progressPercent}%` }}
                />
              </div>

              {/* Total Combined Points Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">
                  🌐
                </div>
                <span>{ProfileService.getTotalPoints(profile).toLocaleString('id-ID')} Total Poin</span>
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
        ) : isMounted ? (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleButtonClick(() => setShowAuthModal(true))}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-extrabold px-6 py-2.5 rounded-full border-2 border-white shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer ml-auto"
          >
            Masuk / Daftar
          </motion.button>
        ) : (
          <div className="h-12 ml-auto pointer-events-none opacity-0" />
        )}
      </header>

      {/* MAIN MENU CONTENT AREA (LEFT SIDE NAVIGATION & BUTTONS) */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-2 flex flex-col flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-md w-full mx-auto md:mx-0 flex flex-col flex-1 h-full justify-between py-1">
          {/* GAME LOGO IMAGE AT TOP END WITH FLOATING ANIMATION */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: [0, -4, 0], scale: 1 }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 },
              y: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
            }}
            className="relative flex items-center justify-center animate-floating-logo pt-1 pb-2 flex-1 min-h-[140px]"
          >
            <img
              src={themeConfig.logoMenu || '/image/logo.png'}
              alt={`${themeConfig.name} Quiz Logo`}
              className="w-full h-full max-h-[380px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] pointer-events-none transition-all duration-500 mx-auto"
            />
          </motion.div>

          {/* FLEXIBLE EMPTY SPACER BETWEEN LOGO AND BUTTONS */}
          <div className="flex-1 min-h-[8px] max-h-[32px]" />

          {/* MAIN VERTICAL BUTTON MENU AT BOTTOM END */}
          <div className="space-y-2 md:space-y-2.5 pb-1">
            <div className="space-y-1.5 md:space-y-2">
              {/* 🟢 MULAI BERMAIN (BIG GREEN BUTTON - ACTIVE) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleButtonClick(() => {
                  if (profile && profile.id) {
                    onStart();
                  } else {
                    setShowAuthModal(true);
                  }
                })}
                className="w-full py-2.5 md:py-3 px-4 rounded-xl md:rounded-2xl green-btn-3d font-extrabold text-sm md:text-base flex items-center justify-between transition cursor-pointer"
              >
                <div className="w-7.5 h-7.5 md:w-8 md:h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current text-white translate-x-0.5" />
                </div>
                <span className="tracking-wide text-white drop-shadow-md">MULAI BERMAIN</span>
                <ChevronRight className="w-5 h-5 text-white/80" />
              </motion.button>

              {/* 🎮 MASUK ROOM PIN KUIS (KAHOOT STYLE - ACTIVE) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleButtonClick(() => {
                  if (profile && profile.id) {
                    if (onOpenRoomJoin) onOpenRoomJoin();
                  } else {
                    setShowAuthModal(true);
                  }
                })}
                className="w-full py-2 md:py-2.5 px-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold text-xs md:text-sm flex items-center justify-between border-2 border-amber-300 shadow-[0_3.5px_0_#B45309] transition cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 md:w-7.5 md:h-7.5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-xs md:text-sm">
                    🎮
                  </div>
                  <span className="tracking-wide text-white drop-shadow-sm font-black">MASUK ROOM PIN KUIS</span>
                </div>
                <div className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs border border-red-400">
                  <span>⚡ LIVE PIN</span>
                </div>
              </motion.button>

              {/* 📜 MATERI EDUKASI INTERAKTIF */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleButtonClick(() => {
                  if (onOpenEducation) {
                    onOpenEducation();
                  } else {
                    setActiveModal('MATERI');
                  }
                })}
                className="w-full py-2 px-4 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] border-2 border-[#81C784] shadow-[0_3px_0_#388E3C] text-[#1B5E20] font-extrabold text-xs md:text-sm flex items-center justify-between transition cursor-pointer relative"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs">
                    📖
                  </div>
                  <span className="tracking-wide uppercase font-black text-[#1B5E20]">MATERI EDUKASI</span>
                </div>
                <div className="flex items-center gap-1 bg-[#2D6A4F] text-[#FDE68A] text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs border border-amber-300">
                  <span>✨ INTERACTIVE</span>
                </div>
              </motion.button>

              {/* 🏆 LEADERBOARD (ACTIVE) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleButtonClick(() => {
                  if (profile && profile.id) {
                    setShowLeaderboardModal(true);
                  } else {
                    setShowAuthModal(true);
                  }
                })}
                className="w-full py-1.5 md:py-2 px-4 rounded-xl cream-btn-3d font-bold text-xs md:text-sm flex items-center justify-between transition cursor-pointer"
              >
                <div className="w-6.5 h-6.5 md:w-7 md:h-7 rounded-full bg-[#FEF3C7] border-2 border-[#F59E0B] flex items-center justify-center text-xs">
                  🏆
                </div>
                <span className="tracking-wide">LEADERBOARD</span>
                <ChevronRight className="w-4 h-4 text-[#B45309]" />
              </motion.button>

              {/* ⚙️ PENGATURAN (ACTIVE) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleButtonClick(() => setActiveModal('PENGATURAN'))}
                className="w-full py-1.5 md:py-2 px-4 rounded-xl cream-btn-3d font-bold text-xs md:text-sm flex items-center justify-between transition cursor-pointer"
              >
                <div className="w-6.5 h-6.5 md:w-7 md:h-7 rounded-full bg-[#E0F2FE] border-2 border-[#38BDF8] flex items-center justify-center text-xs">
                  ⚙️
                </div>
                <span className="tracking-wide">PENGATURAN</span>
                <ChevronRight className="w-4 h-4 text-[#B45309]" />
              </motion.button>
            </div>

            {/* BOTTOM QUICK WIDGET BUTTONS (Daily Challenge, Badge, Toko - LOCKED) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Daily Challenge (Locked) */}
              <button
                onClick={() => handleButtonClick(() => {
                  if (profile && profile.id) {
                    setActiveModal('DAILY');
                  } else {
                    setShowAuthModal(true);
                  }
                })}
                className="p-1.5 rounded-xl bg-[#FFFDF3]/90 border-2 border-slate-300 shadow-[0_2px_0_#94A3B8] hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition relative"
              >
                <div className="absolute top-1 right-1 text-amber-600 bg-amber-100 p-0.5 rounded-full border border-amber-300">
                  <Lock className="w-2 h-2" />
                </div>
                <div className="w-5.5 h-5.5 rounded-lg bg-slate-200 flex items-center justify-center text-xs grayscale">
                  📅
                </div>
                <span className="text-[9px] font-bold text-slate-500 leading-none">
                  Daily Challenge
                </span>
              </button>

              {/* Badge (Locked) */}
              <button
                onClick={() => handleButtonClick(() => {
                  if (profile && profile.id) {
                    setActiveModal('BADGE');
                  } else {
                    setShowAuthModal(true);
                  }
                })}
                className="p-1.5 rounded-xl bg-[#FFFDF3]/90 border-2 border-slate-300 shadow-[0_2px_0_#94A3B8] hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition relative"
              >
                <div className="absolute top-1 right-1 text-amber-600 bg-amber-100 p-0.5 rounded-full border border-amber-300">
                  <Lock className="w-2 h-2" />
                </div>
                <div className="w-5.5 h-5.5 rounded-lg bg-slate-200 flex items-center justify-center text-xs grayscale">
                  🛡️
                </div>
                <span className="text-[9px] font-bold text-slate-500 leading-none">Badge</span>
              </button>

              {/* Toko (Locked) */}
              <button
                onClick={() => handleButtonClick(() => {
                  if (profile && profile.id) {
                    setActiveModal('TOKO');
                  } else {
                    setShowAuthModal(true);
                  }
                })}
                className="p-1.5 rounded-xl bg-[#FFFDF3]/90 border-2 border-slate-300 shadow-[0_2px_0_#94A3B8] hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition relative"
              >
                <div className="absolute top-1 right-1 text-amber-600 bg-amber-100 p-0.5 rounded-full border border-amber-300">
                  <Lock className="w-2 h-2" />
                </div>
                <div className="w-5.5 h-5.5 rounded-lg bg-slate-200 flex items-center justify-center text-xs grayscale">
                  🏪
                </div>
                <span className="text-[9px] font-bold text-slate-500 leading-none">Toko</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-10 w-full p-2 md:p-2.5 flex items-center justify-between bg-black/30 backdrop-blur-sm border-t border-white/10 text-white text-[10px] md:text-xs font-semibold">
        <span>© 2026 KKN Wedomartani • Versi 1.0</span>

        <button
          onClick={() => handleButtonClick(() => setActiveModal('ABOUT'))}
          className="px-2.5 py-1 rounded-full bg-[#FFFDF3] text-[#78350F] border-2 border-[#FDE68A] hover:bg-amber-50 flex items-center gap-1 transition shadow-sm cursor-pointer text-[10px] md:text-xs"
        >
          <BookOpen className="w-3 h-3 text-[#B45309]" />
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <ThemeSelectModal
        isOpen={showThemeSelectModal}
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
        onClose={() => setShowThemeSelectModal(false)}
      />
    </div>
  );
};
