'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Star } from 'lucide-react';
import { Question } from '@/types/game';
import { getThemeConfig, getThemeByCategory } from '@/lib/themeConfig';

interface AnswerFeedbackModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  question: Question;
  onNext: () => void;
}

export const AnswerFeedbackModal: React.FC<AnswerFeedbackModalProps> = ({
  isOpen,
  isCorrect,
  selectedOption,
  question,
  onNext,
}) => {
  if (!isOpen) return null;

  const themeId = question.theme_id || getThemeByCategory(question.category_name);
  const themeConfig = getThemeConfig(themeId);

  const getOptionText = (optKey: 'A' | 'B' | 'C' | 'D') => {
    switch (optKey) {
      case 'A': return question.option_a;
      case 'B': return question.option_b;
      case 'C': return question.option_c;
      case 'D': return question.option_d;
    }
  };

  // Dynamic Theme-matched Mascot Selection
  const getThemeMascots = () => {
    if (themeId === 'independence') {
      return {
        main: isCorrect ? '/image/mascot/banggamerdeka.png' : '/image/mascot/bacamerdeka.png',
        reference: '/image/mascot/dudukmerdeka.png',
      };
    } else if (themeId === 'culture') {
      return {
        main: isCorrect ? '/image/mascot/yesbudaya.png' : '/image/mascot/bacabudaya.png',
        reference: '/image/mascot/angklungbudaya.png',
      };
    } else {
      return {
        main: isCorrect ? '/image/mascot/ok.png' : '/image/mascot/read.png',
        reference: question.dalil?.toLowerCase().includes('qur') ? '/image/mascot/quran.png' : '/image/mascot/doa.png',
      };
    }
  };

  const mascots = getThemeMascots();
  const mainMascotImg = mascots.main;
  const dalilMascotImg = mascots.reference;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none font-sans overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 25 }}
          className="bg-[#FFFDF3] border-4 border-[#FDE68A] max-w-lg w-full rounded-[32px] p-5 sm:p-7 shadow-2xl text-[#1E293B] relative pt-10 my-auto"
        >
          {/* TOP CURVED RIBBON BADGE */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div
              className={`px-8 py-2.5 rounded-full font-black text-lg md:text-xl text-white shadow-lg flex items-center gap-2 border-2 border-white tracking-wide ${isCorrect
                  ? 'bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#15803D] shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-[#EF4444] via-[#DC2626] to-[#B91C1C] shadow-red-500/40'
                }`}
            >
              {isCorrect && <Star className="w-4 h-4 fill-current text-yellow-300" />}
              <span>{isCorrect ? 'Jawaban Benar!' : 'Jawaban Kurang Tepat'}</span>
              {isCorrect && <Star className="w-4 h-4 fill-current text-yellow-300" />}
            </div>
          </div>

          {/* MAIN MASCOT & HEADER SECTION */}
          <div className="flex items-center justify-center gap-3 mt-2 mb-4">
            {/* Animated 3D Mascot Character */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center"
            >
              <img
                src={mainMascotImg}
                alt="Mascot Avatar"
                className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] animate-bounce"
                style={{ animationDuration: '3s' }}
              />
            </motion.div>

            {/* Greeting & Check/Cross Badge Header */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md text-white ${isCorrect
                      ? 'bg-[#22C55E]'
                      : 'bg-[#EF4444]'
                    }`}
                >
                  {isCorrect ? (
                    <Check className="w-4 h-4 stroke-[3.5]" />
                  ) : (
                    <X className="w-4 h-4 stroke-[3.5]" />
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-black text-[#1E293B] leading-tight">
                  {isCorrect
                    ? `Luar biasa! Jawabanmu tepat! ${themeConfig.icon}`
                    : 'Yuk, tetap semangat! Kamu pasti bisa!'}
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-amber-900/80">
                {isCorrect
                  ? 'Keren sekali, poinmu bertambah! Mari simak penjelasannya:'
                  : 'Jangan menderu, mari kita pelajari sama-sama di bawah ini:'}
              </p>
            </div>
          </div>

          {/* IF WRONG: ANSWER COMPARISON BOX */}
          {!isCorrect && (
            <div className="bg-[#FFEDD5]/90 border-2 border-[#FDBA74] rounded-2xl p-3.5 mb-4 grid grid-cols-2 gap-3 text-xs shadow-inner">
              {/* Correct Answer */}
              <div>
                <span className="text-[11px] font-bold text-amber-900 block mb-1">
                  Jawaban yang benar adalah:
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                    {question.correct_option}
                  </div>
                  <span className="font-extrabold text-[#15803D] text-xs sm:text-sm truncate">
                    {getOptionText(question.correct_option)}
                  </span>
                </div>
              </div>

              {/* Player's Wrong Choice */}
              <div>
                <span className="text-[11px] font-bold text-amber-900 block mb-1">
                  Jawabanmu:
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#EF4444] text-white font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                    {selectedOption || '?'}
                  </div>
                  <span className="font-extrabold text-[#B91C1C] text-xs sm:text-sm truncate">
                    {selectedOption ? getOptionText(selectedOption) : 'Waktu Habis'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* EXPLANATION BOX (SPEECH BUBBLE STYLE WITH MASCOT INSIGHT) */}
          <div
            className={`rounded-2xl p-4 border-2 mb-4 text-xs sm:text-sm leading-relaxed relative ${isCorrect
                ? 'bg-[#DCFCE7]/90 border-[#86EFAC] text-[#14532D]'
                : 'bg-[#FEE2E2]/90 border-[#FCA5A5] text-[#7F1D1D]'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-current flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                💡
              </div>
              <div className="flex-1">
                <span className="font-extrabold block text-xs uppercase tracking-wider mb-0.5">
                  Penjelasan & Edukasi:
                </span>
                <p className="font-semibold text-xs sm:text-sm leading-snug">{question.explanation}</p>
              </div>
            </div>
          </div>

          {/* REFERENCE / DALIL SECTION WITH DALIL MASCOT */}
          {question.dalil && (
            <div className="bg-[#FEF3C7] border-2 border-[#FDE68A] rounded-2xl p-4 mb-5 relative overflow-hidden shadow-xs">
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1.5 pr-14">
                  <span className="font-extrabold text-xs text-[#78350F] uppercase tracking-wider flex items-center gap-1.5">
                    <span>{themeConfig.referenceIcon}</span>
                    <span>{themeConfig.referenceLabel}</span>
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#451A03] italic leading-relaxed">
                    "{question.dalil}"
                  </p>
                </div>

                {/* Decorative Dalil Mascot Illustration */}
                <div className="absolute right-1 bottom-1 w-14 h-16 pointer-events-none flex items-end justify-end">
                  <img
                    src={dalilMascotImg}
                    alt="Dalil Mascot"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM ACTION BUTTON */}
          <div className="flex justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onNext}
              className={`py-3.5 px-6 rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer transition ${isCorrect
                  ? 'bg-gradient-to-b from-[#22C55E] to-[#15803D] border-2 border-[#BBF7D0] hover:shadow-emerald-500/30'
                  : 'bg-gradient-to-b from-[#EF4444] to-[#B91C1C] border-2 border-[#FCA5A5] hover:shadow-red-500/30'
                }`}
            >
              <span>Lanjut ke Soal Berikutnya</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
