'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Palette, ChevronRight } from 'lucide-react';
import { AppTheme, THEME_CONFIGS, ThemeDefinition } from '@/lib/themeConfig';
import { audioManager } from '@/lib/audioManager';

interface ThemeSelectModalProps {
  isOpen: boolean;
  activeTheme: AppTheme;
  onSelectTheme: (themeId: AppTheme) => void;
  onClose: () => void;
}

export const ThemeSelectModal: React.FC<ThemeSelectModalProps> = ({
  isOpen,
  activeTheme,
  onSelectTheme,
  onClose,
}) => {
  if (!isOpen) return null;

  const themesList: ThemeDefinition[] = [
    THEME_CONFIGS.islamic,
    THEME_CONFIGS.independence,
    THEME_CONFIGS.culture,
  ];

  const handleSelect = (themeId: AppTheme) => {
    audioManager.playClick();
    onSelectTheme(themeId);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#FFFDF3] border-4 border-[#FDE68A] max-w-xl w-full rounded-[32px] p-6 md:p-8 shadow-2xl text-[#1E293B] relative pt-10 my-auto"
        >
          {/* TOP CURVED RIBBON BADGE */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 border-2 border-white px-8 py-2.5 rounded-full font-black text-lg md:text-xl text-white shadow-xl flex items-center gap-2 tracking-wide shadow-amber-500/40">
              <Palette className="w-5 h-5" />
              <span>Pilih Tema Kuis</span>
              <Sparkles className="w-5 h-5 text-yellow-200" />
            </div>
          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2.5 rounded-2xl bg-[#FEF3C7] text-[#78350F] hover:bg-amber-200 transition cursor-pointer border border-[#F59E0B]/40"
          >
            <X className="w-5 h-5" />
          </button>

          {/* MODAL HEADER INFO */}
          <div className="text-center mb-6 mt-1">
            <h3 className="text-xl md:text-2xl font-black text-[#451A03] tracking-tight">
              Selamat Datang! Selamat Berkompetisi ✨
            </h3>
            <p className="text-xs md:text-sm text-amber-900 font-semibold mt-1">
              Pilih tema visual & materi kuis yang ingin Anda mainkan saat ini:
            </p>
          </div>

          {/* THEME CARDS LIST */}
          <div className="space-y-3.5 mb-6">
            {themesList.map((t) => {
              const isSelected = activeTheme === t.id;
              return (
                <motion.div
                  key={t.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(t.id)}
                  className={`p-4 md:p-5 rounded-2xl border-3 cursor-pointer transition relative overflow-hidden flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-[#F59E0B] shadow-lg ring-2 ring-[#F59E0B]'
                      : 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 shadow-sm'
                  }`}
                >
                  {/* LEFT ICON & INFO */}
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-200 to-yellow-300 border-2 border-amber-400 flex items-center justify-center text-3xl md:text-4xl shadow-md flex-shrink-0">
                      {t.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base md:text-lg text-[#451A03] leading-none">
                          {t.name}
                        </span>
                        {isSelected && (
                          <span className="bg-[#22C55E] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                            AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-amber-800 leading-snug">
                        {t.subtitle}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                        {t.bannerDesc}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT ACTION ARROW / CHECKMARK */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-[#22C55E] text-white shadow-md'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-6 h-6 stroke-[3]" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* FOOTER CONFIRM BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="w-full py-3.5 px-6 rounded-2xl green-btn-3d font-black text-base md:text-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
          >
            <span>LANJUT DENGAN TEMA {THEME_CONFIGS[activeTheme].name.toUpperCase()}</span>
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
