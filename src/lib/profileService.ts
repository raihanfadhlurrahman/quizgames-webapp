import { DEFAULT_AVATAR } from '@/data/avatars';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface UserProfileData {
  id: string;
  name: string;
  avatar: string;
  border_frame?: string;
  border_color?: string;
  bg_profile?: string;
  title_tag?: string;
  bio_quote?: string;
  bio_translation?: string;
  bio_reference?: string;
  level: number;
  xp: number;
  amal_points: number;
  total_games: number;
  total_correct: number;
  total_questions_answered: number;
  created_at: string;
}

const LOCAL_STORAGE_PROFILE_KEY = 'islamic_millionaire_user_profile_v3';

export class ProfileService {
  // Get Current Real User Profile
  static getProfile(): UserProfileData {
    if (typeof window === 'undefined') {
      return this.createDefaultProfile();
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          return {
            ...this.createDefaultProfile(),
            ...parsed,
          };
        }
      } catch {
        // Fallback if JSON parse fails
      }
    }

    const defaultProf = this.createDefaultProfile();
    this.saveProfile(defaultProf);
    return defaultProf;
  }

  // Save/Update Profile
  static async saveProfile(profile: Partial<UserProfileData>): Promise<UserProfileData> {
    const current = this.getProfile();
    const updated: UserProfileData = {
      ...current,
      ...profile,
      name: profile.name?.trim() || current.name || 'Pemain Baru',
      avatar: profile.avatar || current.avatar || DEFAULT_AVATAR,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('players').upsert([{
          id: updated.id,
          name: updated.name,
          avatar: updated.avatar,
          level: updated.level,
          xp: updated.xp,
          amal_points: updated.amal_points,
          total_games: updated.total_games,
          updated_at: new Date().toISOString(),
        }]);
      } catch (e) {
        console.warn('Supabase sync profile failed:', e);
      }
    }

    return updated;
  }

  // Accumulate Score & XP After Match
  static async addGameResults(score: number, correctCount: number = 0, totalQuestions: number = 15): Promise<UserProfileData> {
    const current = this.getProfile();
    const newAmalPoints = current.amal_points + score;
    const newXP = current.xp + score;
    const newTotalGames = current.total_games + 1;
    const newTotalCorrect = current.total_correct + correctCount;
    const newTotalQuestionsAnswered = current.total_questions_answered + totalQuestions;

    // Calculate Level: Every 500 XP = +1 Level
    const newLevel = Math.floor(newAmalPoints / 500) + 1;

    const updated: UserProfileData = {
      ...current,
      amal_points: newAmalPoints,
      xp: newXP,
      level: newLevel,
      total_games: newTotalGames,
      total_correct: newTotalCorrect,
      total_questions_answered: newTotalQuestionsAnswered,
    };

    return this.saveProfile(updated);
  }

  private static createDefaultProfile(): UserProfileData {
    return {
      id: 'player-' + Math.random().toString(36).substring(2, 9),
      name: 'Raihan',
      avatar: DEFAULT_AVATAR,
      border_frame: '/image/border/1.png',
      border_color: '/image/border/1.png',
      bg_profile: '/image/bgprofile/1.jpg',
      title_tag: 'Muslim Cerdas',
      bio_quote: 'رَبِّ زِدْنِي عِلْمًا',
      bio_translation: '"Ya Tuhanku, tambahkanlah kepadaku ilmu."',
      bio_reference: '(QS. Taha: 114)',
      level: 4,
      xp: 320,
      amal_points: 1200,
      total_games: 18,
      total_correct: 42,
      total_questions_answered: 50,
      created_at: new Date().toISOString(),
    };
  }
}
