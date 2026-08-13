'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Play, ArrowLeft, Star, Sparkles, BookOpen } from 'lucide-react';
import { Category, PlayerProfile, AppTheme } from '@/types/game';
import { GameService } from '@/lib/gameService';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { audioManager } from '@/lib/audioManager';
import { getThemeConfig } from '@/lib/themeConfig';

interface SetupScreenProps {
  onGameSetupComplete: (profile: PlayerProfile) => void;
  onBack: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onGameSetupComplete, onBack }) => {
  const [profile, setProfile] = useState<UserProfileData>(ProfileService.getProfileOrDefault());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTheme, setActiveTheme] = useState<AppTheme>('islamic');

  useEffect(() => {
    const activeProf = ProfileService.getProfileOrDefault();
    setProfile(activeProf);

    // Sync active theme from saved theme selected in WelcomeScreen
    const savedTheme = localStorage.getItem('app_theme') as AppTheme;
    if (savedTheme === 'independence' || savedTheme === 'culture' || savedTheme === 'islamic') {
      setActiveTheme(savedTheme);
    }

    GameService.getCategories().then(setCategories);
  }, []);

  const filteredCategories = categories.filter((cat) => {
    if (cat.theme_id) return cat.theme_id === activeTheme;
    return activeTheme === 'islamic'; // Default fallback for untagged categories
  });

  // Auto-select valid category whenever filtered categories list changes
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const isCurrentValid = filteredCategories.some((cat) => cat.name === selectedCategory);
      if (!isCurrentValid) {
        setSelectedCategory(filteredCategories[0].name);
      }
    }
  }, [filteredCategories, selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playClick();

    onGameSetupComplete({
      name: profile.name,
      avatar: profile.avatar,
      category: selectedCategory || (filteredCategories[0]?.name ?? 'Rukun Islam'),
    });
  };

  const themeConfig = getThemeConfig(activeTheme);

  return (
    <div
      className="min-h-screen w-full select-none flex items-center justify-center p-4 py-8 font-sans overflow-hidden relative transition-all duration-700"
      style={{
        backgroundImage: `url('${themeConfig.bgImage || '/image/mainmenubg1.jpg'}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark Subtle Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#FFFDF3] border-4 border-[#FDE68A] max-w-3xl w-full p-6 md:p-8 rounded-[32px] shadow-2xl text-[#1E293B] relative pt-10 z-10"
      >
        {/* TOP CURVED RIBBON HEADER BADGE */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#15803D] border-2 border-white px-8 py-2.5 rounded-full font-black text-lg md:text-xl text-white shadow-xl flex items-center gap-2 tracking-wide shadow-emerald-500/40">
            <Star className="w-4 h-4 fill-current text-yellow-300" />
            <span>Pilih Kategori Kuis</span>
            <Star className="w-4 h-4 fill-current text-yellow-300" />
          </div>
        </div>

        {/* BACK BUTTON */}
        <button
          onClick={() => {
            audioManager.playClick();
            onBack();
          }}
          className="absolute top-4 left-4 p-2.5 rounded-2xl bg-[#FEF3C7] text-[#78350F] hover:bg-amber-200 transition cursor-pointer border border-[#F59E0B]/40"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* ACTIVE PLAYER COMPACT BADGE */}
        <div className="mt-2 mb-4 bg-[#FEF3C7]/80 border border-[#F59E0B] rounded-2xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-[#F59E0B] flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
              {profile.avatar.startsWith('/') ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{profile.avatar}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#451A03] text-sm md:text-base leading-none">
                  {profile.name}
                </span>
                <span className="bg-[#FBBF24] text-[#78350F] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Lv. {profile.level}
                </span>
              </div>
              <span className="text-xs text-amber-900 font-semibold">
                Pemain Aktif • Siap Berkompetisi!
              </span>
            </div>
          </div>

          <div className="text-right">
            {(() => {
              const pointsInfo = ProfileService.getThemePointsInfo(profile, activeTheme);
              return (
                <span className={`text-xs md:text-sm font-black block ${pointsInfo.colorClass}`}>
                  {pointsInfo.icon} {pointsInfo.points.toLocaleString()} {pointsInfo.label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* ACTIVE THEME INFORMATION BANNER */}
        <div className="mb-4 bg-amber-100/80 border border-amber-300/80 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{themeConfig.icon}</span>
            <div>
              <span className="text-xs text-amber-900/70 font-semibold block leading-none">Tema Kuis Aktif:</span>
              <span className="text-sm font-black text-[#78350F]">{themeConfig.name} ({themeConfig.subtitle})</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-200/70 px-2.5 py-1 rounded-full hidden sm:inline-block">
            Tema Berdasarkan Menu Utama
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CATEGORY SELECTION GRID */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs md:text-sm font-extrabold text-[#78350F] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#D97706]" />
                <span>Pilih Kategori Kuis:</span>
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {selectedCategory || 'Memilih...'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1 p-1">
              {/* Dynamic Database Categories filtered by Active Theme */}
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      audioManager.playClick();
                      setSelectedCategory(cat.name);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#DCFCE7] border-[#22C55E] text-[#15803D] font-extrabold shadow-md ring-2 ring-[#22C55E]'
                        : 'bg-white border-amber-200 hover:border-amber-400 text-[#78350F] font-bold hover:bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl flex-shrink-0">
                        {cat.icon || themeConfig.icon || '🕌'}
                      </div>
                      <div className="truncate">
                        <span className="block text-sm font-extrabold truncate">{cat.name}</span>
                        <span className="text-[10px] text-amber-800 font-semibold truncate block">
                          {cat.description || `Pertanyaan Kuis ${themeConfig.name}`}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON: MASUK ARENA KUIS ➔ */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-4 rounded-2xl md:rounded-3xl green-btn-3d font-black text-lg md:text-xl flex items-center justify-center gap-3 transition cursor-pointer shadow-xl"
          >
            <Play className="w-6 h-6 fill-current text-white" />
            <span>MASUK ARENA KUIS ({themeConfig.name.toUpperCase()})</span>
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
