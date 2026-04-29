# Hero Seat Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hero is always displayed at the bottom-center of the poker table; all other seats are arranged clockwise relative to the hero's position.

**Architecture:** Replace fixed `SEAT_POSITIONS` (Record keyed by position name) with `DISPLAY_SLOT_POSITIONS` (array of 6 fixed CSS slot positions). At render time, compute which poker position maps to each display slot based on the hero's index in the clockwise position order. Only `PracticeModeView.tsx` changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, inline styles

---

### Task 1: Replace constants and seat render loop

**Files:**
- Modify: `src/components/PracticeModeView.tsx`

- [ ] **Step 1: Replace `ALL_POSITIONS` and `SEAT_POSITIONS` constants**

Find these two constants (lines 18–28):

```tsx
const ALL_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;

// Seat positions — percentage-based within the table container
const SEAT_POSITIONS: Record<string, CSSProperties> = {
  UTG: { top: '4%',    left: '12%'  },
  HJ:  { top: '4%',    right: '12%' },
  CO:  { top: '38%',   right: '-2%' },
  BTN: { bottom: '4%', right: '12%' },
  SB:  { bottom: '4%', left: '12%'  },
  BB:  { top: '38%',   left: '-2%'  },
};
```

Replace with:

```tsx
// Clockwise physical seat order
const POSITION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;

// Fixed display slot positions — slot 0 is ALWAYS the hero (bottom-center)
// Slots 1-5 go clockwise: bottom-right, right, top-right, top-left, left
const DISPLAY_SLOT_POSITIONS: CSSProperties[] = [
  { bottom: '2%',  left: '50%', transform: 'translateX(-50%)' }, // 0 hero
  { bottom: '8%',  right: '8%'  },                               // 1 bottom-right
  { top: '38%',    right: '-2%' },                               // 2 right
  { top: '4%',     right: '12%' },                               // 3 top-right
  { top: '4%',     left: '12%'  },                               // 4 top-left
  { top: '38%',    left: '-2%'  },                               // 5 left
];
```

- [ ] **Step 2: Add `heroIdx` derived value in component body**

Find the derived values block (around line 181–183):

```tsx
  const resultConfig = resultKind ? RESULT_CONFIG[resultKind] : null;
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const [card1, card2] = handToCards(currentQuestion.hand);
```

Add `heroIdx` after `card1, card2`:

```tsx
  const resultConfig = resultKind ? RESULT_CONFIG[resultKind] : null;
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const [card1, card2] = handToCards(currentQuestion.hand);
  const heroIdx = Math.max(0, POSITION_ORDER.findIndex(p => p === currentQuestion.myPosition));
```

`Math.max(0, ...)` guards against -1 if myPosition is somehow not in the list (defensive, shouldn't happen).

- [ ] **Step 3: Replace the seat render loop**

Find the entire `{/* Seat badges — CoinPoker avatar style */}` block that starts with:

```tsx
          {/* Seat badges — CoinPoker avatar style */}
          {ALL_POSITIONS.map(pos => {
          const isHero = pos === currentQuestion.myPosition;
          const isOpener = pos === currentQuestion.openerPosition;
          const isDealer = pos === 'BTN';
```

And ends with the closing of the map (at `})}` after the final `</div>`).

Replace the entire block with:

```tsx
          {/* Seat badges — hero always at slot 0 (bottom-center), clockwise rotation */}
          {DISPLAY_SLOT_POSITIONS.map((slotStyle, slotIdx) => {
          const pos = POSITION_ORDER[(heroIdx + slotIdx) % POSITION_ORDER.length];
          const isHero = slotIdx === 0;
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
              style={slotStyle}
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

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "Y:/THマトリックス" && git add src/components/PracticeModeView.tsx && git commit -m "feat: rotate table so hero is always at bottom-center"
```

---

### Task 2: Smoke test

- [ ] **Step 1: Start dev server**

```bash
cd "Y:/THマトリックス" && npm run dev
```

- [ ] **Step 2: Verify hero rotation for multiple positions**

Open the practice mode and cycle through several questions. For each:
- Hero seat (bottom-center) shows the correct position label matching `situationLabel`
- E.g. if situationLabel says "BB vs CO Open", hero at bottom should show "BB"
- Opener seat (orange ring + RAISE badge) should be the CO position
- Other seats show FOLD badge
- Dealer button (D) appears on BTN seat regardless of rotation

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
cd "Y:/THマトリックス" && git add src/components/PracticeModeView.tsx && git commit -m "fix: correct hero seat rotation edge cases"
```

(Skip this step if no fixes were needed.)
