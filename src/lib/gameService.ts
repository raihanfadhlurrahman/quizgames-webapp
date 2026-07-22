import { Question, Category, LeaderboardEntry, GameSessionResult } from '@/types/game';
import { INITIAL_CATEGORIES, INITIAL_QUESTIONS } from '@/data/seedQuestions';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const LOCAL_STORAGE_QUESTIONS_KEY = 'islamic_millionaire_questions';
const LOCAL_STORAGE_LEADERBOARD_KEY = 'islamic_millionaire_leaderboard';
const LOCAL_STORAGE_CATEGORIES_KEY = 'islamic_millionaire_categories';

export class GameService {
  // Fetch All Categories
  static async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase categories fetch failed, falling back to local:', e);
      }
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_CATEGORIES;
        }
      }
    }
    return INITIAL_CATEGORIES;
  }

  // Fetch Questions (Filtered by category or all)
  static async getQuestions(categoryName?: string, count: number = 15): Promise<Question[]> {
    let pool: Question[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('questions').select('*');
        if (categoryName && categoryName !== 'Campuran') {
          query = query.eq('category_name', categoryName);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          pool = data;
        }
      } catch (e) {
        console.warn('Supabase fetch questions failed, using local fallback:', e);
      }
    }

    if (pool.length === 0) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
        if (saved) {
          try {
            pool = JSON.parse(saved);
          } catch {
            pool = INITIAL_QUESTIONS;
          }
        } else {
          pool = INITIAL_QUESTIONS;
        }
      } else {
        pool = INITIAL_QUESTIONS;
      }
    }

    if (categoryName && categoryName !== 'Campuran') {
      const filtered = pool.filter(q => q.category_name === categoryName);
      if (filtered.length >= count) {
        pool = filtered;
      }
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Save/Update Single Question
  static async saveQuestion(question: Question): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          category_name: question.category_name || 'Campuran',
          difficulty: question.difficulty || 'medium',
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_option: question.correct_option,
          explanation: question.explanation,
          dalil: question.dalil || '',
          ustadz_hint: question.ustadz_hint || '',
        };

        if (question.id && !question.id.startsWith('custom-') && !question.id.startsWith('q-')) {
          await supabase.from('questions').update(payload).eq('id', question.id);
        } else {
          await supabase.from('questions').insert([payload]);
        }
      } catch (e) {
        console.warn('Supabase save question failed, saving to LocalStorage:', e);
      }
    }

    // Always update LocalStorage as well for seamless offline compatibility
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
      let list: Question[] = saved ? JSON.parse(saved) : [...INITIAL_QUESTIONS];
      const existingIdx = list.findIndex(q => q.id === question.id);
      if (existingIdx >= 0) {
        list[existingIdx] = question;
      } else {
        list.unshift(question);
      }
      localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(list));
    }
  }

  // Delete Question
  static async deleteQuestion(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('questions').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete question failed:', e);
      }
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
      let list: Question[] = saved ? JSON.parse(saved) : [...INITIAL_QUESTIONS];
      list = list.filter(q => q.id !== id);
      localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(list));
    }
  }

  // Save Questions List (Batch / CSV import)
  static async saveQuestionsBatch(questions: Question[]): Promise<void> {
    for (const q of questions) {
      await this.saveQuestion(q);
    }
  }

  // Submit Game Result & Leaderboard Entry
  static async submitGameResult(result: GameSessionResult): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: sessionData, error: sessionErr } = await supabase
          .from('game_sessions')
          .insert([result])
          .select()
          .single();

        if (!sessionErr && sessionData) {
          await supabase.from('leaderboard').insert([{
            session_id: sessionData.id,
            player_name: result.player_name,
            player_avatar: result.player_avatar,
            score: result.total_score,
            correct_count: result.correct_answers,
            duration_seconds: result.duration_seconds,
            event_tag: result.event_tag,
          }]);
          return;
        }
      } catch (e) {
        console.warn('Supabase submit failed, saving to LocalStorage:', e);
      }
    }

    if (typeof window !== 'undefined') {
      const existing = this.getLocalLeaderboard();
      const newEntry: LeaderboardEntry = {
        id: 'lb-' + Date.now(),
        player_name: result.player_name,
        player_avatar: result.player_avatar,
        score: result.total_score,
        correct_count: result.correct_answers,
        duration_seconds: result.duration_seconds,
        event_tag: result.event_tag,
        created_at: new Date().toISOString(),
      };
      const updated = [...existing, newEntry].sort((a, b) => b.score - a.score || a.duration_seconds - b.duration_seconds);
      localStorage.setItem(LOCAL_STORAGE_LEADERBOARD_KEY, JSON.stringify(updated));
    }
  }

  // Get Leaderboard Top Entries
  static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('score', { ascending: false })
          .order('duration_seconds', { ascending: true })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase leaderboard fetch failed:', e);
      }
    }

    return this.getLocalLeaderboard().slice(0, limit);
  }

  static getLocalLeaderboard(): LeaderboardEntry[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(LOCAL_STORAGE_LEADERBOARD_KEY);
    if (!saved) {
      return [
        { id: '1', player_name: 'Ahmad', player_avatar: '👳', score: 1500, correct_count: 15, duration_seconds: 180, event_tag: 'KKN Wedomartani', created_at: new Date().toISOString() },
        { id: '2', player_name: 'Dinda', player_avatar: '🧕🏻', score: 1300, correct_count: 13, duration_seconds: 195, event_tag: 'KKN Wedomartani', created_at: new Date().toISOString() },
        { id: '3', player_name: 'Fajar', player_avatar: '👦🏻', score: 1100, correct_count: 11, duration_seconds: 210, event_tag: 'KKN Wedomartani', created_at: new Date().toISOString() },
      ];
    }
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  // Admin: Reset Leaderboard
  static async resetLeaderboard(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('leaderboard').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase reset failed:', e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_LEADERBOARD_KEY);
    }
  }
}
