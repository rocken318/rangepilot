import { NextRequest, NextResponse } from 'next/server';
import { fetchRssArticles } from '../../../../lib/rss';
import { translateBatch } from '../../../../lib/deepl';
import { supabaseAdmin } from '../../../../lib/supabase';

const RSS_SOURCES = [
  { url: 'https://www.pokernews.com/rss/news.xml', source: 'pokernews', category: 'general' },
  { url: 'https://www.pokernews.com/rss/tours.xml', source: 'pokernews', category: 'tournament' },
  { url: 'https://www.cardplayer.com/rss/news', source: 'cardplayer', category: 'general' },
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

      const titlesToTranslate = newArticles.map((a) => a.title);
      const summariesToTranslate = newArticles.map((a) => a.summary || a.title);

      const [titlesJa, summariesJa] = await Promise.all([
        translateBatch(titlesToTranslate),
        translateBatch(summariesToTranslate),
      ]);

      const rows = newArticles.map((a, i) => ({
        source_url: a.url,
        title_en: a.title,
        title_ja: titlesJa[i],
        summary_en: a.summary || null,
        summary_ja: summariesJa[i] || null,
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

  return NextResponse.json({
    inserted: totalInserted,
    errors: errors.length > 0 ? errors : undefined,
  });
}
