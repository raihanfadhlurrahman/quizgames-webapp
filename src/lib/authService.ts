import { supabase, isSupabaseConfigured } from './supabaseClient';

export class AuthService {
  // Helper to validate and generate email from username
  static sanitizeUsername(username: string): string {
    const clean = username.trim().toLowerCase();
    // Allow only alphanumeric, dots, underscores, dashes
    if (!/^[a-z0-9._-]+$/.test(clean)) {
      throw new Error('Username hanya boleh berisi huruf, angka, titik (.), underscore (_), atau strip (-).');
    }
    return clean;
  }

  static getEmailFromUsername(username: string): string {
    const cleanUsername = this.sanitizeUsername(username);
    return `${cleanUsername}@gmail.com`;
  }

  // Register Player/Admin
  static async signUpWithUsername(username: string, name: string, password?: string, role: 'player' | 'admin' = 'player'): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase belum terkonfigurasi.');
    }

    if (!username || username.trim().length < 3) {
      throw new Error('Username minimal harus 3 karakter.');
    }

    if (!name || name.trim().length < 2) {
      throw new Error('Nama minimal harus 2 karakter.');
    }

    if (!password || password.length < 6) {
      throw new Error('Kata sandi (password) minimal harus 6 karakter.');
    }

    const email = this.getEmailFromUsername(username);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          role,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  // Sign In Player/Admin
  static async signInWithUsername(username: string, password?: string): Promise<any> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase belum terkonfigurasi.');
    }

    if (!username) {
      throw new Error('Username wajib diisi.');
    }

    if (!password) {
      throw new Error('Kata sandi (password) wajib diisi.');
    }

    const email = this.getEmailFromUsername(username);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  // Log Out
  static async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
  }

  // Get active session
  static async getCurrentSession(): Promise<any> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
    return null;
  }

  // Listen to auth changes
  static onAuthStateChange(callback: (event: any, session: any) => void): (() => void) | null {
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
      return () => {
        subscription.unsubscribe();
      };
    }
    return null;
  }
}
