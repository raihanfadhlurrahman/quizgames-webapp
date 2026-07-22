export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Question {
  id: string;
  category_id?: string;
  category_name?: string;
  difficulty: Difficulty;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  dalil?: string;
  ustadz_hint?: string;
}

export interface PlayerProfile {
  name: string;
  avatar: string;
  category: string;
}

export interface GameSessionResult {
  id?: string;
  player_name: string;
  player_avatar: string;
  category_name: string;
  mode: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  total_score: number;
  duration_seconds: number;
  event_tag: string;
  created_at?: string;
}

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  player_avatar: string;
  score: number;
  correct_count: number;
  duration_seconds: number;
  event_tag: string;
  created_at: string;
}

export type GameState = 'WELCOME' | 'SETUP' | 'PLAYING' | 'FEEDBACK' | 'SUMMARY' | 'LEADERBOARD';
