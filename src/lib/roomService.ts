import { QuizRoom, QuizRoomPlayer, Question } from '@/types/game';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ProfileService, UserProfileData } from './profileService';
import { GameService } from './gameService';

export class RoomService {
  // Generate random 6-digit numeric PIN (e.g. 849201)
  static generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create a new Quiz Room (Admin Host)
  static async createRoom(
    title: string,
    categoryName: string = 'Campuran',
    totalQuestions: number = 10,
    createdBy?: string
  ): Promise<QuizRoom | null> {
    const pin = this.generatePin();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('quiz_rooms')
          .insert([
            {
              room_code: pin,
              title: title.trim() || 'Kuis Live Sosialisasi KKN',
              category_name: categoryName,
              total_questions: totalQuestions,
              status: 'waiting',
              current_question_index: 0,
              created_by: createdBy || null,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return data as QuizRoom;
        } else {
          console.error('Failed to create room in Supabase:', error);
        }
      } catch (e) {
        console.error('Exception creating room:', e);
      }
    }

    // Fallback local mock room
    return {
      id: `room-${Date.now()}`,
      room_code: pin,
      title: title.trim() || 'Kuis Live Sosialisasi KKN',
      category_name: categoryName,
      status: 'waiting',
      current_question_index: 0,
      total_questions: totalQuestions,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    };
  }

  // Get Room details by 6-Digit PIN
  static async getRoomByPin(pin: string): Promise<QuizRoom | null> {
    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (cleanPin.length !== 6) return null;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('quiz_rooms')
          .select('*')
          .eq('room_code', cleanPin)
          .maybeSingle();

        if (!error && data) return data as QuizRoom;
      } catch (e) {
        console.warn('Error fetching room by PIN:', e);
      }
    }
    return null;
  }

  // Player joins room with their profile
  static async joinRoom(roomId: string, profile: UserProfileData): Promise<QuizRoomPlayer | null> {
    // Ensure player ID is a valid UUID
    if (!profile.id || profile.id.startsWith('guest_')) {
      profile.id = ProfileService.generateUUID();
    }

    if (isSupabaseConfigured() && supabase) {
      const activeClient = supabase;
      try {
        // 1. Ensure player profile exists in public.players table to satisfy foreign key constraint
        await ProfileService.saveProfile(profile);

        // 2. Check if player is already in room
        const { data: existingPlayer } = await activeClient
          .from('quiz_room_players')
          .select('*')
          .eq('room_id', roomId)
          .eq('player_id', profile.id)
          .maybeSingle();

        if (existingPlayer) {
          const { data: updatedData } = await activeClient
            .from('quiz_room_players')
            .update({
              player_name: profile.name,
              player_avatar: profile.avatar || '/image/pp/1.png',
              border_frame: profile.border_frame || profile.border_color || '/image/border/1.png',
              bg_profile: profile.bg_profile || '/image/bgprofile/1.jpg',
            })
            .eq('room_id', roomId)
            .eq('player_id', profile.id)
            .select()
            .single();

          if (updatedData) return updatedData as QuizRoomPlayer;
          return existingPlayer as QuizRoomPlayer;
        }

        // 3. Insert new player into room
        const payloadFull = {
          room_id: roomId,
          player_id: profile.id,
          player_name: profile.name,
          player_avatar: profile.avatar || '/image/pp/1.png',
          border_frame: profile.border_frame || profile.border_color || '/image/border/1.png',
          bg_profile: profile.bg_profile || '/image/bgprofile/1.jpg',
          score: 0,
          correct_count: 0,
        };

        const { data: insertedData, error: insertError } = await activeClient
          .from('quiz_room_players')
          .insert([payloadFull])
          .select()
          .single();

        if (!insertError && insertedData) return insertedData as QuizRoomPlayer;

        if (insertError) {
          console.warn('Retrying joinRoom without bg_profile:', insertError.message);
          const { bg_profile, ...payloadWithoutBg } = payloadFull;
          const { data: dataFallback, error: errFallback } = await activeClient
            .from('quiz_room_players')
            .insert([payloadWithoutBg])
            .select()
            .single();

          if (!errFallback && dataFallback) return dataFallback as QuizRoomPlayer;
        }
      } catch (e) {
        console.warn('Error joining room in Supabase:', e);
      }
    }

    return {
      id: `rp-${Date.now()}`,
      room_id: roomId,
      player_id: profile.id,
      player_name: profile.name,
      player_avatar: profile.avatar || '/image/pp/1.png',
      border_frame: profile.border_frame || '/image/border/1.png',
      bg_profile: profile.bg_profile || '/image/bgprofile/1.jpg',
      score: 0,
      correct_count: 0,
    };
  }

  // Fetch list of joined players in room
  static async getRoomPlayers(roomId: string): Promise<QuizRoomPlayer[]> {
    if (isSupabaseConfigured() && supabase) {
      const activeClient = supabase;
      try {
        const { data, error } = await activeClient
          .from('quiz_room_players')
          .select('*')
          .eq('room_id', roomId)
          .order('score', { ascending: false });

        if (!error && data) return data as QuizRoomPlayer[];
        if (error) {
          console.warn('Error fetching room players from Supabase:', error.message);
        }
      } catch (e) {
        console.warn('Error getting room players:', e);
      }
    }
    return [];
  }

  // Player Leaves Room (Removes single player from room)
  static async leaveRoom(roomId: string, playerId: string): Promise<boolean> {
    if (!roomId || !playerId) return true;
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('quiz_room_players')
          .delete()
          .eq('room_id', roomId)
          .eq('player_id', playerId);

        if (error) {
          console.warn('Supabase player leave delete error:', error.message);
        }
      } catch (e) {
        console.warn('Error leaving room in Supabase:', e);
      }
    }
    return true;
  }

  // Local active room status cache for fail-safe cross-tab sync
  static getLocalRoomCache(roomId: string): { status?: any; current_question_index?: number; question_ids?: string[] } | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`quiz_room_state_${roomId}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  static setLocalRoomCache(roomId: string, status: any, questionIndex: number, questionIds?: string[]) {
    if (typeof window === 'undefined') return;
    try {
      const existing = RoomService.getLocalRoomCache(roomId);
      localStorage.setItem(
        `quiz_room_state_${roomId}`,
        JSON.stringify({
          status,
          current_question_index: questionIndex,
          timestamp: Date.now(),
          question_ids: questionIds || existing?.question_ids,
        })
      );
    } catch {}
  }

  // Host Updates Room Status (waiting -> question -> feedback -> standing -> finished)
  static async updateRoomStatus(
    roomId: string,
    status: 'waiting' | 'question' | 'feedback' | 'standing' | 'finished',
    questionIndex: number = 0,
    questionIds?: string[]
  ): Promise<boolean> {
    this.setLocalRoomCache(roomId, status, questionIndex, questionIds);

    if (isSupabaseConfigured() && supabase) {
      try {
        const updates: any = {
          status,
          current_question_index: questionIndex,
        };
        if (status === 'question' && questionIndex === 0) {
          updates.started_at = new Date().toISOString();
        }
        if (status === 'finished') {
          updates.finished_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('quiz_rooms')
          .update(updates)
          .eq('id', roomId);

        if (error && error.code === '23514') {
          console.warn('Supabase status check constraint fallback triggered:', error.message);
          // Omit status field if constrained by old DB check, but update current_question_index
          await supabase
            .from('quiz_rooms')
            .update({ current_question_index: questionIndex })
            .eq('id', roomId);
        }

        return !error;
      } catch (e) {
        console.error('Error updating room status:', e);
      }
    }
    return true;
  }

  // Submit player score for current question
  static async submitRoomScore(
    roomId: string,
    playerId: string,
    scoreAdd: number,
    isCorrect: boolean
  ) {
    if (isSupabaseConfigured() && supabase) {
      try {
        // Fetch current score
        const { data: cur } = await supabase
          .from('quiz_room_players')
          .select('score, correct_count')
          .eq('room_id', roomId)
          .eq('player_id', playerId)
          .single();

        const oldScore = cur?.score || 0;
        const oldCorrect = cur?.correct_count || 0;

        await supabase
          .from('quiz_room_players')
          .update({
            score: oldScore + scoreAdd,
            correct_count: oldCorrect + (isCorrect ? 1 : 0),
          })
          .eq('room_id', roomId)
          .eq('player_id', playerId);
      } catch (e) {
        console.warn('Error submitting room score:', e);
      }
    }
  }

  // Subscribe to Realtime Updates on Room & Joined Players (with periodic 2s polling fallback & cross-tab sync)
  static subscribeToRoom(
    roomId: string,
    onRoomChange: (room: QuizRoom) => void,
    onPlayersChange: (players: QuizRoomPlayer[]) => void
  ) {
    // Immediate initial sync
    this.getRoomPlayers(roomId).then(onPlayersChange);

    // Initial check for local cache
    const initialCache = RoomService.getLocalRoomCache(roomId);

    // 2-Second Polling Fallback (ensures live sync even if WebSockets are inactive/blocked)
    const pollInterval = setInterval(() => {
      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('quiz_rooms')
          .select('*')
          .eq('id', roomId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              const localCache = RoomService.getLocalRoomCache(roomId);
              const roomData = data as QuizRoom;
              if (localCache && localCache.status && localCache.status !== 'waiting') {
                roomData.status = localCache.status;
                roomData.current_question_index = localCache.current_question_index ?? roomData.current_question_index;
              }
              if (localCache?.question_ids) {
                roomData.question_ids = localCache.question_ids;
              }
              onRoomChange(roomData);
            }
          });
        this.getRoomPlayers(roomId).then(onPlayersChange);
      }
    }, 2000);

    // Cross-tab LocalStorage listener for instant multi-tab sync
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === `quiz_room_state_${roomId}` && e.newValue) {
        try {
          const state = JSON.parse(e.newValue);
          if (state && state.status) {
            if (isSupabaseConfigured() && supabase) {
              supabase
                .from('quiz_rooms')
                .select('*')
                .eq('id', roomId)
                .maybeSingle()
                .then(({ data }) => {
                  const roomData = (data as QuizRoom) || { id: roomId, status: state.status };
                  roomData.status = state.status;
                  roomData.current_question_index = state.current_question_index || 0;
                  if (state.question_ids) roomData.question_ids = state.question_ids;
                  onRoomChange(roomData);
                });
            } else {
              onRoomChange({
                id: roomId,
                room_code: '',
                title: '',
                category_name: 'Campuran',
                status: state.status,
                current_question_index: state.current_question_index || 0,
              } as QuizRoom);
            }
          }
        } catch {}
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
    }

    if (!isSupabaseConfigured() || !supabase) {
      return () => {
        clearInterval(pollInterval);
        if (typeof window !== 'undefined') {
          window.removeEventListener('storage', handleStorageEvent);
        }
      };
    }

    const activeClient = supabase;
    const channelName = `quiz_room_${roomId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = activeClient.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new) {
            const localCache = RoomService.getLocalRoomCache(roomId);
            const roomData = payload.new as QuizRoom;
            if (localCache && localCache.status && localCache.status !== 'waiting') {
              roomData.status = localCache.status;
              roomData.current_question_index = localCache.current_question_index ?? roomData.current_question_index;
            }
            if (localCache?.question_ids) {
              roomData.question_ids = localCache.question_ids;
            }
            onRoomChange(roomData);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_room_players', filter: `room_id=eq.${roomId}` },
        () => {
          this.getRoomPlayers(roomId).then(onPlayersChange);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageEvent);
      }
      activeClient.removeChannel(channel);
    };
  }

  // Fetch the 5 most recent QuRoom sessions for Leaderboard
  static async getRecentQuRoomSessions(limit: number = 5): Promise<any[]> {
    if (isSupabaseConfigured() && supabase) {
      const activeClient = supabase;
      try {
        const { data: rooms, error } = await activeClient
          .from('quiz_rooms')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && rooms && rooms.length > 0) {
          const results = await Promise.all(
            rooms.map(async (room: any) => {
              const { data: players } = await activeClient
                .from('quiz_room_players')
                .select('*')
                .eq('room_id', room.id)
                .order('score', { ascending: false });

              const playerCount = players ? players.length : 0;
              const topWinner = players && players.length > 0 ? {
                player_id: players[0].player_id,
                player_name: players[0].player_name,
                player_avatar: players[0].player_avatar,
                score: players[0].score,
              } : undefined;

              return {
                id: room.id,
                room_code: room.room_code,
                title: room.title || 'Kuis Live Sosialisasi KKN',
                category_name: room.category_name || 'Campuran',
                status: room.status || 'finished',
                total_questions: room.total_questions || 10,
                total_players: playerCount,
                created_at: room.created_at || new Date().toISOString(),
                top_winner: topWinner,
              };
            })
          );
          return results;
        }
      } catch (e) {
        console.warn('Error fetching recent QuRoom sessions:', e);
      }
    }

    // Fallback mock recent room session if database is empty or unconfigured
    return [
      {
        id: 'room-demo-1',
        room_code: '849201',
        title: 'Kuis Live Sosialisasi KKN Wedomartani',
        category_name: 'Campuran',
        status: 'finished',
        total_questions: 10,
        total_players: 8,
        created_at: new Date().toISOString(),
        top_winner: {
          player_id: 'p-win-1',
          player_name: 'Raihan Fadhlurrahman',
          player_avatar: '/image/pp/1.png',
          score: 1850,
        },
      },
    ];
  }

  // Fetch full leaderboard & details for a specific QuRoom session
  static async getQuRoomSessionDetails(roomId: string): Promise<{
    session: any | null;
    participants: any[];
  }> {
    let session: any = null;
    let participants: any[] = [];

    if (isSupabaseConfigured() && supabase) {
      const activeClient = supabase;
      try {
        const { data: roomData } = await activeClient
          .from('quiz_rooms')
          .select('*')
          .eq('id', roomId)
          .maybeSingle();

        if (roomData) {
          const { data: players } = await activeClient
            .from('quiz_room_players')
            .select('*')
            .eq('room_id', roomId)
            .order('score', { ascending: false });

          const rankedPlayers = (players || []).map((p: any, idx: number) => ({
            ...p,
            rank: idx + 1,
          }));

          session = {
            id: roomData.id,
            room_code: roomData.room_code,
            title: roomData.title || 'Kuis Live Sosialisasi KKN',
            category_name: roomData.category_name || 'Campuran',
            status: roomData.status || 'finished',
            total_questions: roomData.total_questions || 10,
            total_players: rankedPlayers.length,
            created_at: roomData.created_at || new Date().toISOString(),
            top_winner: rankedPlayers.length > 0 ? {
              player_id: rankedPlayers[0].player_id,
              player_name: rankedPlayers[0].player_name,
              player_avatar: rankedPlayers[0].player_avatar,
              score: rankedPlayers[0].score,
            } : undefined,
          };

          participants = rankedPlayers;
        }
      } catch (e) {
        console.warn('Error fetching QuRoom session details:', e);
      }
    }

    if (!session) {
      // Mock fallback
      session = {
        id: roomId,
        room_code: '849201',
        title: 'Kuis Live Sosialisasi KKN Wedomartani',
        category_name: 'Campuran',
        status: 'finished',
        total_questions: 10,
        total_players: 3,
        created_at: new Date().toISOString(),
      };
      participants = [
        {
          id: 'p1',
          room_id: roomId,
          player_id: 'p-win-1',
          player_name: 'Raihan Fadhlurrahman',
          player_avatar: '/image/pp/1.png',
          border_frame: '/image/border/1.png',
          bg_profile: '/image/bgprofile/1.jpg',
          score: 1850,
          correct_count: 9,
          rank: 1,
        },
        {
          id: 'p2',
          room_id: roomId,
          player_id: 'p-win-2',
          player_name: 'Ahmad Zakaria',
          player_avatar: '/image/pp/2.png',
          border_frame: '/image/border/1.png',
          bg_profile: '/image/bgprofile/1.jpg',
          score: 1420,
          correct_count: 7,
          rank: 2,
        },
        {
          id: 'p3',
          room_id: roomId,
          player_id: 'p-win-3',
          player_name: 'Siti Nurhaliza',
          player_avatar: '/image/pp/3.png',
          border_frame: '/image/border/1.png',
          bg_profile: '/image/bgprofile/1.jpg',
          score: 1100,
          correct_count: 5,
          rank: 3,
        },
      ];
    }

    return { session, participants };
  }
}
