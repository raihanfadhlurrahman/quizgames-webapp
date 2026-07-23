'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Play, ChevronRight, RefreshCw, X, Sparkles, Zap, Award, CheckCircle2, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { QuizRoom, QuizRoomPlayer, Question } from '@/types/game';
import { RoomService } from '@/lib/roomService';
import { GameService } from '@/lib/gameService';
import { audioManager } from '@/lib/audioManager';

interface RoomHostViewProps {
  room: QuizRoom;
  onClose: () => void;
}

export const RoomHostView: React.FC<RoomHostViewProps> = ({ room, onClose }) => {
  const [currentRoom, setCurrentRoom] = useState<QuizRoom>(room);
  const [players, setPlayers] = useState<QuizRoomPlayer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(20);

  useEffect(() => {
    // Fetch initial questions and players
    RoomService.getRoomPlayers(room.id).then(setPlayers);
    GameService.getQuestions(room.category_name || 'Campuran', room.total_questions || 10, 'kahoot').then(setQuestions);

    // Subscribe to realtime room updates
    const unsubscribe = RoomService.subscribeToRoom(
      room.id,
      (updatedRoom) => {
        setCurrentRoom(updatedRoom);
        setCurrentQIndex(updatedRoom.current_question_index || 0);
      },
      (updatedPlayers) => {
        setPlayers(updatedPlayers);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [room.id]);

  // Host Proyektor Timer Countdown during 'question' phase
  useEffect(() => {
    if (currentRoom.status === 'question') {
      setTimer(20);
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            // Automatically switch to 'feedback' phase when timer expires
            RoomService.updateRoomStatus(room.id, 'feedback', currentQIndex);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [currentRoom.status, currentQIndex]);

  // Operator Actions with Optimistic Local Updates
  const handleStartGame = async () => {
    audioManager.playClick();
    setLoading(true);
    const orderedIds = questions.map((q) => q.id);
    setCurrentRoom((prev) => ({ ...prev, status: 'question', current_question_index: 0, question_ids: orderedIds }));
    await RoomService.updateRoomStatus(room.id, 'question', 0, orderedIds);
    setLoading(false);
  };

  const handleShowFeedback = async () => {
    audioManager.playClick();
    setCurrentRoom((prev) => ({ ...prev, status: 'feedback' }));
    await RoomService.updateRoomStatus(room.id, 'feedback', currentQIndex);
  };

  const handleShowStanding = async () => {
    audioManager.playClick();
    setCurrentRoom((prev) => ({ ...prev, status: 'standing' }));
    await RoomService.updateRoomStatus(room.id, 'standing', currentQIndex);
  };

  const handleNextQuestion = async () => {
    audioManager.playClick();
    const nextIdx = currentQIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentRoom((prev) => ({ ...prev, status: 'question', current_question_index: nextIdx }));
      await RoomService.updateRoomStatus(room.id, 'question', nextIdx);
    } else {
      setCurrentRoom((prev) => ({ ...prev, status: 'finished' }));
      await RoomService.updateRoomStatus(room.id, 'finished', currentQIndex);
    }
  };

  const handleCloseRoom = async () => {
    if (confirm('Apakah Anda yakin ingin mengakhiri sesi room kuis ini untuk semua peserta?')) {
      audioManager.playClick();
      setCurrentRoom((prev) => ({ ...prev, status: 'finished' }));
      await RoomService.updateRoomStatus(room.id, 'finished', currentQIndex);
      onClose();
    }
  };

  const currentQ = questions[currentQIndex];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* TOP ADMIN CONTROL BAR */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 font-mono font-black text-sm">
            PIN: {currentRoom.room_code}
          </div>
          <div>
            <h2 className="font-extrabold text-sm md:text-base gold-gradient-text">{currentRoom.title}</h2>
            <p className="text-xs text-slate-400">
              Kategori: <span className="text-emerald-400 font-bold">{currentRoom.category_name}</span> • Status Sesi:{' '}
              <span className="uppercase text-amber-400 font-extrabold">{currentRoom.status}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCloseRoom}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-black rounded-xl border border-red-500/40 cursor-pointer flex items-center gap-1.5 transition active:scale-95"
          title="Akhiri Sesi Room Kuis"
        >
          <X className="w-4 h-4 text-red-400" />
          <span>Akhiri Sesi Room</span>
        </button>
      </div>

      {/* MAIN PROYECTOR DISPLAY AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        {/* FASE 1: WAITING LOBBY (PIN & JOINED PLAYERS GRID) */}
        {currentRoom.status === 'waiting' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl w-full space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/30">
                Layar Proyektor KKN Wedomartani
              </span>
              <h1 className="text-3xl md:text-5xl font-black gold-gradient-text">GABUNG SEKARANG KE KUIS!</h1>
              <p className="text-slate-300 text-sm md:text-base">
                Buka web kuis di HP Anda, tekan tombol <strong className="text-amber-400">Masuk Room PIN</strong> dan masukkan kode:
              </p>
            </div>

            {/* GIANT PIN CARD */}
            <div className="py-6 px-10 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-4 border-amber-400 rounded-3xl inline-block shadow-2xl backdrop-blur-md">
              <span className="text-5xl md:text-7xl font-mono font-black text-amber-300 tracking-[0.25em]">
                {currentRoom.room_code.slice(0, 3)} {currentRoom.room_code.slice(3)}
              </span>
            </div>

            {/* JOINED PLAYERS GRID WITH PP & BORDER OVERLAY */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-300">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>{players.length} Pemain Telah Terhubung</span>
              </div>

              {players.length === 0 ? (
                <p className="text-xs text-slate-500 animate-pulse">Menunggu pemain pertama memasukkan PIN...</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-3 max-h-60 overflow-y-auto p-2">
                  {players.map((p) => (
                    <motion.div
                      key={p.id || p.player_id}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 px-4 py-2 bg-slate-900/90 border border-slate-700 rounded-2xl shadow-md text-sm font-bold"
                    >
                      {/* Avatar with Border Overlay */}
                      <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                        <div className="w-[78%] h-[78%] rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600">
                          {p.player_avatar && p.player_avatar.startsWith('/') ? (
                            <img src={p.player_avatar} alt={p.player_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">{p.player_avatar || '👦🏻'}</span>
                          )}
                        </div>
                        <img
                          src={p.border_frame || '/image/border/1.png'}
                          alt="Bingkai"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
                        />
                      </div>

                      <span className="text-white font-extrabold">{p.player_name}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* START BUTTON */}
            <div className="pt-4">
              <button
                onClick={handleStartGame}
                disabled={loading || players.length === 0}
                className={`emerald-gradient-btn px-10 py-4 rounded-2xl text-white font-black text-xl shadow-2xl cursor-pointer flex items-center justify-center gap-3 mx-auto transition ${
                  loading || players.length === 0 ? 'opacity-50 pointer-events-none' : 'hover:scale-105 active:scale-95'
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>MULAI KUIS SOSIALISASI</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* FASE 2: QUESTION DISPLAY (TIMER 20s) */}
        {currentRoom.status === 'question' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-md">
              <span>Soal <strong className="text-white">{currentQIndex + 1}</strong> dari {questions.length}</span>
              <span className="text-emerald-400 font-extrabold uppercase">Kategori: {currentRoom.category_name}</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-400/40 text-amber-300 font-mono font-black text-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{timer}s</span>
              </div>
            </div>

            {currentQ && (
              <div className="glass-card p-8 rounded-3xl border border-slate-700 text-left space-y-6 shadow-2xl">
                <h2 className="text-xl md:text-3xl font-extrabold text-white leading-relaxed">
                  {currentQ.question_text}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const optText = currentQ[`option_${optKey.toLowerCase()}` as keyof Question];
                    return (
                      <div
                        key={optKey}
                        className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 text-base font-bold text-slate-200"
                      >
                        <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black flex-shrink-0 text-lg">
                          {optKey}
                        </span>
                        <span>{optText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OPERATOR CONTROL BAR */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-bold">{players.length} Pemain Menjawab secara Live</span>
              <button
                onClick={handleShowFeedback}
                className="emerald-gradient-btn px-6 py-3 rounded-xl text-white font-extrabold text-sm shadow-xl flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>PENJELASAN & DALIL</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* FASE 3: FEEDBACK (DALIL & PENJELASAN EDUKATIF) */}
        {currentRoom.status === 'feedback' && currentQ && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl w-full space-y-6">
            <div className="p-4 bg-emerald-500/20 border-2 border-emerald-400 rounded-3xl text-center space-y-1 shadow-xl">
              <span className="text-xs font-black uppercase text-emerald-300 tracking-widest block">KUNCI JAWABAN BENAR</span>
              <h2 className="text-2xl font-black text-white">
                Opsi <span className="text-yellow-300 uppercase">{currentQ.correct_option}</span>: {currentQ[`option_${currentQ.correct_option.toLowerCase()}` as keyof Question]}
              </h2>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-slate-700 text-left space-y-4 shadow-2xl">
              <h3 className="text-base font-extrabold text-white leading-relaxed">
                {currentQ.question_text}
              </h3>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <span className="text-xs font-bold text-gold-400 block">💡 Penjelasan Edukatif:</span>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>

              {currentQ.dalil && (
                <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl text-xs md:text-sm text-amber-200 font-serif italic space-y-1">
                  <span className="font-sans font-bold text-gold-400 block non-italic text-xs">📖 Referensi Dalil:</span>
                  <p>"{currentQ.dalil}"</p>
                </div>
              )}
            </div>

            {/* OPERATOR NEXT TO STANDINGS BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleShowStanding}
                className="bg-amber-600 hover:bg-amber-500 px-8 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-xl flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <BarChart3 className="w-5 h-5" />
                <span>LIHAT STANDING SCOREBOARD</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* FASE 4: STANDING SCOREBOARD (PERINGKAT SEMENTARA) */}
        {currentRoom.status === 'standing' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full space-y-6">
            <div className="space-y-1">
              <div className="text-3xl">📊</div>
              <h1 className="text-2xl md:text-3xl font-black gold-gradient-text">Papan Peringkat Sementara</h1>
              <p className="text-xs text-slate-300 font-semibold">
                Skor sementara peserta setelah Soal #{currentQIndex + 1}
              </p>
            </div>

            {/* TOP PLAYERS STANDING GRID */}
            <div className="glass-card p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-3">
              {sortedPlayers.slice(0, 5).map((p, idx) => (
                <div
                  key={p.id || p.player_id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-sm font-bold transition ${
                    idx === 0
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : idx === 1
                      ? 'bg-slate-700/80 border-slate-500 text-slate-200'
                      : idx === 2
                      ? 'bg-orange-950/60 border-orange-600 text-orange-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 text-center font-black text-lg">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>

                    {/* Avatar with Border Overlay */}
                    <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <div className="w-[78%] h-[78%] rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600">
                        {p.player_avatar && p.player_avatar.startsWith('/') ? (
                          <img src={p.player_avatar} alt={p.player_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{p.player_avatar || '👦🏻'}</span>
                        )}
                      </div>
                      <img
                        src={p.border_frame || '/image/border/1.png'}
                        alt="Bingkai"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-105"
                      />
                    </div>

                    <span className="truncate font-extrabold text-base text-white">{p.player_name}</span>
                  </div>

                  <span className="font-black text-amber-300 text-base flex-shrink-0">
                    {p.score.toLocaleString('id-ID')} Pt
                  </span>
                </div>
              ))}
            </div>

            {/* OPERATOR BUTTON FOR NEXT QUESTION */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="emerald-gradient-btn px-8 py-3.5 rounded-2xl text-white font-black text-base shadow-2xl flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{currentQIndex + 1 < questions.length ? 'NEXT SOAL ➔' : 'LIHAT PODIUM JUARA akhir'}</span>
                <ChevronRight className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* FASE 5: FINISHED (PODIUM JUARA) */}
        {currentRoom.status === 'finished' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-2xl">
                <Trophy className="w-9 h-9 fill-current" />
              </div>
              <h1 className="text-3xl font-black gold-gradient-text">PODIUM PEMENANG KUIS!</h1>
              <p className="text-xs text-slate-300">Selamat kepada para pemenang kuis sosialisasi KKN</p>
            </div>

            {/* PODIUM DISPLAY */}
            <div className="flex items-end justify-center gap-4 pt-6 pb-4">
              {/* RANK 2 */}
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center space-y-2 flex-1">
                  <div className="text-2xl">🥈</div>
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="w-[78%] h-[78%] rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                      {sortedPlayers[1].player_avatar?.startsWith('/') ? (
                        <img src={sortedPlayers[1].player_avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span>{sortedPlayers[1].player_avatar || '👦🏻'}</span>
                      )}
                    </div>
                    <img src={sortedPlayers[1].border_frame || '/image/border/1.png'} className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-105 z-10" />
                  </div>
                  <span className="font-extrabold text-xs text-slate-200 truncate max-w-[100px]">
                    {sortedPlayers[1].player_name}
                  </span>
                  <div className="w-full bg-gradient-to-t from-slate-700 to-slate-600 rounded-t-2xl py-6 text-center font-black text-slate-200 text-sm border-t-2 border-slate-400">
                    {sortedPlayers[1].score.toLocaleString('id-ID')} Pt
                  </div>
                </div>
              )}

              {/* RANK 1 (HIGHEST) */}
              {sortedPlayers[0] && (
                <div className="flex flex-col items-center space-y-2 flex-1 z-10">
                  <div className="text-4xl">🥇</div>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="w-[78%] h-[78%] rounded-full bg-amber-500 flex items-center justify-center overflow-hidden">
                      {sortedPlayers[0].player_avatar?.startsWith('/') ? (
                        <img src={sortedPlayers[0].player_avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span>{sortedPlayers[0].player_avatar || '👦🏻'}</span>
                      )}
                    </div>
                    <img src={sortedPlayers[0].border_frame || '/image/border/1.png'} className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-105 z-10" />
                  </div>
                  <span className="font-black text-sm text-gold-400 truncate max-w-[120px]">
                    {sortedPlayers[0].player_name}
                  </span>
                  <div className="w-full bg-gradient-to-t from-amber-600 to-yellow-500 rounded-t-2xl py-10 text-center font-black text-white text-base border-t-4 border-amber-300 shadow-2xl">
                    {sortedPlayers[0].score.toLocaleString('id-ID')} Pt
                  </div>
                </div>
              )}

              {/* RANK 3 */}
              {sortedPlayers[2] && (
                <div className="flex flex-col items-center space-y-2 flex-1">
                  <div className="text-2xl">🥉</div>
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="w-[78%] h-[78%] rounded-full bg-amber-900 flex items-center justify-center overflow-hidden">
                      {sortedPlayers[2].player_avatar?.startsWith('/') ? (
                        <img src={sortedPlayers[2].player_avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span>{sortedPlayers[2].player_avatar || '👦🏻'}</span>
                      )}
                    </div>
                    <img src={sortedPlayers[2].border_frame || '/image/border/1.png'} className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-105 z-10" />
                  </div>
                  <span className="font-extrabold text-xs text-amber-200 truncate max-w-[100px]">
                    {sortedPlayers[2].player_name}
                  </span>
                  <div className="w-full bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-2xl py-4 text-center font-black text-amber-300 text-xs border-t-2 border-amber-700">
                    {sortedPlayers[2].score.toLocaleString('id-ID')} Pt
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm rounded-2xl border border-slate-700 cursor-pointer"
            >
              Tutup Layar Proyektor
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
