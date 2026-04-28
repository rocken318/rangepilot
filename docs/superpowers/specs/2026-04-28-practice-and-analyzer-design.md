# RangePilot 追加機能設計書
## 練習モード + ハンド履歴解析モード

**日付：** 2026-04-28  
**対象リポジトリ：** rocken318/rangepilot  
**ベースアーキテクチャ：** Vite + React 19 + TypeScript + Tailwind CSS v4  

---

## 1. スコープ

### 今回実装する機能
1. **練習モード** (`practiceMode`) — GTO Wizard トレーナー風のインタラクティブ練習
2. **ハンド履歴解析モード** (`handHistoryAnalyzer`) — テキスト/ファイル貼り付け→プリフロップ判断解析

### 今回のスコープ外（将来追加）
- Supabase統合（クラウド学習データ保存）
- AI対戦モード（texasholdemゲームエンジン統合）

---

## 2. 練習モード（`practiceMode`）

### 目的
ゲームっぽいUIで楽しくプリフロップ判断を学べるインタラクティブな練習画面。既存SpotTestViewより視覚的・ゲーム的。

### UI構成

```
┌─────────────────────────────────────┐
│ [スコア: 7] [ストリーク: 🔥3]  Q.12  │  ← ヘッダー
├─────────────────────────────────────┤
│                                     │
│  [UTG] [HJ▲] [CO] [BTN★] [SB] [BB] │  ← ポジションバッジ（Heroハイライト）
│                                     │
│         ┌──────┐ ┌──────┐          │
│         │  A♠  │ │  Q♦  │          │  ← ハンドカード（大きめ）
│         └──────┘ └──────┘          │
│                                     │
│  HJが3bbでオープン。あなたはBTN。    │  ← 状況テキスト
│  どうする？                         │
│                                     │
│  [Raise] [Call] [3Bet] [Fold]       │  ← アクションボタン
│                                     │
├─────────────────────────────────────┤
│ ✅ 正解: 3Bet or Call               │  ← 解説エリア（選択後に展開）
│ 評価: 許容範囲                      │
│ AQoはBTNから3betも有力。...         │
│                                     │
│ [🤖 AIに詳しく聞く]  [次の問題→]   │
└─────────────────────────────────────┘
```

### フロー
1. 問題をランダム表示（既存 `spots.ts` から取得）
2. ユーザーがアクションボタンを選択
3. 即座に静的解説を展開表示（`handExplanations.ts` + spots の explanation フィールド活用）
4. 「AIに詳しく聞く」ボタン → OpenAI API で動的解説を生成（AIReviewView と同パターン）
5. 「次の問題」で次へ、スコア・ストリークを更新

### ゲーム要素
- スコア（正解数）
- 連続正解ストリーク（🔥アイコン）
- 問題番号表示
- 正解時：緑ハイライト演出
- 不正解時：赤ハイライト + 正解表示

### SafeMode 連動
- SafeMode ON の場合、解説コメントに安全寄りの補足を付加
- 例：「3betも候補だが、初中級者はコールでOK」

### データソース
- 問題：既存 `src/data/spots.ts`（100問以上）
- 静的解説：`src/data/handExplanations.ts` + spots の explanation
- AI解説：OpenAI API（`api/analyze-hand.ts` パターン流用）

### 新規ファイル
- `src/components/PracticeModeView.tsx`

---

## 3. ハンド履歴解析モード（`handHistoryAnalyzer`）

### 目的
ユーザーが実際にプレイしたハンドヒストリーを貼り付け or ファイル読み込みして、RangePilotの既存レンジデータ・SafeModeルールでプリフロップ判断を添削する。

### UI構成

```
┌─────────────────────────────────────┐
│ ハンド履歴解析                       │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ここにハンドヒストリーを貼り付け  │ │  ← テキストエリア（大）
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│ [📁 .txtファイルを読み込む]          │
│ [📋 サンプルを読み込む]              │
│ [🔍 解析する]                        │
├─────────────────────────────────────┤
│ 解析結果                             │
│ ┌─────────────────────────────────┐ │
│ │ ハンド: AQo      Hero: BTN      │ │
│ │ スポット: BTN vs HJ Open        │ │
│ │ 実際のアクション: Call           │ │
│ │ 推奨アクション: 3bet or Call    │ │
│ │ 評価: [許容範囲]                 │ │
│ │ コメント: AQoはBTNから...       │ │
│ │ SafeMode: コールで十分。...     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### パーサー仕様（`handHistoryParser.ts`）

入力テキスト例：
```
PokerStars Hand #123456789
Hero is BTN
Dealt to Hero [As Qd]
UTG folds
HJ raises to 3bb
CO folds
Hero calls
SB folds
BB folds
```

出力型：
```typescript
interface ParsedHand {
  heroPosition: Position;           // "BTN"
  heroHand: string;                 // "AQo"
  heroAction: HeroAction;           // "call"
  spotType: SpotType;               // "vsOpen" | "open" | "vs3Bet" | "unknown"
  openerPosition: Position | null;  // "HJ"
  threeBetPosition: Position | null;
  actions: ActionEntry[];
}
```

ハンド正規化：
- `[As Qd]` → `AQo`
- `[As Qs]` → `AQs`
- `[9h 9d]` → `99`
- `[Tc Jc]` → `JTs`（ランク順：A K Q J T 9 8 7 6 5 4 3 2）

### 解析ロジック（`handAnalysis.ts`）

1. 既存 `ranges.ts` のデータでハンドを評価（優先）
2. レンジデータに該当なければ簡易フォールバックロジック
3. 評価ラベル：**良い判断 / 許容範囲 / 注意 / ミス寄り / 判定不能**

フォールバック基準：
- AA/KK/QQ/JJ/AKs/AKo → 強い
- TT/99/AQs/AQo/AJs/KQs → 中〜強
- 弱いオフスートA・低Kx・低Qx・低コネクター → フォールド寄り
- BTN/CO → 広め、UTG/HJ → 狭め、BB → コールレンジ広め、SB → 慎重

SafeMode 連動：
- SafeMode ON の場合コメントに「初中級者はコール/フォールド寄りでよい」補足を追加

### 評価バッジ
| 英語 | 日本語 | 色 |
|------|--------|-----|
| Good | 良い判断 | 緑 |
| OK | 許容範囲 | 青 |
| Caution | 注意 | 黄 |
| Mistake | ミス寄り | 赤 |
| Unknown | 判定不能 | グレー |

### 新規ファイル
- `src/components/HandHistoryAnalyzer.tsx`
- `src/utils/handHistoryParser.ts`
- `src/utils/handAnalysis.ts`
- `src/types/handHistory.ts`

---

## 4. 全体アーキテクチャ

### 型拡張（`src/types.ts`）
```typescript
type Mode = 
  // 既存5レンジモード
  | 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense' | 'sbVsBb'
  // 既存ユーティリティモード
  | 'villainType' | 'memo' | 'spotTest' | 'positionGuide'
  | 'postflopGuide' | 'glossary' | 'learningTracker' | 'aiReview'
  // 新規追加
  | 'practiceMode'        // 練習モード
  | 'handHistoryAnalyzer' // ハンド履歴解析
```

### 変更ファイル
- `src/App.tsx` — 2モードの条件レンダリング追加
- `src/components/Controls.tsx` — ユーティリティタブに2ボタン追加

### データフロー
```
src/data/ranges.ts ──→ src/utils/handAnalysis.ts ──→ HandHistoryAnalyzer
                                                  └──→ PracticeModeView
src/data/spots.ts  ──→ PracticeModeView
App.tsx (safeMode) ──→ props として両コンポーネントへ
OpenAI API         ──→ PracticeModeView（「AIに詳しく聞く」）
```

---

## 5. 品質制約

- `npm run build` が通る状態を維持
- TypeScript エラーなし（strict モード対応）
- 既存機能・UI を壊さない
- スマホ対応（Tailwind レスポンシブ）
- 既存のダークテーマ・Tailwind スタイルに合わせる
- SafeMode は両モードで連動

---

## 6. 実装順序

1. 型定義（`handHistory.ts`、`types.ts` 拡張）
2. ユーティリティ（`handHistoryParser.ts`、`handAnalysis.ts`）
3. `HandHistoryAnalyzer.tsx` コンポーネント
4. `PracticeModeView.tsx` コンポーネント
5. `Controls.tsx` にタブ追加
6. `App.tsx` に条件レンダリング追加
7. `npm run build` で確認
