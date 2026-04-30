# Plan 3: News UI + Monetization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual news list and detail pages with SSR, add Media.net ad banners, add Amazon Associates book recommendations, and add a Books tab to the existing training tool.

**Architecture:** Next.js SSR pages fetch articles from Supabase at request time. Language (EN/JP) is toggled client-side with `useState` — no URL change needed. Ads and Amazon cards are isolated React components. The Books tab in the training tool is a new `Mode` in the existing state machine.

**Tech Stack:** Next.js 15, Supabase JS client, React 19, Tailwind CSS v4

**Prerequisite:** Plan 1 and Plan 2 must be complete.

---

## Files Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `app/news/page.tsx` | News list (SSR) |
| Create | `app/news/[slug]/page.tsx` | Article detail (SSR) |
| Create | `components/news/ArticleCard.tsx` | Article card component |
| Create | `components/news/LangToggle.tsx` | EN/JP toggle button |
| Create | `components/news/CategoryFilter.tsx` | Category filter tabs |
| Create | `components/ads/MediaNetBanner.tsx` | Media.net ad banner |
| Create | `components/ads/AmazonCard.tsx` | Amazon affiliate card |
| Create | `components/ads/BookShelf.tsx` | Sidebar book list |
| Modify | `src/types.ts` | Add `'news'` and `'books'` to Mode type |
| Modify | `src/App.tsx` | Add news link and books mode rendering |
| Modify | `app/layout.tsx` | Add Media.net script tag |
| Modify | `app/sitemap.ts` | Add dynamic article URLs |

---

## Task 1: Add Navigation Link to News

**Files:**
- Modify: `src/types.ts`
- Modify: `src/App.tsx`

The news page lives at `/news` (a separate Next.js route), not a mode inside the SPA. We add an external link in the top nav. We also add a `'books'` mode to the SPA.

- [ ] **Step 1: Add `'books'` to `Mode` type in `src/types.ts`**

In `src/types.ts`, find the `Mode` type and add `'books'`:

```ts
export type Mode =
  | 'open'
  | 'vsOpen'
  | 'vs3Bet'
  | 'bbDefense'
  | 'sbVsBb'
  | 'villainType'
  | 'memo'
  | 'spotTest'
  | 'positionGuide'
  | 'postflopGuide'
  | 'glossary'
  | 'learningTracker'
  | 'aiReview'
  | 'practiceMode'
  | 'handHistoryAnalyzer'
  | 'gtoGuide'
  | 'books';
```

Also add to `MODE_LABELS`:

```ts
books: '📚 参考書籍',
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add books mode to Mode type"
```

---

## Task 2: Amazon Associates Card Component

**Files:**
- Create: `components/ads/AmazonCard.tsx`

Amazon Associate tag comes from env var `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`.

- [ ] **Step 1: Create `components/ads/AmazonCard.tsx`**

```tsx
interface Props {
  asin: string;
  title: string;
  author: string;
  imageUrl: string;
  price?: string;
}

export default function AmazonCard({ asin, title, author, imageUrl, price }: Props) {
  const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? '';
  const url = `https://www.amazon.co.jp/dp/${asin}?tag=${tag}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex gap-3 p-3 rounded-lg border border-gray-700/50 hover:border-yellow-500/40 transition-colors bg-gray-900/40"
    >
      <img
        src={imageUrl}
        alt={title}
        className="w-12 h-16 object-cover rounded flex-shrink-0"
      />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">{title}</p>
        <p className="text-[10px] text-gray-400">{author}</p>
        {price && (
          <p className="text-xs text-yellow-400 font-bold mt-auto">{price}</p>
        )}
        <span className="text-[9px] text-gray-500 mt-auto">Amazon.co.jp</span>
      </div>
    </a>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ads/AmazonCard.tsx
git commit -m "feat: add Amazon Associates card component"
```

---

## Task 3: BookShelf Component (Sidebar)

**Files:**
- Create: `components/ads/BookShelf.tsx`

This is the curated book list shown in the news sidebar. ASINs are hardcoded — update when adding more books. The associate tag is read at runtime.

- [ ] **Step 1: Create `components/ads/BookShelf.tsx`**

```tsx
import AmazonCard from './AmazonCard';

const BOOKS = [
  {
    asin: 'B01MQXK4QT',
    title: 'The Mathematics of Poker',
    author: 'Bill Chen, Jerrod Ankenman',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B01MQXK4QT.jpg',
    price: '¥2,800',
  },
  {
    asin: '4774188344',
    title: 'ポーカーで生計を立てる',
    author: 'Dusty Schmidt',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/4774188344.jpg',
    price: '¥1,980',
  },
  {
    asin: 'B00BKJJZPK',
    title: 'Applications of No-Limit Hold\'em',
    author: 'Matthew Janda',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B00BKJJZPK.jpg',
    price: '¥3,200',
  },
];

export default function BookShelf() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500/80">
        📚 おすすめ書籍
      </h3>
      {BOOKS.map((book) => (
        <AmazonCard key={book.asin} {...book} />
      ))}
      <p className="text-[9px] text-gray-600 text-center pt-1">
        Amazonアソシエイトプログラム参加中
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ads/BookShelf.tsx
git commit -m "feat: add BookShelf sidebar component with curated poker books"
```

---

## Task 4: Media.net Banner Component

**Files:**
- Create: `components/ads/MediaNetBanner.tsx`
- Modify: `app/layout.tsx`

Media.net requires a `<script>` tag in `<head>` plus a `<div>` per ad slot. The script tag and site ID are provided after Media.net approval. Use placeholder IDs until then.

- [ ] **Step 1: Create `components/ads/MediaNetBanner.tsx`**

```tsx
'use client';

interface Props {
  slotId: string;
  className?: string;
}

export default function MediaNetBanner({ slotId, className = '' }: Props) {
  // Media.net renders ads into this div by its ID
  return (
    <div
      id={slotId}
      className={`overflow-hidden ${className}`}
      aria-label="Advertisement"
    />
  );
}
```

- [ ] **Step 2: Add Media.net script to `app/layout.tsx`**

Add the `<Script>` import and the Media.net script. The `siteId` below is a placeholder — replace with your actual Media.net site ID after approval.

In `app/layout.tsx`, add `import Script from 'next/script';` and add the script before `{children}`:

```tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = { /* ... existing metadata ... */ };

const MEDIA_NET_SITE_ID = process.env.NEXT_PUBLIC_MEDIA_NET_SITE_ID ?? '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {MEDIA_NET_SITE_ID && (
          <Script
            id="media-net"
            strategy="afterInteractive"
            src={`//contextual.media.net/dmedianet.js?cid=${MEDIA_NET_SITE_ID}`}
          />
        )}
        {children}
      </body>
    </html>
  );
}
```

Add `NEXT_PUBLIC_MEDIA_NET_SITE_ID` to `.env.local` (leave empty until approved):
```
NEXT_PUBLIC_MEDIA_NET_SITE_ID=
```

- [ ] **Step 3: Commit**

```bash
git add components/ads/MediaNetBanner.tsx app/layout.tsx
git commit -m "feat: add media.net banner component and conditional script loader"
```

---

## Task 5: Language Toggle and Category Filter

**Files:**
- Create: `components/news/LangToggle.tsx`
- Create: `components/news/CategoryFilter.tsx`

- [ ] **Step 1: Create `components/news/LangToggle.tsx`**

```tsx
'use client';

interface Props {
  lang: 'ja' | 'en';
  onChange: (lang: 'ja' | 'en') => void;
}

export default function LangToggle({ lang, onChange }: Props) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-700/50 text-xs font-bold">
      <button
        onClick={() => onChange('ja')}
        className={`px-3 py-1.5 transition-colors ${
          lang === 'ja' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        🇯🇵 日本語
      </button>
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 transition-colors ${
          lang === 'en' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        🇺🇸 English
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/news/CategoryFilter.tsx`**

```tsx
'use client';

const CATEGORIES = [
  { value: 'all', label: 'すべて' },
  { value: 'tournament', label: 'トーナメント' },
  { value: 'general', label: 'ニュース' },
] as const;

type Category = (typeof CATEGORIES)[number]['value'];

interface Props {
  active: Category;
  onChange: (c: Category) => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            active === cat.value
              ? 'bg-yellow-500 text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/news/LangToggle.tsx components/news/CategoryFilter.tsx
git commit -m "feat: add language toggle and category filter components"
```

---

## Task 6: Article Card Component

**Files:**
- Create: `components/news/ArticleCard.tsx`

- [ ] **Step 1: Create `components/news/ArticleCard.tsx`**

```tsx
import type { Article } from '../../lib/supabase';
import Link from 'next/link';

interface Props {
  article: Article;
  lang: 'ja' | 'en';
}

function slugify(url: string): string {
  return encodeURIComponent(url);
}

const SOURCE_LABELS: Record<string, string> = {
  pokernews: 'PokerNews',
  cardplayer: 'Card Player',
  gpi: 'Global Poker Index',
};

export default function ArticleCard({ article, lang }: Props) {
  const title = lang === 'ja' ? article.title_ja : article.title_en;
  const summary = lang === 'ja' ? article.summary_ja : article.summary_en;
  const date = new Date(article.published_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Link
      href={`/news/${slugify(article.source_url)}`}
      className="group block rounded-xl overflow-hidden border border-gray-700/50 hover:border-yellow-500/40 transition-colors bg-gray-900/40"
    >
      {article.image_url && (
        <div className="aspect-video overflow-hidden bg-gray-800">
          <img
            src={article.image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="text-yellow-500/70 font-semibold">
            {SOURCE_LABELS[article.source] ?? article.source}
          </span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
          {title}
        </h3>
        {summary && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{summary}</p>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/news/ArticleCard.tsx
git commit -m "feat: add article card component with lang support"
```

---

## Task 7: News List Page (SSR)

**Files:**
- Create: `app/news/page.tsx`

This is a Server Component that fetches from Supabase. Client interactivity (lang toggle, category filter) is handled by a child `'use client'` wrapper.

- [ ] **Step 1: Create `app/news/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { supabase } from '../../lib/supabase';
import NewsListClient from './NewsListClient';

export const metadata: Metadata = {
  title: 'ポーカーニュース | RangePilot',
  description: '海外ポーカーニュースを毎日日本語に翻訳してお届け。トーナメント結果、戦略記事など。',
};

export const revalidate = 3600; // revalidate every hour

export default async function NewsPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(40);

  return <NewsListClient articles={articles ?? []} />;
}
```

- [ ] **Step 2: Create `app/news/NewsListClient.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { Article } from '../../lib/supabase';
import ArticleCard from '../../components/news/ArticleCard';
import LangToggle from '../../components/news/LangToggle';
import CategoryFilter from '../../components/news/CategoryFilter';
import BookShelf from '../../components/ads/BookShelf';
import MediaNetBanner from '../../components/ads/MediaNetBanner';

interface Props {
  articles: Article[];
}

export default function NewsListClient({ articles }: Props) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [category, setCategory] = useState<'all' | 'tournament' | 'general'>('all');

  const filtered = category === 'all'
    ? articles
    : articles.filter((a) => a.category === category);

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white mb-1">
            🃏 ポーカーニュース
          </h1>
          <p className="text-sm text-gray-400">海外の最新ポーカーニュースを毎朝更新</p>
        </div>

        {/* Ad banner */}
        <MediaNetBanner slotId="mn-banner-top" className="mb-4 min-h-[90px]" />

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <CategoryFilter active={category} onChange={setCategory} />
          <LangToggle lang={lang} onChange={setLang} />
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Articles grid */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">記事がありません</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((article, i) => (
                  <>
                    <ArticleCard key={article.id} article={article} lang={lang} />
                    {/* Insert ad every 6 articles */}
                    {(i + 1) % 6 === 0 && (
                      <div key={`ad-${i}`} className="sm:col-span-2">
                        <MediaNetBanner slotId={`mn-infeed-${i}`} className="min-h-[90px]" />
                      </div>
                    )}
                  </>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — hidden on mobile */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
            <BookShelf />
            <MediaNetBanner slotId="mn-sidebar" className="min-h-[250px]" />
          </aside>
        </div>

        {/* Back to app link */}
        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← トレーニングツールに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/news/page.tsx app/news/NewsListClient.tsx
git commit -m "feat: add news list page with SSR and client-side lang/category filtering"
```

---

## Task 8: Article Detail Page (SSR)

**Files:**
- Create: `app/news/[slug]/page.tsx`

- [ ] **Step 1: Create `app/news/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import ArticleDetailClient from './ArticleDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const url = decodeURIComponent(slug);
  const { data } = await supabase
    .from('articles')
    .select('title_ja, summary_ja')
    .eq('source_url', url)
    .single();

  if (!data) return { title: 'Article Not Found' };

  return {
    title: `${data.title_ja} | RangePilot`,
    description: data.summary_ja ?? undefined,
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const url = decodeURIComponent(slug);

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('source_url', url)
    .single();

  if (!article) notFound();

  return <ArticleDetailClient article={article} />;
}
```

- [ ] **Step 2: Create `app/news/[slug]/ArticleDetailClient.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { Article } from '../../../lib/supabase';
import LangToggle from '../../../components/news/LangToggle';
import MediaNetBanner from '../../../components/ads/MediaNetBanner';
import BookShelf from '../../../components/ads/BookShelf';
import Link from 'next/link';

interface Props {
  article: Article;
}

export default function ArticleDetailClient({ article }: Props) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  const title = lang === 'ja' ? article.title_ja : article.title_en;
  const summary = lang === 'ja' ? article.summary_ja : article.summary_en;
  const date = new Date(article.published_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <Link href="/news" className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4 block">
          ← ニュース一覧
        </Link>

        <div className="flex gap-6">
          {/* Article */}
          <article className="flex-1 min-w-0">
            {article.image_url && (
              <img
                src={article.image_url}
                alt={title}
                className="w-full aspect-video object-cover rounded-xl mb-4"
              />
            )}

            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="text-xs text-gray-500">{date}</div>
              <LangToggle lang={lang} onChange={setLang} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-4">
              {title}
            </h1>

            {summary && (
              <p className="text-sm text-gray-300 leading-relaxed mb-6 border-l-2 border-yellow-500/40 pl-4">
                {summary}
              </p>
            )}

            <MediaNetBanner slotId="mn-article-mid" className="my-6 min-h-[250px]" />

            {/* Link to original article */}
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white transition-colors border border-gray-700/50"
            >
              🔗 元記事を読む（英語）
            </a>

            <MediaNetBanner slotId="mn-article-bottom" className="mt-6 min-h-[90px]" />
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
            <BookShelf />
            <MediaNetBanner slotId="mn-detail-sidebar" className="min-h-[250px]" />
          </aside>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/news/[slug]/page.tsx app/news/[slug]/ArticleDetailClient.tsx
git commit -m "feat: add article detail page with SSR metadata and lang toggle"
```

---

## Task 9: Books Mode in Training Tool

**Files:**
- Create: `src/components/BooksView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/BooksView.tsx`**

```tsx
import AmazonCard from '../../components/ads/AmazonCard';

const BOOKS = [
  {
    asin: 'B01MQXK4QT',
    title: 'The Mathematics of Poker',
    author: 'Bill Chen, Jerrod Ankenman',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B01MQXK4QT.jpg',
    price: '¥2,800',
    tag: 'GTO理論の数学的基礎',
  },
  {
    asin: '4774188344',
    title: 'ポーカーで生計を立てる',
    author: 'Dusty Schmidt',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/4774188344.jpg',
    price: '¥1,980',
    tag: '日本語書籍',
  },
  {
    asin: 'B00BKJJZPK',
    title: 'Applications of No-Limit Hold\'em',
    author: 'Matthew Janda',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B00BKJJZPK.jpg',
    price: '¥3,200',
    tag: '6max NLH 上級者向け',
  },
  {
    asin: 'B07C4N4FSG',
    title: 'Poker\'s 1%: The One Big Secret That Keeps Elite Players on Top',
    author: 'Ed Miller',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B07C4N4FSG.jpg',
    price: '¥1,500',
    tag: '思考パターン改善',
  },
];

export default function BooksView() {
  return (
    <div
      className="w-full min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-black text-white mb-1">📚 参考書籍</h2>
        <p className="text-xs text-gray-400 mb-6">GTO学習におすすめの書籍</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BOOKS.map((book) => (
            <div key={book.asin}>
              <p className="text-[10px] text-yellow-500/70 font-semibold mb-1 uppercase tracking-wider">
                {book.tag}
              </p>
              <AmazonCard {...book} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-6">
          本サイトはAmazon.co.jpアソシエイトプログラムに参加しています。
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add BooksView to `src/App.tsx`**

In `src/App.tsx`:

1. Add import:
```tsx
import BooksView from './components/BooksView';
```

2. Add `'books'` to `UTILITY_MODES`:
```tsx
const UTILITY_MODES: Mode[] = ['villainType', 'memo', 'spotTest', 'practiceMode', 'positionGuide', 'postflopGuide', 'glossary', 'learningTracker', 'aiReview', 'handHistoryAnalyzer', 'gtoGuide', 'books'];
```

3. In the JSX render section, add the books case alongside the other utility mode renders. Find the block that renders `mode === 'gtoGuide'` and add after it:
```tsx
{mode === 'books' && <BooksView />}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BooksView.tsx src/App.tsx
git commit -m "feat: add books mode with amazon affiliate recommendations"
```

---

## Task 10: Update Sitemap with Dynamic Articles

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Update `app/sitemap.ts` to include article URLs**

```ts
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
```

- [ ] **Step 2: Update sitemap test to handle async Supabase call**

In `app/sitemap.test.ts`, mock Supabase:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

describe('sitemap', () => {
  it('includes the homepage', async () => {
    const { default: sitemap } = await import('./sitemap');
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/'))).toBe(true);
  });

  it('includes the news route', async () => {
    const { default: sitemap } = await import('./sitemap');
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/news'))).toBe(true);
  });

  it('all entries have lastModified', async () => {
    const { default: sitemap } = await import('./sitemap');
    const entries = await sitemap();
    entries.forEach((e) => {
      expect(e.lastModified).toBeDefined();
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit and push**

```bash
git add app/sitemap.ts app/sitemap.test.ts
git commit -m "feat: add dynamic article URLs to sitemap"
git push
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: zero errors.

- [ ] **Step 3: Verify news page in dev**

```bash
npm run dev
```

Open `http://localhost:3000/news`. With no articles in Supabase locally, should show "記事がありません".

- [ ] **Step 4: Add env vars to Vercel and push**

In Vercel, add:
```
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG = <your-associate-tag>
NEXT_PUBLIC_MEDIA_NET_SITE_ID   = (leave empty until approved)
```

- [ ] **Step 5: Verify production**

After deploy:
- `/news` renders the news list (with articles after first cron run)
- `/news/[slug]` renders article detail
- Books mode appears in training tool nav
- `/sitemap.xml` includes article URLs

---

## Post-Launch Checklist

- [ ] Submit site to **Google Search Console** and request sitemap indexing
- [ ] Submit site to **Google News Publisher Center** (requires NewsArticle JSON-LD — add if needed)
- [ ] Apply to **Media.net** at https://www.media.net/ once news content is populated
- [ ] Verify **Amazon Associates** links work with your associate tag

---

## Completion Criteria

- [ ] `npm test` passes all tests
- [ ] `npm run build` passes
- [ ] `/news` shows articles fetched by cron
- [ ] Language toggle switches between EN/JP content
- [ ] Category filter works
- [ ] Article detail page shows translated content
- [ ] Books mode shows in training tool with affiliate links
- [ ] Sitemap includes article URLs
