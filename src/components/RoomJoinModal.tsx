'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Users, X, Play, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { QuizRoom, QuizRoomPlayer } from '@/types/game';
import { RoomService } from '@/lib/roomService';
import { ProfileService, UserProfileData } from '@/lib/profileService';
import { audioManager } from '@/lib/audioManager';

interface RoomJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinedAndStarted: (room: QuizRoom, initialPlayers: QuizRoomPlayer[]) => void;
}

export const RoomJoinModal: React.FC<RoomJoinModalProps> = ({
  isOpen,
  onClose,
  onJoinedAndStarted,
}) => {
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [joinedRoom, setJoinedRoom] = useState<QuizRoom | null>(null);
  const [players, setPlayers] = useState<QuizRoomPlayer[]>([]);
  const [userProfile] = useState<UserProfileData>(ProfileService.getProfile());

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setErrorMsg('');
      setJoinedRoom(null);
      setPlayers([]);
      setLoading(false);
    }
  }, [isOpen]);

  // Subscribe to room realtime updates when player joins
  useEffect(() => {
    if (joinedRoom) {
      const unsubscribe = RoomService.subscribeToRoom(
        joinedRoom.id,
        (updatedRoom) => {
          setJoinedRoom(updatedRoom);
          if (updatedRoom.status !== 'waiting' && updatedRoom.status !== 'finished') {
            audioManager.playClick();
            onJoinedAndStarted(updatedRoom, players);
          }
        },
        (updatedPlayers) => {
          setPlayers(updatedPlayers);
        }
      );

      // Initial fetch of players
      RoomService.getRoomPlayers(joinedRoom.id).then(setPlayers);

      return () => {
        unsubscribe();
      };
    }
  }, [joinedRoom?.id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (cleanPin.length !== 6) {
      setErrorMsg('Masukkan 6-digit kode PIN room dengan benar.');
      return;
    }

    setLoading(true);
    audioManager.playClick();

    const room = await RoomService.getRoomByPin(cleanPin);

    if (!room) {
      setErrorMsg('Room dengan PIN tersebut tidak ditemukan atau telah berakhir.');
      setLoading(false);
      return;
    }

    if (room.status === 'finished') {
      setErrorMsg('Sesi kuis untuk room ini telah selesai.');
      setLoading(false);
      return;
    }

    // Join Room
    await RoomService.joinRoom(room.id, userProfile);
    const initialPlayers = await RoomService.getRoomPlayers(room.id);

    setJoinedRoom(room);
    setPlayers(initialPlayers);
    setLoading(false);

    // If game is already active, start immediately
    if (room.status !== 'waiting') {
      onJoinedAndStarted(room, initialPlayers);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="border-4 border-[#FDE68A] max-w-md w-full rounded-[32px] p-6 bg-[#FFFDF3] text-[#1E293B] relative overflow-hidden shadow-2xl"
        >
          {/* Header Action / Close */}
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#B45309] hover:bg-amber-800 text-white flex items-center justify-center border-2 border-white shadow-md cursor-pointer z-10"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>

          {!joinedRoom ? (
            /* PIN ENTRY FORM */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-800 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <KeyRound className="w-8 h-8 text-amber-700" />
              </div>

              <div>
                <h2 className="text-xl font-black text-[#78350F]">Masuk Room Kuis PIN</h2>
                <p className="text-xs text-amber-800 font-semibold mt-1">
                  Masukkan 6-digit kode PIN yang ditampilkan di proyektor Admin
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="849201"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-3xl font-black tracking-[0.3em] py-3.5 px-4 bg-amber-50/80 border-4 border-amber-300 rounded-2xl text-[#78350F] placeholder-amber-300 focus:outline-none focus:border-amber-600 shadow-inner uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || pin.length !== 6}
                  className={`emerald-gradient-btn w-full py-3.5 rounded-2xl text-white font-black text-base shadow-lg cursor-pointer flex items-center justify-center gap-2 transition ${
                    loading || pin.length !== 6 ? 'opacity-50 pointer-events-none' : 'active:scale-95'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>MASUK ROOM</span>
                      <Play className="w-4 h-4 fill-current" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* WAITING LOBBY VIEW */
            <div className="space-y-5 text-center py-2">
              <div className="bg-amber-100/90 border-2 border-amber-300 rounded-2xl p-3 inline-block shadow-sm">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">
                  KODE ROOM PIN
                </span>
                <span className="text-2xl font-black text-[#78350F] tracking-[0.2em] font-mono">
                  {joinedRoom.room_code}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-[#78350F]">{joinedRoom.title}</h2>
                <p className="text-xs text-amber-800 font-bold mt-0.5">
                  Kategori: <span className="text-amber-900 font-extrabold">{joinedRoom.category_name}</span>
                </p>
              </div>

              {/* PULSE WAITING BADGE */}
              <div className="p-4 bg-amber-500/10 border-2 border-amber-400/50 rounded-2xl flex items-center justify-center gap-2.5 text-amber-900 font-black text-xs animate-pulse shadow-inner">
                <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                <span>Menunggu Admin (Host) memulai kuis...</span>
              </div>

              {/* PARTICIPANTS AVATAR LIST */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-black text-amber-900 px-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-700" />
                    Peserta Terhubung ({players.length})
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                    ⚡ LIVE
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {players.map((p) => {
                    const isSelf = p.player_id === userProfile.id;
                    return (
                      <div
                        key={p.id || p.player_id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-bold transition ${
                          isSelf
                            ? 'bg-amber-200/90 border-amber-500 text-amber-950 shadow-xs'
                            : 'bg-white/80 border-amber-200 text-slate-700'
                        }`}
                      >
                        {/* Avatar with Border Overlay */}
                        <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <div className="w-[78%] h-[78%] rounded-full bg-[#FEF3C7] flex items-center justify-center overflow-hidden border border-amber-300">
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

                        <span className="truncate flex-1 font-extrabold">
                          {p.player_name} {isSelf && <span className="text-[10px] text-amber-800">(Anda)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
