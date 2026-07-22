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
  game_type?: 'millionaire' | 'kahoot';
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
  player_id?: string;
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
  player_id?: string;
  player_name: string;
  player_avatar: string;
  border_frame?: string;
  title_tag?: string;
  score: number;
  correct_count: number;
  total_questions?: number;
  total_games?: number;
  accuracy?: number;
  duration_seconds: number;
  event_tag: string;
  created_at: string;
}

export interface QuizRoom {
  id: string;
  room_code: string;
  title: string;
  category_name: string;
  status: 'waiting' | 'question' | 'feedback' | 'standing' | 'finished';
  current_question_index: number;
  total_questions: number;
  question_ids?: string[]; // Ordered list of question IDs for all clients to share
  created_by?: string;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
}

export interface QuizRoomPlayer {
  id: string;
  room_id: string;
  player_id: string;
  player_name: string;
  player_avatar: string;
  border_frame?: string;
  bg_profile?: string;
  score: number;
  correct_count: number;
  joined_at?: string;
}

export type GameState = 'WELCOME' | 'SETUP' | 'PLAYING' | 'FEEDBACK' | 'SUMMARY' | 'LEADERBOARD';
