'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import { MateriChapter, MateriPage } from '@/types/education';
import { EducationService } from '@/lib/educationService';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { PlayerProfile } from '@/types/game';
import { audioManager } from '@/lib/audioManager';
import { getYouTubeThumbnailUrl, getYouTubeWatchUrl, isYouTubeUrl } from '@/lib/youtubeHelper';

interface EducationBookProps {
  chapter: MateriChapter;
  onBack: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  player?: PlayerProfile | null;
  initialPages?: MateriPage[];
  isPreviewMode?: boolean;
}

type ModalType = 'DALIL' | 'FUNFACT' | 'MEDIA_ZOOM' | null;

export interface CornerPoint {
  x: number; // Percentage 0..100
  y: number; // Percentage 0..100
}

export interface PageCorners {
  tl: CornerPoint;
  tr: CornerPoint;
  br: CornerPoint;
  bl: CornerPoint;
}

const DEFAULT_LEFT_CORNERS: PageCorners = {
  tl: { x: 9.5, y: 12.4 },
  tr: { x: 48.8, y: 11.5 },
  br: { x: 48.2, y: 82.1 },
  bl: { x: 8.9, y: 81.3 },
};

const DEFAULT_RIGHT_CORNERS: PageCorners = {
  tl: { x: 52.3, y: 12.3 },
  tr: { x: 89.9, y: 12.1 },
  br: { x: 91.5, y: 82.5 },
  bl: { x: 51.8, y: 82.5 },
};

export default function EducationBook({
  chapter,
  onBack,
  isMuted = false,
  onToggleMute,
  player,
  initialPages,
  isPreviewMode = false,
}: EducationBookProps) {
  const [pages, setPages] = useState<MateriPage[]>(initialPages || []);
  const [loading, setLoading] = useState(!initialPages || initialPages.length === 0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeMediaZoom, setActiveMediaZoom] = useState<{ url: string; type: string; title?: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);

  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const p = ProfileService.getProfile();
    setProfileData(p);
    if (initialPages && initialPages.length > 0) {
      setPages(initialPages);
      setLoading(false);
    } else {
      setLoading(true);
      EducationService.getPagesByChapter(chapter.id)
        .then((res) => { setPages(res); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [chapter.id, initialPages]);

  useEffect(() => { stopSpeaking(); }, [currentPageIndex, isMuted]);
  useEffect(() => { return () => stopSpeaking(); }, []);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleAudioNarration = (text: string, customAudioUrl?: string) => {
    if (isMuted) return;
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    // 1. Jika ada file audio rekaman kustom (.mp3 / .wav)
    if (customAudioUrl && customAudioUrl.trim()) {
      try {
        const audio = new Audio(customAudioUrl.trim());
        audioElementRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          // Fallback to TTS if audio file fails to load
          if (text) playTTS(text);
        };
        audio.play().then(() => setIsSpeaking(true)).catch(() => setIsSpeaking(false));
        return;
      } catch (e) {
        console.warn('Audio play failed, falling back to TTS:', e);
      }
    }

    // 2. Fallback Web Speech Synthesis TTS
    if (text) {
      playTTS(text);
    }
  };

  const playTTS = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    ttsRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleNext = () => { audioManager.playClick(); if (currentPageIndex < pages.length - 1) { setCurrentPageIndex(p => p + 1); setActiveModal(null); } };
  const handlePrev = () => { audioManager.playClick(); if (currentPageIndex > 0) { setCurrentPageIndex(p => p - 1); setActiveModal(null); } };
  const handleBack = () => { stopSpeaking(); audioManager.playClick(); onBack(); };

  const currentPage = pages[currentPageIndex];
  const isFirst = currentPageIndex === 0;
  const isLast = currentPageIndex === pages.length - 1;

  const displayProfile = profileData || player;
  const totalPoints = profileData ? ProfileService.getTotalPoints(profileData) : 320;
  const levelInfo = ProfileService.calculateLevelInfo(totalPoints);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/image/backgroundmateri1.png')" }}>
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-base font-black text-amber-950 drop-shadow">Membuka Buku...</p>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-cover bg-center"
        style={{ backgroundImage: "url('/image/backgroundmateri1.png')" }}>
        <p className="text-lg font-black text-amber-950">Halaman buku belum tersedia.</p>
        <button onClick={handleBack} className="h-11 w-36 hover:scale-105 active:scale-95 transition cursor-pointer">
          <img src="/image/elemenbuku/kembalibutton.png" alt="Kembali" className="w-full h-full object-contain" />
        </button>
      </div>
    );
  }

  const bulletPoints: string[] = Array.isArray(currentPage.bullet_points)
    ? currentPage.bullet_points as string[]
    : (() => { try { return JSON.parse(currentPage.bullet_points as unknown as string) as string[]; } catch { return []; } })();

  const hasDalil = !!(currentPage.dalil_title || currentPage.dalil_arabic || currentPage.dalil_translation);
  const hasFunFact = !!(currentPage.fun_fact_title || currentPage.fun_fact_description);
  const audioText = currentPage.left_audio_text || currentPage.right_story_text || '';

  return (
    <div
      className="h-screen max-h-screen w-full flex flex-col justify-between select-none bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/image/backgroundmateri1.png')" }}
    >
      {/* ───── HEADER: [Kembali] [spacer] [Profil+Mute] ───── */}
      <header className="w-full max-w-6xl mx-auto px-3 sm:px-5 py-1.5 flex items-center justify-between gap-3 z-20 flex-shrink-0">

        {/* kembalibutton.png — AR ~2.5:1, object-contain */}
        <button
          onClick={handleBack}
          className="flex-shrink-0 h-9 w-28 sm:h-11 sm:w-36 hover:scale-105 active:scale-95 active:brightness-90 transition cursor-pointer"
        >
          <img src="/image/elemenbuku/kembalibutton.png" alt="Kembali" className="w-full h-full object-contain" />
        </button>

        {/* Spacer / Preview Badge */}
        {isPreviewMode ? (
          <div className="flex-1 flex justify-center">
            <div className="bg-amber-400/95 text-amber-950 px-4 py-1 rounded-full border-2 border-amber-200 shadow-md text-xs font-black flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>👁️ MODE PRATINJAU BUKU (ADMIN)</span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Profil card — identik dengan EducationChapterList & EducationPortal */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="relative rounded-2xl p-1.5 sm:p-2 flex items-center gap-2 sm:gap-3 shadow-xl border-2 border-[#FDE68A] overflow-hidden"
            style={{
              backgroundImage: `url('${profileData?.bg_profile || '/image/bgprofile/1.jpg'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px] pointer-events-none" />

            {/* Avatar + border frame */}
            <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <div className="w-[82%] h-[82%] rounded-full overflow-hidden flex items-center justify-center bg-amber-100 border border-amber-300">
                {displayProfile?.avatar?.startsWith('/') ? (
                  <img src={displayProfile.avatar} alt={displayProfile?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg sm:text-xl">{displayProfile?.avatar || '👳'}</span>
                )}
              </div>
              <img
                src={profileData?.border_frame || '/image/border/1.png'}
                alt="Frame"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-125"
              />
            </div>

            {/* Nama, Level, XP */}
            <div className="relative z-10 space-y-0.5 text-left bg-[#FFFDF3]/90 px-2 py-0.5 rounded-xl border border-amber-200 shadow-xs">
              <div className="text-[9px] sm:text-[10px] font-semibold text-slate-600 leading-none">Assalamu'alaikum!</div>
              <div className="text-xs sm:text-sm font-black text-[#451A03] tracking-wide truncate max-w-[90px] sm:max-w-[130px]">
                {displayProfile?.name || 'Aisyah Nur'}
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                <span className="bg-[#FBBF24] text-[#78350F] text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  Level {levelInfo.level}
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-900">
                  ⭐ {totalPoints.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* onspeak / offspeak terintegrasi dalam card */}
            {onToggleMute && (
              <button
                onClick={() => { audioManager.playClick(); onToggleMute(); }}
                className="relative z-10 p-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200 border border-amber-300 transition cursor-pointer ml-0.5 shadow-sm"
                title={isMuted ? 'Aktifkan Suara' : 'Matikan Suara'}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ───── BUKU ───── */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-1 sm:px-3 py-1 z-10 overflow-hidden">
        <div className="relative h-full max-h-full w-auto max-w-5xl mx-auto aspect-[1.38/1] flex items-center justify-center select-none">
          <img
            src="/image/elemenbuku/buku.png"
            alt="Buku Terbuka"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* ════ HALAMAN KIRI OVERLAY ════ */}
          <div
            style={{
              position: 'absolute',
              left: `${DEFAULT_LEFT_CORNERS.tl.x}%`,
              top: `${DEFAULT_LEFT_CORNERS.tl.y}%`,
              width: `${DEFAULT_LEFT_CORNERS.tr.x - DEFAULT_LEFT_CORNERS.tl.x}%`,
              height: `${DEFAULT_LEFT_CORNERS.bl.y - DEFAULT_LEFT_CORNERS.tl.y}%`,
            }}
            className="flex flex-col items-center justify-between gap-1.5 p-1 sm:p-2 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`left-${currentPageIndex}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                className="w-full h-full flex flex-col gap-1"
              >
                {/* ── ATAS: Area Visual (box2.png frame) ─────────────── */}
                {/*
                    flex-[3] = ~65% tinggi halaman kiri.
                    box2.png AR ~1:1 → object-fill OK karena border tipis.
                    Konten di dalam: w-[78%] h-[78%] agar tidak nabrak border kayu.
                  */}
                <div className="flex-[3] w-full relative flex items-center justify-center overflow-hidden min-h-0">
                  {currentPage.left_content_type === 'media' && currentPage.left_media_url ? (
                    <>
                      <img
                        src="/image/elemenbuku/box2.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-fill"
                      />
                      <div className="relative z-10 w-[88%] h-[85%] flex items-center justify-center overflow-hidden p-1">
                        {isYouTubeUrl(currentPage.left_media_url, currentPage.left_media_type) ? (
                          <a
                            href={getYouTubeWatchUrl(currentPage.left_media_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-full h-full max-w-full max-h-full flex items-center justify-center group overflow-hidden rounded-xl border border-rose-300/40 shadow-sm bg-black/5"
                            title="Tonton Video di YouTube"
                          >
                            <img
                              src={getYouTubeThumbnailUrl(currentPage.left_media_url) || currentPage.left_media_url}
                              alt="Thumbnail Video YouTube"
                              className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-300 rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition flex items-center justify-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-600 group-hover:bg-rose-700 text-white flex items-center justify-center shadow-xl transition transform group-hover:scale-110">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-white text-[9px] font-black tracking-wider">
                              YouTube ↗
                            </span>
                          </a>
                        ) : (
                          <div
                            onClick={() => {
                              audioManager.playClick();
                              setActiveMediaZoom({
                                url: currentPage.left_media_url!,
                                type: 'image',
                                title: currentPage.left_title || currentPage.right_title,
                              });
                              setActiveModal('MEDIA_ZOOM');
                            }}
                            className="relative w-full h-full max-w-full max-h-full flex items-center justify-center cursor-zoom-in group overflow-hidden rounded-xl"
                            title="Klik untuk memperbesar gambar"
                          >
                            <img
                              src={currentPage.left_media_url}
                              alt="Ilustrasi Materi"
                              className="max-w-full max-h-full object-contain rounded-xl group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-extrabold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              🔍 Klik Memperbesar
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : currentPage.left_content_type === 'text' && currentPage.left_text ? (
                    <>
                      <img
                        src="/image/elemenbuku/box2.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-fill"
                      />
                      <div className="relative z-10 w-[80%] h-[80%] flex items-center justify-center">
                        <p className="text-[9px] sm:text-[10px] text-amber-950/90 font-semibold text-center leading-relaxed">
                          {currentPage.left_text}
                        </p>
                      </div>
                    </>
                  ) : (
                    <img
                      src="/image/elemenbuku/box2.png"
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-fill"
                    />
                  )}
                </div>

                {/* ── BAWAH: Tombol Narasi / TTS / File Audio ──────────────────────── */}
                <div className="flex-[2] w-full flex items-center justify-center min-h-0 px-2">
                  {(currentPage.left_audio_url || audioText) && !isMuted ? (
                    <button
                      onClick={() => handleAudioNarration(audioText, currentPage.left_audio_url)}
                      className="relative w-full flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition"
                      style={{ height: 'clamp(32px, 6vh, 52px)' }}
                    >
                      {/* buttonnarator.png — AR ~3:1, stretch horizontal OK */}
                      <img
                        src="/image/elemenbuku/buttonnarator.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-fill rounded-full"
                      />
                      {/* visualaudio.png — AR ~2:1, object-contain, animate-pulse saat aktif */}
                      <img
                        src="/image/elemenbuku/visualaudio.png"
                        alt="Audio"
                        className={`relative z-10 w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0 ${isSpeaking ? 'animate-pulse' : ''}`}
                      />
                      <span className="relative z-10 text-[10px] sm:text-xs md:text-sm font-black text-amber-900 whitespace-nowrap">
                        {isSpeaking ? '⏹ Stop' : currentPage.left_audio_url ? '🎵 Putar Audio' : '▶ Dengarkan'}
                      </span>
                    </button>
                  ) : (
                    /* Spacer agar layout tetap konsisten walau tidak ada TTS */
                    <div className="w-full" style={{ height: 'clamp(32px, 6vh, 52px)' }} />
                  )}
                </div>
              </motion.div>

            </AnimatePresence>
          </div>

          {/* ════ HALAMAN KANAN OVERLAY ════ */}
          <div
            style={{
              position: 'absolute',
              left: `${DEFAULT_RIGHT_CORNERS.tl.x}%`,
              top: `${DEFAULT_RIGHT_CORNERS.tl.y}%`,
              width: `${DEFAULT_RIGHT_CORNERS.tr.x - DEFAULT_RIGHT_CORNERS.tl.x}%`,
              height: `${DEFAULT_RIGHT_CORNERS.bl.y - DEFAULT_RIGHT_CORNERS.tl.y}%`,
            }}
            className="flex flex-col gap-1.5 p-1 sm:p-2 overflow-y-auto"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`right-${currentPageIndex}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col gap-1.5"
              >
                {/* Judul — plain text, tanpa backgroundheadline.png */}
                {currentPage.right_title && (
                  <h2 className="text-[10px] sm:text-xs md:text-sm font-black text-amber-950 leading-tight border-b-2 border-amber-400/60 pb-1 mb-0.5">
                    {currentPage.right_title}
                  </h2>
                )}

                {/* Story Text */}
                {currentPage.right_story_text && (
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-amber-950/90 font-semibold leading-relaxed">
                    {currentPage.right_story_text}
                  </p>
                )}

                {/*
                    Bullet Points — logonomor1/logonomor2 sebagai ikon nomor (1:1, object-contain).
                    Teks poin pakai box krem sederhana (bg-amber-50 rounded).
                    Tidak pakai backgroundpoin.png / backgroundpoin2.png.
                  */}
                {bulletPoints.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {bulletPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        {/* logonomor1 (hijau) untuk ganjil, logonomor2 (emas) untuk genap */}
                        <img
                          src={idx % 2 === 0
                            ? '/image/elemenbuku/logonomor1.png'
                            : '/image/elemenbuku/logonomor2.png'}
                          alt={`${idx + 1}`}
                          className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0 mt-0.5"
                        />
                        {/* Teks poin dalam box sederhana */}
                        <div className="flex-1 bg-amber-50/80 border border-amber-200/80 rounded-lg px-2 py-1">
                          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-amber-950 leading-tight">
                            {point}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/*
                    buttondalil.png (AR ~2:1) + buttontahukahkamu.png (AR ~2.5:1).
                    object-contain — ikon kiri tidak boleh gepeng.
                  */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {hasDalil && (
                    <button
                      onClick={() => { audioManager.playClick(); setActiveModal('DALIL'); }}
                      className="relative h-9 sm:h-11 w-28 sm:w-34 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center"
                    >
                      <img
                        src="/image/elemenbuku/buttondalil.png"
                        alt="Lihat Dalil"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      <span className="relative z-10 w-full pl-9 sm:pl-10 pr-2 text-[9px] sm:text-[10px] font-black text-amber-950 leading-none whitespace-nowrap">
                        Lihat Dalil
                      </span>
                    </button>
                  )}

                  {hasFunFact && (
                    <button
                      onClick={() => { audioManager.playClick(); setActiveModal('FUNFACT'); }}
                      className="relative h-10 sm:h-12 w-32 sm:w-42 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center"
                    >
                      <img
                        src="/image/elemenbuku/buttontahukahkamu.png"
                        alt="Tahukah Kamu?"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      <span className="relative z-10 w-full pl-9 sm:pl-11 pr-2 sm:pr-3 text-[9px] sm:text-[10px] font-black text-white leading-none drop-shadow whitespace-nowrap">
                        Tahukah Kamu?
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ───── BOTTOM NAVIGATION ───── */}
      {/*
        back.png / next.png — AR ~1:1, object-contain.
        nohalaman.png — AR ~4:3, teks di atas 50% (papan krem), pt tetap px.
      */}
      <footer className="w-full px-4 py-1.5 sm:py-2 flex items-center justify-center gap-4 sm:gap-6 z-20 flex-shrink-0">
        <button
          onClick={handlePrev}
          disabled={isFirst}
          className={`h-10 w-14 sm:h-12 sm:w-20 hover:scale-105 active:scale-95 transition cursor-pointer flex-shrink-0 ${isFirst ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <img src="/image/elemenbuku/back.png" alt="Sebelumnya" className="w-full h-full object-contain" />
        </button>

        {/* nohalaman.png — teks di papan krem (atas 50%), bukan di bookmark merah bawah */}
        <div className="relative flex-shrink-0 h-12 w-36 sm:h-16 sm:w-48">
          <img
            src="/image/elemenbuku/nohalaman.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-fill"
          />
          <div className="absolute inset-0 flex items-start justify-center pt-3 sm:pt-4">
            <span className="text-xs sm:text-sm font-black text-amber-950 tracking-widest uppercase drop-shadow-sm">
              {currentPageIndex + 1} / {pages.length}
            </span>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={isLast}
          className={`h-10 w-14 sm:h-12 sm:w-20 hover:scale-105 active:scale-95 transition cursor-pointer flex-shrink-0 ${isLast ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <img src="/image/elemenbuku/next.png" alt="Berikutnya" className="w-full h-full object-contain" />
        </button>
      </footer>

      {/* ════ MODAL: DALIL ════ */}
      <AnimatePresence>
        {activeModal === 'DALIL' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-[#FFFDF3] border-2 border-amber-300 rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <button onClick={() => setActiveModal(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200 transition cursor-pointer">
                <X size={16} className="text-amber-900" />
              </button>
              <h3 className="text-base font-black text-amber-950 mb-4 pr-8">{currentPage.dalil_title || 'Dalil'}</h3>
              {currentPage.dalil_arabic && (
                <p className="text-xl sm:text-2xl font-bold text-amber-950 text-right leading-loose mb-3">
                  {currentPage.dalil_arabic}
                </p>
              )}
              {currentPage.dalil_latin && (
                <p className="text-xs sm:text-sm italic text-amber-700 mb-2 text-center leading-relaxed">
                  {currentPage.dalil_latin}
                </p>
              )}
              {currentPage.dalil_translation && (
                <p className="text-xs sm:text-sm font-bold text-amber-950 text-center leading-relaxed bg-amber-50 rounded-2xl px-4 py-3 border border-amber-200 mb-3">
                  "{currentPage.dalil_translation}"
                </p>
              )}
              {currentPage.dalil_source && (
                <p className="text-[10px] font-black text-amber-700 text-center uppercase tracking-wide">
                  — {currentPage.dalil_source}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODAL: TAHUKAH KAMU? ════ */}
      <AnimatePresence>
        {activeModal === 'FUNFACT' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-sky-50 border-2 border-sky-300 rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <button onClick={() => setActiveModal(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-sky-100 hover:bg-sky-200 transition cursor-pointer">
                <X size={16} className="text-sky-900" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                {/* tahukahkamuicon.png — AR 1:1, object-contain, w-10 h-10 */}
                <img src="/image/elemenbuku/tahukahkamuicon.png" alt="Tahukah Kamu?"
                  className="w-10 h-10 object-contain flex-shrink-0" />
                <h3 className="text-base font-black text-sky-900">
                  {currentPage.fun_fact_title || 'Tahukah Kamu?'}
                </h3>
              </div>
              <p className="text-sm font-bold text-sky-950 leading-relaxed bg-white/80 rounded-2xl px-4 py-3 border border-sky-200">
                {currentPage.fun_fact_description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODAL: ZOOM-IN MEDIA (LIGHTBOX) ════ */}
      <AnimatePresence>
        {activeModal === 'MEDIA_ZOOM' && activeMediaZoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md cursor-pointer"
            onClick={() => {
              setActiveModal(null);
              setActiveMediaZoom(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center cursor-default"
            >
              {/* Tombol Tutup ✕ */}
              <button
                onClick={() => {
                  audioManager.playClick();
                  setActiveModal(null);
                  setActiveMediaZoom(null);
                }}
                className="absolute -top-3 -right-3 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-900 font-bold shadow-2xl transition cursor-pointer border border-slate-300 hover:scale-110 hover:bg-slate-100"
                title="Tutup Pratinjau (Esc)"
              >
                <X size={22} />
              </button>

              {/* Tampilan Media Zoomed In */}
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-3xl bg-slate-950/90 border border-white/20 p-3 shadow-2xl">
                {activeMediaZoom.type === 'video' ? (
                  <video
                    src={activeMediaZoom.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-full object-contain rounded-2xl"
                  />
                ) : (
                  <img
                    src={activeMediaZoom.url}
                    alt={activeMediaZoom.title || 'Pratinjau Media'}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  />
                )}
              </div>

              {activeMediaZoom.title && (
                <div className="mt-3 text-center text-xs sm:text-sm font-extrabold text-white/90 bg-slate-900/90 px-5 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                  {activeMediaZoom.title}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
