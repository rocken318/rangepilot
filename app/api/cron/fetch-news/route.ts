import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchRssArticles } from '../../../../lib/rss';
import { summarizeBatch } from '../../../../lib/summarize';
import { supabaseAdmin } from '../../../../lib/supabase';

const RSS_SOURCES = [
  { url: 'https://upswingpoker.com/feed', source: 'upswingpoker', category: 'strategy' },
  { url: 'https://www.worldpokertour.com/news/feed/', source: 'wpt', category: 'tournament' },
  { url: 'https://www.pokerstrategy.com/feed/', source: 'pokerstrategy', category: 'strategy' },
] as const;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let totalInserted = 0;
  const errors: string[] = [];

  for (const feed of RSS_SOURCES) {
    try {
      const articles = await fetchRssArticles(feed.url, feed.source, feed.category);
      if (articles.length === 0) continue;

      const urls = articles.map((a) => a.url);
      const { data: existing } = await supabaseAdmin
        .from('articles')
        .select('source_url')
        .in('source_url', urls);

      const existingUrls = new Set((existing ?? []).map((e: { source_url: string }) => e.source_url));
      const newArticles = articles.filter((a) => !existingUrls.has(a.url));
      console.log(`[${feed.source}] fetched=${articles.length} new=${newArticles.length}`);
      if (newArticles.length === 0) continue;

      const inputs = newArticles.map((a) => ({ title: a.title, summary: a.summary || a.title }));
      const translated = await summarizeBatch(inputs);

      const rows = newArticles.map((a, i) => ({
        source_url: a.url,
        title_en: a.title,
        title_ja: translated[i]?.title_ja ?? a.title,
        summary_en: a.summary || null,
        summary_ja: translated[i]?.summary_ja ?? null,
        image_url: a.imageUrl,
        source: a.source,
        category: a.category,
        published_at: a.publishedAt.toISOString(),
      }));

      const { error } = await supabaseAdmin.from('articles').insert(rows);
      if (error) {
        console.error(`INSERT ERROR [${feed.source}]:`, JSON.stringify(error));
        errors.push(`${feed.source}: ${error.message}`);
      } else {
        console.log(`INSERT OK [${feed.source}]: ${rows.length} rows`);
        totalInserted += rows.length;
      }
    } catch (err) {
      errors.push(`${feed.source}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  if (totalInserted > 0) {
    revalidatePath('/news');
  }

  return NextResponse.json({
    inserted: totalInserted,
    errors: errors.length > 0 ? errors : undefined,
  });
}
