'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Settings, Volume2, VolumeX, Heart, Star, X, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, PlayerProfile } from '@/types/game';
import { LadderPanel } from './LadderPanel';
import { AnswerFeedbackModal } from './AnswerFeedbackModal';
import { audioManager } from '@/lib/audioManager';
import { ProfileService, UserProfileData } from '@/lib/profileService';

interface QuizArenaProps {
  player: PlayerProfile;
  questions: Question[];
  onGameComplete: (correctCount: number, wrongCount: number, totalScore: number, durationSeconds: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnHome?: () => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  player,
  questions,
  onGameComplete,
  isMuted,
  onToggleMute,
  onReturnHome,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());

  // Lifelines State (1 use per game session for 50:50 and Tanya Ustadz)
  const [lifeline5050Used, setLifeline5050Used] = useState<boolean>(false);
  const [hiddenOptions, setHiddenOptions] = useState<('A' | 'B' | 'C' | 'D')[]>([]);
  const [lifelineUstadzUsed, setLifelineUstadzUsed] = useState<boolean>(false);
  const [showUstadzModal, setShowUstadzModal] = useState<boolean>(false);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Modal Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [lastIsCorrect, setLastIsCorrect] = useState<boolean>(false);

  const [userProfile] = useState<UserProfileData>(ProfileService.getProfile());
  const currentQuestion = questions[currentIndex];

  // Answer Handler Callback
  const handleAnswerSubmit = useCallback(
    (option: 'A' | 'B' | 'C' | 'D' | null) => {
      setTimerActive(false);
      setSelectedOption(option);

      const isCorrect = option === currentQuestion.correct_option;
      setLastIsCorrect(isCorrect);

      if (isCorrect) {
        audioManager.playCorrect();
        setCorrectCount((prev) => prev + 1);
        setTotalScore((prev) => prev + 100);
        try {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#10B981', '#FBBF24', '#34D399'],
          });
        } catch {
          // Confetti fallback
        }
      } else {
        audioManager.playWrong();
        setWrongCount((prev) => prev + 1);
      }

      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 400);
    },
    [currentQuestion]
  );

  // Countdown Timer Effect
  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft <= 0) {
      handleAnswerSubmit(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerActive, handleAnswerSubmit]);

  // Advance to Next Question
  const handleNextQuestion = () => {
    setShowFeedbackModal(false);
    setSelectedOption(null);
    setHiddenOptions([]);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(20);
      setTimerActive(true);
    } else {
      audioManager.playVictory();
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      onGameComplete(
        correctCount,
        wrongCount,
        totalScore,
        elapsedSeconds
      );
    }
  };

  // Lifeline 50:50 Handler
  const handleUse5050 = () => {
    if (lifeline5050Used || !timerActive) return;
    audioManager.playClick();

    const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const wrongOptions = options.filter((opt) => opt !== currentQuestion.correct_option);
    const shuffledWrong = wrongOptions.sort(() => 0.5 - Math.random());
    setHiddenOptions(shuffledWrong.slice(0, 2));
    setLifeline5050Used(true);
  };

  // Lifeline Ustadz Handler
  const handleUseUstadz = () => {
    if (lifelineUstadzUsed || !timerActive) return;
    audioManager.playClick();
    setLifelineUstadzUsed(true);
    setShowUstadzModal(true);
  };

  if (!currentQuestion) return null;

  return (
    <div
      className="min-h-screen w-full select-none flex flex-col justify-between p-3 sm:p-5 lg:p-6 overflow-hidden font-sans relative"
      style={{
        backgroundImage: `url('/image/backgroundGame2.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark Subtle Overlay */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Player Profile Badge with Custom BgProfile and PNG Border Overlay */}
        <div
          className="relative overflow-hidden border-2 border-[#FDE68A] rounded-2xl p-2 md:p-2.5 flex items-center gap-2.5 shadow-xl"
          style={{
            backgroundImage: `url('${userProfile.bg_profile || '/image/bgprofile/1.jpg'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle contrast overlay */}
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px] pointer-events-none" />

          {/* Avatar with Dynamic PNG Border Overlay */}
          <div className="relative z-10 w-11 h-11 md:w-13 md:h-13 flex items-center justify-center flex-shrink-0">
            <div className="w-[78%] h-[78%] rounded-full bg-[#FEF3C7] flex items-center justify-center overflow-hidden shadow-inner border border-amber-300">
              {player.avatar.startsWith('/') ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl md:text-2xl">{player.avatar}</span>
              )}
            </div>
            <img
              src={userProfile.border_frame || userProfile.border_color || '/image/border/1.png'}
              alt="Bingkai"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
            />
          </div>

          <div className="relative z-10 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-xs sm:text-sm md:text-base leading-none drop-shadow-sm">
                {player.name}
              </span>
              <span className="bg-[#FBBF24] text-[#78350F] text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                Lv. {userProfile.level}
              </span>
            </div>
            {userProfile.title_tag && (
              <div className="text-[9px] font-bold text-amber-300 truncate max-w-[120px]">
                {userProfile.title_tag}
              </div>
            )}
            <div className="w-20 md:w-28 bg-slate-700 h-1.5 rounded-full overflow-hidden border border-slate-600">
              <div
                className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((userProfile.amal_points % 500) / 500) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] md:text-xs font-bold text-[#34D399]">
              <span>💚</span>
              <span>{(userProfile.amal_points + totalScore).toLocaleString('id-ID')} Amal</span>
            </div>
          </div>
        </div>

        {/* Center: Arena Logo Image */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex justify-center max-w-[180px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px]"
        >
          <img
            src="/image/logoarena.png"
            alt="Islamic Millionaire Quiz Arena"
            className="w-full h-auto object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        {/* Right: Lives & Settings Buttons */}
        <div className="flex items-center gap-2">
          {/* Hearts Capsule */}
          <div className="bg-[#0B132B]/85 backdrop-blur-md border-2 border-[#FDE68A] rounded-2xl px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-1.5 text-white font-extrabold text-xs md:text-sm shadow-xl">
            <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500 fill-current animate-pulse" />
            <span>3</span>
            <span className="text-gold-400 font-black text-xs md:text-sm ml-0.5">+</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#0B132B]/85 border-2 border-[#FDE68A] text-white flex items-center justify-center shadow-xl hover:scale-105 transition cursor-pointer"
          >
            <Settings className="w-5 h-5 text-[#FDE68A]" />
          </button>
        </div>
      </header>

      {/* SUB-HEADER: QUESTION PROGRESS DOTS & TIMER */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between gap-4 my-2 md:my-3">
        {/* Left: Soal X dari 15 & Progress Dots */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <span className="text-xs sm:text-sm md:text-base font-bold text-white tracking-wide">
            Soal <span className="text-[#FBBF24] font-black">{currentIndex + 1}</span> dari {questions.length}
          </span>

          {/* 15 Progress Dots */}
          <div className="flex items-center gap-1 md:gap-1.5">
            {questions.map((_, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black transition-all ${
                    isCompleted
                      ? 'bg-[#22C55E] text-white border border-[#86EFAC]'
                      : isCurrent
                      ? 'bg-[#FBBF24] text-[#78350F] border-2 border-white ring-2 ring-[#FBBF24]/60 scale-125'
                      : 'bg-slate-900/60 border border-[#FBBF24]/50 text-slate-500'
                  }`}
                >
                  {isCurrent ? idx + 1 : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Countdown Timer Capsule */}
        <div className="bg-[#0B132B]/90 border-2 border-[#FDE68A] rounded-full px-4 py-1.5 flex items-center gap-2 text-white font-extrabold shadow-xl">
          <Timer className="w-4 h-4 text-[#FBBF24] animate-spin" />
          <span className="text-base md:text-lg font-black text-[#FBBF24]">{timeLeft}</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 md:gap-6 py-1">
        {/* CENTER: QUIZ QUESTION CARD */}
        <div className="flex-1 w-full max-w-2xl lg:max-w-3xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[#FFFDF3] border-4 border-[#FDE68A] rounded-3xl p-5 md:p-7 shadow-2xl text-[#1E293B] relative"
          >
            {/* Question Text */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-center text-[#1E293B] leading-relaxed mb-4">
              {currentQuestion.question_text}
            </h3>

            {/* Star Divider Line */}
            <div className="flex items-center justify-center gap-3 my-4 opacity-60">
              <div className="h-0.5 w-16 md:w-24 bg-[#D97706]/40 rounded-full" />
              <Star className="w-4 h-4 md:w-5 md:h-5 fill-current text-[#D97706]" />
              <div className="h-0.5 w-16 md:w-24 bg-[#D97706]/40 rounded-full" />
            </div>

            {/* 4 ANSWER OPTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4 mt-4">
              {(['A', 'B', 'C', 'D'] as const).map((key) => {
                const optText = currentQuestion[`option_${key.toLowerCase()}` as keyof Question];
                const isHidden = hiddenOptions.includes(key);
                const isSelected = selectedOption === key;

                const buttonStyles = {
                  A: 'from-[#2563EB] to-[#1D4ED8] border-[#93C5FD] shadow-[0_5px_0_#1E40AF]',
                  B: 'from-[#22C55E] to-[#15803D] border-[#BBF7D0] shadow-[0_5px_0_#166534]',
                  C: 'from-[#F59E0B] to-[#B45309] border-[#FDE68A] shadow-[0_5px_0_#78350F]',
                  D: 'from-[#EF4444] to-[#B91C1C] border-[#FCA5A5] shadow-[0_5px_0_#991B1B]',
                };

                if (isHidden) {
                  return (
                    <div
                      key={key}
                      className="p-3.5 rounded-2xl border-2 border-slate-300 bg-slate-200/60 text-slate-400 opacity-40 select-none text-center font-bold text-sm"
                    >
                      <span className="mr-1">({key})</span>
                      <span>[ Dieliminasi ]</span>
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: timerActive ? 1.02 : 1 }}
                    whileTap={{ scale: timerActive ? 0.97 : 1 }}
                    disabled={!timerActive}
                    onClick={() => handleAnswerSubmit(key)}
                    className={`py-3.5 md:py-4 px-4 rounded-2xl md:rounded-3xl bg-gradient-to-b ${
                      buttonStyles[key]
                    } border-3 text-white font-extrabold text-base md:text-lg flex items-center justify-start gap-3 transition cursor-pointer ${
                      isSelected ? 'ring-4 ring-white scale-102' : ''
                    }`}
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white text-[#1E293B] font-black text-base md:text-lg flex items-center justify-center shadow-md flex-shrink-0">
                      {key}
                    </div>
                    <span className="flex-1 text-left leading-snug drop-shadow-sm">{optText}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* BOTTOM LIFELINES BAR */}
          <div className="flex items-center justify-center gap-4 md:gap-6 mt-4 w-full">
            {/* 50:50 Lifeline Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUse5050}
              disabled={lifeline5050Used || !timerActive}
              className={`bg-[#0B132B]/90 border-2 border-[#FDE68A] rounded-2xl px-5 py-2.5 flex items-center gap-2.5 shadow-xl transition cursor-pointer relative ${
                lifeline5050Used ? 'opacity-40 grayscale cursor-not-allowed' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                50:50
              </div>
              <span className="text-white font-extrabold text-xs md:text-sm">50:50</span>
              <div className="absolute -top-2 -right-2 bg-[#FBBF24] text-[#78350F] rounded-full w-5.5 h-5.5 flex items-center justify-center font-black text-[11px] border-2 border-white shadow-md">
                {lifeline5050Used ? 0 : 1}
              </div>
            </motion.button>

            {/* Tanya Ustadz Lifeline Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUseUstadz}
              disabled={lifelineUstadzUsed || !timerActive}
              className={`bg-[#0B132B]/90 border-2 border-[#FDE68A] rounded-2xl px-5 py-2 flex items-center gap-2.5 shadow-xl transition cursor-pointer relative ${
                lifelineUstadzUsed ? 'opacity-40 grayscale cursor-not-allowed' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#FEF3C7] border border-[#F59E0B] overflow-hidden flex-shrink-0">
                <img src="/image/tanyaustadz.png" alt="Tanya Ustadz" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-extrabold text-xs md:text-sm leading-tight text-left">
                Tanya<br />Ustadz
              </span>
              <div className="absolute -top-2 -right-2 bg-[#FBBF24] text-[#78350F] rounded-full w-5.5 h-5.5 flex items-center justify-center font-black text-[11px] border-2 border-white shadow-md">
                {lifelineUstadzUsed ? 0 : 1}
              </div>
            </motion.button>
          </div>
        </div>

        {/* RIGHT SIDE: TANGGA AMAL PANEL */}
        <aside className="hidden lg:block">
          <LadderPanel currentQuestionIndex={currentIndex} totalQuestions={questions.length} />
        </aside>
      </main>

      {/* EDUCATIONAL ANSWER FEEDBACK MODAL */}
      <AnswerFeedbackModal
        isOpen={showFeedbackModal}
        isCorrect={lastIsCorrect}
        selectedOption={selectedOption}
        question={currentQuestion}
        onNext={handleNextQuestion}
      />

      {/* TANYA USTADZ MODAL WITH USTADZ IMAGE */}
      <AnimatePresence>
        {showUstadzModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FFFDF3] max-w-md w-full rounded-3xl p-6 border-4 border-[#FDE68A] text-center shadow-2xl relative text-[#451A03]"
            >
              <button
                onClick={() => setShowUstadzModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#FEF3C7] text-[#78350F] hover:bg-amber-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Ustadz Avatar Image */}
              <div className="w-24 h-24 rounded-full bg-[#FEF3C7] border-4 border-[#F59E0B] overflow-hidden mx-auto mb-3 shadow-lg">
                <img src="/image/tanyaustadz.png" alt="Ustadz Virtual" className="w-full h-full object-cover" />
              </div>

              <h3 className="text-xl font-extrabold text-[#78350F] mb-1">Nasihat Ustadz Virtual</h3>
              <p className="text-xs text-amber-900 mb-4">Bismillah, berikut petunjuk untuk membantu kamu menjawab:</p>

              <div className="bg-[#FEF3C7] p-4 rounded-2xl border border-[#F59E0B] text-[#78350F] text-xs font-semibold leading-relaxed italic mb-6">
                "{currentQuestion.ustadz_hint || 'Fokus pada pilihan yang paling mencerminkan ajaran pokok Islam dan memiliki dalil yang shahih.'}"
              </div>

              <button
                onClick={() => setShowUstadzModal(false)}
                className="emerald-gradient-btn w-full py-3 rounded-2xl text-white font-extrabold text-sm shadow-md cursor-pointer"
              >
                TERIMA KASIH, USTADZ!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL (WITH RETURN TO MAIN MENU BUTTON) */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#FFFDF3] max-w-sm w-full rounded-3xl p-6 border-4 border-[#FDE68A] text-center shadow-2xl relative text-[#451A03]"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#FEF3C7] text-[#78350F] hover:bg-amber-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-full bg-[#E0F2FE] border-2 border-[#38BDF8] flex items-center justify-center text-3xl mx-auto mb-3">
                ⚙️
              </div>
              <h3 className="text-lg font-extrabold text-[#78350F] mb-4">Pengaturan Permainan</h3>

              <div className="space-y-3">
                {/* Audio Toggle */}
                <div className="flex items-center justify-between p-3 bg-[#FEF3C7] rounded-2xl border border-[#F59E0B]">
                  <div className="flex items-center gap-3">
                    {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
                    <span className="font-bold text-xs text-[#78350F]">Suara & Audio</span>
                  </div>
                  <button
                    onClick={onToggleMute}
                    className={`px-3 py-1 rounded-xl text-xs font-bold text-white transition cursor-pointer ${
                      isMuted ? 'bg-red-500' : 'bg-[#10B981]'
                    }`}
                  >
                    {isMuted ? 'MUTE' : 'AKTIF'}
                  </button>
                </div>

                {/* Return to Main Menu Button */}
                {onReturnHome && (
                  <button
                    onClick={() => {
                      audioManager.playClick();
                      setShowSettingsModal(false);
                      onReturnHome();
                    }}
                    className="w-full p-3 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-[#F59E0B] text-[#78350F] font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-[#B45309]" />
                    <span>KEMBALI KE MENU UTAMA</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full mt-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                LANJUTKAN KUIS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
