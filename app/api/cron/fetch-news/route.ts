import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchRssArticles, scrapeArticleBody } from '../../../../lib/rss';
import { summarizeBatch, generateArticle } from '../../../../lib/summarize';
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

      // Step 1: title_ja + summary_ja (batch)
      const inputs = newArticles.map((a) => ({ title: a.title, summary: a.summary || a.title }));
      const translated = await summarizeBatch(inputs);

      // Step 2: scrape + generate body_ja + points_ja (per article, sequential to avoid rate limits)
      const rows = [];
      for (let i = 0; i < newArticles.length; i++) {
        const a = newArticles[i];
        const t = translated[i];

        const bodyEn = await scrapeArticleBody(a.url);
        const sourceText = bodyEn || a.summary || a.title;
        const { body_ja, points_ja } = await generateArticle(a.title, sourceText);

        rows.push({
          source_url: a.url,
          title_en: a.title,
          title_ja: t?.title_ja ?? a.title,
          summary_en: a.summary || null,
          summary_ja: t?.summary_ja ?? null,
          image_url: a.imageUrl,
          source: a.source,
          category: a.category,
          published_at: a.publishedAt.toISOString(),
          body_ja: body_ja || null,
          points_ja: points_ja.length > 0 ? points_ja : null,
        });
      }

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
