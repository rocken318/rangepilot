import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only client with elevated permissions (for cron writes)
export const supabaseAdmin = createClient(url, serviceKey ?? anonKey);

// Public client (for reads in SSR pages)
export const supabase = createClient(url, anonKey);

export type Article = {
  id: string;
  source_url: string;
  title_en: string;
  title_ja: string;
  summary_en: string | null;
  summary_ja: string | null;
  image_url: string | null;
  source: string;
  category: string;
  published_at: string;
  fetched_at: string;
};
