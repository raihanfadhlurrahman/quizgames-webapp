'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles, BookOpen, Lightbulb, X, CheckCircle, Info } from 'lucide-react';
import { EducationChapter, EducationSlide } from '@/types/education';
import { audioManager } from '@/lib/audioManager';

interface EducationReaderProps {
  chapter: EducationChapter;
  onBackToPortal: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function EducationReader({ chapter, onBackToPortal, isMuted = false, onToggleMute }: EducationReaderProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<'DALIL' | 'FUNFACT' | null>(null);

  const currentSlide: EducationSlide = chapter.slides[currentSlideIndex] || chapter.slides[0];
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === chapter.slides.length - 1;

  const handleNext = () => {
    audioManager.playClick();
    if (!isLastSlide) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    audioManager.playClick();
    if (!isFirstSlide) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="min-h-screen w-full text-slate-100 flex flex-col justify-between font-sans select-none relative overflow-hidden"
      style={{
        backgroundImage: `url('/image/backgroundmateri1.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Soft Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER NAVIGATION BAR */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 bg-[#0A1628]/80 backdrop-blur-md border-b border-emerald-500/20 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioManager.playClick();
              onBackToPortal();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Pilih Bab</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">{chapter.icon}</span>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white tracking-wide truncate max-w-[180px] sm:max-w-xs">
                {chapter.title}
              </h1>
              <p className="text-[10px] text-emerald-400 font-bold">
                Slide {currentSlideIndex + 1} dari {chapter.slides.length}
              </p>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR & MUTE BUTTON */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end w-36">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentSlideIndex + 1) / chapter.slides.length) * 100}%` }}
              />
            </div>
          </div>

          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}
        </div>
      </header>

      {/* MAIN CAROUSEL CONTENT CANVAS */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-[#0D1B2A]/90 backdrop-blur-xl rounded-[28px] sm:rounded-[36px] border-2 sm:border-4 border-emerald-500/40 p-5 sm:p-8 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[420px]"
          >
            {/* LEFT SPOTLIGHT CARD (VISUAL & ICON) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#112233] to-[#0A1628] rounded-[24px] border border-emerald-500/30 shadow-inner relative overflow-hidden group">
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30 uppercase tracking-wider">
                  {currentSlide.visualBadge}
                </span>
              </div>

              {/* Floating Animated Graphic Icon */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-emerald-600/30 via-teal-500/20 to-amber-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-6xl sm:text-7xl shadow-xl my-4"
              >
                {currentSlide.visualIcon}
              </motion.div>

              <h2 className="text-lg sm:text-xl font-black text-white leading-tight mb-1">
                {currentSlide.title}
              </h2>
              {currentSlide.subtitle && (
                <p className="text-xs text-slate-300 font-semibold">{currentSlide.subtitle}</p>
              )}
            </div>

            {/* RIGHT CONTENT STORY BOX */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                    Poin Penting Belajar
                  </span>
                </div>

                {/* BULLET POINTS LIST (RAMAH ANAK SD-SMP) */}
                <div className="space-y-2.5">
                  {currentSlide.bulletPoints.map((pt, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-start gap-3 p-3 bg-slate-900/70 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium hover:border-emerald-500/40 transition"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* INTERACTIVE FEATURE CHIPS (DALIL & FUNFACT POPUP MODAL BUTTONS) */}
              <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-800">
                {currentSlide.dalil && (
                  <button
                    onClick={() => {
                      audioManager.playClick();
                      setActiveModal('DALIL');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>📖 Baca Dalil & Rujukan</span>
                  </button>
                )}

                {currentSlide.funFact && (
                  <button
                    onClick={() => {
                      audioManager.playClick();
                      setActiveModal('FUNFACT');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>💡 Tahukah Kamu? (Fun Fact)</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BOTTOM CONTROL NAVIGATION BAR */}
      <footer className="px-4 py-3 sm:px-8 sm:py-4 bg-[#0A1628]/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-20">
        {/* PREV BUTTON */}
        <button
          onClick={handlePrev}
          disabled={isFirstSlide}
          className={`px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg ${
            isFirstSlide
              ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Sebelumnya</span>
        </button>

        {/* INDICATOR DOTS */}
        <div className="flex items-center gap-1.5">
          {chapter.slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                audioManager.playClick();
                setCurrentSlideIndex(idx);
              }}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlideIndex
                  ? 'w-7 bg-emerald-400 shadow-sm'
                  : 'w-2.5 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* NEXT / SELESAI BUTTON */}
        {isLastSlide ? (
          <button
            onClick={() => {
              audioManager.playClick();
              onBackToPortal();
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg animate-bounce"
          >
            <span>Selesai Belajar 🎉</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-lg"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </footer>

      {/* POPUP MODAL DALIL & RUJUKAN */}
      <AnimatePresence>
        {activeModal === 'DALIL' && currentSlide.dalil && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0D1B2A] border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-emerald-400">
                <BookOpen className="w-6 h-6" />
                <h3 className="text-base font-black tracking-wide">{currentSlide.dalil.title}</h3>
              </div>

              {currentSlide.dalil.arabicText && (
                <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/60 text-right leading-loose font-serif">
                  <p className="text-xl sm:text-2xl text-emerald-200 font-semibold">{currentSlide.dalil.arabicText}</p>
                </div>
              )}

              {currentSlide.dalil.latinText && (
                <p className="text-xs text-amber-300 italic font-medium">"{currentSlide.dalil.latinText}"</p>
              )}

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-medium">
                <p className="font-bold text-slate-400 mb-1">Artinya:</p>
                <p>"{currentSlide.dalil.translation}"</p>
              </div>

              <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between pt-2 border-t border-slate-800">
                <span>Rujukan: {currentSlide.dalil.source}</span>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL FUN FACT */}
      <AnimatePresence>
        {activeModal === 'FUNFACT' && currentSlide.funFact && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0D1B2A] border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-center"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400 text-3xl flex items-center justify-center mx-auto">
                {currentSlide.funFact.icon || '💡'}
              </div>

              <h3 className="text-lg font-black text-amber-300 tracking-wide">{currentSlide.funFact.title}</h3>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium p-4 bg-slate-900 rounded-2xl border border-slate-800">
                {currentSlide.funFact.description}
              </p>

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                FAHAM & KEREEN! ✨
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
