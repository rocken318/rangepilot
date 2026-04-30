# Postflop Guide Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `PostflopGuideView.tsx` so each content type (flow steps, tips, examples, pot odds) has a distinct visual treatment that eliminates the wall-of-text feeling.

**Architecture:** Replace the monolithic render block in `PostflopGuideView.tsx` with 5 focused inline sub-components (`FlowSteps`, `TipList`, `ExampleList`, `PotOddsTable`, `SubsectionCard`). No changes to `postflopGuide.ts` or any other file.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: Rewrite PostflopGuideView.tsx

**Files:**
- Modify: `src/components/PostflopGuideView.tsx`

- [ ] **Step 1: Replace the entire file with the new implementation**

Full replacement for `src/components/PostflopGuideView.tsx`:

```tsx
import { useState } from 'react';
import { POSTFLOP_SECTIONS } from '../data/postflopGuide';
import type { PostflopSection, PostflopSubsection } from '../data/postflopGuide';

// Section accent border colors keyed by section id
const SECTION_ACCENT: Record<string, string> = {
  cbet:         'border-orange-500',
  boardTexture: 'border-blue-500',
  potOdds:      'border-green-500',
  position:     'border-purple-500',
  mistakes:     'border-red-500',
};

// Pot odds reference table data
const POT_ODDS_ROWS = [
  { draw: 'コンボドロー',       outs: 15, equity: '~54%', third: true,  twoThird: true  },
  { draw: 'フラッシュドロー',   outs: 9,  equity: '~35%', third: true,  twoThird: true  },
  { draw: 'OESDストレート',     outs: 8,  equity: '~32%', third: true,  twoThird: true  },
  { draw: 'オーバーカード2枚', outs: 6,  equity: '~24%', third: true,  twoThird: false },
  { draw: 'ガットショット',     outs: 4,  equity: '~17%', third: false, twoThird: false },
];

function FlowSteps({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {i + 1}
          </div>
          <span className="text-sm text-gray-200 leading-relaxed">{step}</span>
        </div>
      ))}
    </div>
  );
}

function TipList({ tips }: { tips: string[] }) {
  return (
    <div className="space-y-2">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 border-l-2 border-green-500 bg-green-900/20 px-3 py-2 rounded-r-lg">
          <span className="text-green-400 flex-shrink-0 text-xs mt-0.5">ℹ</span>
          <span className="text-sm text-gray-300 leading-relaxed">{tip}</span>
        </div>
      ))}
    </div>
  );
}

function ExampleList({ examples }: { examples: { board: string; analysis: string }[] }) {
  return (
    <div className="space-y-3">
      {examples.map((ex, i) => (
        <div key={i} className="bg-gray-900/60 border border-gray-600/30 rounded-lg p-4">
          <span className="font-mono text-sm bg-gray-800 px-2 py-0.5 rounded text-white border border-gray-600">
            {ex.board}
          </span>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed">{ex.analysis}</p>
        </div>
      ))}
    </div>
  );
}

function PotOddsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left py-2 pr-3 text-gray-400 font-medium">ドロー</th>
            <th className="text-center py-2 px-3 text-gray-400 font-medium">アウツ</th>
            <th className="text-center py-2 px-3 text-gray-400 font-medium">エクイティ</th>
            <th className="text-center py-2 px-3 text-gray-400 font-medium">1/3ポット</th>
            <th className="text-center py-2 px-3 text-gray-400 font-medium">2/3ポット</th>
          </tr>
        </thead>
        <tbody>
          {POT_ODDS_ROWS.map((row) => (
            <tr key={row.draw} className="border-b border-gray-700/50">
              <td className="py-2 pr-3 text-gray-200 font-medium">{row.draw}</td>
              <td className="text-center py-2 px-3 text-gray-300">{row.outs}</td>
              <td className="text-center py-2 px-3 text-white font-mono font-bold">{row.equity}</td>
              <td className="text-center py-2 px-3">
                {row.third
                  ? <span className="text-green-400">✅ コール</span>
                  : <span className="text-red-400">❌ フォールド</span>}
              </td>
              <td className="text-center py-2 px-3">
                {row.twoThird
                  ? <span className="text-green-400">✅ コール</span>
                  : <span className="text-red-400">❌ フォールド</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubsectionCard({ sub, sectionId }: { sub: PostflopSubsection; sectionId: string }) {
  const accent = SECTION_ACCENT[sectionId] ?? 'border-gray-500';
  const showPotOddsTable = sectionId === 'potOdds' && sub.title === 'よく出るドローのオッズ';

  return (
    <div className={`bg-gray-800/50 border border-gray-700 border-l-4 ${accent} rounded-xl p-5 space-y-4`}>
      <h3 className="text-lg font-bold text-white">{sub.title}</h3>

      <p className="text-sm text-gray-300 leading-relaxed">{sub.content}</p>

      {showPotOddsTable && <PotOddsTable />}

      {!showPotOddsTable && sub.flowSteps && sub.flowSteps.length > 0 && (
        <FlowSteps steps={sub.flowSteps} />
      )}

      {!showPotOddsTable && sub.tips && sub.tips.length > 0 && (
        <TipList tips={sub.tips} />
      )}

      {sub.examples && sub.examples.length > 0 && (
        <ExampleList examples={sub.examples} />
      )}
    </div>
  );
}

export default function PostflopGuideView() {
  const [selectedSection, setSelectedSection] = useState<string>(POSTFLOP_SECTIONS[0].id);

  const currentSection: PostflopSection =
    POSTFLOP_SECTIONS.find((s) => s.id === selectedSection) ?? POSTFLOP_SECTIONS[0];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">ポストフロップ基礎ガイド</h2>
        <p className="text-sm text-gray-400 mt-1">
          プリフロップの次に重要なポストフロップの基本を学びましょう
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {POSTFLOP_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setSelectedSection(section.id)}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Section description */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-5 py-3">
        <p className="text-sm text-gray-300 leading-relaxed">{currentSection.description}</p>
      </div>

      {/* Subsections */}
      {currentSection.subsections.map((sub, idx) => (
        <SubsectionCard key={idx} sub={sub} sectionId={currentSection.id} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript compile check**

```bash
cd "Y:/THマトリックス" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "Y:/THマトリックス" && git add src/components/PostflopGuideView.tsx && git commit -m "feat: redesign postflop guide with visual sub-components"
```

---

### Task 2: Smoke test in browser

- [ ] **Step 1: Start dev server**

```bash
cd "Y:/THマトリックス" && npm run dev
```

- [ ] **Step 2: Verify each section**

Open `ポストフロップ基礎` tab and check:

- [ ] Each subsection card has a colored left border (orange for Cベット, blue for ボードテクスチャ, etc.)
- [ ] FlowSteps show as numbered circles (1, 2, 3…) not dots
- [ ] Tips show as green left-border cards with ℹ icon
- [ ] Board examples show board string as monospace badge
- [ ] `ポットオッズ` → `よく出るドローのオッズ` subsection shows the 5-row table (no tip list)
- [ ] All 5 section tabs switch correctly

- [ ] **Step 3: Push**

```bash
cd "Y:/THマトリックス" && git push origin main
```
