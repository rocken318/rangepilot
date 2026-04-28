# Practice Mode: CoinPoker-Style UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `PracticeModeView.tsx` to look like a real poker client (CoinPoker reference) — dark navy room, avatar seats with stacks and action badges around an oval table, hero cards prominent in hero seat area, dealer button.

**Architecture:** All changes are purely visual/JSX in `PracticeModeView.tsx`. Logic (state, handlers, `lookupAnswer`, AI call) is untouched. `PokerCard.tsx` is untouched.

**Tech Stack:** React, Tailwind CSS, inline styles (same as current)

---

### Task 1: Add seat data constants and action-badge logic

**Files:**
- Modify: `src/components/PracticeModeView.tsx:18-49` (constants section)

- [ ] **Step 1: Replace SEAT_POSITIONS and add SEAT_COLORS**

Replace the existing `SEAT_POSITIONS` constant block (lines 21–28) and the three style constants (`RESULT_CONFIG`, `CHOICE_STYLES`) with the following — keep `RESULT_CONFIG` and `CHOICE_STYLES` unchanged, only add/replace what's shown:

```tsx
// Seat positions — percentage-based within the table container
const SEAT_POSITIONS: Record<string, CSSProperties> = {
  UTG: { top: '4%',    left: '12%'  },
  HJ:  { top: '4%',    right: '12%' },
  CO:  { top: '38%',   right: '-2%' },
  BTN: { bottom: '4%', right: '12%' },
  SB:  { bottom: '4%', left: '12%'  },
  BB:  { top: '38%',   left: '-2%'  },
};

// Avatar ring color per seat
const SEAT_COLORS: Record<string, string> = {
  UTG: '#3b82f6',
  HJ:  '#8b5cf6',
  CO:  '#f97316',
  BTN: '#ef4444',
  SB:  '#eab308',
  BB:  '#14b8a6',
};

// Action badge appearance
type ActionBadgeKind = 'RAISE' | '3-BET' | '4-BET' | 'CALL' | 'FOLD';
const ACTION_BADGE_STYLE: Record<ActionBadgeKind, string> = {
  'RAISE': 'bg-orange-500/90 text-white',
  '3-BET': 'bg-rose-600/90 text-white',
  '4-BET': 'bg-purple-600/90 text-white',
  'CALL':  'bg-sky-500/90 text-white',
  'FOLD':  'bg-gray-600/70 text-gray-300',
};

// Map UserChoice → ActionBadgeKind
const CHOICE_TO_BADGE: Record<string, ActionBadgeKind> = {
  raise: 'RAISE',
  call:  'CALL',
  '3bet': '3-BET',
  '4bet': '4-BET',
  fold:  'FOLD',
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit
```

Expected: no errors related to the new constants.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス" && git add src/components/PracticeModeView.tsx && git commit -m "refactor: add seat color/badge constants for CoinPoker UI"
```

---

### Task 2: Redesign player seat badges to CoinPoker avatar style

**Files:**
- Modify: `src/components/PracticeModeView.tsx` — the `{/* Seat badges */}` block (currently lines 220–245)

- [ ] **Step 1: Replace seat badge JSX**

Find and replace the entire `{/* Seat badges */}` block:

**Old block (lines 220–245):**
```tsx
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
```

**New block:**
```tsx
        {/* Seat badges — CoinPoker avatar style */}
        {ALL_POSITIONS.map(pos => {
          const isHero = pos === currentQuestion.myPosition;
          const isOpener = pos === currentQuestion.openerPosition;
          const isDealer = pos === 'BTN';

          // Determine action badge to show
          let badge: ActionBadgeKind | null = null;
          if (isOpener && !isHero) {
            badge = 'RAISE';
          } else if (!isHero && !isOpener) {
            badge = 'FOLD';
          }
          // After hero answers, show hero's action
          if (isHero && selectedChoice !== null) {
            badge = CHOICE_TO_BADGE[selectedChoice] ?? null;
          }

          // Avatar ring color
          const ringColor = isHero
            ? '#4ade80'
            : isOpener
            ? '#f97316'
            : SEAT_COLORS[pos];

          return (
            <div
              key={pos}
              className="absolute flex flex-col items-center gap-0.5"
              style={SEAT_POSITIONS[pos]}
            >
              {/* Avatar circle */}
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${SEAT_COLORS[pos]}cc, ${SEAT_COLORS[pos]}66)`,
                    border: `2px solid ${ringColor}`,
                    boxShadow: isHero
                      ? `0 0 12px ${ringColor}88`
                      : isOpener
                      ? `0 0 8px ${ringColor}66`
                      : 'none',
                  }}
                >
                  {pos.slice(0, 2)}
                </div>

                {/* Position label — top-left corner of avatar */}
                <div
                  className="absolute -top-2 -left-1 text-[9px] font-bold px-1 rounded"
                  style={{ background: 'rgba(0,0,0,0.85)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {pos}
                </div>

                {/* Dealer button */}
                {isDealer && (
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                    style={{ background: '#fff', color: '#1f2937', border: '1.5px solid #9ca3af' }}
                  >
                    D
                  </div>
                )}
              </div>

              {/* Stack */}
              <div className="text-[10px] text-gray-400 font-mono">100BB</div>

              {/* Action badge */}
              {badge && (
                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ACTION_BADGE_STYLE[badge]}`}>
                  {badge}
                </div>
              )}
            </div>
          );
        })}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス" && git add src/components/PracticeModeView.tsx && git commit -m "feat: redesign seat badges to CoinPoker avatar style with stacks and action badges"
```

---

### Task 3: Dark navy background + leather table border

**Files:**
- Modify: `src/components/PracticeModeView.tsx` — outer wrapper div and table container div

- [ ] **Step 1: Replace outer wrapper**

Find:
```tsx
    <div className="max-w-2xl mx-auto space-y-4">
```

Replace with:
```tsx
    <div
      className="w-full min-h-screen flex flex-col gap-4 px-2 py-4"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
```

- [ ] **Step 2: Replace table container**

Find the table div that starts with:
```tsx
      {/* Green felt poker table */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #1a5c2a 0%, #0f4420 55%, #0a3018 100%)',
          minHeight: '280px',
          boxShadow: resultConfig ? resultConfig.tableGlow : 'none',
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
```

Replace the outer `<div>` and its two decoration children with this new structure (keep all children after the decorations — seat badges and center block — unchanged and inside the new `relative` inner div):

```tsx
      {/* Green felt poker table — leather border + felt surface */}
      <div
        style={{
          borderRadius: '50% / 42%',
          background: 'linear-gradient(180deg, #3a2510 0%, #1e1208 100%)',
          padding: '12px',
          boxShadow: resultConfig
            ? `${resultConfig.tableGlow}, 0 8px 40px rgba(0,0,0,0.8)`
            : '0 8px 40px rgba(0,0,0,0.8)',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Inner felt — relative container for absolute seat badges */}
        <div
          className="relative"
          style={{
            borderRadius: '50% / 42%',
            background: 'radial-gradient(ellipse at 50% 45%, #1a5c2a 0%, #0f4420 55%, #0a3018 100%)',
            minHeight: '290px',
          }}
        >
          {/* Felt inner ring */}
          <div
            className="absolute inset-3 pointer-events-none"
            style={{ borderRadius: '50% / 42%', border: '1.5px solid rgba(255,255,255,0.07)' }}
          />
          {/* Center ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(30,120,50,0.18) 0%, transparent 65%)' }}
          />
```

The seat badges `{ALL_POSITIONS.map(...)}` and the center content block go **inside** this inner felt div. Close both divs at the end of the table section:

```tsx
        </div>{/* end inner felt */}
      </div>{/* end leather border wrapper */}
```

- [ ] **Step 3: Fix outer wrapper closing tag**

The outer wrapper now uses `flex flex-col`, so the result/buttons section needs no extra margin. Verify the JSX closes correctly and the action buttons / result panel come after the table div.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "Y:/THマトリックス" && git add src/components/PracticeModeView.tsx && git commit -m "feat: add dark navy background and leather table border"
```

---

### Task 4: Redesign table center — pot display + scenario info

**Files:**
- Modify: `src/components/PracticeModeView.tsx` — the `{/* Center: cards + situation */}` block

- [ ] **Step 1: Replace center content block**

Find:
```tsx
        {/* Center: cards + situation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
          <div className="flex gap-3">
            <PokerCard rank={card1.rank} suit={card1.suit} size="lg" />
            <PokerCard rank={card2.rank} suit={card2.suit} size="lg" />
          </div>
          <div className="text-center">
            <p className="text-sm sm:text-base font-semibold text-white/90 drop-shadow-lg">
              {currentQuestion.situationLabel}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(134,239,172,0.6)' }}>どうする？</p>
          </div>
        </div>
```

Replace with:
```tsx
        {/* Center: pot + cards + situation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
          {/* Pot display */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white/80"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span style={{ color: '#a3e635' }}>●</span>
            <span>ポット</span>
            <span className="font-bold text-white">2.5BB</span>
          </div>

          {/* Hero hole cards */}
          <div className="flex gap-2">
            <PokerCard rank={card1.rank} suit={card1.suit} size="lg" />
            <PokerCard rank={card2.rank} suit={card2.suit} size="lg" />
          </div>

          {/* Situation label */}
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold text-white/80 drop-shadow-lg leading-snug">
              {currentQuestion.situationLabel}
            </p>
            {selectedChoice === null && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(134,239,172,0.5)' }}>どうする？</p>
            )}
          </div>
        </div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス" && git add src/components/PracticeModeView.tsx && git commit -m "feat: add pot display and polish table center"
```

---

### Task 5: Constrain layout width and polish HUD

**Files:**
- Modify: `src/components/PracticeModeView.tsx` — outer wrapper and HUD

- [ ] **Step 1: Add max-width centering inside the dark background**

The outer wrapper should span the full viewport but the content inside should be centered with a max width. Replace the outer wrapper with:

```tsx
    <div
      className="w-full min-h-screen flex flex-col items-center px-2 py-4"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="w-full max-w-2xl flex flex-col gap-4">
```

And close both divs at the bottom:
```tsx
      </div>{/* end max-w-2xl */}
    </div>{/* end dark background */}
```

- [ ] **Step 2: Style the HUD to span the full max-width**

The existing HUD bar uses `flex items-center justify-between px-4 py-2.5 rounded-xl border` — no change needed, it already stretches to container width.

- [ ] **Step 3: Make action buttons area feel more like a poker client**

Find the action buttons wrapper:
```tsx
      <div className="flex flex-wrap justify-center gap-2">
```

Replace with:
```tsx
      <div
        className="flex flex-wrap justify-center gap-3 px-2 py-3 rounded-xl"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "Y:/THマトリックス" && git add src/components/PracticeModeView.tsx && git commit -m "feat: polish layout width, HUD, and action button area"
```

---

### Task 6: Dev server smoke test

- [ ] **Step 1: Start dev server**

```bash
cd "Y:/THマトリックス" && npm run dev
```

- [ ] **Step 2: Open practice mode in browser**

Navigate to the app, click 練習 (practice mode). Verify:
- Dark navy background visible
- Oval table with leather border ring
- 6 avatar seats with position labels, "100BB" stack, action badges (RAISE on opener, FOLD on others)
- Dealer "D" badge on BTN seat
- Hole cards visible in center with pot label
- After clicking an action: hero seat shows action badge (3-BET / CALL / FOLD)
- Result glow (green/red/yellow) appears on table after answering
- Score HUD visible at top

- [ ] **Step 3: Check mobile view**

Resize browser to 375px width and verify the table and seats don't overflow.

- [ ] **Step 4: Final commit**

```bash
cd "Y:/THマトリックス" && git add -A && git commit -m "feat: complete CoinPoker-style practice mode UI"
```
