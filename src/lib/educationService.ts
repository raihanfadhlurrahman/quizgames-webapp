import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MateriChapter, MateriPage } from '@/types/education';
import { ISLAMIC_CHAPTERS } from '@/data/islamicEducationData';

const LOCAL_STORAGE_CHAPTERS_KEY = 'islamic_millionaire_chapters';
const LOCAL_STORAGE_PAGES_KEY = 'islamic_millionaire_pages';

export class EducationService {
  // Fetch Chapters by Category (Supabase Direct + LocalStorage Fallback)
  static async getChaptersByCategory(categoryId: string, includeUnpublished = false): Promise<MateriChapter[]> {
    let list: MateriChapter[] = [];
    let fetchedFromSupabase = false;

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('materi_chapters')
          .select('*')
          .eq('category_id', categoryId)
          .order('chapter_number', { ascending: true });

        if (!includeUnpublished) {
          query = query.eq('is_published', true);
        }

        const { data, error } = await query;
        if (!error && data) {
          list = data;
          fetchedFromSupabase = true;
        }
      } catch (e) {
        console.warn('Supabase fetch chapters failed, relying on localStorage/static:', e);
      }
    }

    if (!fetchedFromSupabase && typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CHAPTERS_KEY);
      if (saved) {
        try {
          const localList: MateriChapter[] = JSON.parse(saved);
          if (Array.isArray(localList)) {
            list = localList.filter(
              (ch) => ch.category_id === categoryId && (includeUnpublished || ch.is_published)
            );
          }
        } catch (e) {
          console.warn('Failed to parse local chapters:', e);
        }
      }
    }

    // Static Fallback only if no data found and Supabase fetch wasn't executed
    if (list.length === 0 && !fetchedFromSupabase) {
      const staticChapters = ISLAMIC_CHAPTERS.map((ch, idx) => ({
        id: ch.id,
        category_id: categoryId,
        category_name: 'Materi Islami',
        theme_id: ch.themeId || 'islamic',
        chapter_number: ch.chapterNumber || (idx + 1),
        title: ch.title,
        description: ch.description,
        cover_icon: ch.icon || '📖',
        total_pages: ch.totalSlides || ch.slides.length,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      list = staticChapters;
    }

    return list.sort((a, b) => a.chapter_number - b.chapter_number);
  }

  // Get All Chapters Admin (Supabase Direct + LocalStorage fallback)
  static async getAllChaptersAdmin(): Promise<MateriChapter[]> {
    let list: MateriChapter[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('materi_chapters')
          .select('*')
          .order('category_name', { ascending: true })
          .order('chapter_number', { ascending: true });
        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase fetch all chapters failed:', e);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CHAPTERS_KEY);
      if (saved) {
        try {
          const localList: MateriChapter[] = JSON.parse(saved);
          if (Array.isArray(localList)) {
            list = localList;
          }
        } catch (e) {
          console.warn('Failed to parse local chapters:', e);
        }
      }
    }

    return list;
  }

  // Save/Update Chapter
  static async saveChapter(chapter: Partial<MateriChapter>): Promise<MateriChapter> {
    const isNew = !chapter.id;
    const now = new Date().toISOString();
    
    const preparedChapter: any = {
      ...chapter,
      id: chapter.id || crypto.randomUUID(),
      updated_at: now,
    };
    
    if (isNew) {
      preparedChapter.created_at = now;
      preparedChapter.total_pages = preparedChapter.total_pages || 0;
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('materi_chapters')
          .upsert(preparedChapter)
          .select()
          .single();
        if (!error && data) {
          this.syncChapterToLocal(data);
          return data;
        } else if (error) {
          console.warn('Supabase upsert chapter error:', error.message);
          throw new Error(`Supabase Error: ${error.message}`);
        }
      } catch (e: any) {
        console.warn('Supabase upsert chapter failed:', e);
        if (e.message?.startsWith('Supabase Error:')) throw e;
      }
    }

    // Local Storage Only save
    this.syncChapterToLocal(preparedChapter);
    return preparedChapter;
  }

  // Delete Chapter
  static async deleteChapter(chapterId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('materi_chapters')
          .delete()
          .eq('id', chapterId);
        if (error) {
          console.warn('Supabase delete chapter error:', error.message);
          throw new Error(`Supabase Error: ${error.message}`);
        }
      } catch (e: any) {
        console.warn('Supabase delete chapter failed:', e);
        if (e.message?.startsWith('Supabase Error:')) throw e;
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CHAPTERS_KEY);
      if (saved) {
        try {
          const list: MateriChapter[] = JSON.parse(saved);
          const filtered = list.filter((item) => item.id !== chapterId);
          localStorage.setItem(LOCAL_STORAGE_CHAPTERS_KEY, JSON.stringify(filtered));
        } catch (e) {
          console.warn('Failed to parse/delete local chapter:', e);
        }
      }
    }
  }

  // Get Pages by Chapter ID (Supabase Direct + LocalStorage Fallback + Static Fallback)
  static async getPagesByChapter(chapterId: string): Promise<MateriPage[]> {
    let list: MateriPage[] = [];
    let fetchedFromSupabase = false;

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('materi_pages')
          .select('*')
          .eq('chapter_id', chapterId)
          .order('page_number', { ascending: true });
        if (!error && data) {
          list = data;
          fetchedFromSupabase = true;
        }
      } catch (e) {
        console.warn('Supabase fetch pages failed:', e);
      }
    }

    if (!fetchedFromSupabase && typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAGES_KEY);
      if (saved) {
        try {
          const localList: MateriPage[] = JSON.parse(saved);
          if (Array.isArray(localList)) {
            list = localList.filter((p) => p.chapter_id === chapterId);
          }
        } catch (e) {
          console.warn('Failed to parse local pages:', e);
        }
      }
    }

    // Static Fallback only if no data found and Supabase wasn't fetched
    if (list.length === 0 && !fetchedFromSupabase) {
      const staticChapter = ISLAMIC_CHAPTERS.find((ch) => ch.id === chapterId);
      if (staticChapter && staticChapter.slides) {
        list = staticChapter.slides.map((slide) => ({
          id: slide.id,
          chapter_id: chapterId,
          page_number: slide.slideNumber,
          left_content_type: 'media',
          left_media_url: slide.visualIcon.startsWith('/') ? slide.visualIcon : '/image/sticker/islami/alquran2.png',
          left_media_type: 'image',
          left_audio_text: slide.bulletPoints.join('. '),
          right_title: slide.title,
          right_story_text: slide.subtitle || '',
          bullet_points: slide.bulletPoints,
          dalil_title: slide.dalil?.title,
          dalil_arabic: slide.dalil?.arabicText,
          dalil_latin: slide.dalil?.latinText,
          dalil_translation: slide.dalil?.translation,
          dalil_source: slide.dalil?.source,
          fun_fact_title: slide.funFact?.title,
          fun_fact_description: slide.funFact?.description,
          created_at: new Date().toISOString(),
        }));
      }
    }

    return list.sort((a, b) => a.page_number - b.page_number);
  }

  // Save/Update Page
  static async savePage(page: Partial<MateriPage>): Promise<MateriPage> {
    const isNew = !page.id;
    const now = new Date().toISOString();

    const preparedPage: any = {
      ...page,
      id: page.id || crypto.randomUUID(),
      updated_at: now,
    };

    if (preparedPage.left_media_type === 'youtube') {
      preparedPage.left_media_type = 'video';
    }

    if (isNew) {
      preparedPage.created_at = now;
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('materi_pages')
          .upsert(preparedPage)
          .select()
          .single();
        if (!error && data) {
          this.syncPageToLocal(data);
          this.updateChapterPagesCount(preparedPage.chapter_id);
          return data;
        } else if (error) {
          console.warn('Supabase upsert page error:', error.message);
          throw new Error(`Supabase Error: ${error.message}`);
        }
      } catch (e: any) {
        console.warn('Supabase upsert page failed:', e);
        if (e.message?.startsWith('Supabase Error:')) throw e;
      }
    }

    this.syncPageToLocal(preparedPage);
    this.updateChapterPagesCount(preparedPage.chapter_id);
    return preparedPage;
  }

  // Delete Page
  static async deletePage(pageId: string): Promise<void> {
    let chapterId = '';

    // Find page locally first to get chapterId
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAGES_KEY);
      if (saved) {
        try {
          const list: MateriPage[] = JSON.parse(saved);
          const found = list.find((p) => p.id === pageId);
          if (found) {
            chapterId = found.chapter_id;
          }
        } catch (e) {}
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        // Find page in database if not found locally
        if (!chapterId) {
          const { data } = await supabase.from('materi_pages').select('chapter_id').eq('id', pageId).single();
          if (data) chapterId = data.chapter_id;
        }

        const { error } = await supabase
          .from('materi_pages')
          .delete()
          .eq('id', pageId);
        if (error) {
          console.warn('Supabase delete page error:', error.message);
          throw new Error(`Supabase Error: ${error.message}`);
        }
      } catch (e: any) {
        console.warn('Supabase delete page failed:', e);
        if (e.message?.startsWith('Supabase Error:')) throw e;
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAGES_KEY);
      if (saved) {
        try {
          const list: MateriPage[] = JSON.parse(saved);
          const filtered = list.filter((item) => item.id !== pageId);
          localStorage.setItem(LOCAL_STORAGE_PAGES_KEY, JSON.stringify(filtered));
        } catch (e) {
          console.warn('Failed to delete local page:', e);
        }
      }
    }

    if (chapterId) {
      this.updateChapterPagesCount(chapterId);
    }
  }

  // Helpers to Sync to Local Storage
  private static syncChapterToLocal(chapter: MateriChapter) {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CHAPTERS_KEY);
      let list: MateriChapter[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];

      const idx = list.findIndex((c) => c.id === chapter.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...chapter };
      } else {
        list.push(chapter);
      }
      localStorage.setItem(LOCAL_STORAGE_CHAPTERS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to sync chapter to local:', e);
    }
  }

  private static syncPageToLocal(page: MateriPage) {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAGES_KEY);
      let list: MateriPage[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];

      const idx = list.findIndex((p) => p.id === page.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...page };
      } else {
        list.push(page);
      }
      localStorage.setItem(LOCAL_STORAGE_PAGES_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to sync page to local:', e);
    }
  }

  // Automatically update page counts on chapters in local storage (if DB trigger offline)
  private static async updateChapterPagesCount(chapterId: string) {
    if (typeof window === 'undefined') return;
    try {
      const savedPages = localStorage.getItem(LOCAL_STORAGE_PAGES_KEY);
      const pagesList: MateriPage[] = savedPages ? JSON.parse(savedPages) : [];
      const count = pagesList.filter((p) => p.chapter_id === chapterId).length;

      const savedChapters = localStorage.getItem(LOCAL_STORAGE_CHAPTERS_KEY);
      let chaptersList: MateriChapter[] = savedChapters ? JSON.parse(savedChapters) : [];
      
      const idx = chaptersList.findIndex((c) => c.id === chapterId);
      if (idx !== -1) {
        chaptersList[idx].total_pages = count;
        localStorage.setItem(LOCAL_STORAGE_CHAPTERS_KEY, JSON.stringify(chaptersList));
      }
    } catch (e) {
      console.warn('Failed to update chapter page count:', e);
    }
  }

  // Upload Asset (Image / GIF / Audio) to Supabase Storage Bucket 'materi_assets'
  static async uploadMateriAsset(file: File, folder: 'images' | 'audios' = 'images'): Promise<string> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase belum dikonfigurasi. Pastikan NEXT_PUBLIC_SUPABASE_URL & ANON_KEY sudah diset.');
    }

    const fileExt = file.name.split('.').pop() || 'bin';
    const cleanFileName = `${folder}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
    const bucketName = 'materi_assets';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(cleanFileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase Storage Upload Error:', error);
      throw new Error(`Gagal upload ke Supabase Storage: ${error.message}. Pastikan bucket '${bucketName}' sudah dibuat & diset Public!`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }
}
