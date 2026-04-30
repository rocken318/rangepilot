# Plan 2: News Pipeline (Supabase + Vercel Cron + DeepL)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated daily pipeline that fetches international poker news via RSS, translates EN→JP with DeepL, and stores articles in Supabase. No UI — this plan ends with data flowing into the database.

**Architecture:** A Vercel Cron Job fires daily at 09:00 JST, calling `/api/cron/fetch-news`. The handler fetches RSS from PokerNews.com, deduplicates via `source_url`, translates new articles with DeepL Free API, and upserts into Supabase. Supabase is accessed via the JS client using a service role key (server-only).

**Tech Stack:** Next.js 15 Route Handler, Supabase JS client, DeepL Free API, fast-xml-parser (RSS parsing), Vitest

**Prerequisite:** Plan 1 must be complete (Next.js migration).

---

## Files Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `lib/supabase.ts` | Supabase client (server-side) |
| Create | `lib/deepl.ts` | DeepL translation utility |
| Create | `lib/rss.ts` | RSS fetch + parse utility |
| Create | `app/api/cron/fetch-news/route.ts` | Vercel Cron endpoint |
| Create | `vercel.json` | Cron schedule config |
| Create | `lib/deepl.test.ts` | DeepL utility test |
| Create | `lib/rss.test.ts` | RSS parser test |
| Create | `app/api/cron/fetch-news/route.test.ts` | Cron handler test |

---

## Task 1: Supabase Project Setup

This is a manual step — no code yet.

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New Project. Note the project URL and keys.

- [ ] **Step 2: Create the articles table**

In Supabase SQL Editor, run:

```sql
CREATE TABLE articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url   text UNIQUE NOT NULL,
  title_en     text NOT NULL,
  title_ja     text NOT NULL,
  summary_en   text,
  summary_ja   text,
  image_url    text,
  source       text NOT NULL,
  category     text NOT NULL DEFAULT 'general',
  published_at timestamptz NOT NULL,
  fetched_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX articles_published_at_idx ON articles (published_at DESC);
CREATE INDEX articles_category_idx ON articles (category);
```

- [ ] **Step 3: Add environment variables to Vercel**

In Vercel → Environment Variables, add:
```
NEXT_PUBLIC_SUPABASE_URL     = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY    = eyJ...
DEEPL_API_KEY                = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx
CRON_SECRET                  = <random 32-char string, generate with: openssl rand -hex 16>
```

Also add to `.env.local`.

- [ ] **Step 4: Install Supabase client and RSS parser**

```bash
npm install @supabase/supabase-js fast-xml-parser
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install supabase and rss parser deps"
```

---

## Task 2: Supabase Client

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create `lib/supabase.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add supabase client with admin and public instances"
```

---

## Task 3: DeepL Translation Utility

**Files:**
- Create: `lib/deepl.ts`
- Create: `lib/deepl.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/deepl.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

describe('translateToJapanese', () => {
  it('returns translated text from DeepL API response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        translations: [{ text: 'ポーカーニュース' }],
      }),
    }) as unknown as typeof fetch;

    const { translateToJapanese } = await import('./deepl');
    const result = await translateToJapanese('Poker News');
    expect(result).toBe('ポーカーニュース');
  });

  it('returns original text when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    const { translateToJapanese } = await import('./deepl');
    const result = await translateToJapanese('Fallback text');
    expect(result).toBe('Fallback text');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test lib/deepl.test.ts
```

Expected: FAIL — `Cannot find module './deepl'`

- [ ] **Step 3: Create `lib/deepl.ts`**

```ts
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export async function translateToJapanese(text: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return text;

  try {
    const res = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: 'JA',
        source_lang: 'EN',
      }),
    });

    if (!res.ok) return text;

    const data = await res.json() as { translations: { text: string }[] };
    return data.translations[0]?.text ?? text;
  } catch {
    return text;
  }
}

export async function translateBatch(texts: string[]): Promise<string[]> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return texts;

  try {
    const res = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: 'JA',
        source_lang: 'EN',
      }),
    });

    if (!res.ok) return texts;

    const data = await res.json() as { translations: { text: string }[] };
    return data.translations.map((t, i) => t.text ?? texts[i]);
  } catch {
    return texts;
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test lib/deepl.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/deepl.ts lib/deepl.test.ts
git commit -m "feat: add deepl translation utility with batch support"
```

---

## Task 4: RSS Fetch Utility

**Files:**
- Create: `lib/rss.ts`
- Create: `lib/rss.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/rss.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PokerNews</title>
    <item>
      <title>Big Tournament Results</title>
      <link>https://pokernews.com/news/2026/04/results.htm</link>
      <description>Player wins $1M in latest event.</description>
      <pubDate>Wed, 30 Apr 2026 09:00:00 GMT</pubDate>
      <enclosure url="https://example.com/img.jpg" type="image/jpeg"/>
    </item>
  </channel>
</rss>`;

describe('fetchRssArticles', () => {
  it('parses RSS feed into RawArticle array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_RSS,
    }) as unknown as typeof fetch;

    const { fetchRssArticles } = await import('./rss');
    const articles = await fetchRssArticles('https://pokernews.com/rss', 'pokernews', 'tournament');

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Big Tournament Results');
    expect(articles[0].url).toBe('https://pokernews.com/news/2026/04/results.htm');
    expect(articles[0].source).toBe('pokernews');
    expect(articles[0].category).toBe('tournament');
  });

  it('returns empty array on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const { fetchRssArticles } = await import('./rss');
    const articles = await fetchRssArticles('https://pokernews.com/rss', 'pokernews', 'general');
    expect(articles).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test lib/rss.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create `lib/rss.ts`**

```ts
import { XMLParser } from 'fast-xml-parser';

export type RawArticle = {
  title: string;
  url: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: Date;
  source: string;
  category: string;
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

export async function fetchRssArticles(
  feedUrl: string,
  source: string,
  category: string
): Promise<RawArticle[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'RangePilot/1.0 (poker news aggregator)' },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml) as {
      rss?: { channel?: { item?: unknown[] | unknown } };
    };

    const rawItems = parsed.rss?.channel?.item;
    if (!rawItems) return [];

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const enclosure = i['enclosure'] as Record<string, string> | undefined;
      return {
        title: String(i['title'] ?? ''),
        url: String(i['link'] ?? ''),
        summary: String(i['description'] ?? ''),
        imageUrl: enclosure?.['@_url'] ?? null,
        publishedAt: new Date(String(i['pubDate'] ?? Date.now())),
        source,
        category,
      };
    }).filter((a) => a.url && a.title);
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test lib/rss.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/rss.ts lib/rss.test.ts
git commit -m "feat: add rss fetch and parse utility"
```

---

## Task 5: Cron Endpoint

**Files:**
- Create: `app/api/cron/fetch-news/route.ts`
- Create: `app/api/cron/fetch-news/route.test.ts`

The RSS sources to poll:
- `https://www.pokernews.com/rss/news.xml` → source: `pokernews`, category: `general`
- `https://www.pokernews.com/rss/tours.xml` → source: `pokernews`, category: `tournament`
- `https://www.cardplayer.com/rss/news` → source: `cardplayer`, category: `general`

- [ ] **Step 1: Write failing test**

Create `app/api/cron/fetch-news/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

beforeEach(() => {
  vi.resetModules();
  process.env.CRON_SECRET = 'test-secret';
});

describe('GET /api/cron/fetch-news', () => {
  it('returns 401 when authorization header is missing', async () => {
    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/cron/fetch-news');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when wrong secret is provided', async () => {
    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/cron/fetch-news', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test app/api/cron/fetch-news/route.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create `app/api/cron/fetch-news/route.ts`**

```ts
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
  // Vercel Cron authenticates with CRON_SECRET
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

      // Check which URLs already exist
      const urls = articles.map((a) => a.url);
      const { data: existing } = await supabaseAdmin
        .from('articles')
        .select('source_url')
        .in('source_url', urls);

      const existingUrls = new Set((existing ?? []).map((e: { source_url: string }) => e.source_url));
      const newArticles = articles.filter((a) => !existingUrls.has(a.url));
      if (newArticles.length === 0) continue;

      // Translate titles and summaries in batch
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
        errors.push(`${feed.source}: ${error.message}`);
      } else {
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
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test app/api/cron/fetch-news/route.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/fetch-news/route.ts app/api/cron/fetch-news/route.test.ts
git commit -m "feat: add daily news cron endpoint with dedup and translation"
```

---

## Task 6: vercel.json Cron Schedule

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-news",
      "schedule": "0 0 * * *"
    }
  ]
}
```

`0 0 * * *` = midnight UTC = 09:00 JST.

- [ ] **Step 2: Commit and push**

```bash
git add vercel.json
git commit -m "feat: add vercel cron for daily news fetch at 09:00 JST"
git push
```

---

## Task 7: Verify Pipeline End-to-End

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass (7+ tests across sitemap, deepl, rss, cron).

- [ ] **Step 2: Trigger cron manually in production**

After deploy, call the endpoint manually to test:

```bash
curl -X GET https://<domain>/api/cron/fetch-news \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Expected response:
```json
{ "inserted": 5 }
```

- [ ] **Step 3: Verify articles in Supabase**

In Supabase Table Editor → `articles` table. Should see rows with `title_ja` populated.

- [ ] **Step 4: Commit**

No code changes expected. If any fixes were needed, commit them:

```bash
git add -A
git commit -m "fix: pipeline verification fixes"
git push
```

---

## Completion Criteria

- [ ] `npm test` passes all tests
- [ ] Manual cron trigger inserts articles into Supabase
- [ ] `title_ja` and `summary_ja` are populated via DeepL
- [ ] Re-running the cron does NOT create duplicate articles
- [ ] Vercel deployment shows cron job in Functions dashboard
