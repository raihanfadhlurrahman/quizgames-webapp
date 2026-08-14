import { Question, Category, LeaderboardEntry, GameSessionResult } from '@/types/game';
import { INITIAL_CATEGORIES, INITIAL_QUESTIONS } from '@/data/seedQuestions';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const LOCAL_STORAGE_QUESTIONS_KEY = 'islamic_millionaire_questions';
const LOCAL_STORAGE_LEADERBOARD_KEY = 'islamic_millionaire_leaderboard';
const LOCAL_STORAGE_CATEGORIES_KEY = 'islamic_millionaire_categories';

export class GameService {
  // Fetch All Categories (Supabase DB + LocalStorage fallback/merge)
  static async getCategories(): Promise<Category[]> {
    let list: Category[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          list = data.map((c: any) => ({
            ...c,
            theme_id: c.theme_id || 'islamic',
          }));
        }
      } catch (e) {
        console.warn('Supabase categories fetch failed:', e);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
      if (saved) {
        try {
          const localList: Category[] = JSON.parse(saved);
          if (Array.isArray(localList) && localList.length > 0) {
            if (list.length > 0) {
              list = list.map((spCat) => {
                const matched = localList.find(
                  (lCat) => lCat.id === spCat.id || lCat.name.toLowerCase() === spCat.name.toLowerCase()
                );
                return matched ? { ...spCat, ...matched } : spCat;
              });

              localList.forEach((lCat) => {
                if (!list.some((spCat) => spCat.id === lCat.id || spCat.name.toLowerCase() === lCat.name.toLowerCase())) {
                  list.push(lCat);
                }
              });
            } else {
              list = localList;
            }
          }
        } catch (e) {
          console.warn('Failed to parse local categories:', e);
        }
      }
    }

    if (list.length === 0) {
      list = INITIAL_CATEGORIES;
    }

    return list;
  }

  // Save/Update Category (Supabase DB + LocalStorage Sync)
  static async saveCategory(category: Category, oldCategoryName?: string): Promise<Category> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category.id || '');
    let savedCat: Category = { ...category };

    const payload: any = {
      name: category.name.trim(),
      icon: category.icon || '🕌',
      description: category.description || '',
      theme_id: category.theme_id || 'islamic',
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        if (isUUID) {
          let { data, error } = await supabase
            .from('categories')
            .update(payload)
            .eq('id', category.id)
            .select()
            .maybeSingle();

          if (error && error.message?.includes('theme_id')) {
            delete payload.theme_id;
            const res = await supabase.from('categories').update(payload).eq('id', category.id).select().maybeSingle();
            data = res.data;
            error = res.error;
          }

          if (!error && data) {
            savedCat = { ...data, theme_id: data.theme_id || category.theme_id || 'islamic' };
          }
        } else {
          const searchName = oldCategoryName ? oldCategoryName.trim() : category.name.trim();
          const { data: existing } = await supabase.from('categories').select('*').eq('name', searchName).maybeSingle();

          if (existing?.id) {
            let { data, error } = await supabase
              .from('categories')
              .update(payload)
              .eq('id', existing.id)
              .select()
              .maybeSingle();

            if (!error && data) {
              savedCat = { ...data, theme_id: data.theme_id || category.theme_id || 'islamic' };
            }
          } else {
            let { data, error } = await supabase
              .from('categories')
              .upsert([payload], { onConflict: 'name' })
              .select()
              .maybeSingle();

            if (!error && data) {
              savedCat = { ...data, theme_id: data.theme_id || category.theme_id || 'islamic' };
            }
          }
        }

        if (oldCategoryName && oldCategoryName.trim() !== category.name.trim()) {
          try {
            await supabase
              .from('questions')
              .update({ category_name: category.name.trim() })
              .eq('category_name', oldCategoryName.trim());
          } catch (e) {
            console.warn('Updating question category_name in Supabase failed:', e);
          }
        }
      } catch (e) {
        console.warn('Supabase save category failed, saving to LocalStorage:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
        let list: Category[] = saved ? JSON.parse(saved) : [...INITIAL_CATEGORIES];

        const targetId = category.id;
        const targetOldName = (oldCategoryName || '').toLowerCase().trim();
        const targetName = category.name.toLowerCase().trim();

        const idx = list.findIndex(
          c => c.id === targetId ||
               (targetOldName && c.name.toLowerCase().trim() === targetOldName) ||
               (targetName && c.name.toLowerCase().trim() === targetName)
        );

        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            ...savedCat,
            id: list[idx].id,
          };
          savedCat = list[idx];
        } else {
          const newId = savedCat.id || `cat-custom-${Date.now()}`;
          savedCat.id = newId;
          list.push(savedCat);
        }

        localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(list));

        if (oldCategoryName && oldCategoryName.trim() !== category.name.trim()) {
          const savedQuestions = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
          if (savedQuestions) {
            try {
              let qList: Question[] = JSON.parse(savedQuestions);
              let qUpdated = false;
              qList = qList.map(q => {
                if (q.category_name?.trim().toLowerCase() === oldCategoryName.trim().toLowerCase()) {
                  qUpdated = true;
                  return { ...q, category_name: category.name.trim() };
                }
                return q;
              });
              if (qUpdated) {
                localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(qList));
              }
            } catch {}
          }
        }
      } catch (e) {
        console.warn('LocalStorage saveCategory error:', e);
      }
    }

    return savedCat;
  }

  // Delete Category (Supabase DB + LocalStorage Sync)
  static async deleteCategory(id: string, name?: string): Promise<void> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isSupabaseConfigured() && supabase) {
      try {
        if (isUUID) {
          await supabase.from('categories').delete().eq('id', id);
        } else if (name) {
          await supabase.from('categories').delete().eq('name', name);
        }
      } catch (e) {
        console.warn('Supabase delete category failed:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
        let list: Category[] = saved ? JSON.parse(saved) : [...INITIAL_CATEGORIES];
        list = list.filter(c => c.id !== id && (name ? c.name.toLowerCase() !== name.toLowerCase() : true));
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('LocalStorage deleteCategory error:', e);
      }
    }
  }

  // Seed initial categories & questions to Supabase
  static async seedInitialQuestionsToSupabase(): Promise<{ count: number; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { count: 0, error: 'Supabase tidak terkonfigurasi.' };
    }

    try {
      // 1. Upsert categories into Supabase (try with theme_id first, fallback without theme_id if missing)
      const catPayloads = INITIAL_CATEGORIES.map((c) => ({
        name: c.name.trim(),
        icon: c.icon || '🕌',
        description: c.description || '',
        theme_id: c.theme_id || 'islamic',
      }));

      const { error: catErr } = await supabase.from('categories').upsert(catPayloads, { onConflict: 'name' });
      if (catErr && catErr.message.includes("theme_id")) {
        // Fallback upsert categories without theme_id
        const catPayloadsNoTheme = INITIAL_CATEGORIES.map((c) => ({
          name: c.name.trim(),
          icon: c.icon || '🕌',
          description: c.description || '',
        }));
        await supabase.from('categories').upsert(catPayloadsNoTheme, { onConflict: 'name' });
      }

      // Fetch all updated categories from Supabase to construct catMap
      const { data: catData } = await supabase.from('categories').select('id, name');
      const catMap: Record<string, string> = {};
      if (catData) {
        catData.forEach((c: any) => { catMap[c.name.trim()] = c.id; });
      }

      // 2. Prepare question payloads
      const payloads = INITIAL_QUESTIONS.map((q) => ({
        category_id: catMap[q.category_name?.trim() || ''] || null,
        theme_id: q.theme_id || 'islamic',
        game_type: q.game_type || 'millionaire',
        difficulty: q.difficulty || 'medium',
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation,
        dalil: q.dalil || '',
        ustadz_hint: q.ustadz_hint || '',
      }));

      const { data, error } = await supabase.from('questions').insert(payloads).select();
      if (error) {
        if (error.message.includes("theme_id")) {
          // If theme_id column does not exist yet in Supabase schema cache, retry without theme_id column
          const payloadsNoTheme = payloads.map(({ theme_id, ...rest }) => rest);
          const { data: data2, error: error2 } = await supabase.from('questions').insert(payloadsNoTheme).select();
          if (error2) throw new Error(error2.message);
          return {
            count: data2 ? data2.length : 0,
            error: '⚠️ Kolom `theme_id` belum ada di Supabase! Harap jalankan script migration di dokumen/schema.sql pada Supabase SQL Editor.',
          };
        }
        throw new Error(error.message);
      }
      return { count: data ? data.length : 0 };
    } catch (e: any) {
      console.error('Failed to seed questions to Supabase:', e);
      return { count: 0, error: e.message || 'Gagal seeding soal ke Supabase' };
    }
  }

  // Fetch Questions (Filtered by category, gameType, and strictly by themeId: 'islamic' | 'independence' | 'culture')
  static async getQuestions(
    categoryName?: string,
    count: number = 15,
    gameType: 'millionaire' | 'kahoot' = 'millionaire',
    themeId?: string
  ): Promise<Question[]> {
    let pool: Question[] = [];
    const activeTheme = themeId || (typeof window !== 'undefined' ? localStorage.getItem('app_theme') : 'islamic') || 'islamic';

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('questions').select('*, categories(name)');
        let { data, error } = await query;

        // Fallback without categories join if relation fails
        if (error) {
          const fallback = await supabase.from('questions').select('*');
          data = fallback.data;
          error = fallback.error;
        }

        if (!error && data && data.length > 0) {
          let mapped = data.map((q: any) => ({
            ...q,
            theme_id: q.theme_id || 'islamic',
            category_name: q.categories?.name || q.category_name || 'Campuran',
          }));
          
          // Filter strictly by active theme
          mapped = mapped.filter((q: Question) => (q.theme_id || 'islamic') === activeTheme);

          if (categoryName && categoryName !== 'Campuran') {
            const filtered = mapped.filter((q: Question) => q.category_name === categoryName);
            if (filtered.length > 0) mapped = filtered;
          }
          pool = mapped;
        }
      } catch (e) {
        console.warn('Supabase fetch questions failed:', e);
      }
    }

    // Check LocalStorage fallback
    if (pool.length === 0 && typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
      if (saved) {
        try {
          const list: Question[] = JSON.parse(saved);
          let filtered = list.filter(q => (q.theme_id || 'islamic') === activeTheme);
          if (categoryName && categoryName !== 'Campuran') {
            const catFiltered = filtered.filter(q => q.category_name === categoryName);
            if (catFiltered.length > 0) filtered = catFiltered;
          }
          if (filtered.length > 0) pool = filtered;
        } catch {
          // ignore
        }
      }
    }

    // Fallback ONLY if both Supabase & LocalStorage returned 0 rows
    if (pool.length === 0) {
      pool = INITIAL_QUESTIONS.filter((q) => (q.theme_id || 'islamic') === activeTheme);
      if (categoryName && categoryName !== 'Campuran') {
        const filtered = pool.filter((q) => q.category_name === categoryName);
        if (filtered.length > 0) pool = filtered;
      }
      if (pool.length === 0) {
        pool = INITIAL_QUESTIONS.filter((q) => (q.theme_id || 'islamic') === activeTheme);
      }
      if (pool.length === 0) pool = INITIAL_QUESTIONS;
    }

    // Deterministic sort for kahoot mode so Operator and all Participants get EXACT same question order
    if (gameType === 'kahoot') {
      return [...pool].sort((a, b) => (a.id || '').localeCompare(b.id || '')).slice(0, count);
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Fetch specific questions by IDs, preserving the order of the IDs
  static async getQuestionsByIds(ids: string[]): Promise<Question[]> {
    if (!ids || ids.length === 0) return [];
    
    let pool: Question[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        let { data, error } = await supabase
          .from('questions')
          .select('*, categories(name)')
          .in('id', ids);

        if (error) {
          const fallback = await supabase.from('questions').select('*').in('id', ids);
          data = fallback.data;
          error = fallback.error;
        }

        if (!error && data && data.length > 0) {
          pool = data.map((q: any) => ({
            ...q,
            category_name: q.categories?.name || q.category_name || 'Campuran',
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch questions by ids failed:', e);
      }
    }

    if (pool.length === 0 && typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
      if (saved) {
        try {
          const list: Question[] = JSON.parse(saved);
          pool = list.filter((q) => ids.includes(q.id || ''));
        } catch {
          // ignore
        }
      }
    }

    if (pool.length === 0) {
      pool = INITIAL_QUESTIONS.filter((q) => ids.includes(q.id || ''));
    }

    // Sort the pool according to the order of `ids` array
    const sorted = [...pool].sort((a, b) => {
      const idxA = ids.indexOf(a.id || '');
      const idxB = ids.indexOf(b.id || '');
      return idxA - idxB;
    });

    return sorted;
  }

  // Fetch ALL questions for Admin view (Supabase DB + LocalStorage fallback/merge)
  static async getAllQuestionsAdmin(): Promise<Question[]> {
    let pool: Question[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        let { data, error } = await supabase
          .from('questions')
          .select('*, categories(name)')
          .order('created_at', { ascending: false });

        if (error) {
          const fallback = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
          data = fallback.data;
          error = fallback.error;
        }

        if (!error && data && data.length > 0) {
          pool = data.map((q: any) => ({
            ...q,
            theme_id: q.theme_id || 'islamic',
            category_name: q.categories?.name || q.category_name || 'Campuran',
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch all questions failed:', e);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
      if (saved) {
        try {
          const localList: Question[] = JSON.parse(saved);
          if (Array.isArray(localList) && localList.length > 0) {
            if (pool.length > 0) {
              pool = pool.map((spQ) => {
                const matched = localList.find((lQ) => lQ.id === spQ.id);
                return matched ? { ...spQ, ...matched } : spQ;
              });

              localList.forEach((lQ) => {
                if (!pool.some((p) => p.id === lQ.id)) {
                  pool.unshift(lQ);
                }
              });
            } else {
              pool = localList;
            }
          }
        } catch (e) {
          console.warn('Failed to parse local questions:', e);
        }
      }
    }

    if (pool.length === 0) {
      pool = INITIAL_QUESTIONS;
    }

    return pool;
  }

  // Save/Update Single Question (Supabase DB + LocalStorage Sync)
  static async saveQuestion(question: Question): Promise<Question> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(question.id || '');
    let savedQuestion: Question = { ...question };

    // Resolve category_id safely (MUST be valid UUID format for PostgreSQL)
    let catId: string | null = null;
    if (question.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(question.category_id)) {
      catId = question.category_id;
    } else if (isSupabaseConfigured() && supabase && question.category_name) {
      try {
        const { data: catData } = await supabase.from('categories').select('id').eq('name', question.category_name.trim()).maybeSingle();
        if (catData?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catData.id)) {
          catId = catData.id;
        }
      } catch {
        // ignore
      }
    }

    const payload: any = {
      category_id: catId,
      category_name: question.category_name || 'Campuran',
      theme_id: question.theme_id || 'islamic',
      game_type: question.game_type || 'millionaire',
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

    if (isSupabaseConfigured() && supabase) {
      try {
        if (isUUID) {
          let { data, error } = await supabase
            .from('questions')
            .update(payload)
            .eq('id', question.id)
            .select('*, categories(name)')
            .maybeSingle();

          if (error) {
            delete payload.category_id;
            const res = await supabase.from('questions').update(payload).eq('id', question.id).select('*').maybeSingle();
            data = res.data;
            error = res.error;
          }

          if (error && error.message?.includes('theme_id')) {
            delete payload.theme_id;
            const res = await supabase.from('questions').update(payload).eq('id', question.id).select('*').maybeSingle();
            data = res.data;
            error = res.error;
          }

          if (!error && data) {
            savedQuestion = {
              ...data,
              category_name: data.categories?.name || data.category_name || question.category_name || 'Campuran',
            };
          }
        } else {
          let { data, error } = await supabase
            .from('questions')
            .insert([payload])
            .select('*, categories(name)')
            .maybeSingle();

          if (error) {
            delete payload.category_id;
            const res = await supabase.from('questions').insert([payload]).select('*').maybeSingle();
            data = res.data;
            error = res.error;
          }

          if (error && error.message?.includes('theme_id')) {
            delete payload.theme_id;
            const res = await supabase.from('questions').insert([payload]).select('*').maybeSingle();
            data = res.data;
            error = res.error;
          }

          if (!error && data) {
            savedQuestion = {
              ...data,
              category_name: data.categories?.name || data.category_name || question.category_name || 'Campuran',
            };
          }
        }
      } catch (e: any) {
        console.warn('Supabase saveQuestion failed, falling back to local storage:', e);
      }
    }

    // Always sync to LocalStorage so edits persist locally
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
        let list: Question[] = saved ? JSON.parse(saved) : [...INITIAL_QUESTIONS];

        const targetId = question.id;
        const idx = list.findIndex(q => q.id === targetId || (targetId && q.id === targetId));

        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            ...savedQuestion,
            id: list[idx].id, // maintain existing ID
          };
          savedQuestion = list[idx];
        } else {
          const newId = savedQuestion.id || `q-custom-${Date.now()}`;
          savedQuestion.id = newId;
          list.unshift(savedQuestion);
        }

        localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('LocalStorage saveQuestion error:', e);
      }
    }

    return savedQuestion;
  }

  // Delete Question (Supabase DB + LocalStorage Sync)
  static async deleteQuestion(id: string): Promise<void> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isSupabaseConfigured() && supabase && isUUID) {
      try {
        await supabase.from('questions').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete question error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
        let list: Question[] = saved ? JSON.parse(saved) : [...INITIAL_QUESTIONS];
        list = list.filter(q => q.id !== id);
        localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('LocalStorage delete question error:', e);
      }
    }
  }

  // Delete Questions Batch (Bulk Delete Supabase DB + LocalStorage Sync)
  static async deleteQuestionsBatch(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const uuidIds = ids.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    if (isSupabaseConfigured() && supabase && uuidIds.length > 0) {
      try {
        await supabase.from('questions').delete().in('id', uuidIds);
      } catch (e) {
        console.warn('Supabase delete batch questions error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
        let list: Question[] = saved ? JSON.parse(saved) : [...INITIAL_QUESTIONS];
        list = list.filter(q => !ids.includes(q.id));
        localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('LocalStorage batch delete question error:', e);
      }
    }
  }

  // Save Questions List (Batch / CSV import)
  static async saveQuestionsBatch(questions: Question[]): Promise<void> {
    for (const q of questions) {
      await this.saveQuestion(q);
    }
  }

  // Submit Game Result & Leaderboard Entry
  static async submitGameResult(result: GameSessionResult): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: sessionData, error: sessionErr } = await supabase
          .from('game_sessions')
          .insert([result])
          .select()
          .single();

        if (sessionErr) {
          console.error('Failed to insert game session:', sessionErr);
          return { success: false, error: sessionErr.message };
        }

        if (sessionData) {
          if (result.player_id) {
            // Enforce only one best score entry per player on the leaderboard
            const { data: existing, error: fetchErr } = await supabase
              .from('leaderboard')
              .select('*')
              .eq('player_id', result.player_id)
              .maybeSingle();

            if (fetchErr) {
              console.error('Failed to query existing leaderboard score:', fetchErr);
            }

            if (!existing) {
              // No existing record, insert first score
              const { error: lbInsertErr } = await supabase.from('leaderboard').insert([{
                player_id: result.player_id,
                session_id: sessionData.id,
                player_name: result.player_name,
                player_avatar: result.player_avatar,
                score: result.total_score,
                correct_count: result.correct_answers,
                duration_seconds: result.duration_seconds,
                event_tag: result.event_tag,
              }]);
              if (lbInsertErr) {
                console.error('Failed to insert leaderboard score:', lbInsertErr);
                return { success: false, error: lbInsertErr.message };
              }
            } else if (
              result.total_score > existing.score ||
              (result.total_score === existing.score && result.duration_seconds < existing.duration_seconds)
            ) {
              // Update with the new better score
              const { error: lbUpdateErr } = await supabase.from('leaderboard')
                .update({
                  session_id: sessionData.id,
                  player_name: result.player_name,
                  player_avatar: result.player_avatar,
                  score: result.total_score,
                  correct_count: result.correct_answers,
                  duration_seconds: result.duration_seconds,
                  event_tag: result.event_tag,
                  created_at: new Date().toISOString(),
                })
                .eq('player_id', result.player_id);
              if (lbUpdateErr) {
                console.error('Failed to update leaderboard score:', lbUpdateErr);
                return { success: false, error: lbUpdateErr.message };
              }
            }
          } else {
            // Fallback if player_id is missing
            const { error: lbInsertErr } = await supabase.from('leaderboard').insert([{
              session_id: sessionData.id,
              player_name: result.player_name,
              player_avatar: result.player_avatar,
              score: result.total_score,
              correct_count: result.correct_answers,
              duration_seconds: result.duration_seconds,
              event_tag: result.event_tag,
            }]);
            if (lbInsertErr) {
              console.error('Failed to insert fallback leaderboard score:', lbInsertErr);
              return { success: false, error: lbInsertErr.message };
            }
          }
          return { success: true };
        }
      } catch (e: any) {
        console.error('Supabase submit exception:', e);
        return { success: false, error: e?.message || 'Unknown error' };
      }
    }
    return { success: false, error: 'Supabase is not configured' };
  }

  // Fetch Leaderboard for 5 Top Tabs: ALL (Global), ISLAMIC, INDEPENDENCE, CULTURE
  static async getLeaderboard(tabMode: string = 'ALL', limit: number = 20): Promise<LeaderboardEntry[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: players, error } = await supabase.from('players').select('*');

        if (!error && players && players.length > 0) {
          const mapped = players.map((player) => {
            const amal = player.amal_points || 0;
            const wawasan = player.wawasan_points || 0;
            const budaya = player.budaya_points || 0;
            const totalCombined = amal + wawasan + budaya;

            let score = totalCombined;
            let theme_id: any = 'islamic';

            if (tabMode === 'ISLAMIC') {
              score = amal;
              theme_id = 'islamic';
            } else if (tabMode === 'INDEPENDENCE') {
              score = wawasan;
              theme_id = 'independence';
            } else if (tabMode === 'CULTURE') {
              score = budaya;
              theme_id = 'culture';
            }

            const totalQ = player.total_questions_answered || 0;
            const totalC = player.total_correct || 0;
            const acc = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

            return {
              id: player.id,
              player_id: player.id,
              player_name: player.name,
              player_avatar: player.avatar,
              border_frame: player.border_frame || player.border_color || '/image/border/1.png',
              title_tag: player.title_tag || 'Muslim Cerdas',
              score,
              theme_id,
              correct_count: totalC,
              total_questions: totalQ,
              total_games: player.total_games ?? 0,
              accuracy: acc,
              duration_seconds: 0,
              event_tag: 'KKN Wedomartani',
              created_at: player.created_at || new Date().toISOString(),
            };
          });

          // Sort by score DESC, total_correct DESC
          mapped.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.correct_count - a.correct_count;
          });

          return mapped.slice(0, limit);
        }
      } catch (e) {
        console.warn('Supabase leaderboard fetch failed:', e);
      }
    }

    return [];
  }

  // Get active user's best score and rank (Global or Theme Tab)
  static async getUserBestStats(playerId: string, tabMode: string = 'ALL'): Promise<{
    rank: number;
    score: number;
    correct_count: number;
    total_questions: number;
    accuracy: number;
    total_games: number;
  } | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: players, error: fetchErr } = await supabase.from('players').select('*');

        if (!fetchErr && players && players.length > 0) {
          const mapped = players.map((p) => {
            const amal = p.amal_points || 0;
            const wawasan = p.wawasan_points || 0;
            const budaya = p.budaya_points || 0;
            let score = amal + wawasan + budaya;
            if (tabMode === 'ISLAMIC') score = amal;
            else if (tabMode === 'INDEPENDENCE') score = wawasan;
            else if (tabMode === 'CULTURE') score = budaya;

            return { id: p.id, score, player: p };
          });

          mapped.sort((a, b) => b.score - a.score);
          const rankIndex = mapped.findIndex((m) => m.id === playerId);
          if (rankIndex !== -1) {
            const userItem = mapped[rankIndex];
            const p = userItem.player;
            const totalQ = p.total_questions_answered || 0;
            const totalC = p.total_correct || 0;
            const acc = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

            return {
              rank: rankIndex + 1,
              score: userItem.score,
              correct_count: totalC,
              total_questions: totalQ,
              accuracy: acc,
              total_games: p.total_games ?? 0,
            };
          }
        }
      } catch (e) {
        console.warn('GetUserBestStats error:', e);
      }
    }
    return null;
  }

  static getLocalLeaderboard(): LeaderboardEntry[] {
    return [];
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
  }

  // Admin: Get all registered players
  static async getAllPlayersAdmin(): Promise<any[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Error fetching players for admin:', e);
      }
    }
    return [];
  }

  // Admin: Reset player points selectively by theme or all
  static async resetPlayerPointsByTheme(themeTarget: 'islamic' | 'independence' | 'culture' | 'ALL'): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        if (themeTarget === 'independence') {
          await supabase.from('players').update({ wawasan_points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        } else if (themeTarget === 'culture') {
          await supabase.from('players').update({ budaya_points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        } else if (themeTarget === 'islamic') {
          await supabase.from('players').update({ amal_points: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          await supabase.from('players').update({
            amal_points: 0,
            wawasan_points: 0,
            budaya_points: 0,
            total_games: 0,
            total_correct: 0,
            total_questions_answered: 0,
            xp: 0,
          }).neq('id', '00000000-0000-0000-0000-000000000000');
        }
        return true;
      } catch (e) {
        console.warn('Error resetting player points by theme:', e);
      }
    }
    return false;
  }
}
