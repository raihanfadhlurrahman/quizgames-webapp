import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not configured for server admin API.');
}

const serverSupabase = () => createClient(SUPABASE_URL || '', SERVICE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!SERVICE_KEY || !SUPABASE_URL) return res.status(500).json({ error: 'Server not configured' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = serverSupabase();

  try {
    // Verify the user token and check role
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData || !userData.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = userData.user;
    const role = (user.user_metadata as any)?.role || (user.app_metadata as any)?.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' });
    }

    const method = req.method;
    if (method === 'POST') {
      const question = req.body?.question;
      if (!question) return res.status(400).json({ error: 'Missing question payload' });

      const payload = {
        category_id: question.category_id || null,
        category_name: question.category_name || 'Campuran',
        game_type: question.game_type || 'millionaire',
        difficulty: question.difficulty || 'medium',
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_option: question.correct_option,
        explanation: question.explanation || '',
        dalil: question.dalil || '',
        ustadz_hint: question.ustadz_hint || '',
      };

      const { data, error } = await supabase.from('questions').insert([payload]).select().single();
      if (error) return res.status(500).json({ error });
      return res.status(200).json({ data });
    }

    if (method === 'PUT') {
      const id = req.body?.id;
      const updates = req.body?.updates;
      if (!id || !updates) return res.status(400).json({ error: 'Missing id or updates' });

      const { data, error } = await supabase.from('questions').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error });
      return res.status(200).json({ data });
    }

    if (method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: 'Missing id query' });

      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) return res.status(500).json({ error });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('Admin questions API error:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}
