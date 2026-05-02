# ニュースページ リデザイン & コンテンツ強化

**日付:** 2026-05-02  
**対象:** `/news` 一覧ページ、`/news/[slug]` 詳細ページ、cron パイプライン

---

## 概要

現状のニュースページは「要約2〜3文 + 元記事リンク」のみで、ニュースサイトとして成立していない。ユーザーが読む価値を感じられるよう、コンテンツ量とUIの両軸を改善する。

---

## 1. コンテンツパイプライン改善

### 現状
- RSS フィードから `title` + `description`（2〜3文）を取得
- DeepL → OpenAI で日本語化（要約のみ）
- DB に `summary_ja`（短文）のみ保存

### 改善
cron 実行時（`/api/cron/fetch-news`）に以下を追加：

1. **元URL をスクレイピング**  
   新規記事の `source_url` に対して `fetch()` で HTML 取得。  
   `<article>` / `<main>` タグから本文テキストを抽出（最大3000文字）。  
   取得失敗・タイムアウト（5秒）の場合は RSS summary にフォールバック。

2. **GPT-4o-mini で日本語記事生成**  
   英語本文 → 以下の構成で日本語記事を生成（400〜600字）：
   - **ポイントまとめ**（箇条書き3行）: `points_ja` カラムに保存
   - **本文**（自然な日本語、引用があれば含める）: `body_ja` カラムに保存
   
3. **Supabase スキーマ追加**  
   `articles` テーブルに2カラム追加：
   - `body_ja TEXT` — AI生成の日本語本文（400〜600字）
   - `points_ja TEXT[]` — ポイントまとめ（3項目の配列）

### スクレイピング方針
- `fetch()` で HTML 取得 → `<article>`, `<main>`, `.entry-content`, `.post-content` 順に探索
- タグを除去してプレーンテキスト化
- 広告・ナビゲーション等の短いブロックは除外（200文字未満のブロックをスキップ）
- Cloudflare 等でブロックされた場合は RSS summary で代替（エラーを throw しない）

---

## 2. ニュース一覧ページ（`/news`）

### レイアウト: マガジン型
- **ヒーロー記事**（最新1件）: 横幅フル、大きな画像オーバーレイ、タイトル・要約表示
- **3カラムグリッド**（2〜4件目）: サムネイル + カテゴリバッジ + タイトル
- **2カラム横並び**（5件目以降）: 小サムネイル左 + タイトル右

### ヘッダー
- サイトロゴ `♠ RANGEPILOT | POKER NEWS`（ゴールドアクセント）
- カテゴリフィルター: すべて / トーナメント / 戦略
- 「毎朝更新」バッジ

### 画像フォールバック
- RSS の `image_url` を優先使用
- `image_url` が null の場合、カテゴリ別の Unsplash 固定URL を使用：
  - `tournament`: `https://images.unsplash.com/photo-1541278107931-e006523892df?w=800&q=80`
  - `strategy`: `https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&q=80`
  - `general`: `https://images.unsplash.com/photo-1596731498067-2e1bc3b9a1cf?w=800&q=80`

### カード
- 角丸8px、ダークボーダー（`#1e2d3a`）、ホバー時ゴールドボーダー
- カテゴリバッジ（黄背景・黒文字）、ソース名、相対時間（「2時間前」）
- タイトル2行クランプ

---

## 3. 記事詳細ページ（`/news/[slug]`）

### レイアウト: 2カラム（本文 + サイドバー）

**本文エリア:**
- パンくず: `← ニュース一覧`
- カテゴリバッジ + 日付 + 読了時間（`body_ja` の文字数から計算、約400字/分）
- `<h1>` タイトル（大きく、太字）
- ヒーロー画像（aspect-video、border-radius）
- **ポイントまとめボックス**（黄ボーダー左、`points_ja` の3項目を箇条書き）— `body_ja` がある場合のみ表示
- **日本語本文**（`body_ja`）— `body_ja` がない場合は `summary_ja` を表示
- 元記事リンク（控えめなスタイル、右下）

**サイドバー（lg以上で表示）:**
- 関連記事3件（同カテゴリ、最新順）
- RangePilotトレーニングへの導線カード（ゴールドアクセント）

### lang トグル
- 英語/日本語切り替えは維持（`title_en` / `title_ja`、`body_ja` / 本文なし時はリンクのみ）

---

## 4. `lib/supabase.ts` の型更新

`Article` 型に追加：
```typescript
body_ja: string | null;
points_ja: string[] | null;
```

---

## 5. 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `lib/summarize.ts` | `body_ja`, `points_ja` を生成するよう拡張 |
| `lib/rss.ts` | `scrapeArticleBody(url)` 関数を追加 |
| `app/api/cron/fetch-news/route.ts` | スクレイピング → AI生成フローを追加 |
| `app/news/NewsListClient.tsx` | マガジン型レイアウトに全面改修 |
| `components/news/ArticleCard.tsx` | ヒーロー・グリッド・横並び3バリアントに対応 |
| `app/news/[slug]/ArticleDetailClient.tsx` | ポイントまとめ + 本文 + 関連記事サイドバー |
| `lib/supabase.ts` | `Article` 型に `body_ja`, `points_ja` を追加 |

---

## 6. Supabase マイグレーション

```sql
ALTER TABLE articles ADD COLUMN body_ja TEXT;
ALTER TABLE articles ADD COLUMN points_ja TEXT[];
```

---

## 制約・注意事項

- スクレイピングは Vercel Function のタイムアウト（10秒）内に収める。記事1件あたり最大5秒でタイムアウト。
- Upswing Poker など一部サイトは JS レンダリングが必要な場合があるが、Playwright 等は使わない。取得できなければ RSS summary にフォールバック。
- 既存記事（`body_ja` が null）は次回 cron 実行時に上書きしない（新規のみ対象）。
- `points_ja` は TEXT[] として保存。表示時は配列の各要素を `<li>` で表示。
