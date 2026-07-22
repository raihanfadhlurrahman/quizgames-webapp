'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Camera,
  Edit2,
  X,
  Check,
  Palette,
  BookOpen,
  Sparkles,
  Award,
  Heart,
  Tag,
  Image as ImageIcon,
  LogOut,
} from 'lucide-react';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { AVAILABLE_AVATARS } from '@/data/avatars';
import { AVAILABLE_BORDERS } from '@/data/borders';
import { AVAILABLE_BGPROFILES } from '@/data/bgprofile';
import { audioManager } from '@/lib/audioManager';
import { AuthService } from '@/lib/authService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfileData) => void;
}

export const TITLE_TAG_PRESETS = [
  '⭐ Muslim Cerdas',
  '📖 Penuntut Ilmu',
  '🌙 Pejuang Subuh',
  '🕌 Pencinta Masjid',
  '🌿 Hamba Allah',
];

export const BIO_QUOTE_PRESETS = [
  {
    quote: 'رَبِّ زِدْنِي عِلْمًا',
    translation: '"Ya Tuhanku, tambahkanlah kepadaku ilmu."',
    reference: '(QS. Taha: 114)',
  },
  {
    quote: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: '"Maka sesungguhnya bersama kesulitan ada kemudahan."',
    reference: '(QS. Al-Inshirah: 5-6)',
  },
  {
    quote: 'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا',
    translation: '"Ya Tuhan kami, janganlah Engkau hukum kami jika kami lupa atau khilaf."',
    reference: '(QS. Al-Baqarah: 286)',
  },
  {
    quote: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    translation: '"Tidak ada tuhan selain Engkau, Maha Suci Engkau, sungguh aku termasuk orang zalim."',
    reference: '(QS. Al-Anbiya: 87)',
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfileData>(ProfileService.getProfile());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(profile.name);

  // Customizer Panels Toggles
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [showBorderPicker, setShowBorderPicker] = useState<boolean>(false);
  const [showBgPicker, setShowBgPicker] = useState<boolean>(false);
  const [showTagPicker, setShowTagPicker] = useState<boolean>(false);
  const [customTagInput, setCustomTagInput] = useState<string>('');

  const [showBioPicker, setShowBioPicker] = useState<boolean>(false);
  const [customBioQuote, setCustomBioQuote] = useState<string>('');
  const [customBioTranslation, setCustomBioTranslation] = useState<string>('');
  const [customBioReference, setCustomBioReference] = useState<string>('');

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    audioManager.playClick();
    const updated = await ProfileService.saveProfile({ name: nameInput.trim() });
    setProfile(updated);
    setIsEditingName(false);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    audioManager.playClick();
    const updated = await ProfileService.saveProfile({ avatar: avatarUrl });
    setProfile(updated);
    setShowAvatarPicker(false);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleSelectBorder = async (borderUrl: string) => {
    audioManager.playClick();
    const updated = await ProfileService.saveProfile({
      border_frame: borderUrl,
      border_color: borderUrl,
    });
    setProfile(updated);
    setShowBorderPicker(false);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleSelectBgProfile = async (bgUrl: string) => {
    audioManager.playClick();
    const updated = await ProfileService.saveProfile({ bg_profile: bgUrl });
    setProfile(updated);
    setShowBgPicker(false);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleSelectTag = async (tagText: string) => {
    audioManager.playClick();
    const updated = await ProfileService.saveProfile({ title_tag: tagText });
    setProfile(updated);
    setShowTagPicker(false);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleSaveCustomTag = async () => {
    if (!customTagInput.trim()) return;
    await handleSelectTag(customTagInput.trim());
    setCustomTagInput('');
  };

  const handleSelectBio = async (preset: { quote: string; translation: string; reference: string }) => {
    audioManager.playClick();
    const updated = await ProfileService.saveProfile({
      bio_quote: preset.quote,
      bio_translation: preset.translation,
      bio_reference: preset.reference,
    });
    setProfile(updated);
    setShowBioPicker(false);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleSaveCustomBio = async () => {
    if (!customBioTranslation.trim()) return;
    audioManager.playClick();
    const updated = await ProfileService.saveProfile({
      bio_quote: customBioQuote.trim() || '✨',
      bio_translation: `"${customBioTranslation.trim()}"`,
      bio_reference: customBioReference.trim() ? `(${customBioReference.trim()})` : '',
    });
    setProfile(updated);
    setShowBioPicker(false);
    setCustomBioQuote('');
    setCustomBioTranslation('');
    setCustomBioReference('');
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleLogout = async () => {
    audioManager.playClick();
    await AuthService.signOut();
    ProfileService.clearLocalProfile();
    window.location.reload();
  };

  // Border & BG setup
  const currentBorderFrame = profile.border_frame || profile.border_color || '/image/border/1.png';
  const currentBgProfile = profile.bg_profile || '/image/bgprofile/1.jpg';

  // Calculate Stats & XP
  const totalQuestions = profile.total_questions_answered ?? 0;
  const totalCorrect = profile.total_correct ?? 0;
  const accuracyPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const currentXP = profile.amal_points % 500;
  const maxXP = 500;
  const xpPercentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none font-sans overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="border-4 border-[#FDE68A] max-w-xl md:max-w-2xl w-full rounded-[28px] p-4 sm:p-5 md:p-6 pt-9 md:pt-10 shadow-2xl text-[#1E293B] relative my-auto overflow-visible"
        >
          {/* Inner Background & Overlay Wrapper (Prevents clipping of top ribbon badge) */}
          <div
            className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none"
            style={{
              backgroundImage: `url('${currentBgProfile}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Subtle contrast overlay so custom background image POPS clearly */}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />
          </div>

          {/* TOP LEFT CUSTOM BG BUTTON (🖼️) */}
          <button
            onClick={() => {
              audioManager.playClick();
              setShowBgPicker(!showBgPicker);
              setShowAvatarPicker(false);
              setShowBorderPicker(false);
            }}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1 rounded-full bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 border-2 border-white shadow-md transition cursor-pointer z-20"
            title="Ganti Background Profil"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Background</span>
          </button>

          {/* TOP CURVED BLUE RIBBON HEADER BADGE (Now 100% Unclipped!) */}
          <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-30 pointer-events-auto">
            <div className="bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] border-2 border-white px-6 py-1.5 md:px-8 md:py-2 rounded-full font-black text-sm sm:text-base md:text-lg text-white shadow-xl flex items-center gap-2 tracking-wide shadow-blue-500/40">
              <Star className="w-4 h-4 fill-current text-yellow-300" />
              <span>Profil Saya</span>
              <Star className="w-4 h-4 fill-current text-yellow-300" />
            </div>
          </div>

          {/* TOP RIGHT BLUE CLOSE BUTTON (X) */}
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#1D4ED8] hover:bg-blue-700 text-white flex items-center justify-center border-2 border-white shadow-md transition cursor-pointer z-20"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>

          {/* MAIN PROFILE BODY (Dedicated top margin so ribbon badge NEVER overlaps content) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3.5 md:gap-4.5 items-center mt-3 md:mt-4 mb-2">
            {/* LEFT COLUMN: AVATAR, PNG BORDER OVERLAY & TITLE BADGE */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
              {/* Avatar Frame Container with PNG Border Overlay (Full Prominent Size) */}
              <div className="relative w-26 h-26 sm:w-28 sm:h-28 md:w-30 md:h-30 flex items-center justify-center">
                {/* Inner Circular Avatar Image */}
                <div className="w-[74%] h-[74%] rounded-full bg-[#FEF3C7] flex items-center justify-center overflow-hidden shadow-inner border border-amber-300/80">
                  {profile.avatar.startsWith('/') ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl sm:text-5xl">{profile.avatar}</span>
                  )}
                </div>

                {/* PNG Border Overlay Image (Extends Outwards) */}
                <img
                  src={currentBorderFrame}
                  alt="Bingkai Profile"
                  className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] object-contain pointer-events-none z-10 drop-shadow-md"
                />

                {/* Camera Button (PNG Avatar Picker) */}
                <button
                  onClick={() => {
                    audioManager.playClick();
                    setShowAvatarPicker(!showAvatarPicker);
                    setShowBorderPicker(false);
                    setShowBgPicker(false);
                  }}
                  className="absolute bottom-0 right-0 z-20 w-8 h-8 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0284C7] border-2 border-white text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition cursor-pointer"
                  title="Ganti Character Avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Palette Button (PNG Border Frame Picker) */}
                <button
                  onClick={() => {
                    audioManager.playClick();
                    setShowBorderPicker(!showBorderPicker);
                    setShowAvatarPicker(false);
                    setShowBgPicker(false);
                  }}
                  className="absolute bottom-0 left-0 z-20 w-8 h-8 rounded-full bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-2 border-white text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition cursor-pointer"
                  title="Pilih Bingkai Avatar"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </div>

              {/* Title Badge Below Avatar (Customizable Tag - Full Prominent Size) */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-col">
                <div className="flex items-center gap-1.5">
                  <div className="bg-gradient-to-r from-[#D97706] to-[#78350F] text-white px-3.5 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5 border border-white/40">
                    <Tag className="w-3.5 h-3.5 fill-current text-yellow-300" />
                    <span>{profile.title_tag || 'Muslim Cerdas'}</span>
                  </div>
                  <button
                    onClick={() => {
                      audioManager.playClick();
                      setShowTagPicker(!showTagPicker);
                    }}
                    className="w-6.5 h-6.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md cursor-pointer transition"
                    title="Ubah Tag Gelar"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                
                {profile.role === 'admin' && (
                  <div className="mt-1 bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-[10px] font-black px-3 py-0.5 rounded-full border border-purple-400/60 shadow-sm">
                    ⚙️ Admin KKN
                  </div>
                )}
              </div>

              {/* TITLE TAG PICKER / INPUT PANEL */}
              <AnimatePresence>
                {showTagPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 w-full bg-[#0B132B] p-2.5 rounded-2xl border-2 border-amber-400 text-white space-y-1.5 text-left shadow-lg z-20"
                  >
                    <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Pilih / Ketik Tag Gelar:</span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      {TITLE_TAG_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleSelectTag(preset)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-amber-600 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Custom Input */}
                    <div className="flex items-center gap-1 pt-0.5">
                      <input
                        type="text"
                        maxLength={25}
                        placeholder="Ketik Tag Gelar..."
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-0.5 text-[11px] font-bold text-white focus:outline-none focus:border-amber-400 flex-1"
                      />
                      <button
                        onClick={handleSaveCustomTag}
                        className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT COLUMN: USER INFO (NAME, XP BAR, AMAL, BIO CARD) */}
            <div className="md:col-span-7 space-y-2">
              {/* Player Name with Inline Pencil Edit Button */}
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      maxLength={20}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="bg-white border-2 border-amber-400 rounded-xl px-2.5 py-1 text-sm font-extrabold text-[#451A03] focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer shadow-md"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-[#FFFDF3]/90 px-3 py-1 rounded-xl backdrop-blur-xs border border-amber-200 shadow-xs max-w-fit">
                    <h3 className="text-lg md:text-xl font-black text-[#451A03] tracking-wide">
                      {profile.name}
                    </h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-md cursor-pointer transition"
                      title="Ubah Nama Akun"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Level & XP Progress Bar */}
              <div className="bg-[#FFFDF3]/90 p-2 rounded-xl border border-amber-200 space-y-1 shadow-xs backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-[#FBBF24] text-[#78350F] text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-current text-[#78350F]" />
                    Lv. {profile.level}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700">
                    {currentXP} / {maxXP} XP
                  </span>
                </div>
                <div className="w-full bg-[#CBD5E1] h-2.5 rounded-full overflow-hidden border border-slate-300 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-[#22C55E] to-[#15803D] h-full rounded-full transition-all duration-500"
                    style={{ width: `${xpPercentage}%` }}
                  />
                </div>
              </div>

              {/* Amal Points Indicator */}
              <div className="flex items-center gap-1.5 text-xs md:text-sm font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-xs w-fit">
                <div className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px] shadow-xs">
                  💚
                </div>
                <span>{profile.amal_points.toLocaleString('id-ID')} Amal Point</span>
              </div>

              {/* Customizable Bio / Quran Quote Card */}
              <div className="bg-[#FFFDF3]/95 border-2 border-[#FDE68A] rounded-xl p-2 md:p-2.5 text-center space-y-0.5 shadow-sm relative group">
                <button
                  onClick={() => {
                    audioManager.playClick();
                    setShowBioPicker(!showBioPicker);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs cursor-pointer transition opacity-90 hover:opacity-100"
                  title="Ubah Doa / Bio Profil"
                >
                  <Edit2 className="w-3 h-3" />
                </button>

                <div className="text-xs sm:text-sm font-bold text-[#78350F] tracking-wide font-serif leading-tight pr-5">
                  {profile.bio_quote || 'رَبِّ زِدْنِي عِلْمًا'}
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#451A03] italic">
                  {profile.bio_translation || '"Ya Tuhanku, tambahkanlah kepadaku ilmu."'}
                </div>
                {profile.bio_reference && (
                  <div className="text-[9px] font-bold text-amber-800">
                    {profile.bio_reference}
                  </div>
                )}
              </div>

              {/* BIO / SURAH PICKER & CUSTOM INPUT PANEL */}
              <AnimatePresence>
                {showBioPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#0B132B] p-2.5 rounded-2xl border-2 border-amber-400 text-white space-y-1.5 text-left shadow-lg z-20"
                  >
                    <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Pilih Presets Doa & Surah:</span>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-1">
                      {BIO_QUOTE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectBio(preset)}
                          className="w-full text-left p-1.5 rounded-lg bg-slate-800 hover:bg-amber-700 border border-slate-700 transition cursor-pointer space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                            <span>{preset.reference}</span>
                            <span className="font-serif text-xs">{preset.quote}</span>
                          </div>
                          <p className="text-[9px] text-slate-300 italic truncate">{preset.translation}</p>
                        </button>
                      ))}
                    </div>

                    {/* Custom Bio Input Toggle */}
                    <div className="pt-1.5 border-t border-slate-800 space-y-1">
                      <span className="text-[9px] font-bold text-amber-300 block">Ketik Bio Kustom Sendiri:</span>
                      <input
                        type="text"
                        placeholder="Kalimat Arab / Quote..."
                        value={customBioQuote}
                        onChange={(e) => setCustomBioQuote(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        placeholder="Arti / Makna Bio..."
                        value={customBioTranslation}
                        onChange={(e) => setCustomBioTranslation(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Referensi (opsional, ex: QS. Taha: 114)..."
                          value={customBioReference}
                          onChange={(e) => setCustomBioReference(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={handleSaveCustomBio}
                          className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* BG PROFILE PICKER GRID (TOGGLED BY BACKGROUND BUTTON 🖼️) */}
          <AnimatePresence>
            {showBgPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-20 mb-3 bg-slate-900/95 p-3 rounded-2xl border-2 border-amber-400 text-white space-y-1.5 overflow-hidden shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[11px] font-bold text-amber-400">Pilih Background Profil (10 Pilihan):</span>
                  <button
                    onClick={() => setShowBgPicker(false)}
                    className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {AVAILABLE_BGPROFILES.map((bg) => {
                    const isSelected = currentBgProfile === bg.url;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => handleSelectBgProfile(bg.url)}
                        className={`h-14 rounded-xl bg-slate-800 border-2 transition hover:scale-105 cursor-pointer overflow-hidden relative ${isSelected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-slate-700'
                          }`}
                        title={bg.name}
                      >
                        <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-amber-300 text-center py-0.5">
                          {bg.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PNG BORDER FRAME PICKER GRID (TOGGLED BY PALETTE BUTTON 🎨) */}
          <AnimatePresence>
            {showBorderPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-20 mb-3 bg-slate-900/95 p-3 rounded-2xl border-2 border-amber-400 text-white space-y-1.5 overflow-hidden shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[11px] font-bold text-amber-400">Pilih Bingkai Profil PNG (10 Pilihan):</span>
                  <button
                    onClick={() => setShowBorderPicker(false)}
                    className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {AVAILABLE_BORDERS.map((border) => {
                    const isSelected = currentBorderFrame === border.url;
                    return (
                      <button
                        key={border.id}
                        onClick={() => handleSelectBorder(border.url)}
                        className={`h-14 rounded-xl bg-slate-800 border-2 transition hover:scale-105 cursor-pointer p-1 flex flex-col items-center justify-center relative ${isSelected ? 'border-amber-400 ring-2 ring-amber-400 bg-amber-500/20' : 'border-slate-700'
                          }`}
                        title={border.name}
                      >
                        <img src={border.url} alt={border.name} className="w-full h-full object-contain" />
                        <span className="text-[8px] font-bold text-slate-300 mt-0.5">{border.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AVATAR PICKER GRID (TOGGLED BY CAMERA BUTTON 📷) */}
          <AnimatePresence>
            {showAvatarPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-20 mb-3 bg-slate-900/95 p-3 rounded-2xl border-2 border-amber-400 text-white space-y-1.5 overflow-hidden shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[11px] font-bold text-amber-400">Pilih Character Avatar PNG (20 Karakter):</span>
                  <button
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {AVAILABLE_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectAvatar(avatar.url)}
                      className={`w-10 h-10 rounded-full bg-slate-800 border-2 transition hover:scale-110 cursor-pointer overflow-hidden flex items-center justify-center ${profile.avatar === avatar.url ? 'border-amber-400 ring-2 ring-amber-400' : 'border-slate-700'
                        }`}
                    >
                      <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4 REAL STATS CARDS */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            <div className="p-2 sm:p-2.5 bg-[#FFFDF3]/95 rounded-xl border border-amber-300 text-center space-y-0.5 shadow-xs backdrop-blur-xs">
              <div className="text-base">🏆</div>
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-700">Quiz Dimenangkan</div>
              <div className="text-sm sm:text-base font-black text-[#78350F]">{profile.total_games} Sesi</div>
            </div>

            <div className="p-2 sm:p-2.5 bg-[#FFFDF3]/95 rounded-xl border border-emerald-300 text-center space-y-0.5 shadow-xs backdrop-blur-xs">
              <div className="text-base">🎯</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-700">Jawaban Benar</div>
              <div className="text-sm sm:text-base font-black text-[#166534]">
                {totalCorrect} / {totalQuestions} Soal
              </div>
            </div>

            <div className="p-2 sm:p-2.5 bg-[#FFFDF3]/95 rounded-xl border border-sky-300 text-center space-y-0.5 shadow-xs backdrop-blur-xs">
              <div className="text-base">📊</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-700">Akurasi Benar</div>
              <div className="text-sm sm:text-base font-black text-[#075985]">{accuracyPercentage}%</div>
            </div>

            <div className="p-2 sm:p-2.5 bg-[#FFFDF3]/95 rounded-xl border border-purple-300 text-center space-y-0.5 shadow-xs backdrop-blur-xs">
              <div className="text-base">⭐</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-700">Poin Amal</div>
              <div className="text-sm sm:text-base font-black text-[#6B21A8]">
                {profile.amal_points.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="relative z-10 pt-4 flex justify-center border-t border-amber-200/40 mt-3">
            <button
              onClick={handleLogout}
              className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>KELUAR AKUN (LOGOUT)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
