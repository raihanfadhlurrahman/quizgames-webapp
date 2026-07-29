'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, CheckCircle2, XCircle, Award, Users, ChevronRight, BookOpen, Sparkles, Loader2, LogOut } from 'lucide-react';
import { QuizRoom, QuizRoomPlayer, Question } from '@/types/game';
import { RoomService } from '@/lib/roomService';
import { GameService } from '@/lib/gameService';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { audioManager } from '@/lib/audioManager';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface KahootPlayerArenaProps {
  initialRoom: QuizRoom;
  onReturnHome: () => void;
}

export const KahootPlayerArena: React.FC<KahootPlayerArenaProps> = ({ initialRoom, onReturnHome }) => {
  const [room, setRoom] = useState<QuizRoom>(initialRoom);
  const [players, setPlayers] = useState<QuizRoomPlayer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userProfile] = useState<UserProfileData>(ProfileService.getProfileOrDefault());

  // Player state per question
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [answeredQIndex, setAnsweredQIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  const handleLeaveRoom = async () => {
    if (confirm('Yakin ingin keluar dari kuis live ini?')) {
      audioManager.playClick();
      await RoomService.leaveRoom(room.id, userProfile.id);
      onReturnHome();
    }
  };

  // Fetch questions & players on mount, then re-sync if room provides question_ids
  useEffect(() => {
    let broadcastChannel: any = null;

    const loadQuestions = async () => {
      // Fallback: load deterministically (same sort as operator)
      const qs = await GameService.getQuestions(initialRoom.category_name || 'Campuran', initialRoom.total_questions || 10, 'kahoot');
      setQuestions(qs);
    };

    loadQuestions();
    RoomService.getRoomPlayers(initialRoom.id).then(setPlayers);

    // Subscribe to realtime room updates
    const unsubscribe = RoomService.subscribeToRoom(
      initialRoom.id,
      (updatedRoom) => {
        setRoom(updatedRoom);
      },
      (updatedPlayers) => {
        setPlayers(updatedPlayers);
      }
    );

    // Player Broadcast Channel for Syncing Manual Questions from Host
    if (isSupabaseConfigured() && supabase) {
      broadcastChannel = supabase.channel(`room_sync_${initialRoom.id}`);
      broadcastChannel
        .on('broadcast', { event: 'provide_questions' }, (payload: any) => {
          if (payload.payload?.question_ids) {
            GameService.getQuestionsByIds(payload.payload.question_ids).then((ordered) => {
              if (ordered.length > 0) setQuestions(ordered);
            });
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            // As soon as we join the channel, ask the Host for questions
            broadcastChannel.send({
              type: 'broadcast',
              event: 'request_questions',
            });
          }
        });
    }

    return () => {
      unsubscribe();
      if (broadcastChannel && supabase) {
        supabase.removeChannel(broadcastChannel);
      }
    };
  }, [initialRoom.id]);

  // Handle question index changes from Operator
  const currentQIndex = room.current_question_index || 0;
  const currentQ = questions[currentQIndex];

  // Reset option selection when operator moves to a new question
  useEffect(() => {
    if (answeredQIndex !== currentQIndex) {
      setSelectedOption(null);
      setTimeLeft(20);
    }
  }, [currentQIndex]);

  // Local 20-second timer countdown during 'question' phase
  useEffect(() => {
    if (room.status === 'question') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setTimeLeft(20);
    }
  }, [room.status, currentQIndex]);

  // Handle Option Click by Player
  const handleSelectOption = async (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (selectedOption !== null || room.status !== 'question') return;

    audioManager.playClick();
    setSelectedOption(optionKey);
    setAnsweredQIndex(currentQIndex);

    const isCorrect = currentQ && currentQ.correct_option === optionKey;
    const timeBonus = Math.max(0, timeLeft * 20);
    const scoreAdd = isCorrect ? 1000 + timeBonus : 0;

    if (isCorrect) {
      audioManager.playCorrect();
    } else {
      audioManager.playWrong();
    }

    // Submit score increment to room
    await RoomService.submitRoomScore(room.id, userProfile.id, scoreAdd, isCorrect);
  };

  // Find player's rank & entry in room
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myRankIndex = sortedPlayers.findIndex((p) => p.player_id === userProfile.id);
  const myPlayerEntry = myRankIndex !== -1 ? sortedPlayers[myRankIndex] : null;

  const currentBg = userProfile.bg_profile || '/image/bgprofile/1.jpg';
  const playerBorder = userProfile.border_frame || userProfile.border_color || '/image/border/1.png';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col font-sans select-none overflow-hidden"
      style={{
        backgroundImage: `url('${currentBg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Blur Overlay */}
      <div className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-md pointer-events-none" />

      {/* TOP HEADER BAR */}
      <div className="relative z-10 p-3 md:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          {/* Avatar with PNG Border Frame Overlay */}
          <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
            <div className="w-[78%] h-[78%] rounded-full bg-[#FEF3C7] flex items-center justify-center overflow-hidden border border-amber-300">
              {userProfile.avatar && userProfile.avatar.startsWith('/') ? (
                <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{userProfile.avatar || '👦🏻'}</span>
              )}
            </div>
            <img
              src={playerBorder}
              alt="Bingkai"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
            />
          </div>

          <div>
            <span className="font-extrabold text-white text-sm block leading-tight truncate max-w-[140px]">
              {userProfile.name}
            </span>
            <span className="text-[10.5px] text-amber-400 font-bold block">
              Skor: {myPlayerEntry ? myPlayerEntry.score.toLocaleString('id-ID') : 0} Pt
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-300 text-xs font-mono font-black px-3 py-1 rounded-full border border-amber-400/40">
            PIN: {room.room_code}
          </span>
          <button
            onClick={handleLeaveRoom}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-xl border border-red-500/40 cursor-pointer flex items-center gap-1 transition active:scale-95"
            title="Keluar dari Room Kuis"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* MAIN GAME ARENA CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
        {/* FASE 0: WAITING LOBBY (BEFORE GAME STARTS) */}
        {room.status === 'waiting' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full space-y-6 text-center my-auto">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Users className="w-10 h-10 text-amber-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black gold-gradient-text">Terhubung ke Lobby Kuis!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anda sudah berada di room PIN <strong className="text-amber-400 font-mono font-bold">{room.room_code}</strong>.
                Menunggu Host/Admin memulai kuis...
              </p>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs space-y-2 text-left shadow-xl">
              <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800 pb-2">
                <span>Nama Pemain:</span>
                <span className="text-emerald-400 font-extrabold">{userProfile.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>Pemain Terhubung:</span>
                <span className="text-amber-300 font-extrabold">{players.length} Orang</span>
              </div>
            </div>

            <button
              onClick={handleLeaveRoom}
              className="w-full py-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-black text-xs rounded-2xl border border-red-500/40 cursor-pointer flex items-center justify-center gap-2 transition active:scale-95 shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Room Kuis</span>
            </button>
          </motion.div>
        )}

        {/* FASE 1: QUESTION VIEW (TIMER 20s ACTIVE) */}
        {room.status === 'question' && currentQ && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full space-y-4 my-auto">
            {/* TIMER & PROGRESS HEADER */}
            <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-md">
              <span className="text-xs font-bold text-slate-300">
                Soal <strong className="text-white">{currentQIndex + 1}</strong> dari {questions.length}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/40 text-amber-300 font-mono font-black text-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* QUESTION BOX */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 text-left shadow-2xl space-y-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {currentQ.category_name || room.category_name}
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-white leading-relaxed">
                {currentQ.question_text}
              </h2>
            </div>

            {/* 4 COLORFUL ANSWER BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                const optText = currentQ[`option_${optKey.toLowerCase()}` as keyof Question];
                const isSelected = selectedOption === optKey;
                const isOtherSelected = selectedOption !== null && !isSelected;

                const colorStyles = {
                  A: 'from-red-600 to-rose-700 border-red-400',
                  B: 'from-blue-600 to-indigo-700 border-blue-400',
                  C: 'from-amber-500 to-yellow-600 border-amber-300',
                  D: 'from-emerald-600 to-teal-700 border-emerald-400',
                }[optKey];

                return (
                  <button
                    key={optKey}
                    disabled={selectedOption !== null}
                    onClick={() => handleSelectOption(optKey)}
                    className={`p-4 rounded-2xl border-2 bg-gradient-to-r text-left transition transform flex items-center gap-3 cursor-pointer shadow-lg ${colorStyles} ${
                      isSelected
                        ? 'ring-4 ring-white scale-102 font-black opacity-100'
                        : isOtherSelected
                        ? 'opacity-30 grayscale-[30%] pointer-events-none'
                        : 'hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center font-black text-white flex-shrink-0 text-base shadow-sm">
                      {optKey}
                    </span>
                    <span className="text-white font-extrabold text-sm md:text-base flex-1 drop-shadow-xs">
                      {optText}
                    </span>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {selectedOption && (
              <div className="p-3 bg-amber-500/10 border border-amber-400/40 rounded-2xl text-xs font-bold text-amber-300 text-center animate-pulse">
                Jawaban tersimpan! Menunggu timer 20s habis...
              </div>
            )}
          </motion.div>
        )}

        {/* FASE 2: FEEDBACK VIEW (DALIL & PENJELASAN EDUKATIF) */}
        {room.status === 'feedback' && currentQ && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full space-y-4 my-auto">
            {/* STATUS BENAR / SALAH BADGE */}
            {selectedOption === currentQ.correct_option ? (
              <div className="p-4 bg-emerald-500/20 border-2 border-emerald-400 rounded-3xl text-center space-y-1 shadow-xl">
                <div className="text-3xl">🎉</div>
                <h3 className="text-xl font-black text-emerald-400">JAWABAN BENAR!</h3>
                <p className="text-xs text-emerald-200 font-bold">+1.000 Poin Amal Berhasil Didapatkan</p>
              </div>
            ) : (
              <div className="p-4 bg-red-500/20 border-2 border-red-400 rounded-3xl text-center space-y-1 shadow-xl">
                <div className="text-3xl">💡</div>
                <h3 className="text-xl font-black text-red-400">KURANG TEPAT</h3>
                <p className="text-xs text-red-200 font-bold">
                  Kunci Jawaban yang Benar: <strong className="text-yellow-300 uppercase">Opsi {currentQ.correct_option}</strong>
                </p>
              </div>
            )}

            {/* EDUCATIONAL EXPLANATION & DALIL BOX */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 text-left space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-gold-400 font-extrabold text-sm border-b border-slate-800 pb-2">
                <BookOpen className="w-4 h-4 text-gold-300" />
                <span>Penjelasan Edukatif & Referensi Dalil</span>
              </div>

              <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                {currentQ.explanation}
              </p>

              {currentQ.dalil && (
                <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-2xl text-xs text-amber-200/90 space-y-1 font-serif italic">
                  <span className="font-sans font-bold text-gold-400 block non-italic text-[10.5px]">📖 Dalil Al-Qur'an / Hadits:</span>
                  <p>"{currentQ.dalil}"</p>
                </div>
              )}
            </div>

            <div className="text-xs font-bold text-amber-400 text-center animate-pulse">
              Menunggu Operator menampilkan Standings...
            </div>
          </motion.div>
        )}

        {/* FASE 3: STANDING SCOREBOARD (PERINGKAT SEMENTARA) */}
        {room.status === 'standing' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full space-y-4 my-auto">
            <div className="text-center space-y-1">
              <div className="text-3xl">📊</div>
              <h2 className="text-xl font-black gold-gradient-text">Peringkat Sementara Sesi Room</h2>
              <p className="text-xs text-slate-400 font-bold">
                Posisi Anda saat ini: <strong className="text-emerald-400">#{myRankIndex + 1}</strong> ({myPlayerEntry?.score.toLocaleString('id-ID')} Pt)
              </p>
            </div>

            <div className="glass-card p-4 rounded-3xl border border-slate-700 shadow-2xl space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {sortedPlayers.map((p, idx) => {
                const isSelf = p.player_id === userProfile.id;
                const totalQ = currentQIndex + 1;
                const correctCount = p.correct_count || 0;
                const wrongCount = Math.max(0, totalQ - correctCount);
                const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

                return (
                  <div
                    key={p.id || p.player_id}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition ${
                      isSelf
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg'
                        : idx === 0
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : idx === 1
                        ? 'bg-slate-700/80 border-slate-500 text-slate-200'
                        : idx === 2
                        ? 'bg-orange-950/60 border-orange-600 text-orange-200'
                        : 'bg-slate-900/80 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-black text-sm flex-shrink-0">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>

                      {/* Avatar with Border Overlay */}
                      <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                        <div className="w-[78%] h-[78%] rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600">
                          {p.player_avatar && p.player_avatar.startsWith('/') ? (
                            <img src={p.player_avatar} alt={p.player_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base">{p.player_avatar || '👦🏻'}</span>
                          )}
                        </div>
                        <img
                          src={p.border_frame || '/image/border/1.png'}
                          alt="Bingkai"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-extrabold text-sm flex items-center gap-1.5">
                          <span>{p.player_name}</span>
                          {isSelf && <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md">(Anda)</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] opacity-90 mt-0.5 font-medium">
                          <span className="text-emerald-400 font-bold">✅ {correctCount} Benar</span>
                          <span className="text-red-400 font-bold">❌ {wrongCount} Salah</span>
                          <span className="text-sky-300 font-bold">🎯 {accuracy}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="font-black text-amber-300 text-sm block">
                        {p.score.toLocaleString('id-ID')} Pt
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-semibold block">Poin Amal</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-400/40 rounded-2xl text-xs font-bold text-amber-300 text-center animate-pulse">
              Menunggu Operator melanjutkan ke soal berikutnya...
            </div>
          </motion.div>
        )}

        {/* FASE 4: FINISHED (PODIUM VICTORY & FULL REKAP STANDING) */}
        {room.status === 'finished' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full space-y-6 text-center my-auto py-4">
            {/* HEADER SUMMARY */}
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-2xl">
                <Trophy className="w-9 h-9 fill-current animate-bounce" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black gold-gradient-text">
                {answeredQIndex !== null ? 'PODIUM & HASIL AKHIR KUIS!' : 'Sesi Kuis Diakhiri'}
              </h2>
              {myPlayerEntry && (
                <div className={`p-3 rounded-2xl border text-xs md:text-sm font-extrabold inline-block ${
                  myRankIndex === 0
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : myRankIndex === 1
                    ? 'bg-slate-700/80 border-slate-500 text-slate-200'
                    : myRankIndex === 2
                    ? 'bg-orange-950/60 border-orange-600 text-orange-200'
                    : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                }`}>
                  {myRankIndex === 0 && '🥇 SELAMAT! Anda Adalah JUARA 1 KUIS! 🎉'}
                  {myRankIndex === 1 && '🥈 SELAMAT! Anda Raih JUARA 2 KUIS! 🎉'}
                  {myRankIndex === 2 && '🥉 SELAMAT! Anda Raih JUARA 3 KUIS! 🎉'}
                  {myRankIndex > 2 && `Posisi Anda: Peringkat #${myRankIndex + 1} (${myPlayerEntry.score.toLocaleString('id-ID')} Poin Amal)`}
                </div>
              )}
            </div>

            {/* TOP 3 PODIUM DISPLAY */}
            {sortedPlayers.length > 0 && (
              <div className="flex items-end justify-center gap-2 md:gap-4 pt-2 pb-2">
                {/* RANK 2 */}
                {sortedPlayers[1] && (
                  <div className="flex flex-col items-center space-y-1.5 flex-1">
                    <div className="text-xl md:text-2xl">🥈</div>
                    <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                      <div className="w-[78%] h-[78%] rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600">
                        {sortedPlayers[1].player_avatar?.startsWith('/') ? (
                          <img src={sortedPlayers[1].player_avatar} alt={sortedPlayers[1].player_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm md:text-base">{sortedPlayers[1].player_avatar || '👦🏻'}</span>
                        )}
                      </div>
                      <img src={sortedPlayers[1].border_frame || '/image/border/1.png'} alt="Bingkai" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-105 z-10" />
                    </div>
                    <span className="font-extrabold text-[11px] md:text-xs text-slate-200 truncate max-w-[90px]">
                      {sortedPlayers[1].player_name} {sortedPlayers[1].player_id === userProfile.id && '(Anda)'}
                    </span>
                    <div className="w-full bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-2xl py-3 md:py-4 text-center border-t-2 border-slate-400 shadow-lg space-y-0.5">
                      <div className="font-black text-slate-200 text-xs md:text-sm">
                        {sortedPlayers[1].score.toLocaleString('id-ID')} Pt
                      </div>
                      <div className="text-[9.5px] font-bold text-slate-300">
                        ✅ {sortedPlayers[1].correct_count || 0}B • 🎯 {room.total_questions || questions.length ? Math.round(((sortedPlayers[1].correct_count || 0) / (room.total_questions || questions.length)) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                )}

                {/* RANK 1 (CENTER) */}
                {sortedPlayers[0] && (
                  <div className="flex flex-col items-center space-y-1.5 flex-1 z-10">
                    <div className="text-3xl md:text-4xl">🥇</div>
                    <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                      <div className="w-[78%] h-[78%] rounded-full bg-amber-500 flex items-center justify-center overflow-hidden border border-amber-300">
                        {sortedPlayers[0].player_avatar?.startsWith('/') ? (
                          <img src={sortedPlayers[0].player_avatar} alt={sortedPlayers[0].player_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base md:text-xl">{sortedPlayers[0].player_avatar || '👦🏻'}</span>
                        )}
                      </div>
                      <img src={sortedPlayers[0].border_frame || '/image/border/1.png'} alt="Bingkai" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-105 z-10" />
                    </div>
                    <span className="font-black text-xs md:text-sm text-gold-400 truncate max-w-[110px]">
                      {sortedPlayers[0].player_name} {sortedPlayers[0].player_id === userProfile.id && '(Anda)'}
                    </span>
                    <div className="w-full bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-2xl py-6 md:py-8 text-center border-t-4 border-amber-300 shadow-2xl space-y-0.5">
                      <div className="font-black text-white text-sm md:text-base">
                        {sortedPlayers[0].score.toLocaleString('id-ID')} Pt
                      </div>
                      <div className="text-[10px] font-extrabold text-amber-100">
                        ✅ {sortedPlayers[0].correct_count || 0}B • 🎯 {room.total_questions || questions.length ? Math.round(((sortedPlayers[0].correct_count || 0) / (room.total_questions || questions.length)) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                )}

                {/* RANK 3 */}
                {sortedPlayers[2] && (
                  <div className="flex flex-col items-center space-y-1.5 flex-1">
                    <div className="text-xl md:text-2xl">🥉</div>
                    <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                      <div className="w-[78%] h-[78%] rounded-full bg-amber-900 flex items-center justify-center overflow-hidden border border-amber-700">
                        {sortedPlayers[2].player_avatar?.startsWith('/') ? (
                          <img src={sortedPlayers[2].player_avatar} alt={sortedPlayers[2].player_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm md:text-base">{sortedPlayers[2].player_avatar || '👦🏻'}</span>
                        )}
                      </div>
                      <img src={sortedPlayers[2].border_frame || '/image/border/1.png'} alt="Bingkai" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-105 z-10" />
                    </div>
                    <span className="font-extrabold text-[11px] md:text-xs text-amber-200 truncate max-w-[90px]">
                      {sortedPlayers[2].player_name} {sortedPlayers[2].player_id === userProfile.id && '(Anda)'}
                    </span>
                    <div className="w-full bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-2xl py-3 md:py-4 text-center border-t-2 border-amber-700 shadow-lg space-y-0.5">
                      <div className="font-black text-amber-300 text-[11px] md:text-xs">
                        {sortedPlayers[2].score.toLocaleString('id-ID')} Pt
                      </div>
                      <div className="text-[9px] font-bold text-amber-200">
                        ✅ {sortedPlayers[2].correct_count || 0}B • 🎯 {room.total_questions || questions.length ? Math.round(((sortedPlayers[2].correct_count || 0) / (room.total_questions || questions.length)) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FULL PARTICIPANTS REKAP STANDING TABLE */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between text-xs font-black text-slate-300 px-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Peringkat Akhir Seluruh Peserta ({sortedPlayers.length})</span>
                </span>
                <span className="text-slate-400 font-normal">Scoreboard Live</span>
              </div>

              <div className="glass-card p-4 rounded-3xl border border-slate-700 shadow-2xl space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {sortedPlayers.map((p, idx) => {
                  const isSelf = p.player_id === userProfile.id;
                  const totalQ = room.total_questions || questions.length || 10;
                  const correctCount = p.correct_count || 0;
                  const wrongCount = Math.max(0, totalQ - correctCount);
                  const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

                  return (
                    <div
                      key={p.id || p.player_id}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition ${
                        isSelf
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg'
                          : idx === 0
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : idx === 1
                          ? 'bg-slate-700/80 border-slate-500 text-slate-200'
                          : idx === 2
                          ? 'bg-orange-950/60 border-orange-600 text-orange-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center font-black text-sm flex-shrink-0">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>

                        {/* Avatar with Border Overlay */}
                        <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                          <div className="w-[78%] h-[78%] rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600">
                            {p.player_avatar && p.player_avatar.startsWith('/') ? (
                              <img src={p.player_avatar} alt={p.player_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-base">{p.player_avatar || '👦🏻'}</span>
                            )}
                          </div>
                          <img
                            src={p.border_frame || '/image/border/1.png'}
                            alt="Bingkai"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-extrabold text-sm flex items-center gap-1.5">
                            <span>{p.player_name}</span>
                            {isSelf && <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md">(Anda)</span>}
                          </div>
                          <div className="flex items-center gap-2 text-[10.5px] opacity-90 mt-0.5 font-medium">
                            <span className="text-emerald-400 font-bold">✅ {correctCount} Benar</span>
                            <span className="text-red-400 font-bold">❌ {wrongCount} Salah</span>
                            <span className="text-sky-300 font-bold">🎯 {accuracy}% Akurasi</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-2">
                        <span className="font-black text-amber-300 text-sm md:text-base block leading-tight">
                          {p.score.toLocaleString('id-ID')} Pt
                        </span>
                        <span className="text-[9.5px] text-amber-400/90 font-bold uppercase block">
                          Poin Amal Akhir
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={async () => {
                audioManager.playClick();
                if (room.status === 'waiting') {
                  await RoomService.leaveRoom(room.id, userProfile.id);
                }
                await ProfileService.fetchProfileFromServer();
                onReturnHome();
              }}
              className="emerald-gradient-btn w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-2xl cursor-pointer active:scale-95 transition"
            >
              Kembali ke Beranda
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
