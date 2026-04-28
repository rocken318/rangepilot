# Practice Mode: CoinPoker-Style UI Redesign

**Date:** 2026-04-29  
**Status:** Approved

## Goal

Transform the current casino-style practice mode into a UI that closely resembles a real poker client (CoinPoker reference). Players should see an oval table with avatar seats, stack sizes, action badges, pot display, and hero cards — making the practice session feel like playing actual poker.

---

## Section 1: Overall Layout & Background

- **Outer background:** Dark navy `#0f1923` (dim room atmosphere)
- **Table:** Elliptical green felt centered, dark leather-style border ring
- **Top HUD bar:** Score, streak counter, scenario info (e.g., "BB vs CO Open / 100BB / アンティなし")
- **Bottom area:** Hero cards + action buttons

Layout hierarchy:
```
[Top HUD bar]
[Dark room background]
  [Oval green felt table]
    [6 player seats around perimeter]
    [Pot display in center]
[Hero card display]
[Action buttons]
```

---

## Section 2: Player Seats

Six seats positioned absolutely around the oval table perimeter using percentage coordinates (same approach as current implementation).

### Seat anatomy

```
[Avatar circle]   ← 48px round, position-colored border
[Position badge]  ← UTG / HJ / CO / BTN / SB / BB (top-left of avatar)
[Player name]     ← truncated to ~8 chars
[Stack in BB]     ← e.g. "12.2BB"
[Action badge]    ← shown after their action (FOLD / RAISE / CALL / 3-BET)
```

### Avatar icons

Use emoji or SVG icons per seat rather than user photos. Each position gets a distinct icon color to aid quick recognition (no need for real avatars in practice mode).

### Action badge colors

| Action | Color |
|--------|-------|
| FOLD | Gray `#6b7280` |
| RAISE / 3-BET / 4-BET | Orange `#f97316` |
| CALL | Green `#22c55e` |

### Highlighting

- **Hero seat (BB or queried position):** Bottom-center, cards visible, name "You", blue/teal ring
- **Opener/villain seat:** Orange border glow to indicate who opened

---

## Section 3: Table Center

- **Pot display:** White text on semi-transparent dark pill, e.g. `ポット 2.5BB`, centered on table
- **Dealer button:** Small white "D" circle badge on the BTN seat
- **Pre-flop state:** No community cards shown (table center is clean except pot)

---

## Section 4: Hero Cards & Action Buttons

### Hero cards

- Displayed at hero's seat (bottom-center) using existing PokerCard SVG component
- Size: `lg` (large), displayed side by side with slight overlap

### Action buttons

- Large, touch-friendly buttons below the table
- Colors match current implementation:
  - 3-Bet / 4-Bet: Red/rose gradient
  - Call: Green gradient
  - Fold: Gray

### Post-answer feedback

| Result | Table glow | Badge |
|--------|-----------|-------|
| Correct | Green glow | `✓ CORRECT` |
| Incorrect | Red glow | `✗ INCORRECT` + correct button highlighted |
| Acceptable | Yellow glow | `△ ACCEPTABLE` |

After feedback:
- Explanation text expands below buttons
- "次の問題 →" button to advance

---

## Implementation Notes

- Builds on existing `PracticeModeView.tsx` — rewrite styling only, preserve all logic
- `PokerCard.tsx` and SVG sprite unchanged
- Seat position coordinates remain percentage-based for responsiveness
- No new data dependencies required
