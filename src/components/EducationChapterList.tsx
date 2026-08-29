'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { Category, PlayerProfile } from '@/types/game';
import { MateriChapter } from '@/types/education';
import { EducationService } from '@/lib/educationService';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { audioManager } from '@/lib/audioManager';
import { ChevronLeft } from 'lucide-react';

interface EducationChapterListProps {
  category: Category;
  onBack: () => void;
  onSelectChapter: (chapter: MateriChapter) => void;
  player?: PlayerProfile | null;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function EducationChapterList({
  category,
  onBack,
  onSelectChapter,
  player,
  isMuted = false,
  onToggleMute,
}: EducationChapterListProps) {
  const [chapters, setChapters] = useState<MateriChapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(9);

  // Dynamic grid & items per page based on viewport width
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setItemsPerPage(4); // Mobile: 2x2 grid (max 4)
      } else if (w < 1024) {
        setItemsPerPage(8); // Tablet: 2x4 grid (max 8)
      } else {
        setItemsPerPage(9); // Desktop: 3x3 grid (max 9)
      }
    };

    handleResize(); // Init on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch chapters and profile
  useEffect(() => {
    const p = ProfileService.getProfile();
    setProfileData(p);

    setLoading(true);
    EducationService.getChaptersByCategory(category.id, false)
      .then((res) => {
        setChapters(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching chapters:', err);
        setLoading(false);
      });
  }, [category.id]);

  const handleBack = () => {
    audioManager.playClick();
    onBack();
  };

  const handleChapterClick = (chapter: MateriChapter) => {
    audioManager.playClick();
    onSelectChapter(chapter);
  };

  // Pagination calculation
  const totalPages = Math.ceil(chapters.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentChapters = chapters.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      audioManager.playClick();
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      audioManager.playClick();
      setCurrentPage((prev) => prev - 1);
    }
  };

  const displayProfile = profileData || player;
  const totalPoints = profileData ? ProfileService.getTotalPoints(profileData) : 320;
  const levelInfo = ProfileService.calculateLevelInfo(totalPoints);

  return (
    <div
      className="min-h-screen w-full flex flex-col p-3 sm:p-5 bg-cover bg-center bg-no-repeat select-none"
      style={{ backgroundImage: "url('/image/backgroundmateri1.png')" }}
    >
      {/* ROW 1: Navigasi — [Kembali] [spasi] [Profil card] */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 mb-3 z-10">

        {/* Back Button — AR ~2.5:1, object-contain */}
        <button
          onClick={handleBack}
          className="flex-shrink-0 h-11 w-32 sm:h-14 sm:w-44 hover:scale-105 active:scale-95 active:brightness-90 transition cursor-pointer"
          title="Kembali ke Portal Kategori"
        >
          <img
            src="/image/elemenbuku/kembalibutton.png"
            alt="Kembali"
            className="w-full h-full object-contain"
          />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profil card — identik dengan EducationPortal */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="relative rounded-2xl p-2 sm:p-2.5 flex items-center gap-3 shadow-xl border-2 border-[#FDE68A] overflow-hidden"
            style={{
              backgroundImage: `url('${profileData?.bg_profile || '/image/bgprofile/1.jpg'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px] pointer-events-none" />

            {/* Avatar + border frame */}
            <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
              <div className="w-[82%] h-[82%] rounded-full overflow-hidden flex items-center justify-center bg-amber-100 border border-amber-300">
                {displayProfile?.avatar?.startsWith('/') ? (
                  <img src={displayProfile.avatar} alt={displayProfile?.name} className="w-full h-full object-cover" />
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

            {/* Nama, Level, XP */}
            <div className="relative z-10 space-y-0.5 text-left bg-[#FFFDF3]/90 px-2.5 py-1 rounded-xl backdrop-blur-xs border border-amber-200 shadow-xs">
              <div className="text-[10px] sm:text-xs font-semibold text-slate-600 leading-none">Assalamu'alaikum!</div>
              <div className="text-xs sm:text-sm font-black text-[#451A03] tracking-wide truncate max-w-[100px] sm:max-w-[140px]">
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

            {/* Mute toggle di dalam card */}
            {onToggleMute && (
              <button
                onClick={() => { audioManager.playClick(); onToggleMute(); }}
                className="relative z-10 p-2 rounded-xl bg-amber-100/90 hover:bg-amber-200 border border-amber-300 transition cursor-pointer ml-1 shadow-sm"
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

      {/* ROW 2: Banner Judul Kategori */}
      {/*
        backgroundChapter.png — AR ~5:1.
        Container height: clamp(44–62px).
        PENTING: pt-[n%] dihitung dari LEBAR container (bukan tinggi), jadi harus pakai px tetap.
        Area pita merah (teks) = atas ~55% container → pt-3 (12px) untuk tinggi 44-62px.
      */}
      <div className="w-full max-w-2xl mx-auto mb-4 z-10">
        <div className="relative w-full" style={{ height: 'clamp(64px, 10vw, 90px)' }}>
          <img
            src="/image/elemenbuku/backgroundChapter.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-fill"
          />
          {/* Teks melengkung mengikuti bentuk pita — SVG textPath */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 600 60"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              aria-label={category.name}
            >
              <defs>
                {/* Kurva landai ke atas di tengah, cocok dengan bentuk pita ribbon */}
                <path id="ribbonCurve" d="M 30,38 Q 300,8 570,38" />
              </defs>
              <text
                fontFamily="inherit"
                fontWeight="900"
                fontSize="22"
                fill="white"
                textAnchor="middle"
                dominantBaseline="auto"
                letterSpacing="4"
                style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.6))' }}
              >
                <textPath href="#ribbonCurve" startOffset="50%">
                  {category.name.toUpperCase()}
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>


      {/* CHAPTERS GRID / LIST AREA */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center z-10">
        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-base font-black text-amber-950 drop-shadow">Memuat Daftar Materi...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-12 bg-[#FFFDF3]/90 border-2 border-amber-300/80 rounded-3xl p-8 max-w-sm mx-auto shadow-lg backdrop-blur-xs">
            <p className="text-base sm:text-lg font-black text-amber-950 mb-2">Materi Belum Tersedia</p>
            <p className="text-sm font-bold text-slate-600">Guru belum menambahkan modul belajar di kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 py-3 max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {currentChapters.map((chapter) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, scale: 0.9, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -14 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleChapterClick(chapter)}
                  className="bg-[#FFFDF3] hover:bg-amber-50 border-2 border-[#FDE68A] shadow-[0_6px_0_#D97706] rounded-2xl px-5 py-5 sm:px-6 sm:py-6 flex flex-col justify-between items-center text-center cursor-pointer transition active:translate-y-1.5 active:shadow-none min-h-[120px] sm:min-h-[150px]"
                >
                  {/* Judul Materi Utama */}
                  <h3 className="text-sm sm:text-base md:text-lg font-black text-amber-950 leading-snug line-clamp-3 my-auto">
                    {chapter.title}
                  </h3>

                  {/* Lencana Halaman */}
                  <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <span className="text-xs">📖</span>
                    <span className="text-xs font-black tracking-wide">
                      {chapter.total_pages} Halaman
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* FOOTER & PAGINATION CONTROL */}
      <footer className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 z-10 mt-4 pb-2">
        {/* Pagination Buttons (Only show if totalPages > 1) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 w-full">
            {/* Prev Button */}
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`h-12 w-16 sm:h-14 sm:w-20 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center ${
                currentPage === 1 ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <img
                src="/image/elemenbuku/back.png"
                alt="Sebelumnya"
                className="w-full h-full object-contain"
              />
            </button>

            {/* Page indicator — nohalaman.png: cream board on top, red bookmark on bottom.
                Text must sit in the TOP portion (cream area) of the image */}
            <div className="relative h-16 sm:h-20 w-44 sm:w-56 flex-shrink-0">
              <img
                src="/image/elemenbuku/nohalaman.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-fill"
              />
              {/* Position text in top ~55% where the cream board is */}
              <div className="absolute inset-0 flex items-start justify-center pt-[10%] sm:pt-[8%]">
                <span className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-wider drop-shadow-sm">
                  Hal {currentPage} / {totalPages}
                </span>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`h-12 w-16 sm:h-14 sm:w-20 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center ${
                currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <img
                src="/image/elemenbuku/next.png"
                alt="Berikutnya"
                className="w-full h-full object-contain"
              />
            </button>
          </div>
        )}

        {/* Footer Credit Text */}
        <div className="text-center text-[11px] text-amber-950/80 font-bold bg-[#FFFDF3]/50 px-4 py-1.5 rounded-full backdrop-blur-xs">
          KKN Wedomartani 2026 — Modul Pembelajaran Materi Edukasi Islami
        </div>
      </footer>
    </div>
  );

}
