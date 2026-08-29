'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { EducationChapter } from '@/types/education';
import { Category, PlayerProfile } from '@/types/game';
import { ISLAMIC_CHAPTERS } from '@/data/islamicEducationData';
import { GameService } from '@/lib/gameService';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { audioManager } from '@/lib/audioManager';

interface EducationPortalProps {
  onBackToHome: () => void;
  onSelectCategory: (category: Category) => void;
  player?: PlayerProfile | null;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function EducationPortal({
  onBackToHome,
  onSelectCategory,
  player,
  isMuted = false,
  onToggleMute,
}: EducationPortalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);

  useEffect(() => {
    // Fetch profile and categories on mount
    const p = ProfileService.getProfile();
    setProfileData(p);

    GameService.getCategories().then((res) => {
      setCategories(res);
      setLoading(false);
    });
  }, []);

  // Filter categories strictly for Islamic theme (or fallback to initial if db empty)
  const islamicCategories = categories.filter(
    (c) => (c.theme_id || 'islamic') === 'islamic'
  );

  const displayProfile = profileData || player;
  const totalPoints = profileData ? ProfileService.getTotalPoints(profileData) : 320;
  const levelInfo = ProfileService.calculateLevelInfo(totalPoints);

  // Category Color Palette Mapper matching reference UI
  const getCategoryStyle = (categoryName: string, idx: number) => {
    const name = categoryName.toLowerCase();
    if (name.includes('aqidah')) {
      return {
        bg: 'bg-emerald-50/60',
        border: 'border-emerald-200/70',
        text: 'text-[#15803D]',
        iconBg: 'bg-emerald-100/70',
      };
    } else if (name.includes('qur')) {
      return {
        bg: 'bg-amber-50/60',
        border: 'border-amber-200/70',
        text: 'text-[#B45309]',
        iconBg: 'bg-amber-100/70',
      };
    } else if (name.includes('doa')) {
      return {
        bg: 'bg-purple-50/60',
        border: 'border-purple-200/70',
        text: 'text-[#6B21A8]',
        iconBg: 'bg-purple-100/70',
      };
    } else if (name.includes('fiqih') || name.includes('shalat') || name.includes('salat')) {
      return {
        bg: 'bg-sky-50/60',
        border: 'border-sky-200/70',
        text: 'text-[#0369A1]',
        iconBg: 'bg-sky-100/70',
      };
    } else if (name.includes('nabi') || name.includes('rasul') || name.includes('sirah')) {
      return {
        bg: 'bg-orange-50/60',
        border: 'border-orange-200/70',
        text: 'text-[#C2410C]',
        iconBg: 'bg-orange-100/70',
      };
    } else if (name.includes('akhlak')) {
      return {
        bg: 'bg-rose-50/60',
        border: 'border-rose-200/70',
        text: 'text-[#BE123C]',
        iconBg: 'bg-rose-100/70',
      };
    } else if (name.includes('hadits') || name.includes('adab')) {
      return {
        bg: 'bg-green-50/60',
        border: 'border-green-200/70',
        text: 'text-[#166534]',
        iconBg: 'bg-green-100/70',
      };
    } else if (name.includes('ramadhan') || name.includes('puasa') || name.includes('ibadah')) {
      return {
        bg: 'bg-yellow-50/60',
        border: 'border-yellow-200/70',
        text: 'text-[#A16207]',
        iconBg: 'bg-yellow-100/70',
      };
    } else if (name.includes('rukun')) {
      return {
        bg: 'bg-cyan-50/60',
        border: 'border-cyan-200/70',
        text: 'text-[#0284C7]',
        iconBg: 'bg-cyan-100/70',
      };
    } else if (name.includes('kehidupan') || name.includes('sehari')) {
      return {
        bg: 'bg-teal-50/60',
        border: 'border-teal-200/70',
        text: 'text-[#047857]',
        iconBg: 'bg-teal-100/70',
      };
    }

    const palettes = [
      { bg: 'bg-emerald-50/60', border: 'border-emerald-200/70', text: 'text-[#15803D]', iconBg: 'bg-emerald-100/70' },
      { bg: 'bg-amber-50/60', border: 'border-amber-200/70', text: 'text-[#B45309]', iconBg: 'bg-amber-100/70' },
      { bg: 'bg-purple-50/60', border: 'border-purple-200/70', text: 'text-[#6B21A8]', iconBg: 'bg-purple-100/70' },
      { bg: 'bg-sky-50/60', border: 'border-sky-200/70', text: 'text-[#0369A1]', iconBg: 'bg-sky-100/70' },
      { bg: 'bg-orange-50/60', border: 'border-orange-200/70', text: 'text-[#C2410C]', iconBg: 'bg-orange-100/70' },
      { bg: 'bg-rose-50/60', border: 'border-rose-200/70', text: 'text-[#BE123C]', iconBg: 'bg-rose-100/70' },
      { bg: 'bg-green-50/60', border: 'border-green-200/70', text: 'text-[#166534]', iconBg: 'bg-green-100/70' },
      { bg: 'bg-yellow-50/60', border: 'border-yellow-200/70', text: 'text-[#A16207]', iconBg: 'bg-yellow-100/70' },
    ];
    return palettes[idx % palettes.length];
  };

  const handleCategoryClick = (category: Category) => {
    audioManager.playClick();
    onSelectCategory(category);
  };

  return (
    <div
      className="min-h-screen w-full text-slate-800 p-3 sm:p-6 md:p-8 flex flex-col justify-between font-sans select-none relative overflow-y-auto"
      style={{
        backgroundImage: `url('/image/backgroundmateri1.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Soft Backdrop Overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Floating sticker decorations — blend with background, no box */}
      <img
        src="/image/sticker/islami/lentera2.png"
        alt=""
        aria-hidden="true"
        className="absolute top-6 left-6 w-14 sm:w-20 opacity-80 drop-shadow-lg pointer-events-none rotate-[-8deg] animate-[float_4s_ease-in-out_infinite]"
      />
      <img
        src="/image/sticker/islami/lentera2.png"
        alt=""
        aria-hidden="true"
        className="absolute top-6 right-6 w-14 sm:w-20 opacity-80 drop-shadow-lg pointer-events-none rotate-[8deg] animate-[float_4s_ease-in-out_0.5s_infinite]"
      />
      <img
        src="/image/sticker/islami/bulanmasjid.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-16 left-0 w-32 sm:w-44 opacity-30 pointer-events-none"
      />
      <img
        src="/image/sticker/islami/tumpukanbuku.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-10 right-0 w-28 sm:w-40 opacity-35 pointer-events-none"
      />

      {/* TOP HEADER BAR */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10 mb-4 sm:mb-6 gap-3">
        {/* Left: Back Button (<) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            audioManager.playClick();
            onBackToHome();
          }}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black/40 hover:bg-black/60 text-amber-200 border-2 border-amber-300/60 shadow-lg flex items-center justify-center cursor-pointer transition backdrop-blur-md"
          title="Kembali ke Menu Utama"
        >
          <ChevronLeft className="w-6 h-6 stroke-[3] text-amber-300" />
        </motion.button>

        {/* Right: Player Profiling Card with Volume Mute/Unmute Button */}
        <div className="flex items-center gap-3 ml-auto">
          <div
            className="relative rounded-2xl p-2 sm:p-2.5 flex items-center gap-3 shadow-xl border-2 border-[#FDE68A] overflow-hidden"
            style={{
              backgroundImage: `url('${profileData?.bg_profile || '/image/bgprofile/1.jpg'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay for optimal contrast */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px] pointer-events-none" />

            {/* Player Avatar */}
            <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
              <div className="w-[82%] h-[82%] rounded-full overflow-hidden flex items-center justify-center bg-amber-100 border border-amber-300">
                {displayProfile?.avatar?.startsWith('/') ? (
                  <img src={displayProfile.avatar} alt={displayProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl">{displayProfile?.avatar || '👳'}</span>
                )}
              </div>
              <img
                src={profileData?.border_frame || '/image/border/1.png'}
                alt="Frame"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-125"
              />
            </div>

            {/* Player Info */}
            <div className="relative z-10 space-y-0.5 text-left bg-[#FFFDF3]/90 px-2.5 py-1 rounded-xl backdrop-blur-xs border border-amber-200 shadow-xs">
              <div className="text-[10px] sm:text-xs font-semibold text-slate-600 leading-none">Assalamu'alaikum!</div>
              <div className="text-xs sm:text-sm font-black text-[#451A03] tracking-wide truncate max-w-[120px] sm:max-w-[160px]">
                {displayProfile?.name || 'Aisyah Nur'}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="bg-[#FBBF24] text-[#78350F] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  Level {levelInfo.level}
                </span>
                <span className="text-[10px] sm:text-xs font-extrabold text-amber-900 flex items-center gap-0.5">
                  ⭐ {totalPoints.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Volume Mute/Unmute Button */}
            {onToggleMute && (
              <button
                onClick={() => {
                  audioManager.playClick();
                  onToggleMute();
                }}
                className="relative z-10 p-2 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer ml-1 shadow-sm"
                title={isMuted ? 'Aktifkan Suara' : 'Matikan Suara'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN BODY (2 COLUMNS: BANNER LEFT + CATEGORIES GRID RIGHT) */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch z-10 my-auto">

        {/* LEFT COLUMN: BANNER — no white box, blends with bg */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center text-center relative overflow-hidden py-8 px-2 gap-6">

          {/* Logo Islamic Millionaire — entrance + float animation matching WelcomeScreen */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: [0, -4, 0], scale: 1 }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 0.5 },
              y: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
            }}
            className="w-56 sm:w-72 mx-auto"
          >
            <img
              src="/image/logo.png"
              alt="Islamic Millionaire Logo"
              className="w-full h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] pointer-events-none transition-all duration-500 mx-auto"
            />
          </motion.div>

          {/* Title & Tagline Container with high-contrast card shade */}
          <div className="bg-[#FFFDF3]/95 border-2 border-amber-300/80 shadow-xl rounded-3xl p-5 sm:p-6 backdrop-blur-md max-w-xs sm:max-w-sm mx-auto space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-black text-[#15803D] tracking-tight drop-shadow-xs">
              Materi Islami
            </h1>
            <div className="h-0.5 w-16 bg-emerald-500/40 mx-auto rounded-full" />
            <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">
              Belajar Islam jadi lebih mudah dan menyenangkan!
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: CATEGORIES GRID — transparent, blending */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">

          {/* Header Title with card box shade */}
          <div className="text-center bg-[#FFFDF3]/95 border-2 border-amber-300/80 rounded-2xl p-3 shadow-md backdrop-blur-md max-w-md mx-auto w-full">
            <div className="flex items-center justify-center gap-3">
              <img
                src="/image/sticker/islami/alquran2.png"
                alt=""
                aria-hidden="true"
                className="w-7 sm:w-8 h-auto drop-shadow"
              />
              <h2 className="text-lg sm:text-xl font-black text-[#78350F]">
                Pilih Kategori Materi
              </h2>
              <img
                src="/image/sticker/islami/alquran2.png"
                alt=""
                aria-hidden="true"
                className="w-7 sm:w-8 h-auto drop-shadow scale-x-[-1]"
              />
            </div>
          </div>

          {/* CATEGORIES GRID */}
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700 drop-shadow-sm">Memuat Kategori Database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 my-auto">
              {islamicCategories.map((cat, idx) => {
                const style = getCategoryStyle(cat.name, idx);
                const categoryIcon = cat.icon || '🕌';
                const isImageIcon = categoryIcon.startsWith('/') || categoryIcon.startsWith('http');
                return (
                  <motion.div
                    key={cat.id || idx}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCategoryClick(cat)}
                    className="bg-[#FFFDF3] hover:bg-amber-50 border-2 border-[#FDE68A] shadow-[0_4px_0_#D97706] rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition active:translate-y-1 active:shadow-none"
                  >
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#FEF3C7] border-2 border-[#F59E0B] flex items-center justify-center text-2xl sm:text-3xl shadow-xs overflow-hidden">
                      {isImageIcon ? (
                        <img
                          src={categoryIcon}
                          alt={cat.name}
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                        />
                      ) : (
                        <span className="select-none">
                          {categoryIcon}
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#78350F] leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Bottom Badge Info */}
          <div className="pt-3 border-t border-amber-300/40 flex items-center justify-between text-xs font-bold">
            <div className="px-3.5 py-1.5 rounded-full bg-[#15803D]/90 text-white font-extrabold text-xs flex items-center gap-2 shadow-md backdrop-blur-sm">
              <img
                src="/image/sticker/islami/alquranscreen.png"
                alt=""
                aria-hidden="true"
                className="w-4 h-4 object-contain"
              />
              <span>{islamicCategories.length} Kategori Islami Terdaftar</span>
            </div>

            <img
              src="/image/sticker/islami/tasbihscreen.png"
              alt="Tasbih"
              className="w-9 h-9 object-contain drop-shadow"
              title="Subhanallah"
            />
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="text-center text-[11px] text-slate-600 font-bold z-10 pt-3 border-t border-amber-300/30 max-w-6xl w-full mx-auto drop-shadow-sm">
        KKN Wedomartani 2026 — Modul Pembelajaran Materi Edukasi Islami Interaktif
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--tw-rotate, 0deg)); }
          50% { transform: translateY(-8px) rotate(var(--tw-rotate, 0deg)); }
        }
      `}</style>
    </div>
  );
}
