import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rangepilot.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: { source_url: string; published_at: string }[] | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { supabase } = await import('../lib/supabase');
      const result = await supabase
        .from('articles')
        .select('source_url, published_at')
        .order('published_at', { ascending: false })
        .limit(200);
      articles = result.data;
    } catch {
      // Supabase unavailable — skip article entries
    }
  }

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
