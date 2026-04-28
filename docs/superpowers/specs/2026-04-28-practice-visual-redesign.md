# Practice Mode Visual Redesign — Design Spec

**日付：** 2026-04-28  
**対象：** `src/components/PracticeModeView.tsx` のビジュアルリニューアル  
**参照元：** `Y:\texasholdem` のカード・テーブルUI

---

## 1. 目的

現在の練習モードは「テキストと白いボックス」だけで地味。texasholdemのカジノ調UIアセットを流用して、本物のポーカーゲームのような没入感あるビジュアルに刷新する。

---

## 2. 変更範囲

### 2-1. アセットコピー
- `Y:\texasholdem\public\cards\svg-cards.svg` → `Y:\THマトリックス\public\cards\svg-cards.svg`
- SVGスプライト。ID形式: `#spade_1`（A♠）、`#heart_queen`（Q♥）、`#back`（裏面）

### 2-2. 新規コンポーネント: `src/components/PokerCard.tsx`
texasholdemの `Card.tsx` を参考に、RangePilot向けに単純化した版を作成。

**Props:**
```typescript
interface PokerCardProps {
  rank: string;  // 'A' | 'K' | 'Q' | 'J' | 'T' | '9' ... '2'
  suit: 'S' | 'H' | 'D' | 'C';  // Spade/Heart/Diamond/Club
  size?: 'sm' | 'md' | 'lg';
}
```

**SVG ID 変換マップ:**
| ランク表記 | SVG ID |
|-----------|--------|
| A | `1` |
| T | `10` |
| J | `jack` |
| Q | `queen` |
| K | `king` |
| 2-9 | そのまま |

スートID: `S→spade`, `H→heart`, `D→diamond`, `C→club`

例: `<use href="/cards/svg-cards.svg#spade_queen" />`

**ビジュアルエフェクト（texasholdemから流用）:**
- スーツ別グロー: 赤スート(H/D) → `drop-shadow(0 0 8px rgba(255,60,60,0.8))` / 黒スート(S/C) → `drop-shadow(0 0 8px rgba(80,120,255,0.8))`
- シャドウ: `shadow-[0_4px_20px_rgba(0,0,0,0.7)]`
- 白ボーダー: `2.5px solid rgba(255,255,255,0.9)`
- 角丸: `rounded-[6px]`

**ハンド表記→カード変換:**
| ハンド | カード1 | カード2 |
|-------|--------|--------|
| `AQs` (スーテッド) | A♠ (S) | Q♠ (S) |
| `AQo` (オフスート) | A♠ (S) | Q♦ (D) |
| `99` (ペア) | 9♠ (S) | 9♥ (H) |

→ `handToCards(hand: string): [{ rank, suit }, { rank, suit }]` 関数を作成

### 2-3. `PracticeModeView.tsx` のリニューアル

#### テーブルエリア
カード表示エリアに緑のフェルト背景を適用:
```
background: radial-gradient(ellipse at center, #1a5c2a 0%, #0f4420 50%, #0a3018 100%)
```
+ subtle texture filter（SVGフィルターまたはCSS）
角丸 `rounded-2xl`、パディング、内側の光沢リング

#### ポジション表示
楕円形テーブルレイアウト（今の横1列バッジから変更）:
- 6席を楕円上に配置（CSS position: absolute + 計算座標）
- Hero席: エメラルドグリーン強調 + "YOU" ラベル
- オープナー席: オレンジ + "Raise" ラベル
- 他席: 暗いグレー

楕円配置の計算:
```
angle = (seatIndex / 6) * 2π + π (下から始める)
x = cx + rx * cos(angle)
y = cy + ry * sin(angle)
```
テーブルコンテナ内で `position: relative`, 各席は `position: absolute`

#### アクションボタン（texasholdemのActionBarスタイル流用）
```css
Fold: bg-gradient-to-b from-red-700 to-red-900, border-red-600/50
Call: bg-gradient-to-b from-sky-500 to-sky-700, border-sky-400/40
Raise: bg-gradient-to-b from-amber-400 to-amber-600, border-amber-300/60
3Bet: bg-gradient-to-b from-rose-600 to-rose-800, border-rose-600/40
4Bet: bg-gradient-to-b from-purple-600 to-purple-800, border-purple-600/40
Fold: bg-gradient-to-b from-gray-600 to-gray-800, border-gray-500/40
```
ホバー/アクティブ: `active:scale-[0.97]`、選択時: `ring-2`

#### スコアHUD
カジノHUD風（暗い背景 + 金文字）:
- 背景: `bg-gray-900/90 border-yellow-600/30 border`
- スコア: `text-yellow-400 font-bold font-mono`
- 連続正解: チップアイコン風バッジ（🪙 N連続）

#### 結果フィードバック
カードエリア（テーブル背景部分）のグロー:
- 正解: `shadow-[0_0_30px_rgba(74,222,128,0.4)]` (緑グロー)
- 不正解: `shadow-[0_0_30px_rgba(239,68,68,0.4)]` (赤グロー)
- 許容範囲: `shadow-[0_0_30px_rgba(251,191,36,0.4)]` (金グロー)

---

## 3. 変更ファイル一覧

| ファイル | 種別 |
|---------|------|
| `public/cards/svg-cards.svg` | 新規（texasholdemからコピー） |
| `src/components/PokerCard.tsx` | 新規 |
| `src/components/PracticeModeView.tsx` | 全面リニューアル |

---

## 4. 制約

- `npm run build` が通る状態を維持
- TypeScriptエラーなし
- 既存機能（SpotTest/解析モード等）に影響なし
- スマホでも崩れないレスポンシブ対応
- texasholdemの `cn` ユーティリティは使わない（独自Tailwind直書き）
