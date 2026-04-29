# Postflop Guide Visual Redesign

**Date:** 2026-04-29  
**Status:** Approved  
**File:** `src/components/PostflopGuideView.tsx`

---

## Problem

The current `PostflopGuideView` renders all content as stacked text blocks. Long `content` paragraphs, uniform tip lists, and dense examples make it hard to scan. Key numbers (equity %, pot odds) are buried in prose.

---

## Goal

Redesign `PostflopGuideView.tsx` so each content type has a distinct visual treatment. No changes to `postflopGuide.ts` data structure.

---

## Architecture

Single-file change: `src/components/PostflopGuideView.tsx`.

Extract 4 inline sub-components:

| Component | Purpose |
|---|---|
| `FlowSteps` | Numbered step cards (replace blue dot + line pattern) |
| `TipList` | Green-bordered icon cards (replace 💡 text list) |
| `ExampleList` | Board as monospace badge + analysis text |
| `PotOddsTable` | Draw reference table — only rendered for the `potOdds` section's "よく出るドローのオッズ" subsection |

---

## Visual Changes

### Content paragraph
- Render as-is. No truncation.
- Visual separation from the sub-components below (FlowSteps, TipList, ExampleList) naturally reduces the wall-of-text feeling by chunking content into distinct blocks.

### FlowSteps
- Each step becomes a card: left-aligned number badge (blue circle) + step text.
- Connector line between cards removed; vertical spacing does the job.

### TipList  
- Each tip: left green border card (`border-l-2 border-green-500`), light green background tint, lightbulb icon (`ⓘ`) in gray.

### ExampleList
- Board string displayed as a `font-mono bg-gray-900 px-2 py-0.5 rounded` inline badge.
- Analysis text below in `text-sm text-gray-300`.

### PotOddsTable
Replaces the "よく出るドローのオッズ" subsection's `content` + `tips` with a scannable table:

| ドロー | アウツ | エクイティ | 1/3ポットベット | 2/3ポットベット |
|---|---|---|---|---|
| フラッシュドロー | 9 | ~35% | ✅ コール | ✅ コール |
| OESDストレート | 8 | ~32% | ✅ コール | ✅ コール |
| オーバーカード2枚 | 6 | ~24% | ✅ コール | ❌ フォールド |
| ガットショット | 4 | ~17% | ❌ フォールド | ❌ フォールド |
| コンボドロー | 15 | ~54% | ✅ コール | ✅ コール |

Detection: `subsection.title === 'よく出るドローのオッズ'` → render table instead of standard layout.

### Subsection card accent
- Each subsection card gets `border-l-4` with a color keyed to `section.id`:
  - `cbet` → orange (`border-orange-500`)
  - `boardTexture` → blue (`border-blue-500`)
  - `potOdds` → green (`border-green-500`)
  - `position` → purple (`border-purple-500`)
  - `mistakes` → red (`border-red-500`)

---

## What Does NOT Change

- `postflopGuide.ts` — data untouched
- Tab selector UI
- Section description header
- `PostflopSection` / `PostflopSubsection` types
- All subsections remain always-expanded (no accordion)

---

## Success Criteria

- No wall-of-text paragraphs visible at a glance
- Pot odds table is scannable in under 5 seconds
- FlowSteps and tips are visually distinct from each other and from body text
- TypeScript compiles with no errors
