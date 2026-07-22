'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, X, Sparkles } from 'lucide-react';
import { LeaderboardEntry } from '@/types/game';
import { GameService } from '@/lib/gameService';
import { audioManager } from '@/lib/audioManager';
import { ProfileService, UserProfileData } from '@/lib/profileService';

interface LeaderboardViewProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBack?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  isOpen = true,
  onClose,
  onBack,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile] = useState<UserProfileData>(ProfileService.getProfile());

  const handleClose = () => {
    audioManager.playClick();
    if (onClose) onClose();
    else if (onBack) onBack();
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    const data = await GameService.getLeaderboard(20);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `#${index + 1}`;
    }
  };

  const currentBgProfile = userProfile.bg_profile || '/image/bgprofile/1.jpg';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="border-4 border-[#FDE68A] max-w-2xl w-full rounded-[32px] p-4 sm:p-5 md:p-6 pt-9 text-[#1E293B] relative my-auto overflow-visible shadow-2xl"
        >
          {/* Inner Background & Overlay Wrapper */}
          <div
            className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none"
            style={{
              backgroundImage: `url('${currentBgProfile}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Soft glass contrast overlay */}
            <div className="absolute inset-0 bg-[#FFFDF3]/85 backdrop-blur-[1px]" />
          </div>

          {/* TOP CURVED GOLDEN RIBBON HEADER BADGE */}
          <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-30 pointer-events-auto">
            <div className="bg-gradient-to-r from-[#D97706] via-[#B45309] to-[#78350F] border-2 border-white px-7 py-1.5 md:px-9 md:py-2 rounded-full font-black text-base md:text-xl text-white shadow-xl flex items-center gap-2 tracking-wide shadow-amber-600/40">
              <Trophy className="w-5 h-5 text-yellow-300 fill-current" />
              <span>Papan Peringkat</span>
              <Trophy className="w-5 h-5 text-yellow-300 fill-current" />
            </div>
          </div>

          {/* TOP RIGHT CLOSE BUTTON (X) */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#B45309] hover:bg-amber-800 text-white flex items-center justify-center border-2 border-white shadow-md transition cursor-pointer z-30"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" />
          </button>

          {/* SUBTITLE & REFRESH ACTION BAR */}
          <div className="relative z-10 flex items-center justify-between mt-2 mb-3 pb-2.5 border-b-2 border-amber-200/80">
            <div>
              <h3 className="text-base md:text-lg font-black text-[#78350F] flex items-center gap-2">
                <span>Top Skor Sosialisasi KKN</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
              </h3>
              <p className="text-xs text-amber-800 font-semibold">Pemain dengan perolehan Poin Amal tertinggi</p>
            </div>

            <button
              onClick={() => {
                audioManager.playClick();
                fetchLeaderboard();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-[#FEF3C7] hover:bg-amber-200 text-[#78350F] font-extrabold text-xs border-2 border-[#FDE68A] transition cursor-pointer shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B45309] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* LEADERBOARD CONTENT AREA */}
          {loading ? (
            <div className="relative z-10 py-16 text-center text-amber-900 font-bold text-sm flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Memuat data peringkat terkini...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="relative z-10 py-16 text-center text-amber-900/70 font-semibold text-sm space-y-1">
              <div className="text-4xl mb-2">🏆</div>
              <p>Belum ada skor tercatat.</p>
              <p className="text-xs text-amber-700">Jadilah pemain pertama yang memenangkan kuis!</p>
            </div>
          ) : (
            <div className="relative z-10 space-y-2 max-h-[360px] md:max-h-[400px] overflow-y-auto pr-1.5 custom-scrollbar">
              {entries.map((entry, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;
                const isCurrentPlayer = entry.player_name === userProfile.name;
                const playerBorder = isCurrentPlayer
                  ? (userProfile.border_frame || userProfile.border_color || '/image/border/1.png')
                  : '/image/border/1.png';

                return (
                  <div
                    key={entry.id || index}
                    className={`flex items-center justify-between p-2.5 md:p-3 rounded-2xl border-2 text-sm transition ${
                      isTop1
                        ? 'bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B]/20 border-[#F59E0B] shadow-md'
                        : isTop2
                        ? 'bg-gradient-to-r from-slate-100 via-slate-200/90 to-slate-300/30 border-slate-400 shadow-sm'
                        : isTop3
                        ? 'bg-gradient-to-r from-amber-100/90 via-orange-100/70 to-amber-200/30 border-amber-500/70 shadow-sm'
                        : 'bg-white/90 border-slate-200 text-slate-700 hover:border-amber-300 shadow-xs'
                    }`}
                  >
                    {/* LEFT SIDE: RANK + AVATAR + NAME */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <span className={`w-7 text-center text-base md:text-lg font-black flex-shrink-0 ${
                        isTop1 ? 'text-amber-700' : isTop2 ? 'text-slate-700' : isTop3 ? 'text-orange-800' : 'text-slate-500 text-sm'
                      }`}>
                        {getRankBadge(index)}
                      </span>

                      {/* Avatar with Dynamic PNG Border Frame Overlay */}
                      <div className="relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center flex-shrink-0">
                        <div className="w-[78%] h-[78%] rounded-full bg-[#FEF3C7] flex items-center justify-center overflow-hidden shadow-inner border border-amber-300">
                          {entry.player_avatar && entry.player_avatar.startsWith('/') ? (
                            <img src={entry.player_avatar} alt={entry.player_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{entry.player_avatar || '👦🏻'}</span>
                          )}
                        </div>
                        <img
                          src={playerBorder}
                          alt="Bingkai"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
                        />
                      </div>

                      {/* Name & Subtext */}
                      <div className="min-w-0">
                        <span className="font-extrabold text-[#1E293B] block truncate leading-tight text-sm md:text-base">
                          {entry.player_name} {isCurrentPlayer && <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-md ml-1">(Anda)</span>}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block truncate">
                          Benar {entry.correct_count} • Waktu {entry.duration_seconds}s
                        </span>
                      </div>
                    </div>

                    {/* RIGHT SIDE: SCORE */}
                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="font-black text-amber-800 text-base md:text-lg block leading-tight">
                        {entry.score.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-amber-900 font-black tracking-wider uppercase block">
                        Poin Amal
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER NOTE */}
          <div className="relative z-10 mt-3 pt-2.5 border-t border-amber-200/60 text-center">
            <p className="text-[11px] text-amber-900/80 font-bold">
              ✨ KKN Wedomartani 2026 • Terus kumpulkan Poin Amal dan raih posisi teratas!
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
