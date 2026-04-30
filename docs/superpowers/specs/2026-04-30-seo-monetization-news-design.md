# RangePilot: SEO・マネタイズ・ニュースセクション 設計書

**日付:** 2026-04-30  
**ステータス:** 承認済み  

---

## 概要

RangePilot（ポーカーGTOトレーニングSPA）に以下の3つを追加する：

1. **SEO基盤整備** — meta/OGP/sitemap/構造化データ
2. **マネタイズ** — Media.net広告 + Amazon アソシエイト
3. **ポーカーニュースセクション** — 毎日自動更新・日英バイリンガル

トラフィック増加とサイト収益化が目的。

---

## Phase 1: アーキテクチャ移行（Vite → Next.js 14）

### 理由

現在のVite + React SPAではニュースコンテンツのSEOが機能しない（クローラーがJSを実行できない）。Next.js App RouterのSSRによりニュース記事が検索エンジンに正しくインデックスされる。

### ディレクトリ構成

```
rangepilot/
├── app/
│   ├── layout.tsx            ← グローバルメタデータ・広告スクリプト
│   ├── page.tsx              ← 既存トレーニングツール（App.tsxをそのまま移植）
│   ├── news/
│   │   ├── page.tsx          ← ニュース一覧（SSR）
│   │   └── [slug]/
│   │       └── page.tsx      ← 記事詳細（SSR）
│   └── api/
│       └── cron/
│           └── fetch-news/
│               └── route.ts  ← Vercel Cron エンドポイント
├── components/               ← 既存コンポーネントそのまま流用
├── lib/
│   ├── supabase.ts           ← Supabaseクライアント
│   └── deepl.ts              ← DeepL翻訳ユーティリティ
├── public/
│   └── robots.txt
└── vercel.json               ← Cron設定
```

### 移行方針

- 既存の全Reactコンポーネントはそのまま使用（変更不要）
- `App.tsx` を `app/page.tsx` にラップするだけ
- Vercelデプロイ設定は変更なし

---

## Phase 2: SEO実装

### グローバルメタデータ（app/layout.tsx）

```tsx
export const metadata = {
  title: 'RangePilot | ポーカーGTOレンジ練習ツール',
  description: 'GTOポーカーのプリフロップレンジを練習・学習できる無料ツール。オープン・3ベット・BBディフェンスなど全シナリオ対応。最新のポーカーニュースも毎日更新。',
  openGraph: {
    title: 'RangePilot',
    description: 'GTOポーカー練習ツール＋毎日更新のポーカーニュース',
    locale: 'ja_JP',
    alternateLocale: 'en_US',
  },
}
```

### 対応リスト

| 対応項目 | 実装方法 |
|---------|---------|
| `lang="ja"` + `hreflang` | `app/layout.tsx` の `<html lang="ja">` + head hreflang |
| sitemap.xml | `app/sitemap.ts` でNext.js自動生成（ニュース記事含む） |
| robots.txt | `public/robots.txt` |
| JSON-LD構造化データ | ニュース記事詳細に `NewsArticle` スキーマ → Googleニュース申請対象 |
| OGP画像 | `public/og-image.png` を用意、記事ごとにサムネイル画像をOGPに使用 |

### Googleニュース登録

構造化データ（NewsArticle）が実装されたら Google News Publisher Center に申請。承認されるとトラフィックが大幅増加する可能性あり。

---

## Phase 3: マネタイズ

### Media.net（Yahoo/Bingネットワーク）

AdSenseはポーカーコンテンツを「ギャンブル関連」として審査落ちするリスクが高いため、Media.netを採用。

**広告配置：**

| 場所 | フォーマット | サイズ |
|-----|------------|-------|
| ニュース一覧ヘッダー下 | バナー | 728×90 |
| ニュース一覧記事3件ごと | インフィード | 自動 |
| ニュースサイドバー | スクエア | 300×250 |
| 記事詳細本文中盤 | レクタングル | 300×250 |
| 記事詳細末尾 | バナー | 728×90 |
| **トレーニングツール** | **広告なし** | UX優先 |

トレーニングツール側は広告を一切表示しない。ニュースセクションで収益化し、コアツールのUXを維持する。

**前提条件:** Media.net は事前審査制。https://www.media.net/ から申請し、承認後にスクリプトタグが発行される。審査期間は通常1〜3営業日。ポーカー学習コンテンツは承認されやすいが保証はない。代替として Ezoic も検討可。

### Amazon アソシエイト（Amazon.co.jp）

**配置場所：**
- ニュース記事サイドバー「📚 おすすめ書籍」
- トレーニングツールに「参考書籍」モード（`books`）を追加 — 既存の `Mode` 型に追加し、Controls.tsx のナビに項目を追加する

**想定商品：**
- GTO関連書籍（The Mathematics of Poker、Poker's 1% 等）
- チップセット・トランプ
- ポーカーテーブル・アクセサリー

アフィリエイトリンクは `<AmazonCard>` コンポーネントとして実装し、再利用可能にする。

**前提条件:** Amazon アソシエイト（Amazon.co.jp）のアカウント申請が必要。未登録の場合は https://affiliate.amazon.co.jp/ から申請。承認までに数日かかる場合あり。

---

## Phase 4: ニュースパイプライン

### 自動更新フロー

```
毎朝9:00 JST
    ↓
Vercel Cron → /api/cron/fetch-news
    ↓
RSS フェッチ
  - pokernews.com/rss
  - pokerstrategist.com/rss（またはGPI）
  - 他1〜2ソース
    ↓
Supabase で source_url による重複チェック
    ↓
新規記事のみ DeepL API で EN→JP 翻訳
  （タイトル + 要約 + 本文）
    ↓
Supabase articles テーブルに保存
    ↓
Next.js SSR が自動反映（ビルド不要）
```

### Supabase スキーマ

```sql
CREATE TABLE articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url   text UNIQUE NOT NULL,
  title_en     text NOT NULL,
  title_ja     text NOT NULL,
  summary_en   text,
  summary_ja   text,
  image_url    text,
  source       text NOT NULL,   -- 'pokernews', 'gpi' 等
  category     text,            -- 'tournament', 'strategy', 'live-reporting'
  published_at timestamptz NOT NULL,
  fetched_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON articles (published_at DESC);
CREATE INDEX ON articles (category);
```

### コスト試算

| サービス | 月額 |
|---------|------|
| Supabase | ¥0（無料枠 500MB DB） |
| DeepL API | ¥0（無料枠 50万文字/月）※記事10本/日で余裕 |
| Vercel Cron | ¥0（無料枠内） |
| **合計** | **¥0** |

### vercel.json（Cron設定）

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

---

## Phase 5: UIデザイン

### デザイン方針

既存のダーク・カジノ風デザイン（ `#0d1620` 背景、ゴールドアクセント）を踏襲し、ニュースセクションも同系統のトーンで統一。

### ニュース一覧ページ レイアウト

```
┌─────────────────────────────────────────┐
│  RangePilot  [練習] [ガイド] [ニュース]  │
├─────────────────────────────────────────┤
│  ████████████ 広告バナー（728×90） █████ │
├──────────────────────────┬──────────────┤
│ [全て] [トーナメント]     │ 📚 おすすめ  │
│ [ストラテジー]  [EN/JP]  │   書籍       │
│                           │ （Amazon）   │
│  記事カード × 2列グリッド │ ──────────  │
│  （サムネイル＋タイトル   │ [広告 300×250│
│   ＋要約＋ソース＋日付）  │  Media.net] │
│                           │              │
│  ── インフィード広告 ──   │              │
│  記事カード × 2列 ...     │              │
└──────────────────────────┴──────────────┘
```

### 記事詳細ページ レイアウト

```
タイトル（選択言語）
ソース名・公開日時
[🇯🇵 日本語 / 🇺🇸 English] 切替ボタン
─────────────────────────────
本文（選択言語）
─────────────────────────────
[広告 Media.net 300×250]
─────────────────────────────
関連記事（同カテゴリ 3件）
元記事リンク → source_url
```

---

## 実装順序

1. Next.js 移行（既存機能を維持したまま）
2. SEO基盤（metadata, sitemap, robots.txt, JSON-LD）
3. Supabase セットアップ＋スキーマ作成
4. Cron パイプライン（RSS fetch → DeepL → Supabase）
5. ニュース一覧・詳細ページUI
6. Media.net 広告コンポーネント
7. Amazon アソシエイト コンポーネント
8. Google News Publisher Center 申請

---

## 環境変数（追加が必要なもの）

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPL_API_KEY=
CRON_SECRET=           # Cronエンドポイントの不正アクセス防止
AMAZON_ASSOCIATE_TAG=  # アソシエイトID
```
