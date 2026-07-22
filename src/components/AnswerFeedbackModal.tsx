'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Star } from 'lucide-react';
import { Question } from '@/types/game';

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

  const getOptionText = (optKey: 'A' | 'B' | 'C' | 'D') => {
    switch (optKey) {
      case 'A': return question.option_a;
      case 'B': return question.option_b;
      case 'C': return question.option_c;
      case 'D': return question.option_d;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#FFFDF3] border-4 border-[#FDE68A] max-w-lg w-full rounded-[32px] p-6 sm:p-7 shadow-2xl text-[#1E293B] relative pt-10"
        >
          {/* TOP CURVED RIBBON BADGE */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div
              className={`px-8 py-2.5 rounded-full font-black text-lg md:text-xl text-white shadow-lg flex items-center gap-2 border-2 border-white tracking-wide ${
                isCorrect
                  ? 'bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#15803D] shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-[#EF4444] via-[#DC2626] to-[#B91C1C] shadow-red-500/40'
              }`}
            >
              {isCorrect && <Star className="w-4 h-4 fill-current text-yellow-300" />}
              <span>{isCorrect ? 'Jawaban Benar!' : 'Jawaban Kurang Tepat'}</span>
              {isCorrect && <Star className="w-4 h-4 fill-current text-yellow-300" />}
            </div>
          </div>

          {/* MAIN ICON (BIG GREEN CHECK OR RED CROSS WITH SPARKLES) */}
          <div className="flex flex-col items-center text-center mt-2 mb-4">
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-xl mb-3 border-4 border-white ${
                isCorrect
                  ? 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-b from-[#FCA5A5] to-[#DC2626] text-white shadow-red-500/30'
              }`}
            >
              {isCorrect ? (
                <Check className="w-12 h-12 md:w-14 md:h-14 stroke-[3.5]" />
              ) : (
                <X className="w-12 h-12 md:w-14 md:h-14 stroke-[3.5]" />
              )}
            </div>

            {/* GREETING TEXT */}
            <h4 className="text-base sm:text-lg font-black text-[#1E293B]">
              {isCorrect ? 'MasyaAllah! Jawabanmu benar sekali!' : 'Yuk, tetap semangat! Kamu pasti bisa!'}
            </h4>
          </div>

          {/* IF WRONG: ANSWER COMPARISON BOX */}
          {!isCorrect && (
            <div className="bg-[#FFEDD5]/80 border border-[#FDBA74] rounded-2xl p-3.5 mb-4 grid grid-cols-2 gap-3 text-xs">
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

          {/* EXPLANATION BOX (PENJELASAN) */}
          <div
            className={`rounded-2xl p-4 border mb-4 text-xs sm:text-sm leading-relaxed ${
              isCorrect
                ? 'bg-[#DCFCE7]/90 border-[#86EFAC] text-[#14532D]'
                : 'bg-[#FEE2E2]/90 border-[#FCA5A5] text-[#7F1D1D]'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">📗</span>
              <div>
                <span className="font-extrabold block text-xs uppercase tracking-wider mb-0.5">
                  Penjelasan:
                </span>
                <p className="font-semibold text-xs sm:text-sm leading-snug">{question.explanation}</p>
              </div>
            </div>
          </div>

          {/* DALIL SECTION WITH DECORATIVE LANTERN IMAGE */}
          {question.dalil && (
            <div className="bg-[#FEF3C7]/60 border border-[#FDE68A] rounded-2xl p-4 mb-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1 pr-12">
                  <span className="font-extrabold text-xs text-[#78350F] uppercase tracking-wider block">
                    Dalil
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#451A03] italic leading-relaxed">
                    "{question.dalil}"
                  </p>
                  <span className="text-[11px] font-extrabold text-[#047857] block pt-1">
                    (HR. Bukhari dan Muslim / Al-Qur'an)
                  </span>
                </div>

                {/* Lantern Decorative Image */}
                <div className="absolute right-2 bottom-1 w-12 h-16 pointer-events-none flex items-end justify-end">
                  <img
                    src="/image/lenteraicon.png"
                    alt="Lentera Icon"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM ACTION BUTTON: ONLY "Lanjut ke Soal Berikutnya ➔" */}
          <div className="flex justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={onNext}
              className={`py-3.5 px-6 rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer transition ${
                isCorrect
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
