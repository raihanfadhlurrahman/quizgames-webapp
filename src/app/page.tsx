'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Award, Home, ShieldCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { GameState, PlayerProfile, Question, GameSessionResult } from '@/types/game';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { SetupScreen } from '@/components/SetupScreen';
import { QuizArena } from '@/components/QuizArena';
import { CertificateGenerator } from '@/components/CertificateGenerator';
import { LeaderboardView } from '@/components/LeaderboardView';
import { RoomJoinModal } from '@/components/RoomJoinModal';
import { KahootPlayerArena } from '@/components/KahootPlayerArena';
import { GameService } from '@/lib/gameService';
import { ProfileService } from '@/lib/profileService';
import { audioManager } from '@/lib/audioManager';
import { AuthService } from '@/lib/authService';
import { QuizRoom } from '@/types/game';

export default function HomePage() {
  const [gameState, setGameState] = useState<GameState>('WELCOME');
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSummaryLeaderboardModal, setShowSummaryLeaderboardModal] = useState<boolean>(false);
  const [showRoomJoinModal, setShowRoomJoinModal] = useState<boolean>(false);
  const [joinedKahootRoom, setJoinedKahootRoom] = useState<QuizRoom | null>(null);

  // Summary State
  const [finalResult, setFinalResult] = useState<{
    correctCount: number;
    wrongCount: number;
    totalScore: number;
    durationSeconds: number;
  } | null>(null);
  useEffect(() => {
    // Initial profile sync on mount
    ProfileService.fetchProfileFromServer();

    // Listen to authentication changes
    const unsubscribe = AuthService.onAuthStateChange(async (event, session) => {
      if (session) {
        await ProfileService.fetchProfileFromServer();
      } else {
        ProfileService.clearLocalProfile();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleToggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const handleStartSetup = () => {
    setGameState('SETUP');
  };

  const handleSetupComplete = async (profile: PlayerProfile) => {
    setPlayer(profile);
    setLoading(true);
    const fetched = await GameService.getQuestions(profile.category, 15);
    setQuestions(fetched);
    setLoading(false);
    setGameState('PLAYING');
  };

  const handleGameComplete = async (
    correctCount: number,
    wrongCount: number,
    totalScore: number,
    durationSeconds: number
  ) => {
    setFinalResult({ correctCount, wrongCount, totalScore, durationSeconds });
    setGameState('SUMMARY');

    // Accumulate Poin Amal & XP to real profile
    await ProfileService.addGameResults(totalScore, correctCount, questions.length);

    const activeProfile = ProfileService.getProfile();

    if (player) {
      const result: GameSessionResult = {
        player_id: (activeProfile?.id && activeProfile.id.trim() !== '') ? activeProfile.id : undefined,
        player_name: activeProfile?.name || player.name,
        player_avatar: activeProfile?.avatar || player.avatar,
        category_name: player.category,
        mode: 'Classic Millionaire',
        total_questions: questions.length,
        correct_answers: correctCount,
        wrong_answers: wrongCount,
        total_score: totalScore,
        duration_seconds: durationSeconds,
        event_tag: 'KKN Wedomartani',
      };
      const subRes = await GameService.submitGameResult(result);
      if (!subRes.success) {
        console.error('Leaderboard score submission warning:', subRes.error);
      }
    }
  };

  const handleRestart = () => {
    setGameState('SETUP');
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between select-none">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-emerald-400 font-bold text-lg">Memenyiapkan Soal Kuis...</p>
          <p className="text-xs text-slate-400">Bismillah, mari belajar bersama!</p>
        </div>
      )}

      {/* Screen Views */}
      {gameState === 'WELCOME' && (
        <>
          <WelcomeScreen
            onStart={handleStartSetup}
            onOpenRoomJoin={() => setShowRoomJoinModal(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
          <RoomJoinModal
            isOpen={showRoomJoinModal}
            onClose={() => setShowRoomJoinModal(false)}
            onJoinedAndStarted={(room) => {
              setShowRoomJoinModal(false);
              setJoinedKahootRoom(room);
            }}
          />
        </>
      )}

      {/* KAHOOT LIVE MULTIPLAYER ARENA */}
      {joinedKahootRoom && (
        <KahootPlayerArena
          initialRoom={joinedKahootRoom}
          onReturnHome={() => setJoinedKahootRoom(null)}
        />
      )}

      {gameState === 'SETUP' && (
        <SetupScreen
          onGameSetupComplete={handleSetupComplete}
          onBack={() => setGameState('WELCOME')}
        />
      )}

      {gameState === 'PLAYING' && player && questions.length > 0 && (
        <QuizArena
          player={player}
          questions={questions}
          onGameComplete={handleGameComplete}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onReturnHome={() => setGameState('WELCOME')}
        />
      )}

      {/* COMPACT SUMMARY SCREEN FITTING VIEWPORT */}
      {gameState === 'SUMMARY' && player && finalResult && (
        <div
          className="min-h-screen w-full p-3 md:p-6 flex items-center justify-center relative font-sans overflow-y-auto"
          style={{
            backgroundImage: `url('/image/backgroundSummary.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Subtle Dark Overlay */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0B132B]/90 backdrop-blur-md max-w-3xl lg:max-w-4xl w-full p-4 sm:p-6 rounded-[32px] border-4 border-[#FDE68A]/60 shadow-2xl space-y-4 relative z-10 my-auto"
          >
            {/* Header */}
            <div className="text-center space-y-0.5">
              <div className="text-3xl sm:text-4xl mb-1 animate-bounce">🎉</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                Selamat, {player.name}!
              </h2>
              <p className="text-xs text-slate-300 font-semibold">
                Kamu telah menyelesaikan 15 pertanyaan edukasi Islami
              </p>
            </div>

            {/* 4 STAT CARDS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Card 1: Total Skor */}
              <div className="p-2.5 sm:p-3 bg-[#0A0F1D]/90 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center gap-0.5 shadow-md">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
                  <Trophy className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Total Skor
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#FBBF24]">
                  {finalResult.totalScore}
                </span>
                <span className="text-[9px] text-slate-500 font-bold">Poin</span>
              </div>

              {/* Card 2: Benar */}
              <div className="p-2.5 sm:p-3 bg-[#0A0F1D]/90 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center gap-0.5 shadow-md">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Benar
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#22C55E]">
                  {finalResult.correctCount}
                </span>
                <span className="text-[9px] text-slate-500 font-bold">Soal</span>
              </div>

              {/* Card 3: Salah */}
              <div className="p-2.5 sm:p-3 bg-[#0A0F1D]/90 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center gap-0.5 shadow-md">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center text-red-400">
                  <XCircle className="w-4 h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Salah
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#EF4444]">
                  {finalResult.wrongCount}
                </span>
                <span className="text-[9px] text-slate-500 font-bold">Soal</span>
              </div>

              {/* Card 4: Waktu */}
              <div className="p-2.5 sm:p-3 bg-[#0A0F1D]/90 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center gap-0.5 shadow-md">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  Waktu
                </span>
                <span className="text-lg sm:text-2xl font-black text-white">
                  {finalResult.durationSeconds}s
                </span>
                <span className="text-[9px] text-slate-500 font-bold">Total</span>
              </div>
            </div>

            {/* CERTIFICATE DISPLAY SECTION */}
            <div className="pt-1">
              <CertificateGenerator
                player={player}
                totalScore={finalResult.totalScore}
                correctCount={finalResult.correctCount}
                totalQuestions={questions.length}
              />
            </div>

            {/* ACTION BUTTONS (MAIN LAGI, LEADERBOARD, MENU UTAMA) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  audioManager.playClick();
                  handleRestart();
                }}
                className="emerald-gradient-btn py-3 rounded-2xl text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-103 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>MAIN LAGI</span>
              </button>

              <button
                onClick={() => {
                  audioManager.playClick();
                  setShowSummaryLeaderboardModal(true);
                }}
                className="py-3 rounded-2xl bg-[#0A0F1D] border-2 border-[#FBBF24]/50 text-[#FBBF24] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition cursor-pointer shadow-lg"
              >
                <Trophy className="w-4 h-4 text-[#FBBF24]" />
                <span>LIHAT LEADERBOARD</span>
              </button>

              <button
                onClick={() => {
                  audioManager.playClick();
                  setGameState('WELCOME');
                }}
                className="py-3 rounded-2xl bg-[#0A0F1D] border-2 border-slate-700 text-slate-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition cursor-pointer shadow-lg"
              >
                <Home className="w-4 h-4" />
                <span>KE MENU UTAMA</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SUMMARY LEADERBOARD POPUP MODAL */}
      <LeaderboardView
        isOpen={showSummaryLeaderboardModal}
        onClose={() => setShowSummaryLeaderboardModal(false)}
      />
    </main>
  );
}
