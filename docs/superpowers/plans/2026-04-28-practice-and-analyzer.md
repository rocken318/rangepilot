# Practice Mode + Hand History Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visual Practice Mode (GTO Wizard-style trainer with static + AI explanations) and a Hand History Analyzer mode (paste/upload hand history → preflop analysis using existing range data) to RangePilot.

**Architecture:** Two new utility modes (`practiceMode`, `handHistoryAnalyzer`) added to the existing Mode union type. New components receive `safeMode` as a prop and follow existing Tailwind dark-theme patterns. Utility functions in `src/utils/` keep business logic separate from UI. Both modes are wired into `Controls.tsx` (new utility buttons) and `App.tsx` (conditional rendering).

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite. No new dependencies. AI calls reuse existing `/api/analyze-hand` Vercel endpoint (OpenAI).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/types.ts` | Modify | Add `practiceMode`, `handHistoryAnalyzer` to `Mode` type and `MODE_LABELS` |
| `src/types/handHistory.ts` | Create | Type definitions for parsed hand history and analysis result |
| `src/utils/handHistoryParser.ts` | Create | Parse raw hand history text → `ParsedHand` |
| `src/utils/handAnalysis.ts` | Create | Evaluate `ParsedHand` using range data → `HandAnalysisResult` |
| `src/components/HandHistoryAnalyzer.tsx` | Create | UI: textarea/file upload → result card |
| `src/components/PracticeModeView.tsx` | Create | UI: position badges + hand cards + action buttons + explanation |
| `src/components/Controls.tsx` | Modify | Add two new entries to `UTILITY_MODES` array |
| `src/App.tsx` | Modify | Import + render two new components |

---

## Task 1: Extend Type Definitions

**Files:**
- Modify: `src/types.ts`
- Create: `src/types/handHistory.ts`

- [ ] **Step 1: Add new modes to `src/types.ts`**

Open `src/types.ts`. Make these three edits:

**Edit 1 — Mode type** (add two lines after `'aiReview'`):
```typescript
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
  | 'handHistoryAnalyzer';
```

**Edit 2 — MODE_LABELS** (add two entries at the end of the object):
```typescript
export const MODE_LABELS: Record<Mode, string> = {
  open: 'オープンレンジ',
  vsOpen: 'vs オープンレイズ',
  vs3Bet: 'vs 3ベット',
  bbDefense: 'BBディフェンス',
  sbVsBb: 'SB vs BB',
  villainType: '相手タイプ別調整',
  memo: 'メモ',
  spotTest: 'スポットテスト',
  positionGuide: 'ポジション別ガイド',
  postflopGuide: 'ポストフロップ基礎',
  glossary: '用語集',
  learningTracker: '学習トラッカー',
  aiReview: 'AIレビュー',
  practiceMode: '練習',
  handHistoryAnalyzer: 'ハンド履歴解析',
};
```

- [ ] **Step 2: Create `src/types/handHistory.ts`**

```typescript
import type { Position } from '../types';

export type { Position };

export type HeroAction = 'raise' | 'call' | '3bet' | '4bet' | 'fold' | 'check' | 'unknown';

export type SpotType = 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense' | 'sbVsBb' | 'unknown';

export type EvaluationLabel = 'Good' | 'OK' | 'Caution' | 'Mistake' | 'Unknown';

export interface ActionEntry {
  position: Position;
  action: string;
  amount?: string;
}

export interface ParsedHand {
  heroPosition: Position | null;
  heroHand: string | null;
  heroAction: HeroAction;
  spotType: SpotType;
  openerPosition: Position | null;
  threeBetPosition: Position | null;
  actions: ActionEntry[];
}

export interface HandAnalysisResult {
  heroPosition: Position;
  heroHand: string;
  spotType: SpotType;
  heroAction: HeroAction;
  recommendedAction: string;
  evaluation: EvaluationLabel;
  evaluationJa: string;
  comment: string;
  safeModeComment: string;
  openerPosition: Position | null;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd "Y:/THマトリックス" && npx tsc --noEmit`

Expected: No errors from the new types. (Existing errors for missing components are OK at this stage.)

- [ ] **Step 4: Commit**

```bash
cd "Y:/THマトリックス"
git add src/types.ts src/types/handHistory.ts
git commit -m "feat: add practiceMode and handHistoryAnalyzer to Mode type"
```

---

## Task 2: Hand History Parser

**Files:**
- Create: `src/utils/handHistoryParser.ts`

- [ ] **Step 1: Create `src/utils/handHistoryParser.ts`**

```typescript
import type { ParsedHand, HeroAction, SpotType, ActionEntry } from '../types/handHistory';
import type { Position } from '../types';

const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const VALID_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

function getRank(card: string): string {
  const r = card[0].toUpperCase();
  // Handle '10' as 'T'
  return r === '1' ? 'T' : r;
}

function getSuit(card: string): string {
  return card[card.length - 1].toLowerCase();
}

/** Normalizes two card strings (e.g. "As", "Qd") into hand notation (e.g. "AQo") */
export function normalizeHand(card1: string, card2: string): string {
  const r1 = getRank(card1);
  const r2 = getRank(card2);
  const s1 = getSuit(card1);
  const s2 = getSuit(card2);

  const idx1 = RANK_ORDER.indexOf(r1 as typeof RANK_ORDER[number]);
  const idx2 = RANK_ORDER.indexOf(r2 as typeof RANK_ORDER[number]);

  let highRank: string, lowRank: string, highSuit: string, lowSuit: string;
  if (idx1 <= idx2) {
    highRank = r1; lowRank = r2; highSuit = s1; lowSuit = s2;
  } else {
    highRank = r2; lowRank = r1; highSuit = s2; lowSuit = s1;
  }

  if (highRank === lowRank) return `${highRank}${lowRank}`;
  return `${highRank}${lowRank}${highSuit === lowSuit ? 's' : 'o'}`;
}

/** Parse raw hand history text into a structured ParsedHand object */
export function parseHandHistory(text: string): ParsedHand {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let heroPosition: Position | null = null;
  let heroHand: string | null = null;
  let heroAction: HeroAction = 'unknown';
  const actions: ActionEntry[] = [];

  for (const line of lines) {
    // "Hero is BTN" or "HERO IS BTN" (case-insensitive)
    const heroPosMatch = line.match(/\bHero\s+is\s+(UTG|HJ|CO|BTN|SB|BB)\b/i);
    if (heroPosMatch) {
      heroPosition = heroPosMatch[1].toUpperCase() as Position;
    }

    // "Dealt to Hero [As Qd]"
    const handMatch = line.match(/Dealt\s+to\s+Hero\s+\[([2-9TtJjQqKkAa]+[shdc])\s+([2-9TtJjQqKkAa]+[shdc])\]/i);
    if (handMatch) {
      heroHand = normalizeHand(handMatch[1], handMatch[2]);
    }

    // Actions: "HJ raises to 3bb" / "UTG folds" / "Hero calls" / "CO 3-bets to 9bb"
    const actionMatch = line.match(
      /\b(UTG|HJ|CO|BTN|SB|BB|Hero)\s+(raises?|calls?|folds?|checks?|3[\s-]?bets?|4[\s-]?bets?)\b(?:\s+to\s+(\S+))?/i
    );
    if (actionMatch) {
      const actorRaw = actionMatch[1].toUpperCase();
      const pos: Position | null =
        actorRaw === 'HERO' ? heroPosition : (VALID_POSITIONS.includes(actorRaw as Position) ? actorRaw as Position : null);
      if (!pos) continue;

      const verb = actionMatch[2].toLowerCase().replace(/[\s-]/g, '');
      let normalizedAction: string;
      if (verb.startsWith('raise')) normalizedAction = 'raise';
      else if (verb.startsWith('call')) normalizedAction = 'call';
      else if (verb.startsWith('fold')) normalizedAction = 'fold';
      else if (verb.startsWith('check')) normalizedAction = 'check';
      else if (verb.startsWith('3')) normalizedAction = '3bet';
      else if (verb.startsWith('4')) normalizedAction = '4bet';
      else normalizedAction = verb;

      const entry: ActionEntry = { position: pos, action: normalizedAction };
      if (actionMatch[3]) entry.amount = actionMatch[3];
      actions.push(entry);

      if (actorRaw === 'HERO') {
        heroAction = normalizedAction as HeroAction;
      }
    }
  }

  // Determine spot type and key positions
  let spotType: SpotType = 'unknown';
  let openerPosition: Position | null = null;
  let threeBetPosition: Position | null = null;

  const firstRaise = actions.find(a => a.action === 'raise');
  const first3Bet = actions.find(a => a.action === '3bet');

  if (firstRaise) {
    if (firstRaise.position === heroPosition) {
      spotType = 'open';
    } else {
      openerPosition = firstRaise.position;
      if (first3Bet) {
        threeBetPosition = first3Bet.position;
        if (first3Bet.position === heroPosition) {
          // Hero 3bet — handled as vsOpen for analysis (hero was the 3bettor)
          spotType = 'vsOpen';
        } else {
          // Someone else 3bet against hero's open
          spotType = 'vs3Bet';
        }
      } else if (heroPosition === 'BB') {
        spotType = 'bbDefense';
      } else if (heroPosition === 'SB' && openerPosition === 'SB') {
        spotType = 'sbVsBb';
      } else {
        spotType = 'vsOpen';
      }
    }
  } else if (heroPosition !== null && heroAction !== 'unknown') {
    // No raises — hero may have limped or it's a walk; treat as open opportunity
    spotType = 'open';
  }

  return {
    heroPosition,
    heroHand,
    heroAction,
    spotType,
    openerPosition,
    threeBetPosition,
    actions,
  };
}

export const SAMPLE_HAND_HISTORY = `PokerStars Hand #123456789
Table 'Testudo' 6-max Seat #4 is the button
Seat 1: UTG ($100 in chips)
Seat 2: HJ ($100 in chips)
Seat 3: CO ($100 in chips)
Seat 4: BTN ($100 in chips)
Seat 5: SB ($100 in chips)
Seat 6: BB ($100 in chips)
Hero is BTN
SB: posts small blind $0.50
BB: posts big blind $1.00
Dealt to Hero [As Qd]
UTG: folds
HJ: raises to 3bb
CO: folds
Hero: calls
SB: folds
BB: folds`;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors from `handHistoryParser.ts`.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス"
git add src/utils/handHistoryParser.ts
git commit -m "feat: add hand history parser utility"
```

---

## Task 3: Hand Analysis Utility

**Files:**
- Create: `src/utils/handAnalysis.ts`

- [ ] **Step 1: Create `src/utils/handAnalysis.ts`**

```typescript
import type { ParsedHand, HandAnalysisResult, EvaluationLabel, HeroAction, SpotType } from '../types/handHistory';
import type { Position, Action } from '../types';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';

const EVALUATION_JA: Record<EvaluationLabel, string> = {
  Good: '良い判断',
  OK: '許容範囲',
  Caution: '注意',
  Mistake: 'ミス寄り',
  Unknown: '判定不能',
};

const ACTION_LABELS: Record<string, string> = {
  raise: 'オープンレイズ',
  mixed: 'レイズまたはフォールド（状況次第）',
  fold: 'フォールド',
  '3betValue': '3ベット（バリュー）',
  '3betBluff': '3ベット（ブラフ）',
  '3bet': '3ベット',
  call: 'コール',
  '4betValue': '4ベット（バリュー）',
  '4betBluff': '4ベット（ブラフ）',
};

function heroActionLabel(action: HeroAction): string {
  const map: Record<HeroAction, string> = {
    raise: 'オープンレイズ',
    call: 'コール',
    '3bet': '3ベット',
    '4bet': '4ベット',
    fold: 'フォールド',
    check: 'チェック',
    unknown: '不明',
  };
  return map[action];
}

function getRangeForSpot(
  spotType: SpotType,
  heroPosition: Position,
  openerPosition: Position | null
): Record<string, { action: Action }> | null {
  try {
    switch (spotType) {
      case 'open':
        return getOpenRange(heroPosition, 'standard');
      case 'vsOpen':
        if (!openerPosition) return null;
        return getVsOpenRange(heroPosition, openerPosition, 'standard');
      case 'vs3Bet':
        return getVs3BetRange(heroPosition, 'standard');
      case 'bbDefense':
        if (!openerPosition) return null;
        return getBBDefenseRange(openerPosition, 'standard');
      case 'sbVsBb':
        return getSBvsBBRange('sbOpen', 'standard');
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function evaluateOpenAction(heroAction: HeroAction, rangeAction: Action): {
  evaluation: EvaluationLabel;
  comment: string;
  safeModeComment: string;
  recommendedAction: string;
} {
  const rec = ACTION_LABELS[rangeAction] ?? rangeAction;

  if (rangeAction === 'fold') {
    if (heroAction === 'fold') return {
      evaluation: 'Good', comment: 'フォールドが正解です。このハンドはこのポジションからオープンする価値がありません。', safeModeComment: 'フォールドで問題ありません。安全寄りに徹しましょう。', recommendedAction: rec,
    };
    return {
      evaluation: 'Mistake', comment: `${heroActionLabel(heroAction)}は過剰です。このハンドはこのポジションからオープンするには弱すぎます。`, safeModeComment: 'フォールドが最善です。弱いハンドで無理に参加しないことが安全寄りの基本です。', recommendedAction: rec,
    };
  }

  if (rangeAction === 'raise') {
    if (heroAction === 'raise') return {
      evaluation: 'Good', comment: 'レイズが正解です。このハンドはこのポジションから自信を持ってオープンできます。', safeModeComment: '問題ありません。自信を持ってオープンしましょう。', recommendedAction: rec,
    };
    if (heroAction === 'fold') return {
      evaluation: 'Mistake', comment: 'フォールドはもったいないです。このハンドはオープンレイズに値します。', safeModeComment: '安全寄りでもこのハンドはオープンできます。見逃しです。', recommendedAction: rec,
    };
    return {
      evaluation: 'Caution', comment: `${heroActionLabel(heroAction)}はこのスポットでは非推奨です。通常はオープンレイズが推奨されます。`, safeModeComment: '基本的なオープンレイズを選びましょう。', recommendedAction: rec,
    };
  }

  if (rangeAction === 'mixed') {
    if (heroAction === 'raise' || heroAction === 'fold') return {
      evaluation: 'OK', comment: `このハンドはオープンするかフォールドかが状況次第です。${heroActionLabel(heroAction)}は許容範囲内です。`, safeModeComment: 'フォールドが安全寄りの選択です。', recommendedAction: rec,
    };
    return {
      evaluation: 'Caution', comment: `${heroActionLabel(heroAction)}はこのスポットでは一般的ではありません。`, safeModeComment: 'フォールドが安全です。', recommendedAction: rec,
    };
  }

  return { evaluation: 'Unknown', comment: '判定できませんでした。', safeModeComment: '判定できませんでした。', recommendedAction: rec };
}

function evaluateVsOpenAction(heroAction: HeroAction, rangeAction: Action): {
  evaluation: EvaluationLabel;
  comment: string;
  safeModeComment: string;
  recommendedAction: string;
} {
  const rec = ACTION_LABELS[rangeAction] ?? rangeAction;
  const is3bet = rangeAction === '3betValue' || rangeAction === '3betBluff' || rangeAction === '3bet';
  const isMixed = rangeAction === 'mixed';

  if (rangeAction === 'fold') {
    if (heroAction === 'fold') return { evaluation: 'Good', comment: 'フォールドが正解です。相手のオープンに対してこのハンドはレンジ外です。', safeModeComment: 'フォールドで正解です。', recommendedAction: rec };
    return { evaluation: 'Mistake', comment: `${heroActionLabel(heroAction)}は過剰です。このハンドはフォールドが推奨されます。`, safeModeComment: 'フォールドで問題ありません。安全寄りならなおさらです。', recommendedAction: rec };
  }

  if (rangeAction === 'call') {
    if (heroAction === 'call') return { evaluation: 'Good', comment: 'コールが正解です。このハンドは相手のオープンにコールで参加できます。', safeModeComment: 'コールで問題ありません。', recommendedAction: rec };
    if (heroAction === '3bet') return { evaluation: 'OK', comment: '3ベットも選択肢ですが、コールが標準です。相手や状況次第で3ベットもあり得ます。', safeModeComment: '初中級者はコールを推奨します。3ベットはリスクが上がります。', recommendedAction: rec };
    if (heroAction === 'fold') return { evaluation: 'Caution', comment: 'フォールドはやや消極的です。このハンドはコールで参加できます。', safeModeComment: '安全寄りならフォールドも許容ですが、コールでもOKです。', recommendedAction: rec };
  }

  if (is3bet) {
    if (heroAction === '3bet') return { evaluation: 'Good', comment: '3ベットが正解です。このハンドは相手のオープンに積極的に3ベットできます。', safeModeComment: '3ベットも正解ですが、初中級者はコールも許容範囲です。', recommendedAction: rec };
    if (heroAction === 'call') return { evaluation: 'OK', comment: 'コールも許容範囲ですが、3ベットがより推奨されます。相手レンジに対しバリューを取れます。', safeModeComment: '安全寄りモードではコールで十分です。', recommendedAction: rec };
    if (heroAction === 'fold') return { evaluation: 'Caution', comment: 'フォールドはもったいないです。このハンドは3ベットまたはコールで参加できます。', safeModeComment: '安全寄りならコールが最低限の選択です。', recommendedAction: rec };
  }

  if (isMixed) {
    if (heroAction === 'fold' || heroAction === 'call' || heroAction === '3bet') return { evaluation: 'OK', comment: `${heroActionLabel(heroAction)}は許容範囲です。このハンドは状況次第でアクションが変わります。`, safeModeComment: 'フォールドまたはコールが安全寄りの選択です。', recommendedAction: rec };
  }

  return { evaluation: 'Unknown', comment: '判定できませんでした。', safeModeComment: '判定できませんでした。', recommendedAction: rec };
}

function evaluateVs3BetAction(heroAction: HeroAction, rangeAction: Action): {
  evaluation: EvaluationLabel;
  comment: string;
  safeModeComment: string;
  recommendedAction: string;
} {
  const rec = ACTION_LABELS[rangeAction] ?? rangeAction;
  const is4bet = rangeAction === '4betValue' || rangeAction === '4betBluff';
  const isMixed = rangeAction === 'mixed';

  if (rangeAction === 'fold') {
    if (heroAction === 'fold') return { evaluation: 'Good', comment: 'フォールドが正解です。3ベットに対してこのハンドはレンジ外です。', safeModeComment: 'フォールドで正解です。', recommendedAction: rec };
    return { evaluation: 'Mistake', comment: `${heroActionLabel(heroAction)}は過剰です。3ベットに対してこのハンドはフォールドが推奨されます。`, safeModeComment: 'フォールドが安全です。3ベットへの過剰な反応は禁物です。', recommendedAction: rec };
  }

  if (rangeAction === 'call') {
    if (heroAction === 'call') return { evaluation: 'Good', comment: 'コールが正解です。3ベットに対してコールで見ていける強さがあります。', safeModeComment: 'コールで問題ありません。', recommendedAction: rec };
    if (heroAction === 'fold') return { evaluation: 'Caution', comment: 'フォールドはやや保守的です。このハンドは3ベットにコールできます。', safeModeComment: '安全寄りならフォールドも許容ですが、コールも良い選択です。', recommendedAction: rec };
    if (heroAction === '4bet') return { evaluation: 'Caution', comment: '4ベットは強すぎる反応です。コールが標準的な選択です。', safeModeComment: '4ベットは避け、コールまたはフォールドにしましょう。', recommendedAction: rec };
  }

  if (is4bet) {
    if (heroAction === '4bet') return { evaluation: 'Good', comment: '4ベットが正解です。相手の3ベットに対して強く反撃できるハンドです。', safeModeComment: '4ベットが正解ですが、初中級者はコールも許容範囲です。', recommendedAction: rec };
    if (heroAction === 'call') return { evaluation: 'OK', comment: 'コールも許容範囲ですが、4ベットがより推奨されます。', safeModeComment: '安全寄りならコールが無難です。', recommendedAction: rec };
    if (heroAction === 'fold') return { evaluation: 'Caution', comment: 'フォールドはもったいないです。4ベットまたはコールが推奨されます。', safeModeComment: '安全寄りならコールを検討してください。', recommendedAction: rec };
  }

  if (isMixed) {
    if (heroAction === 'fold' || heroAction === 'call' || heroAction === '4bet') return { evaluation: 'OK', comment: `${heroActionLabel(heroAction)}は許容範囲です。状況次第でアクションが変わる難しい局面です。`, safeModeComment: 'フォールドまたはコールが安全寄りの選択です。', recommendedAction: rec };
  }

  return { evaluation: 'Unknown', comment: '判定できませんでした。', safeModeComment: '判定できませんでした。', recommendedAction: rec };
}

/** Main analysis function: returns null if hand cannot be analyzed */
export function analyzeHand(parsed: ParsedHand): HandAnalysisResult | null {
  if (!parsed.heroPosition || !parsed.heroHand || parsed.spotType === 'unknown') return null;

  const heroPosition = parsed.heroPosition;
  const range = getRangeForSpot(parsed.spotType, heroPosition, parsed.openerPosition);
  if (!range) return null;

  const entry = range[parsed.heroHand];
  const rangeAction = entry?.action ?? null;

  if (!rangeAction) {
    return {
      heroPosition,
      heroHand: parsed.heroHand,
      spotType: parsed.spotType,
      heroAction: parsed.heroAction,
      recommendedAction: '判定不能（レンジデータなし）',
      evaluation: 'Unknown',
      evaluationJa: EVALUATION_JA.Unknown,
      comment: 'このハンドのレンジデータが見つかりませんでした。',
      safeModeComment: 'レンジデータが見つかりませんでした。安全寄りにフォールドを推奨します。',
      openerPosition: parsed.openerPosition,
    };
  }

  let evalResult: { evaluation: EvaluationLabel; comment: string; safeModeComment: string; recommendedAction: string };

  switch (parsed.spotType) {
    case 'open':
      evalResult = evaluateOpenAction(parsed.heroAction, rangeAction);
      break;
    case 'vsOpen':
    case 'bbDefense':
    case 'sbVsBb':
      evalResult = evaluateVsOpenAction(parsed.heroAction, rangeAction);
      break;
    case 'vs3Bet':
      evalResult = evaluateVs3BetAction(parsed.heroAction, rangeAction);
      break;
    default:
      evalResult = { evaluation: 'Unknown', comment: '判定不能です。', safeModeComment: '判定不能です。', recommendedAction: '不明' };
  }

  return {
    heroPosition,
    heroHand: parsed.heroHand,
    spotType: parsed.spotType,
    heroAction: parsed.heroAction,
    recommendedAction: evalResult.recommendedAction,
    evaluation: evalResult.evaluation,
    evaluationJa: EVALUATION_JA[evalResult.evaluation],
    comment: evalResult.comment,
    safeModeComment: evalResult.safeModeComment,
    openerPosition: parsed.openerPosition,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors from the new utility files.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス"
git add src/utils/handAnalysis.ts
git commit -m "feat: add hand analysis utility using existing range data"
```

---

## Task 4: HandHistoryAnalyzer Component

**Files:**
- Create: `src/components/HandHistoryAnalyzer.tsx`

- [ ] **Step 1: Create `src/components/HandHistoryAnalyzer.tsx`**

```typescript
import { useState, useCallback } from 'react';
import { parseHandHistory, SAMPLE_HAND_HISTORY } from '../utils/handHistoryParser';
import { analyzeHand } from '../utils/handAnalysis';
import type { HandAnalysisResult, EvaluationLabel } from '../types/handHistory';

interface Props {
  safeMode: boolean;
}

const SPOT_TYPE_LABELS: Record<string, string> = {
  open: 'オープン機会',
  vsOpen: 'vs オープンレイズ',
  vs3Bet: 'vs 3ベット',
  bbDefense: 'BB ディフェンス',
  sbVsBb: 'SB vs BB',
  unknown: '不明',
};

const HERO_ACTION_LABELS: Record<string, string> = {
  raise: 'オープンレイズ',
  call: 'コール',
  '3bet': '3ベット',
  '4bet': '4ベット',
  fold: 'フォールド',
  check: 'チェック',
  unknown: '不明',
};

const EVAL_COLORS: Record<EvaluationLabel, { border: string; bg: string; badge: string; text: string }> = {
  Good: { border: 'border-green-500', bg: 'bg-green-900/20', badge: 'bg-green-700 text-green-100', text: 'text-green-400' },
  OK: { border: 'border-blue-500', bg: 'bg-blue-900/20', badge: 'bg-blue-700 text-blue-100', text: 'text-blue-400' },
  Caution: { border: 'border-yellow-500', bg: 'bg-yellow-900/20', badge: 'bg-yellow-700 text-yellow-100', text: 'text-yellow-400' },
  Mistake: { border: 'border-red-500', bg: 'bg-red-900/20', badge: 'bg-red-700 text-red-100', text: 'text-red-400' },
  Unknown: { border: 'border-gray-600', bg: 'bg-gray-800/40', badge: 'bg-gray-700 text-gray-300', text: 'text-gray-400' },
};

const EVAL_JA: Record<EvaluationLabel, string> = {
  Good: '良い判断',
  OK: '許容範囲',
  Caution: '注意',
  Mistake: 'ミス寄り',
  Unknown: '判定不能',
};

export default function HandHistoryAnalyzer({ safeMode }: Props) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<HandAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    setError(null);
    setResult(null);

    if (!text.trim()) {
      setError('ハンドヒストリーを入力してください。');
      return;
    }

    const parsed = parseHandHistory(text);

    if (!parsed.heroPosition) {
      setError('Heroのポジションを検出できませんでした。「Hero is BTN」のような記述を含めてください。');
      return;
    }
    if (!parsed.heroHand) {
      setError('Heroのハンドを検出できませんでした。「Dealt to Hero [As Qd]」のような記述を含めてください。');
      return;
    }
    if (parsed.heroAction === 'unknown') {
      setError('Heroのアクションを検出できませんでした。「Hero: calls」などの記述を含めてください。');
      return;
    }
    if (parsed.spotType === 'unknown') {
      setError('スポットタイプを特定できませんでした。アクションの記述を確認してください。');
      return;
    }

    const analysisResult = analyzeHand(parsed);
    if (!analysisResult) {
      setError('解析に失敗しました。ハンドヒストリーの形式を確認してください。');
      return;
    }

    setResult(analysisResult);
  }, [text]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target?.result as string ?? '');
    };
    reader.readAsText(file, 'utf-8');
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  }, []);

  const handleSample = useCallback(() => {
    setText(SAMPLE_HAND_HISTORY);
    setResult(null);
    setError(null);
  }, []);

  const colors = result ? EVAL_COLORS[result.evaluation] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">ハンド履歴解析</h2>
        <p className="text-sm text-gray-400 mt-1">
          プレイしたハンドを貼り付けて、プリフロップ判断をRangePilotのレンジデータで添削します。
        </p>
      </div>

      {/* Input area */}
      <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 space-y-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={'PokerStars Hand #123...\nHero is BTN\nDealt to Hero [As Qd]\nUTG folds\nHJ raises to 3bb\nHero calls\n...'}
          rows={10}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors min-h-[40px] flex items-center gap-1.5">
            <span>📁</span> .txtファイルを読み込む
            <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={handleSample}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors min-h-[40px]"
          >
            📋 サンプルを読み込む
          </button>
          <button
            onClick={handleAnalyze}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors min-h-[40px] ml-auto"
          >
            🔍 解析する
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* Result card */}
      {result && colors && (
        <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-5 space-y-4`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-white">解析結果</h3>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${colors.badge}`}>
              {EVAL_JA[result.evaluation]}
            </span>
          </div>

          {/* Hand info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoBlock label="ハンド" value={result.heroHand} highlight />
            <InfoBlock label="Hero" value={result.heroPosition} />
            <InfoBlock label="スポット" value={SPOT_TYPE_LABELS[result.spotType]} />
            {result.openerPosition && (
              <InfoBlock label="オープナー" value={result.openerPosition} />
            )}
            <InfoBlock label="実際のアクション" value={HERO_ACTION_LABELS[result.heroAction] ?? result.heroAction} />
            <InfoBlock label="推奨アクション" value={result.recommendedAction} highlight />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <p className="text-sm text-gray-300 leading-relaxed">{result.comment}</p>
            {safeMode && (
              <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 text-sm text-green-300">
                🛡 安全寄り: {result.safeModeComment}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-900/60 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-white' : 'text-gray-200'}`}>{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors from `HandHistoryAnalyzer.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス"
git add src/components/HandHistoryAnalyzer.tsx
git commit -m "feat: add HandHistoryAnalyzer component"
```

---

## Task 5: PracticeModeView Component

**Files:**
- Create: `src/components/PracticeModeView.tsx`

- [ ] **Step 1: Create `src/components/PracticeModeView.tsx`**

```typescript
import { useState, useMemo, useCallback } from 'react';
import type { HandEntry } from '../types';
import type { ReviewInput, ReviewResult } from '../types/review';
import { SPOTS, USER_CHOICE_LABELS, choiceMatchesAction, isMixedAction } from '../data/spots';
import type { SpotQuestion, UserChoice } from '../data/spots';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';
import { loadStats, recordAttempt } from '../data/learningTracker';

interface Props {
  safeMode: boolean;
}

const ALL_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;

type ResultKind = 'correct' | 'incorrect' | 'acceptable';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lookupAnswer(q: SpotQuestion): HandEntry | null {
  let range: Record<string, HandEntry>;
  switch (q.lookupMode) {
    case 'open':
      range = getOpenRange(q.lookupMyPos, 'standard');
      break;
    case 'vsOpen':
      range = getVsOpenRange(q.lookupMyPos, q.lookupOpenerPos!, 'standard');
      break;
    case 'vs3Bet':
      range = getVs3BetRange(q.lookupMyPos, 'standard');
      break;
    case 'bbDefense':
      range = getBBDefenseRange(q.lookupOpenerPos!, 'standard');
      break;
    case 'sbVsBb':
      range = getSBvsBBRange(q.lookupSbBbScenario!, 'standard');
      break;
    default:
      return null;
  }
  return range[q.hand] || null;
}

/** Display a poker hand like "AQo" or "99" as two styled card boxes */
function HandCards({ hand }: { hand: string }) {
  const isPair = hand.length === 2;
  const rank1 = hand[0];
  const rank2 = isPair ? hand[1] : hand[1];
  const suited = hand.endsWith('s');
  const offsuit = hand.endsWith('o');

  const cardBase = 'w-14 h-20 sm:w-16 sm:h-24 rounded-xl flex flex-col items-center justify-center shadow-lg border-2';
  const cardColor1 = 'bg-white border-gray-200';
  const cardColor2 = suited ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3 justify-center">
        <div className={`${cardBase} ${cardColor1}`}>
          <span className="text-3xl sm:text-4xl font-black text-gray-900">{rank1}</span>
        </div>
        <div className={`${cardBase} ${cardColor2}`}>
          <span className={`text-3xl sm:text-4xl font-black ${suited ? 'text-blue-700' : 'text-gray-900'}`}>{rank2}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 font-medium">
        {isPair ? 'ペア' : suited ? 'スーテッド' : offsuit ? 'オフスート' : ''}
      </span>
    </div>
  );
}

/** Position badges row — highlights hero and opener */
function PositionBadges({ heroPos, openerPos }: { heroPos: string; openerPos?: string }) {
  return (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {ALL_POSITIONS.map(pos => {
        const isHero = pos === heroPos;
        const isOpener = pos === openerPos;
        return (
          <div
            key={pos}
            className={`relative px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              isHero
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-110'
                : isOpener
                ? 'bg-orange-600/80 text-white'
                : 'bg-gray-700/60 text-gray-500'
            }`}
          >
            {pos}
            {isHero && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-emerald-500 text-white px-1 rounded font-bold">
                You
              </span>
            )}
            {isOpener && !isHero && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-orange-500 text-white px-1 rounded font-bold">
                Raise
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const CHOICE_STYLES: Record<UserChoice, string> = {
  raise: 'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white border-red-600',
  call: 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white border-blue-600',
  '3bet': 'bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white border-rose-600',
  '4bet': 'bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white border-purple-600',
  fold: 'bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100 border-gray-600',
};

const RESULT_CONFIG: Record<ResultKind, { label: string; icon: string; border: string; bg: string; text: string }> = {
  correct: { label: '正解！', icon: '✅', border: 'border-green-500', bg: 'bg-green-900/30', text: 'text-green-400' },
  incorrect: { label: '不正解', icon: '❌', border: 'border-red-500', bg: 'bg-red-900/30', text: 'text-red-400' },
  acceptable: { label: '許容範囲', icon: '🔶', border: 'border-yellow-500', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
};

export default function PracticeModeView({ safeMode }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState<SpotQuestion>(() => pickRandom(SPOTS));
  const [selectedChoice, setSelectedChoice] = useState<UserChoice | null>(null);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [answerEntry, setAnswerEntry] = useState<HandEntry | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(() => loadStats().streaks);
  const [aiResult, setAiResult] = useState<ReviewResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(1);

  const handleChoice = useCallback((choice: UserChoice) => {
    if (selectedChoice !== null) return;

    const entry = lookupAnswer(currentQuestion);
    setAnswerEntry(entry);
    setSelectedChoice(choice);
    setAiResult(null);
    setAiError(null);

    let kind: ResultKind;
    if (!entry || entry.action === 'fold') {
      kind = choice === 'fold' ? 'correct' : 'incorrect';
    } else if (isMixedAction(entry.action)) {
      kind = 'acceptable';
    } else {
      kind = choiceMatchesAction(choice, entry.action) ? 'correct' : 'incorrect';
    }

    setResultKind(kind);
    setScore(s => ({ correct: s.correct + (kind !== 'incorrect' ? 1 : 0), total: s.total + 1 }));

    const updated = recordAttempt({
      spotId: currentQuestion.id,
      userChoice: choice,
      correctAction: entry?.action ?? 'fold',
      result: kind,
      timestamp: Date.now(),
      position: currentQuestion.myPosition,
      scenario: currentQuestion.scenario,
      tags: currentQuestion.tags,
    });
    setStreak(updated.streaks);
  }, [selectedChoice, currentQuestion]);

  const handleNext = useCallback(() => {
    setCurrentQuestion(pickRandom(SPOTS));
    setSelectedChoice(null);
    setResultKind(null);
    setAnswerEntry(null);
    setAiResult(null);
    setAiError(null);
    setQuestionCount(n => n + 1);
  }, []);

  const handleAskAI = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    const input: ReviewInput = {
      heroHand: currentQuestion.hand,
      heroPosition: currentQuestion.myPosition,
      blinds: '0.5/1.0',
      effectiveStack: '100BB',
      preflopAction: currentQuestion.situationLabel,
      flopAction: '',
      turnAction: '',
      riverAction: '',
      opponent: {
        name: '', vpip: '', pfr: '', threeBet: '', foldToThreeBet: '',
        cbet: '', foldToCbet: '', steal: '', checkRaise: '', wtsd: '', wsd: '',
      },
      heroDecision: selectedChoice ?? '',
      result: '',
      memo: '練習モードからの質問。プリフロップのみ解説してください。',
    };
    try {
      const res = await fetch('/api/analyze-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data: ReviewResult = await res.json();
      setAiResult(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI解説の取得に失敗しました');
    } finally {
      setAiLoading(false);
    }
  }, [currentQuestion, selectedChoice]);

  const resultConfig = resultKind ? RESULT_CONFIG[resultKind] : null;
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const actionLabel = useMemo(() => {
    if (!answerEntry) return 'フォールド';
    const map: Record<string, string> = {
      raise: 'オープンレイズ', call: 'コール', fold: 'フォールド',
      '3betValue': '3ベット（バリュー）', '3betBluff': '3ベット（ブラフ）',
      '3bet': '3ベット', mixed: '状況次第（レイズ or フォールド）',
      '4betValue': '4ベット（バリュー）', '4betBluff': '4ベット（ブラフ）',
    };
    return map[answerEntry.action] ?? answerEntry.action;
  }, [answerEntry]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header: score + streak */}
      <div className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700/50">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            スコア: <span className="text-white font-bold">{score.correct}/{score.total}</span>
          </span>
          {score.total > 0 && (
            <span className="text-gray-400">
              正解率: <span className="text-white font-bold">{accuracy}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {streak > 1 && (
            <span className="bg-orange-600/30 border border-orange-600/40 rounded-lg px-2 py-1 text-orange-300 font-bold">
              🔥 {streak}連続正解
            </span>
          )}
          <span className="text-gray-500">Q.{questionCount}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-gray-800/40 rounded-2xl p-5 border border-gray-700/50 space-y-5">
        {/* Position badges */}
        <PositionBadges
          heroPos={currentQuestion.myPosition}
          openerPos={currentQuestion.openerPosition}
        />

        {/* Hand cards */}
        <div className="flex justify-center py-2">
          <HandCards hand={currentQuestion.hand} />
        </div>

        {/* Situation text */}
        <div className="text-center">
          <p className="text-base sm:text-lg text-gray-200 font-medium">{currentQuestion.situationLabel}</p>
          <p className="text-sm text-gray-400 mt-1">どうする？</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          {currentQuestion.choices.map(choice => {
            const isSelected = selectedChoice === choice;
            const isDisabled = selectedChoice !== null;
            const isCorrectAnswer = answerEntry && choiceMatchesAction(choice, answerEntry.action);

            let extraClass = '';
            if (selectedChoice !== null) {
              if (isSelected && resultKind === 'correct') extraClass = 'ring-2 ring-green-400 scale-105';
              else if (isSelected && resultKind === 'incorrect') extraClass = 'ring-2 ring-red-400 opacity-80';
              else if (isSelected && resultKind === 'acceptable') extraClass = 'ring-2 ring-yellow-400';
              else if (isCorrectAnswer) extraClass = 'ring-2 ring-green-500 opacity-90';
              else extraClass = 'opacity-40';
            }

            return (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                disabled={isDisabled}
                className={`px-5 py-3 rounded-xl text-sm sm:text-base font-bold border transition-all min-h-[48px] min-w-[80px] ${CHOICE_STYLES[choice]} ${extraClass} disabled:cursor-not-allowed`}
              >
                {USER_CHOICE_LABELS[choice]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result + Explanation (shown after answer) */}
      {resultConfig && (
        <div className={`rounded-xl border-2 ${resultConfig.border} ${resultConfig.bg} p-5 space-y-4`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{resultConfig.icon}</span>
            <span className={`text-lg font-bold ${resultConfig.text}`}>{resultConfig.label}</span>
            {answerEntry && (
              <span className="ml-auto text-sm text-gray-300">
                正解: <span className="font-bold text-white">{actionLabel}</span>
              </span>
            )}
          </div>

          {/* Static explanation */}
          <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
            <p>{currentQuestion.explanation}</p>
            {currentQuestion.beginnerTip && (
              <p className="text-gray-400 text-xs">{currentQuestion.beginnerTip}</p>
            )}
          </div>

          {/* SafeMode explanation */}
          {safeMode && currentQuestion.safeExplanation && (
            <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 text-sm text-green-300">
              🛡 安全寄り: {currentQuestion.safeExplanation}
            </div>
          )}

          {/* AI explanation */}
          {!aiResult && (
            <button
              onClick={handleAskAI}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-indigo-700 hover:bg-indigo-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiLoading ? '🤖 AI解説を取得中...' : '🤖 AIにもっと詳しく聞く'}
            </button>
          )}
          {aiError && (
            <p className="text-xs text-red-400">⚠ {aiError}</p>
          )}
          {aiResult && (
            <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs text-indigo-400 font-semibold">🤖 AI解説</p>
              <p className="text-sm text-gray-300 leading-relaxed">{aiResult.summary}</p>
              {aiResult.nextRules.length > 0 && (
                <ul className="text-xs text-gray-400 space-y-1">
                  {aiResult.nextRules.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Next question button */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl text-sm font-bold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            次の問題 →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors from `PracticeModeView.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス"
git add src/components/PracticeModeView.tsx
git commit -m "feat: add PracticeModeView with position badges, hand cards, and AI explanation"
```

---

## Task 6: Wire Up Controls and App

**Files:**
- Modify: `src/components/Controls.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `UTILITY_MODES` in `Controls.tsx`**

In `Controls.tsx`, find line 42:
```typescript
const UTILITY_MODES: Mode[] = ['villainType', 'memo', 'spotTest', 'positionGuide', 'postflopGuide', 'glossary', 'learningTracker', 'aiReview'];
```

Replace with:
```typescript
const UTILITY_MODES: Mode[] = ['villainType', 'memo', 'spotTest', 'practiceMode', 'positionGuide', 'postflopGuide', 'glossary', 'learningTracker', 'aiReview', 'handHistoryAnalyzer'];
```

- [ ] **Step 2: Update `UTILITY_MODES` in `App.tsx`**

In `App.tsx`, find line 33:
```typescript
const UTILITY_MODES: Mode[] = ['villainType', 'memo', 'spotTest', 'positionGuide', 'postflopGuide', 'glossary', 'learningTracker', 'aiReview'];
```

Replace with:
```typescript
const UTILITY_MODES: Mode[] = ['villainType', 'memo', 'spotTest', 'practiceMode', 'positionGuide', 'postflopGuide', 'glossary', 'learningTracker', 'aiReview', 'handHistoryAnalyzer'];
```

- [ ] **Step 3: Add imports to `App.tsx`**

In `App.tsx`, after the existing `import AIReviewView from './components/AIReviewView';` line (line 20), add:
```typescript
import PracticeModeView from './components/PracticeModeView';
import HandHistoryAnalyzer from './components/HandHistoryAnalyzer';
```

- [ ] **Step 4: Add conditional rendering in `App.tsx`**

In `App.tsx`, find the line:
```typescript
{mode === 'aiReview' && <AIReviewView />}
```

Add these two lines immediately after it:
```typescript
{mode === 'practiceMode' && <PracticeModeView safeMode={safeMode} />}
{mode === 'handHistoryAnalyzer' && <HandHistoryAnalyzer safeMode={safeMode} />}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
cd "Y:/THマトリックス"
git add src/components/Controls.tsx src/App.tsx
git commit -m "feat: wire up practiceMode and handHistoryAnalyzer in Controls and App"
```

---

## Task 7: Build and Verify

**Files:** None (verification only)

- [ ] **Step 1: Run production build**

```bash
cd "Y:/THマトリックス" && npm run build
```

Expected output ends with something like:
```
✓ built in Xs
dist/index.html       X.XX kB
dist/assets/...
```

Expected: No TypeScript errors, no build errors.

- [ ] **Step 2: Fix any build errors**

If build fails, read the error message carefully:
- TypeScript type error → check type imports match between files
- Missing export → verify `isMixedAction` is exported from `data/spots.ts`
- Missing module → check file paths use correct case (Windows paths are case-insensitive but TypeScript may not be)

Common fix for missing `isMixedAction`: check if it's exported in `spots.ts`:

```bash
cd "Y:/THマトリックス" && grep -n "isMixedAction" src/data/spots.ts
```

If not exported, add to `spots.ts`:
```typescript
export function isMixedAction(action: Action): boolean {
  return action === 'mixed';
}
```

- [ ] **Step 3: Final commit**

```bash
cd "Y:/THマトリックス"
git add -A
git commit -m "feat: complete practice mode and hand history analyzer implementation

- Add PracticeModeView: position badges, hand card display, static + AI explanations
- Add HandHistoryAnalyzer: paste/upload hand history, analyze preflop with range data
- Both modes integrate with SafeMode and existing range data
- npm run build passes"
```

---

## Self-Review

### Spec Coverage Check
- ✅ Practice mode with game-like UI (position badges, card display, score/streak)
- ✅ Action buttons (Raise/Call/3Bet/4Bet/Fold per spot choices)
- ✅ Static explanation immediately after answer
- ✅ AI explanation via "AIに詳しく聞く" button → `/api/analyze-hand`
- ✅ SafeMode integration in both components
- ✅ Hand history: textarea + file upload + sample button
- ✅ Hand history parser: position, hand, actions, spot type
- ✅ Hand normalization: `[As Qd]` → `AQo`, `[9h 9d]` → `99`, etc.
- ✅ Evaluation labels: Good/OK/Caution/Mistake/Unknown with Japanese
- ✅ Result card with all required fields
- ✅ `npm run build` as final verification
- ✅ Existing functionality untouched (only additive changes to Controls/App)

### Type Consistency Check
- `Position` imported from `../types` in all files ✅
- `HandEntry` from `../types` in PracticeModeView ✅
- `ReviewInput`/`ReviewResult` from `../types/review` in PracticeModeView ✅
- `ParsedHand`/`HandAnalysisResult`/`EvaluationLabel` from `../types/handHistory` in analyzer ✅
- `isMixedAction` imported from `../data/spots` (must be exported there) — verify in Task 7 Step 2 ✅
