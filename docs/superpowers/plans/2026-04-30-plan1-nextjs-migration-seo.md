# Plan 1: Next.js Migration + SEO Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate existing Vite+React SPA to Next.js 15 with SSR support, and add SEO fundamentals (metadata, sitemap, robots.txt, OGP).

**Architecture:** The existing React components stay unchanged. `src/App.tsx` becomes a `'use client'` component rendered from `app/page.tsx`. News pages added later will use SSR. The existing Vercel API route (`api/analyze-hand.ts`) is rewritten as a Next.js Route Handler.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), TypeScript, Vitest

---

## Files Map

| Action | Path | Purpose |
|--------|------|---------|
| Delete | `index.html` | Replaced by Next.js |
| Delete | `vite.config.ts` | Replaced by Next.js |
| Delete | `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Replaced by Next.js tsconfig |
| Delete | `api/analyze-hand.ts` | Migrated to Route Handler |
| Create | `next.config.ts` | Next.js config |
| Create | `postcss.config.mjs` | Tailwind v4 for Next.js |
| Create | `tsconfig.json` | New Next.js-compatible tsconfig |
| Create | `app/layout.tsx` | Global layout + metadata + OGP |
| Create | `app/page.tsx` | Renders existing App |
| Create | `app/globals.css` | Moved from `src/index.css` |
| Create | `app/api/analyze-hand/route.ts` | Migrated API route |
| Create | `public/robots.txt` | SEO: allow all |
| Create | `app/sitemap.ts` | Auto-generated sitemap |
| Create | `vitest.config.ts` | Test config |
| Create | `app/sitemap.test.ts` | Sitemap unit test |
| Modify | `src/App.tsx` | Add `'use client'` |
| Modify | `package.json` | Replace vite with next, add vitest |

---

## Task 1: Install Next.js, Remove Vite

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Next.js 15 and test deps**

```bash
npm install next@15
npm install --save-dev vitest @vitest/ui @testing-library/react jsdom
npm uninstall vite @tailwindcss/vite eslint-plugin-react-refresh
npm install --save-dev @tailwindcss/postcss postcss
```

Note: `@vitejs/plugin-react` は **残す**（`vitest.config.ts` で使用）。

- [ ] **Step 2: Update scripts in package.json**

Replace the entire `"scripts"` block in `package.json` with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:ui": "vitest --ui"
},
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: migrate from vite to next.js 15"
```

---

## Task 2: Next.js and TypeScript Config

**Files:**
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tsconfig.json` (replace all 3 old ones)
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 2: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

- [ ] **Step 3: Delete old tsconfig files and create new `tsconfig.json`**

```bash
rm tsconfig.app.json tsconfig.node.json
```

Then create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
```

- [ ] **Step 5: Delete old config files**

```bash
rm index.html vite.config.ts eslint.config.js
```

- [ ] **Step 6: Commit**

```bash
git add next.config.ts postcss.config.mjs tsconfig.json vitest.config.ts
git rm index.html vite.config.ts tsconfig.app.json tsconfig.node.json eslint.config.js
git commit -m "chore: add next.js and vitest config, remove vite config"
```

---

## Task 3: Create App Directory and Globals

**Files:**
- Create: `app/globals.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `app/globals.css`**

Copy from `src/index.css` but replace `#root` with `main`:

```css
@import "tailwindcss";

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #0f1117;
  color: #e5e7eb;
  min-height: 100vh;
}
```

- [ ] **Step 2: Add `'use client'` to `src/App.tsx`**

Add as the very first line of `src/App.tsx`:

```ts
'use client';
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css src/App.tsx
git commit -m "feat: add next.js app globals and mark App as client component"
```

---

## Task 4: Create app/layout.tsx with SEO Metadata

**Files:**
- Create: `app/layout.tsx`

- [ ] **Step 1: Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RangePilot | ポーカーGTOレンジ練習ツール',
    template: '%s | RangePilot',
  },
  description:
    'GTOポーカーのプリフロップレンジを練習・学習できる無料ツール。オープン・3ベット・BBディフェンスなど全シナリオ対応。最新のポーカーニュースも毎日更新。',
  keywords: ['ポーカー', 'GTO', 'レンジ', '練習', 'プリフロップ', 'poker', 'range', 'training'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    alternateLocale: ['en_US'],
    title: 'RangePilot | ポーカーGTOレンジ練習ツール',
    description: 'GTOポーカー練習ツール＋毎日更新のポーカーニュース',
    siteName: 'RangePilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RangePilot | ポーカーGTOレンジ練習ツール',
    description: 'GTOポーカー練習ツール＋毎日更新のポーカーニュース',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add next.js root layout with SEO metadata and OGP"
```

---

## Task 5: Create app/page.tsx

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Write failing test for page rendering**

Create `app/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';

describe('page module', () => {
  it('exports a default function', async () => {
    const mod = await import('./page');
    expect(typeof mod.default).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 3: Create `app/page.tsx`**

```tsx
import App from '../src/App';

export default function Page() {
  return <App />;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/page.test.tsx
git commit -m "feat: add next.js page wrapping existing App component"
```

---

## Task 6: Migrate API Route

**Files:**
- Create: `app/api/analyze-hand/route.ts`
- Delete: `api/analyze-hand.ts`

The existing `api/analyze-hand.ts` uses Vercel-specific `VercelRequest/VercelResponse`. Next.js Route Handlers use `NextRequest/NextResponse`.

- [ ] **Step 1: Create `app/api/analyze-hand/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `あなたは6max NLHキャッシュゲームのポーカー学習コーチです。
目的はユーザーの上達支援であり、実戦中のリアルタイム意思決定支援ではありません。
回答はプレイ後レビューとして行ってください。
ユーザーが今すぐ押すべきボタンを指示するのではなく、ハンド終了後の分析として説明してください。
初心者にも分かる日本語で、短く具体的に答えてください。
GTO理論をベースにしつつ、相手スタッツに応じたエクスプロイトも説明してください。
特に以下を重視してください：
- プリフロップ判断
- 3BETへの対応
- AJo/KQoなど支配されやすいハンドの扱い
- 弱いワンペアで粘りすぎないこと
- 魚相手にはブラフを減らしてバリューを増やすこと
- リバーの大きいベットへの対応
- 相手のスタッツからのタイプ分類

出力は必ず以下のJSON形式で返してください：
{
  "summary": "結論を1〜2文",
  "goodPoints": ["良かった点1", "良かった点2"],
  "mistakes": ["ミスの可能性1", "ミスの可能性2"],
  "nextRules": ["次回のルール1", "次回のルール2"],
  "opponentNote": "相手メモ用の短文",
  "tags": ["タグ1", "タグ2"],
  "severity": "low | medium | high"
}`;

function buildUserPrompt(body: Record<string, unknown>): string {
  const o = (body.opponent ?? {}) as Record<string, string>;
  return `以下のハンドをプレイ後レビューしてください。

【自分のハンド】${body.heroHand ?? ''}
【自分のポジション】${body.heroPosition ?? ''}
【ブラインド】${body.blinds ?? ''}
【有効スタック】${body.effectiveStack ?? ''}
【プリフロップ】${body.preflopAction ?? ''}
【フロップ】${body.flopAction ?? ''}
【ターン】${body.turnAction ?? ''}
【リバー】${body.riverAction ?? ''}
【相手】${o.name ?? ''}
【相手スタッツ】VPIP:${o.vpip ?? ''} PFR:${o.pfr ?? ''} 3BET:${o.threeBet ?? ''} FoldTo3B:${o.foldToThreeBet ?? ''} CBet:${o.cbet ?? ''} FoldToCB:${o.foldToCbet ?? ''} Steal:${o.steal ?? ''} CR:${o.checkRaise ?? ''} WTSD:${o.wtsd ?? ''} WSD:${o.wsd ?? ''}
【自分の判断】${body.heroDecision ?? ''}
【結果】${body.result ?? ''}
【自由メモ】${body.memo ?? ''}`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.heroHand) {
    return NextResponse.json({ error: 'heroHand is required' }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty response from OpenAI' }, { status: 502, headers: CORS_HEADERS });
    }

    const parsed = JSON.parse(content);
    const result = {
      summary: parsed.summary ?? '',
      goodPoints: Array.isArray(parsed.goodPoints) ? parsed.goodPoints : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      nextRules: Array.isArray(parsed.nextRules) ? parsed.nextRules : [],
      opponentNote: parsed.opponentNote ?? '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      severity: ['low', 'medium', 'high'].includes(parsed.severity) ? parsed.severity : 'medium',
    };

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `AI analysis failed: ${message}` },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
```

- [ ] **Step 2: Remove old API file**

```bash
git rm api/analyze-hand.ts
```

Also check if `@vercel/node` is still needed — if not, uninstall it:

```bash
npm ls @vercel/node 2>/dev/null && npm uninstall @vercel/node || true
```

- [ ] **Step 3: Commit**

```bash
git add app/api/analyze-hand/route.ts
git commit -m "feat: migrate analyze-hand to next.js route handler"
```

---

## Task 7: Verify Build and Fix Any Issues

**Files:**
- Modify: any files with SSR-incompatible imports (fix as found)

Next.js SSR will crash on browser-only globals (`localStorage`, `window`, etc.) used at module level. All such usage in this codebase is inside React event handlers or effects — confirm this during the build.

- [ ] **Step 1: Run dev server and check for errors**

```bash
npm run dev
```

Open `http://localhost:3000`. The existing training tool should render exactly as before.

- [ ] **Step 2: Fix any `localStorage` or `window` issues**

If any error like `localStorage is not defined` appears, the fix is to guard with `typeof window !== 'undefined'` at the call site. Expected location: `src/data/learningTracker.ts`.

Check `learningTracker.ts` — if it accesses `localStorage` at module level (outside a function), wrap it:

```ts
// Before (if at module level):
const raw = localStorage.getItem('...');

// After:
const raw = typeof window !== 'undefined' ? localStorage.getItem('...') : null;
```

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected output: build succeeds with no TypeScript errors.

- [ ] **Step 4: Delete old entry point**

```bash
git rm src/main.tsx
```

- [ ] **Step 5: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve any SSR-incompatible code after next.js migration"
```

---

## Task 8: robots.txt

**Files:**
- Create: `public/robots.txt`

- [ ] **Step 1: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://rangepilot.vercel.app/sitemap.xml
```

Replace `rangepilot.vercel.app` with the actual Vercel domain (check `.vercel/project.json` for `name`, then URL is `<name>.vercel.app`).

- [ ] **Step 2: Commit**

```bash
git add public/robots.txt
git commit -m "feat: add robots.txt allowing all crawlers"
```

---

## Task 9: Sitemap

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/sitemap.test.ts`

- [ ] **Step 1: Write failing test**

Create `app/sitemap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('includes the homepage', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/'))).toBe(true);
  });

  it('includes the news route', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/news'))).toBe(true);
  });

  it('all entries have lastModified', async () => {
    const entries = await sitemap();
    entries.forEach((e) => {
      expect(e.lastModified).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './sitemap'`

- [ ] **Step 3: Create `app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rangepilot.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
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
  ];
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts app/sitemap.test.ts
git commit -m "feat: add sitemap with homepage and news routes"
```

---

## Task 10: Add NEXT_PUBLIC_BASE_URL to Vercel

The sitemap and other SEO features need the production URL.

- [ ] **Step 1: Add env var in Vercel dashboard**

Go to Vercel → Project Settings → Environment Variables.
Add:
```
NEXT_PUBLIC_BASE_URL = https://<your-actual-domain>.vercel.app
```

- [ ] **Step 2: Add to local .env.local for development**

Create `.env.local` (already in .gitignore):

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
OPENAI_API_KEY=<your key>
```

- [ ] **Step 3: Commit robots.txt update with correct domain**

Update `public/robots.txt` if needed with the real domain, then:

```bash
git add public/robots.txt
git commit -m "fix: update robots.txt with production domain"
```

---

## Task 11: Push and Verify Production

- [ ] **Step 1: Push to main**

```bash
git push
```

- [ ] **Step 2: Verify Vercel deployment succeeds**

Check Vercel dashboard — build should succeed. If it fails, check build logs for any SSR issues not caught locally.

- [ ] **Step 3: Verify SEO tags in production**

Open production URL in browser, right-click → View Source.
Confirm:
- `<html lang="ja">` is present
- `<title>RangePilot | ポーカーGTOレンジ練習ツール</title>` is in `<head>`
- `<meta name="description" ...>` is present
- `<meta property="og:title" ...>` is present

- [ ] **Step 4: Verify sitemap**

Open `https://<domain>/sitemap.xml` — should return XML with homepage and `/news`.

- [ ] **Step 5: Verify robots.txt**

Open `https://<domain>/robots.txt` — should show the allow-all rule.

---

## Completion Criteria

- [ ] `npm run build` passes with zero errors
- [ ] `npm test` passes (3 tests)
- [ ] Production URL renders identical to previous Vite build
- [ ] `/sitemap.xml` returns valid XML
- [ ] `/robots.txt` is accessible
- [ ] View Source shows metadata tags in `<head>`
- [ ] `/api/analyze-hand` POST still works (test via AIReviewView in the app)
