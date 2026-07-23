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
  role?: 'player' | 'admin';
  created_at: string;
}

const LOCAL_STORAGE_PROFILE_KEY = 'islamic_millionaire_user_profile_v3';

export class ProfileService {
  // Get Current Real User Profile from Local Storage Cache
  static getProfile(): UserProfileData | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id.trim() !== '') {
          // Migration check: if old guest_ ID exists, sanitize to UUID v4 and persist
          if (parsed.id.startsWith('guest_')) {
            parsed.id = this.generateUUID();
            try {
              localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(parsed));
            } catch { }
          }
          return parsed;
        }
      } catch {
        // Fallback
      }
    }

    return null;
  }

  // Check if session is authenticated and fetch profile from Supabase
  static async fetchProfileFromServer(): Promise<UserProfileData | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        // No session, clear local cache profile
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
        }
        return null;
      }

      const userId = session.user.id;

      // Fetch profile from players table
      const { data: player, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !player) {
        // If not found in database, insert a new row
        const metaName = session.user.user_metadata?.name || 'Pemain Baru';
        const metaRole = session.user.user_metadata?.role || 'player';
        const newProfile: UserProfileData = {
          ...this.createDefaultProfile(userId),
          name: metaName,
          role: metaRole,
        };

        await supabase.from('players').insert([{
          id: userId,
          name: newProfile.name,
          avatar: newProfile.avatar,
          border_frame: newProfile.border_frame || '/image/border/1.png',
          border_color: newProfile.border_color || '/image/border/1.png',
          bg_profile: newProfile.bg_profile || '/image/bgprofile/1.jpg',
          title_tag: newProfile.title_tag || 'Muslim Cerdas',
          bio_quote: newProfile.bio_quote || 'رَبِّ زِدْنِي عِلْمًا',
          bio_translation: newProfile.bio_translation || '"Ya Tuhanku, tambahkanlah kepadaku ilmu."',
          bio_reference: newProfile.bio_reference || '(QS. Taha: 114)',
          level: newProfile.level,
          xp: newProfile.xp,
          amal_points: newProfile.amal_points,
          total_games: newProfile.total_games,
          total_correct: newProfile.total_correct,
          total_questions_answered: newProfile.total_questions_answered,
          role: newProfile.role,
        }]);

        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
        }
        return newProfile;
      }

      // Found profile in database, sync with localStorage cache
      const profileData: UserProfileData = {
        id: player.id,
        name: player.name || 'Pemain Baru',
        avatar: player.avatar || DEFAULT_AVATAR,
        border_frame: player.border_frame || '/image/border/1.png',
        border_color: player.border_color || '/image/border/1.png',
        bg_profile: player.bg_profile || '/image/bgprofile/1.jpg',
        title_tag: player.title_tag || 'Muslim Cerdas',
        bio_quote: player.bio_quote || 'رَبِّ زِدْنِي عِلْمًا',
        bio_translation: player.bio_translation || '"Ya Tuhanku, tambahkanlah kepadaku ilmu."',
        bio_reference: player.bio_reference || '(QS. Taha: 114)',
        level: player.level ?? 1,
        xp: player.xp ?? 0,
        amal_points: player.amal_points ?? 0,
        total_games: player.total_games ?? 0,
        total_correct: player.total_correct ?? 0,
        total_questions_answered: player.total_questions_answered ?? 0,
        role: player.role || 'player',
        created_at: player.created_at || new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profileData));
      }
      return profileData;
    } catch (e) {
      console.warn('Failed to fetch profile from server:', e);
      return this.getProfile();
    }
  }

  // Save/Update Profile
  static async saveProfile(profile: Partial<UserProfileData>): Promise<UserProfileData> {
    const current = this.getProfile() || this.createDefaultProfile('');
    const finalId = (profile.id && !profile.id.startsWith('guest_')) ? profile.id : current.id;
    const updated: UserProfileData = {
      ...current,
      ...profile,
      id: finalId,
      name: profile.name?.trim() || current.name || 'Pemain Baru',
      avatar: profile.avatar || current.avatar || DEFAULT_AVATAR,
      border_frame: profile.border_frame || current.border_frame || '/image/border/1.png',
      border_color: profile.border_color || profile.border_frame || current.border_color || '/image/border/1.png',
      bg_profile: profile.bg_profile || current.bg_profile || '/image/bgprofile/1.jpg',
      title_tag: profile.title_tag || current.title_tag || 'Muslim Cerdas',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }

    if (isSupabaseConfigured() && supabase && updated.id) {
      try {
        await supabase.from('players').upsert([{
          id: updated.id,
          name: updated.name,
          avatar: updated.avatar,
          border_frame: updated.border_frame,
          border_color: updated.border_color,
          bg_profile: updated.bg_profile,
          title_tag: updated.title_tag,
          bio_quote: updated.bio_quote,
          bio_translation: updated.bio_translation,
          bio_reference: updated.bio_reference,
          level: updated.level,
          xp: updated.xp,
          amal_points: updated.amal_points,
          total_games: updated.total_games,
          total_correct: updated.total_correct,
          total_questions_answered: updated.total_questions_answered,
          role: updated.role || 'player',
          updated_at: new Date().toISOString(),
        }]);

        // Propagate name and avatar changes to game sessions and leaderboard tables
        await supabase.from('game_sessions')
          .update({
            player_name: updated.name,
            player_avatar: updated.avatar
          })
          .eq('player_id', updated.id);

        await supabase.from('leaderboard')
          .update({
            player_name: updated.name,
            player_avatar: updated.avatar
          })
          .eq('player_id', updated.id);
      } catch (e) {
        console.warn('Supabase sync profile failed:', e);
      }
    }

    return updated;
  }

  // Helper: Calculate Level & Progress dynamically
  static calculateLevelInfo(totalPoints: number) {
    let level = 1;
    let pointsNeeded = 5000;
    let remainingPoints = totalPoints;

    while (remainingPoints >= pointsNeeded) {
      remainingPoints -= pointsNeeded;
      level++;
      pointsNeeded += 2500;
    }

    const progressPercent = Math.min((remainingPoints / pointsNeeded) * 100, 100);

    return {
      level,
      currentLevelPoints: remainingPoints,
      nextLevelPoints: pointsNeeded,
      progressPercent
    };
  }

  // Accumulate Score & XP After Match
  static async addGameResults(score: number, correctCount: number = 0, totalQuestions: number = 15): Promise<UserProfileData> {
    const current = this.getProfile() || this.createDefaultProfile('');
    const newAmalPoints = (current.amal_points || 0) + score;
    const newXP = current.xp + score;
    const newTotalGames = current.total_games + 1;
    const newTotalCorrect = current.total_correct + correctCount;
    const newTotalQuestionsAnswered = current.total_questions_answered + totalQuestions;

    const { level: newLevel } = this.calculateLevelInfo(newAmalPoints);

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

  // Get Current Profile or Default fallback
  static getProfileOrDefault(): UserProfileData {
    let p = this.getProfile();
    if (!p) {
      p = this.createDefaultProfile('');
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
        } catch { }
      }
    }
    return p;
  }

  // Clear session locally
  static clearLocalProfile(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    }
  }

  static generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static createDefaultProfile(id: string = ''): UserProfileData {
    const isIdValid = id && id.trim() !== '' && !id.startsWith('guest_');
    const finalId = isIdValid ? id : this.generateUUID();
    return {
      id: finalId,
      name: 'Pemain Baru',
      avatar: DEFAULT_AVATAR,
      border_frame: '/image/border/1.png',
      border_color: '/image/border/1.png',
      bg_profile: '/image/bgprofile/1.jpg',
      title_tag: 'Muslim Cerdas',
      bio_quote: 'رَبِّ زِدْنِي عِلْمًا',
      bio_translation: '"Ya Tuhanku, tambahkanlah kepadaku ilmu."',
      bio_reference: '(QS. Taha: 114)',
      level: 1,
      xp: 0,
      amal_points: 0,
      total_games: 0,
      total_correct: 0,
      total_questions_answered: 0,
      role: 'player',
      created_at: new Date().toISOString(),
    };
  }
}
