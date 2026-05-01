import type { MetadataRoute } from 'next';
import { supabase } from '../lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rangepilot.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: articles } = await supabase
    .from('articles')
    .select('source_url, published_at')
    .order('published_at', { ascending: false })
    .limit(200);

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${BASE_URL}/news/${encodeURIComponent(a.source_url)}`,
    lastModified: new Date(a.published_at),
    changeFrequency: 'never' as const,
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...articleEntries,
  ];
}
