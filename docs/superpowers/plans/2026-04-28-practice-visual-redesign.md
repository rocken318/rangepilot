# Practice Mode Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign PracticeModeView with casino-style visuals borrowed from Y:\texasholdem — real SVG playing cards, green felt table, elliptical seat layout, gradient action buttons.

**Architecture:** Copy SVG card sprite from texasholdem to RangePilot's public folder. Create a standalone `PokerCard` component that renders real cards from the sprite. Fully rewrite `PracticeModeView` with a table-style layout. No new dependencies — uses Tailwind + inline styles only.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite. SVG sprite from texasholdem (`/cards/svg-cards.svg`).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `public/cards/svg-cards.svg` | Copy from texasholdem | SVG playing card sprite sheet |
| `src/components/PokerCard.tsx` | Create | Renders a single playing card using SVG sprite |
| `src/components/PracticeModeView.tsx` | Full rewrite | Casino-style practice UI |

---

## Task 1: Copy SVG Card Sprite

**Files:**
- Create: `public/cards/svg-cards.svg` (copy from `Y:\texasholdem\public\cards\svg-cards.svg`)

- [ ] **Step 1: Copy the sprite file**

```bash
cp "Y:/texasholdem/public/cards/svg-cards.svg" "Y:/THマトリックス/public/cards/svg-cards.svg"
```

Expected: File appears at `Y:\THマトリックス\public\cards\svg-cards.svg`. Size should be several hundred KB.

- [ ] **Step 2: Verify sprite IDs exist**

```bash
grep -c "id=" "Y:/THマトリックス/public/cards/svg-cards.svg"
```

Expected: Output is a number > 50 (one ID per card + back).

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス"
git add public/cards/svg-cards.svg
git commit -m "feat: add SVG card sprite from texasholdem"
```

---

## Task 2: Create PokerCard Component

**Files:**
- Create: `src/components/PokerCard.tsx`

- [ ] **Step 1: Create `src/components/PokerCard.tsx`**

```typescript
export type Suit = 'S' | 'H' | 'D' | 'C';
export type CardSize = 'sm' | 'md' | 'lg';

const RANK_SVG: Record<string, string> = {
  'A': '1', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', 'T': '10',
  'J': 'jack', 'Q': 'queen', 'K': 'king',
};

const SUIT_SVG: Record<Suit, string> = {
  'S': 'spade', 'H': 'heart', 'D': 'diamond', 'C': 'club',
};

const SIZE_CLASSES: Record<CardSize, string> = {
  sm: 'w-10 h-14',
  md: 'w-14 h-20',
  lg: 'w-20 h-28',
};

function suitGlow(suit: Suit): string {
  if (suit === 'H' || suit === 'D') return 'drop-shadow(0 0 8px rgba(255,60,60,0.8))';
  return 'drop-shadow(0 0 8px rgba(80,120,255,0.8))';
}

/** Convert RangePilot hand notation (e.g. "AQo", "99", "KJs") to two { rank, suit } pairs */
export function handToCards(hand: string): [{ rank: string; suit: Suit }, { rank: string; suit: Suit }] {
  const isPair = hand.length === 2 && hand[0] === hand[1];
  const isSuited = hand.endsWith('s');
  const rank1 = hand[0];
  const rank2 = hand.length >= 2 ? hand[1] : hand[0];

  if (isPair) {
    return [{ rank: rank1, suit: 'S' }, { rank: rank2, suit: 'H' }];
  } else if (isSuited) {
    return [{ rank: rank1, suit: 'S' }, { rank: rank2, suit: 'S' }];
  } else {
    return [{ rank: rank1, suit: 'S' }, { rank: rank2, suit: 'D' }];
  }
}

interface PokerCardProps {
  rank: string;
  suit: Suit;
  size?: CardSize;
  className?: string;
}

export default function PokerCard({ rank, suit, size = 'md', className = '' }: PokerCardProps) {
  const rankId = RANK_SVG[rank] ?? rank.toLowerCase();
  const suitId = SUIT_SVG[suit];
  const href = `/cards/svg-cards.svg#${suitId}_${rankId}`;

  return (
    <div
      className={`relative overflow-hidden bg-white select-none rounded-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.7)] ${SIZE_CLASSES[size]} ${className}`}
      style={{
        border: '2.5px solid rgba(255,255,255,0.9)',
        filter: suitGlow(suit),
      }}
    >
      <svg
        viewBox="0 0 169.075 244.640"
        className="absolute inset-0 w-full h-full"
        aria-label={`${rank} of ${suitId}s`}
      >
        <use href={href} />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | head -10
```

Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス"
git add src/components/PokerCard.tsx
git commit -m "feat: add PokerCard component using SVG sprite from texasholdem"
```

---

## Task 3: Rewrite PracticeModeView

**Files:**
- Modify: `src/components/PracticeModeView.tsx` (full rewrite)

- [ ] **Step 1: Replace `src/components/PracticeModeView.tsx` with the new casino-style version**

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
import PokerCard, { handToCards } from './PokerCard';

interface Props {
  safeMode: boolean;
}

const ALL_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;

// Hardcoded elliptical seat positions (percentage-based within table container)
const SEAT_POSITIONS: Record<string, React.CSSProperties> = {
  UTG: { top: '6%',  left: '15%'  },
  HJ:  { top: '6%',  right: '15%' },
  CO:  { top: '44%', right: '1%'  },
  BTN: { bottom: '6%', right: '15%' },
  SB:  { bottom: '6%', left: '15%'  },
  BB:  { top: '44%', left: '1%'   },
};

type ResultKind = 'correct' | 'incorrect' | 'acceptable';

const RESULT_CONFIG: Record<ResultKind, {
  label: string; icon: string;
  border: string; bg: string; text: string;
  tableGlow: string;
}> = {
  correct:    { label: '正解！',    icon: '✅', border: 'border-green-500',  bg: 'bg-green-900/30',  text: 'text-green-400',  tableGlow: '0 0 40px rgba(74,222,128,0.45)' },
  incorrect:  { label: '不正解',    icon: '❌', border: 'border-red-500',    bg: 'bg-red-900/30',    text: 'text-red-400',    tableGlow: '0 0 40px rgba(239,68,68,0.45)'  },
  acceptable: { label: '許容範囲',  icon: '🔶', border: 'border-yellow-500', bg: 'bg-yellow-900/30', text: 'text-yellow-400', tableGlow: '0 0 40px rgba(251,191,36,0.45)' },
};

// Casino-style gradient button styles per choice
const CHOICE_STYLES: Record<UserChoice, string> = {
  raise: 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300/60 text-gray-900 hover:from-amber-300 hover:to-amber-500',
  call:  'bg-gradient-to-b from-sky-500 to-sky-700 border-sky-400/40 text-white hover:from-sky-400 hover:to-sky-600',
  '3bet':'bg-gradient-to-b from-rose-600 to-rose-800 border-rose-500/40 text-white hover:from-rose-500 hover:to-rose-700',
  '4bet':'bg-gradient-to-b from-purple-600 to-purple-800 border-purple-500/40 text-white hover:from-purple-500 hover:to-purple-700',
  fold:  'bg-gradient-to-b from-gray-600 to-gray-800 border-gray-500/40 text-gray-100 hover:from-gray-500 hover:to-gray-700',
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lookupAnswer(q: SpotQuestion): HandEntry | null {
  let range: Record<string, HandEntry>;
  switch (q.lookupMode) {
    case 'open':      range = getOpenRange(q.lookupMyPos, 'standard'); break;
    case 'vsOpen':    range = getVsOpenRange(q.lookupMyPos, q.lookupOpenerPos!, 'standard'); break;
    case 'vs3Bet':    range = getVs3BetRange(q.lookupMyPos, 'standard'); break;
    case 'bbDefense': range = getBBDefenseRange(q.lookupOpenerPos!, 'standard'); break;
    case 'sbVsBb':    range = getSBvsBBRange(q.lookupSbBbScenario!, 'standard'); break;
    default: return null;
  }
  return range[q.hand] || null;
}

export default function PracticeModeView({ safeMode }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState<SpotQuestion>(() => pickRandom(SPOTS));
  const [selectedChoice, setSelectedChoice] = useState<UserChoice | null>(null);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [answerEntry, setAnswerEntry] = useState<HandEntry | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(() => loadStats().streaks.current);
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
    setStreak(updated.streaks.current);
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
      blinds: '0.5/1.0 (100BB)',
      effectiveStack: '100BB',
      preflopAction: currentQuestion.situationLabel,
      flopAction: '', turnAction: '', riverAction: '',
      opponent: { name:'', vpip:'', pfr:'', threeBet:'', foldToThreeBet:'', cbet:'', foldToCbet:'', steal:'', checkRaise:'', wtsd:'', wsd:'' },
      heroDecision: selectedChoice ?? '',
      result: '',
      memo: '練習モードからの質問です。プリフロップの判断のみ簡潔に解説してください。',
    };
    try {
      const res = await fetch('/api/analyze-hand', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setAiResult(await res.json());
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI解説の取得に失敗しました');
    } finally {
      setAiLoading(false);
    }
  }, [currentQuestion, selectedChoice]);

  const resultConfig = resultKind ? RESULT_CONFIG[resultKind] : null;
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const [card1, card2] = handToCards(currentQuestion.hand);

  const actionLabel = useMemo(() => {
    if (!answerEntry) return 'フォールド';
    const map: Record<string, string> = {
      raise: 'オープンレイズ', call: 'コール', fold: 'フォールド',
      '3betValue': '3ベット（バリュー）', '3betBluff': '3ベット（ブラフ）',
      '3bet': '3ベット', mixed: '状況次第',
      '4betValue': '4ベット（バリュー）', '4betBluff': '4ベット（ブラフ）',
    };
    return map[answerEntry.action] ?? answerEntry.action;
  }, [answerEntry]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Casino HUD */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border"
        style={{ background: 'rgba(10,12,10,0.9)', borderColor: 'rgba(212,175,55,0.3)' }}
      >
        <div className="flex items-center gap-4">
          <span style={{ color: '#ffd700', fontFamily: 'monospace' }} className="text-sm font-bold">
            🃏 {score.correct}<span className="text-gray-500">/{score.total}</span>
          </span>
          {score.total > 0 && (
            <span className="text-xs text-gray-400">
              正解率 <span style={{ color: '#ffd700' }} className="font-bold">{accuracy}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {streak > 1 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(212,100,0,0.25)', border: '1px solid rgba(212,100,0,0.5)', color: '#ffa040' }}
            >
              🔥 {streak}連続
            </span>
          )}
          <span className="text-xs text-gray-600">Q.{questionCount}</span>
        </div>
      </div>

      {/* Green felt poker table */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #1a5c2a 0%, #0f4420 55%, #0a3018 100%)',
          minHeight: '280px',
          boxShadow: resultConfig ? resultConfig.tableGlow : '0 0 0 transparent',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Felt inner border ring */}
        <div
          className="absolute inset-3 rounded-2xl pointer-events-none"
          style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
        />
        {/* Center ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(30,120,50,0.18) 0%, transparent 65%)' }}
        />

        {/* Seat badges — absolute positioned around ellipse */}
        {ALL_POSITIONS.map(pos => {
          const isHero = pos === currentQuestion.myPosition;
          const isOpener = pos === currentQuestion.openerPosition;
          return (
            <div
              key={pos}
              className="absolute flex flex-col items-center"
              style={SEAT_POSITIONS[pos]}
            >
              <div
                className="text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap"
                style={
                  isHero
                    ? { background: 'rgba(22,163,74,0.85)', color: '#fff', border: '1.5px solid #4ade80', boxShadow: '0 0 12px rgba(74,222,128,0.4)' }
                    : isOpener
                    ? { background: 'rgba(180,80,0,0.75)', color: '#ffd090', border: '1px solid rgba(255,160,64,0.5)' }
                    : { background: 'rgba(0,0,0,0.55)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {pos}
                {isHero && <span className="ml-1 opacity-80">★</span>}
                {isOpener && !isHero && <span className="ml-1 text-[10px]">↑R</span>}
              </div>
            </div>
          );
        })}

        {/* Center: cards + situation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
          {/* Cards */}
          <div className="flex gap-3">
            <PokerCard rank={card1.rank} suit={card1.suit} size="lg" />
            <PokerCard rank={card2.rank} suit={card2.suit} size="lg" />
          </div>
          {/* Situation text */}
          <div className="text-center">
            <p className="text-sm sm:text-base font-semibold text-white/90 drop-shadow-lg">
              {currentQuestion.situationLabel}
            </p>
            <p className="text-xs text-green-300/60 mt-0.5">どうする？</p>
          </div>
        </div>
      </div>

      {/* Action buttons — casino gradient style */}
      <div className="flex flex-wrap justify-center gap-2">
        {currentQuestion.choices.map(choice => {
          const isSelected = selectedChoice === choice;
          const isDisabled = selectedChoice !== null;
          const isCorrectAnswer = answerEntry && choiceMatchesAction(choice, answerEntry.action);

          let extraClass = '';
          if (selectedChoice !== null) {
            if (isSelected && resultKind === 'correct')    extraClass = 'ring-2 ring-green-400 scale-105';
            else if (isSelected && resultKind === 'incorrect')  extraClass = 'ring-2 ring-red-400 opacity-80';
            else if (isSelected && resultKind === 'acceptable') extraClass = 'ring-2 ring-yellow-400';
            else if (isCorrectAnswer && !isSelected)            extraClass = 'ring-2 ring-green-500';
            else extraClass = 'opacity-35';
          }

          return (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={isDisabled}
              className={`px-5 py-3 rounded-xl text-sm sm:text-base font-bold border transition-all active:scale-[0.97] min-h-[48px] min-w-[80px] ${CHOICE_STYLES[choice]} ${extraClass} disabled:cursor-not-allowed`}
            >
              {USER_CHOICE_LABELS[choice]}
            </button>
          );
        })}
      </div>

      {/* Result + explanation panel */}
      {resultConfig && (
        <div className={`rounded-xl border-2 ${resultConfig.border} ${resultConfig.bg} p-5 space-y-4`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{resultConfig.icon}</span>
            <span className={`text-lg font-bold ${resultConfig.text}`}>{resultConfig.label}</span>
            {answerEntry && (
              <span className="ml-auto text-sm text-gray-300">
                正解: <span className="font-bold text-white">{actionLabel}</span>
              </span>
            )}
          </div>

          {/* Static explanation */}
          <div className="text-sm text-gray-300 leading-relaxed space-y-1">
            <p>{currentQuestion.explanation}</p>
            {currentQuestion.beginnerTip && (
              <p className="text-xs text-gray-400 italic">{currentQuestion.beginnerTip}</p>
            )}
          </div>

          {/* SafeMode note */}
          {safeMode && currentQuestion.safeExplanation && (
            <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 text-sm text-green-300">
              🛡 安全寄り: {currentQuestion.safeExplanation}
            </div>
          )}

          {/* AI button */}
          {!aiResult && (
            <button
              onClick={handleAskAI}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-indigo-700 hover:bg-indigo-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiLoading ? '🤖 AI解説を取得中...' : '🤖 AIにもっと詳しく聞く'}
            </button>
          )}
          {aiError && <p className="text-xs text-red-400">⚠ {aiError}</p>}
          {aiResult && (
            <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs text-indigo-400 font-semibold">🤖 AI解説</p>
              <p className="text-sm text-gray-300 leading-relaxed">{aiResult.summary}</p>
              {aiResult.nextRules.length > 0 && (
                <ul className="text-xs text-gray-400 space-y-1 mt-1">
                  {aiResult.nextRules.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Next button */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
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

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | head -20
```

Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス"
git add src/components/PracticeModeView.tsx
git commit -m "feat: redesign PracticeModeView with casino-style UI, SVG cards, green table"
```

---

## Task 4: Build Verification

- [ ] **Step 1: Run production build**

```bash
cd "Y:/THマトリックス" && npm run build 2>&1
```

Expected: Ends with `✓ built in Xs` and no TypeScript errors.

- [ ] **Step 2: Fix any build errors**

If `Cannot find module './PokerCard'`: check the import path in PracticeModeView — must be `'./PokerCard'` (not `'../components/PokerCard'`).

If TypeScript error about `React.CSSProperties`: add `import React from 'react';` at top of PracticeModeView.

- [ ] **Step 3: Final commit and push**

```bash
cd "Y:/THマトリックス"
git add -A
git commit -m "feat: complete casino-style practice mode with SVG cards from texasholdem"
git push origin main
```

---

## Self-Review

### Spec Coverage
- ✅ SVG card sprite copied from texasholdem
- ✅ `PokerCard` component with suit-based glow (red H/D, blue S/C)
- ✅ `handToCards()` converts AQo→A♠Q♦, AQs→A♠Q♠, 99→9♠9♥
- ✅ Green felt table background with radial gradient + inner ring
- ✅ Elliptical seat layout (hardcoded % positions for 6 seats)
- ✅ Casino gradient action buttons (amber/raise, sky/call, rose/3bet, purple/4bet, gray/fold)
- ✅ Casino HUD (dark bg, gold text, monospace)
- ✅ Table glow feedback (green/red/gold) on answer
- ✅ Static explanation + SafeMode note + AI button preserved
- ✅ Score/streak tracking preserved
- ✅ build verification step

### Type Consistency
- `handToCards` returns `[{ rank: string; suit: Suit }, { rank: string; suit: Suit }]` — used as `[card1, card2]` in PracticeModeView ✅
- `PokerCard` props: `rank: string, suit: Suit, size?: CardSize` — called with `rank={card1.rank} suit={card1.suit} size="lg"` ✅
- `Suit` type exported from `PokerCard.tsx` — not imported in PracticeModeView (used via `handToCards` return type inference) ✅
- `SEAT_POSITIONS` typed as `Record<string, React.CSSProperties>` — spread as `style={SEAT_POSITIONS[pos]}` ✅
