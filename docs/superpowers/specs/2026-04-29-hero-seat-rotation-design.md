# Hero Seat Rotation Design

**Date:** 2026-04-29  
**Status:** Approved

## Problem

Seat positions are currently hardcoded (UTG always top-left, BB always left-middle, etc.), so the hero's avatar appears at different locations depending on the spot. Real poker clients always show the hero at the bottom-center of the table.

## Goal

Hero is always rendered at the bottom-center display slot. All other seats are arranged clockwise around the table relative to the hero's position.

## Design

### Display Slots (fixed CSS positions)

Six fixed slots, always in the same place on screen:

| Slot | Location | CSS |
|------|----------|-----|
| 0 | Bottom-center (HERO) | `{ bottom: '2%', left: '50%', transform: 'translateX(-50%)' }` |
| 1 | Bottom-right | `{ bottom: '8%', right: '8%' }` |
| 2 | Right-middle | `{ top: '38%', right: '-2%' }` |
| 3 | Top-right | `{ top: '4%', right: '12%' }` |
| 4 | Top-left | `{ top: '4%', left: '12%' }` |
| 5 | Left-middle | `{ top: '38%', left: '-2%' }` |

### Position Order

Clockwise physical order: `['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']` (indices 0–5)

### Mapping Algorithm

Given hero position index `h`:

- Slot 0 → position index `h` (hero)
- Slot 1 → position index `(h + 1) % 6`
- Slot 2 → position index `(h + 2) % 6`
- Slot 3 → position index `(h + 3) % 6`
- Slot 4 → position index `(h + 4) % 6`
- Slot 5 → position index `(h + 5) % 6`

### Examples

**Hero = BTN (h=3):**
```
     [HJ=4]       [CO=2]
 [UTG=3]                [SB=1]
     [CO ←wait]  [BTN=0=hero]
```

Actually cleaner:
```
  top-left=HJ    top-right=CO
left=UTG                  right=SB
  bot-left=BB  bot-right=... wait
                 bottom=BTN(hero)
```

Position mapping:
- bottom-center: BTN
- bottom-right: SB
- right-middle: BB
- top-right: UTG
- top-left: HJ
- left-middle: CO

**Hero = BB (h=5):**
- bottom-center: BB
- bottom-right: UTG
- right-middle: HJ
- top-right: CO
- top-left: BTN
- left-middle: SB

**Hero = UTG (h=0):**
- bottom-center: UTG
- bottom-right: HJ
- right-middle: CO
- top-right: BTN
- top-left: SB
- left-middle: BB

## Implementation

**File changed:** `src/components/PracticeModeView.tsx` only

**Changes:**
1. Replace `SEAT_POSITIONS: Record<string, CSSProperties>` (fixed map) with `DISPLAY_SLOT_POSITIONS: CSSProperties[]` (array of 6 slot positions)
2. Add `POSITION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']` constant
3. Compute `slotToPos` array at render time: `slotToPos[i] = POSITION_ORDER[(heroIdx + i) % 6]`
4. Render seats by iterating slots 0–5, looking up which position goes in each slot
5. Slot 0 is always the hero — mark it visually (already done via `isHero` check)

No changes to logic, data, or other components.
