# Stack Depth / Push-Fold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スタックデプス選択（100BB / 50BB / 20BB / 15BB / 10BB）を追加し、20BB以下でNashプッシュフォールドチャートを表示する。

**Architecture:** `StackDepth` 型を追加し、短スタック（≤20BB）時は `open` モードを push range（全イン/フォールド）、`bbDefense` モードを call range（コール/フォールド）に切り替える。データは新規 `push-fold.ts` に分離。既存 `ranges.ts` は無変更。50BB は現状と同じ100BBレンジを使用（将来拡張用に型のみ定義）。

**Tech Stack:** TypeScript, React useState/useMemo, 既存 HandMatrix/Legend/colorScheme 表示システム（変更なし）

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types.ts` | Modify | `StackDepth` 型・`STACK_DEPTH_LABELS` 定数を追加 |
| `src/data/push-fold.ts` | Create | `getPushRange()` / `getCallRange()` — 3スタック × 5ポジションのNashデータ |
| `src/App.tsx` | Modify | `stackDepth` state追加、range useMemo分岐、scenarioLabel更新、ポジション変更ハンドラ更新 |
| `src/components/Controls.tsx` | Modify | Props追加、スタック深度ボタン行追加、短スタック時のシナリオ・レンジ幅非表示ロジック |

---

## Task 1: StackDepth 型を追加

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: `src/types.ts` に型と定数を追加**

  `RANGE_WIDTH_LABELS` の直後に追加：

  ```typescript
  export type StackDepth = '100' | '50' | '20' | '15' | '10';

  export const STACK_DEPTH_LABELS: Record<StackDepth, string> = {
    '100': '100BB',
    '50': '50BB',
    '20': '20BB',
    '15': '15BB',
    '10': '10BB',
  };

  export const SHORT_STACK_DEPTHS: StackDepth[] = ['20', '15', '10'];
  ```

- [ ] **Step 2: ビルド確認**

  ```bash
  cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | grep -v "__tests__"
  ```

  Expected: エラーなし

- [ ] **Step 3: Commit**

  ```bash
  git add src/types.ts
  git commit -m "feat: add StackDepth type for tournament short-stack ranges"
  ```

---

## Task 2: push-fold.ts を作成

**Files:**
- Create: `src/data/push-fold.ts`

- [ ] **Step 1: `src/data/push-fold.ts` を新規作成**

  ```typescript
  import type { HandEntry, Action } from '../types';
  import { getHandName } from '../types';
  import type { StackDepth } from '../types';

  // ── ヘルパー（ranges.ts と同じ実装）──────────────────��───────
  function emptyRange(): Record<string, HandEntry> {
    const r: Record<string, HandEntry> = {};
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j < 13; j++) {
        const h = getHandName(i, j);
        r[h] = { hand: h, action: 'fold' as Action };
      }
    }
    return r;
  }

  function setHands(range: Record<string, HandEntry>, hands: string[], action: Action, note?: string) {
    for (const h of hands) {
      range[h] = { hand: h, action, note };
    }
  }

  const pp = (min: string, max?: string): string[] => {
    const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
    const minIdx = ranks.indexOf(min);
    const maxIdx = max ? ranks.indexOf(max) : 0;
    const result: string[] = [];
    for (let i = maxIdx; i <= minIdx; i++) result.push(`${ranks[i]}${ranks[i]}`);
    return result;
  };

  // suitedFrom('A','K','T') → AKs, AQs, AJs, ATs  ※ from は高いランク
  const sf = (high: string, from: string, to: string): string[] => {
    const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
    const fromIdx = ranks.indexOf(from);
    const toIdx = ranks.indexOf(to);
    const result: string[] = [];
    for (let i = fromIdx; i <= toIdx; i++) result.push(`${high}${ranks[i]}s`);
    return result;
  };

  // ============================================================
  // PUSH RANGES（全イン推奨レンジ、アクション='raise'）
  // Nash近似。6-max、antes なし、FFTOスタック。
  // ============================================================

  function makePushRange(position: string, stackBB: StackDepth): Record<string, HandEntry> {
    const r = emptyRange();
    const note = `${stackBB}BB: 全イン（プッシュ）推奨`;

    if (stackBB === '10') {
      if (position === 'UTG') {
        // ~15%: TT+, AJs+, AQo+, KQs
        setHands(r, pp('T', 'A'), 'raise', note);
        setHands(r, sf('A','K','J'), 'raise', note);          // AKs, AQs, AJs
        setHands(r, ['AQo', 'AKo', 'KQs'], 'raise', note);
      } else if (position === 'HJ') {
        // ~20%: 88+, ATs+, AJo+, KQs, QJs
        setHands(r, pp('8', 'A'), 'raise', note);
        setHands(r, sf('A','K','T'), 'raise', note);          // AKs-ATs
        setHands(r, ['AJo', 'AQo', 'AKo', 'KQs', 'QJs'], 'raise', note);
      } else if (position === 'CO') {
        // ~27%: 66+, A8s+, ATo+, KTs+, KJo, QTs+, JTs
        setHands(r, pp('6', 'A'), 'raise', note);
        setHands(r, sf('A','K','8'), 'raise', note);          // AKs-A8s
        setHands(r, ['ATo','AJo','AQo','AKo'], 'raise', note);
        setHands(r, ['KTs','KJs','KQs','KJo','QTs','QJs','JTs'], 'raise', note);
      } else if (position === 'BTN') {
        // ~48%: 33+, A2s+, A7o+, K7s+, K9o+, Q9s+, QTo+, J9s+, T9s
        setHands(r, pp('3', 'A'), 'raise', note);
        setHands(r, sf('A','K','2'), 'raise', note);          // 全スーテッドエース
        setHands(r, ['A7o','A8o','A9o','ATo','AJo','AQo','AKo'], 'raise', note);
        setHands(r, ['K7s','K8s','K9s','KTs','KJs','KQs'], 'raise', note);
        setHands(r, ['K9o','KTo','KJo','KQo'], 'raise', note);
        setHands(r, ['Q9s','QTs','QJs','QTo','QJo','J9s','JTs','T9s'], 'raise', note);
      } else if (position === 'SB') {
        // ~65%: 22+, A2+（大半）, K5s+, K8o+, Q7s+, Q9o+, J8s+, T8s+, 97s+, 87s
        setHands(r, pp('2', 'A'), 'raise', note);
        setHands(r, sf('A','K','2'), 'raise', note);
        setHands(r, ['A3o','A4o','A5o','A6o','A7o','A8o','A9o','ATo','AJo','AQo','AKo'], 'raise', note);
        setHands(r, ['K5s','K6s','K7s','K8s','K9s','KTs','KJs','KQs'], 'raise', note);
        setHands(r, ['K8o','K9o','KTo','KJo','KQo'], 'raise', note);
        setHands(r, ['Q7s','Q8s','Q9s','QTs','QJs','Q9o','QTo','QJo'], 'raise', note);
        setHands(r, ['J8s','J9s','JTs','J9o','T8s','T9s','97s','87s'], 'raise', note);
      }
    }

    else if (stackBB === '15') {
      if (position === 'UTG') {
        // ~5%: QQ+, AKs, AKo
        setHands(r, pp('Q', 'A'), 'raise', note);
        setHands(r, ['AKs', 'AKo'], 'raise', note);
      } else if (position === 'HJ') {
        // ~9%: JJ+, AQs+, AKo, KQs
        setHands(r, pp('J', 'A'), 'raise', note);
        setHands(r, ['AQs','AKs','AKo','KQs'], 'raise', note);
      } else if (position === 'CO') {
        // ~14%: TT+, AJs+, AQo+, KQs
        setHands(r, pp('T', 'A'), 'raise', note);
        setHands(r, sf('A','K','J'), 'raise', note);          // AKs, AQs, AJs
        setHands(r, ['AQo','AKo','KQs'], 'raise', note);
      } else if (position === 'BTN') {
        // ~28%: 77+, A7s+, ATo+, K9s+, KJo+, QTs+, QJo, JTs
        setHands(r, pp('7', 'A'), 'raise', note);
        setHands(r, sf('A','K','7'), 'raise', note);          // AKs-A7s
        setHands(r, ['ATo','AJo','AQo','AKo'], 'raise', note);
        setHands(r, ['K9s','KTs','KJs','KQs','KJo','KQo'], 'raise', note);
        setHands(r, ['QTs','QJs','QJo','JTs'], 'raise', note);
      } else if (position === 'SB') {
        // ~35%: 55+, A5s+, A8o+, K9s+, KJo+, QTs+, JTs, T9s
        setHands(r, pp('5', 'A'), 'raise', note);
        setHands(r, sf('A','K','5'), 'raise', note);          // AKs-A5s
        setHands(r, ['A8o','A9o','ATo','AJo','AQo','AKo'], 'raise', note);
        setHands(r, ['K9s','KTs','KJs','KQs','KJo','KQo'], 'raise', note);
        setHands(r, ['QTs','QJs','QJo','JTs','T9s'], 'raise', note);
      }
    }

    else if (stackBB === '20') {
      if (position === 'UTG') {
        // ~3%: KK+, AKs, AKo
        setHands(r, pp('K', 'A'), 'raise', note);
        setHands(r, ['AKs','AKo'], 'raise', note);
      } else if (position === 'HJ') {
        // ~6%: QQ+, AQs+, AKo
        setHands(r, pp('Q', 'A'), 'raise', note);
        setHands(r, ['AQs','AKs','AKo'], 'raise', note);
      } else if (position === 'CO') {
        // ~9%: JJ+, AQs+, AKo, KQs
        setHands(r, pp('J', 'A'), 'raise', note);
        setHands(r, sf('A','K','Q'), 'raise', note);          // AKs, AQs
        setHands(r, ['AKo','KQs'], 'raise', note);
      } else if (position === 'BTN') {
        // ~18%: 88+, ATs+, AJo+, KTs+, KQo, QJs
        setHands(r, pp('8', 'A'), 'raise', note);
        setHands(r, sf('A','K','T'), 'raise', note);          // AKs-ATs
        setHands(r, ['AJo','AQo','AKo'], 'raise', note);
        setHands(r, ['KTs','KJs','KQs','KQo','QJs'], 'raise', note);
      } else if (position === 'SB') {
        // ~25%: 55+, A7s+, A9o+, KTs+, KQo, QJs, JTs
        setHands(r, pp('5', 'A'), 'raise', note);
        setHands(r, sf('A','K','7'), 'raise', note);          // AKs-A7s
        setHands(r, ['A9o','ATo','AJo','AQo','AKo'], 'raise', note);
        setHands(r, ['KTs','KJs','KQs','KQo','QJs','JTs'], 'raise', note);
      }
    }

    return r;
  }

  // ============================================================
  // CALL RANGES（プッシュに対するBBコールレンジ、アクション='call'）
  // pusherPos: プッシュしてきた相手のポジション
  // ============================================================

  function makeCallRange(pusherPos: string, stackBB: StackDepth): Record<string, HandEntry> {
    const r = emptyRange();
    const note = `${stackBB}BB: コール推奨（vs ${pusherPos} プッシュ）`;

    if (stackBB === '10') {
      if (pusherPos === 'UTG') {
        // UTGプッシュレンジ~15%に対してコール: 88+, ATs+, AJo+, KQs
        setHands(r, pp('8', 'A'), 'call', note);
        setHands(r, sf('A','K','T'), 'call', note);
        setHands(r, ['AJo','AQo','AKo','KQs'], 'call', note);
      } else if (pusherPos === 'HJ') {
        // ~20%プッシュに対して: 66+, A9s+, AJo+, KTs+, QJs
        setHands(r, pp('6', 'A'), 'call', note);
        setHands(r, sf('A','K','9'), 'call', note);
        setHands(r, ['AJo','AQo','AKo','KTs','KJs','KQs','QJs'], 'call', note);
      } else if (pusherPos === 'CO') {
        // ~27%プッシュに対して: 55+, A7s+, ATo+, K9s+, KJo, QTs+, JTs
        setHands(r, pp('5', 'A'), 'call', note);
        setHands(r, sf('A','K','7'), 'call', note);
        setHands(r, ['ATo','AJo','AQo','AKo'], 'call', note);
        setHands(r, ['K9s','KTs','KJs','KQs','KJo','QTs','QJs','JTs'], 'call', note);
      } else if (pusherPos === 'BTN') {
        // ~48%プッシュに対して: 44+, A4s+, A8o+, K8s+, KTo+, Q9s+, QJo, JTs, T9s
        setHands(r, pp('4', 'A'), 'call', note);
        setHands(r, sf('A','K','4'), 'call', note);
        setHands(r, ['A8o','A9o','ATo','AJo','AQo','AKo'], 'call', note);
        setHands(r, ['K8s','K9s','KTs','KJs','KQs','KTo','KJo','KQo'], 'call', note);
        setHands(r, ['Q9s','QTs','QJs','QJo','JTs','T9s'], 'call', note);
      } else if (pusherPos === 'SB') {
        // ~65%プッシュに対して: 33+, A2s+, A6o+, K7s+, K9o+, Q9s+, QTo+, J9s+, T9s
        setHands(r, pp('3', 'A'), 'call', note);
        setHands(r, sf('A','K','2'), 'call', note);
        setHands(r, ['A6o','A7o','A8o','A9o','ATo','AJo','AQo','AKo'], 'call', note);
        setHands(r, ['K7s','K8s','K9s','KTs','KJs','KQs','K9o','KTo','KJo','KQo'], 'call', note);
        setHands(r, ['Q9s','QTs','QJs','QTo','QJo','J9s','JTs','T9s'], 'call', note);
      }
    }

    else if (stackBB === '15') {
      if (pusherPos === 'UTG') {
        // UTGプッシュ~5%に対して: QQ+, AKs, AKo
        setHands(r, pp('Q', 'A'), 'call', note);
        setHands(r, ['AKs','AKo'], 'call', note);
      } else if (pusherPos === 'HJ') {
        // ~9%に対して: JJ+, AQs+, AKo, KQs
        setHands(r, pp('J', 'A'), 'call', note);
        setHands(r, ['AQs','AKs','AKo','KQs'], 'call', note);
      } else if (pusherPos === 'CO') {
        // ~14%に対して: TT+, AJs+, AQo+, KQs
        setHands(r, pp('T', 'A'), 'call', note);
        setHands(r, sf('A','K','J'), 'call', note);
        setHands(r, ['AQo','AKo','KQs'], 'call', note);
      } else if (pusherPos === 'BTN') {
        // ~28%に対して: 77+, A8s+, AJo+, KTs+, KQo, QJs
        setHands(r, pp('7', 'A'), 'call', note);
        setHands(r, sf('A','K','8'), 'call', note);
        setHands(r, ['AJo','AQo','AKo','KTs','KJs','KQs','KQo','QJs'], 'call', note);
      } else if (pusherPos === 'SB') {
        // ~35%に対して: 55+, A5s+, A9o+, K9s+, KJo+, QTs+, JTs
        setHands(r, pp('5', 'A'), 'call', note);
        setHands(r, sf('A','K','5'), 'call', note);
        setHands(r, ['A9o','ATo','AJo','AQo','AKo'], 'call', note);
        setHands(r, ['K9s','KTs','KJs','KQs','KJo','KQo','QTs','QJs','JTs'], 'call', note);
      }
    }

    else if (stackBB === '20') {
      if (pusherPos === 'UTG') {
        // UTGプッシュ~3%に対して: QQ+, AKs, AKo
        setHands(r, pp('Q', 'A'), 'call', note);
        setHands(r, ['AKs','AKo'], 'call', note);
      } else if (pusherPos === 'HJ') {
        // ~6%に対して: JJ+, AQs+, AKo, KQs
        setHands(r, pp('J', 'A'), 'call', note);
        setHands(r, ['AQs','AKs','AKo','KQs'], 'call', note);
      } else if (pusherPos === 'CO') {
        // ~9%に対して: TT+, AJs+, AQo+, KQs
        setHands(r, pp('T', 'A'), 'call', note);
        setHands(r, sf('A','K','J'), 'call', note);
        setHands(r, ['AQo','AKo','KQs'], 'call', note);
      } else if (pusherPos === 'BTN') {
        // ~18%に対して: 88+, ATs+, AJo+, KQs, KQo, QJs
        setHands(r, pp('8', 'A'), 'call', note);
        setHands(r, sf('A','K','T'), 'call', note);
        setHands(r, ['AJo','AQo','AKo','KQs','KQo','QJs'], 'call', note);
      } else if (pusherPos === 'SB') {
        // ~25%に対して: 66+, A8s+, ATo+, KTs+, KJo+, QJs, JTs
        setHands(r, pp('6', 'A'), 'call', note);
        setHands(r, sf('A','K','8'), 'call', note);
        setHands(r, ['ATo','AJo','AQo','AKo'], 'call', note);
        setHands(r, ['KTs','KJs','KQs','KJo','KQo','QJs','JTs'], 'call', note);
      }
    }

    return r;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  export function getPushRange(position: string, stackBB: StackDepth): Record<string, HandEntry> {
    return makePushRange(position, stackBB);
  }

  export function getCallRange(pusherPos: string, stackBB: StackDepth): Record<string, HandEntry> {
    return makeCallRange(pusherPos, stackBB);
  }
  ```

- [ ] **Step 2: ビルド確認**

  ```bash
  cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | grep -v "__tests__"
  ```

  Expected: エラーなし

- [ ] **Step 3: Commit**

  ```bash
  git add src/data/push-fold.ts
  git commit -m "feat: add Nash push/fold range data for 10/15/20BB stacks"
  ```

---

## Task 3: App.tsx を更新

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import を追加**

  `App.tsx` の import ブロックに追加（既存の `getOpenRange` インポートの後）：

  ```typescript
  import { getPushRange, getCallRange } from './data/push-fold';
  import type { StackDepth } from './types';
  import { STACK_DEPTH_LABELS, SHORT_STACK_DEPTHS } from './types';
  ```

- [ ] **Step 2: `stackDepth` state を追加**

  `safeMode` state の直後に追加：

  ```typescript
  const [stackDepth, setStackDepth] = useState<StackDepth>('100');
  ```

- [ ] **Step 3: `handlePositionChange` を短スタック対応に更新**

  既存の `handlePositionChange` 関数全体を以下に置き換える：

  ```typescript
  const handlePositionChange = (pos: Position) => {
    setMyPosition(pos);
    setSelectedHand(null);

    const isShortStack = SHORT_STACK_DEPTHS.includes(stackDepth);
    if (isShortStack) {
      // 短スタック時: BBはコール、それ以外はプッシュモード
      setMode(pos === 'BB' ? 'bbDefense' : 'open');
      return;
    }

    const scenarios = getAvailableScenarios(pos);

    if (UTILITY_MODES.includes(mode)) {
      setMode(scenarios[0].mode);
      if (scenarios[0].sbScenario) setSbVsBbScenario(scenarios[0].sbScenario);
      return;
    }

    const stillAvailable = scenarios.some(s => {
      if (s.mode !== mode) return false;
      if (s.mode === 'sbVsBb' && s.sbScenario !== sbVsBbScenario) return false;
      return true;
    });

    if (!stillAvailable) {
      setMode(scenarios[0].mode);
      if (scenarios[0].sbScenario) setSbVsBbScenario(scenarios[0].sbScenario);
    }

    const effectiveMode = stillAvailable ? mode : scenarios[0].mode;
    if (effectiveMode === 'vsOpen') {
      const posOrder: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      const myIdx = posOrder.indexOf(pos);
      const opIdx = posOrder.indexOf(openerPosition);
      if (opIdx >= myIdx) {
        setOpenerPosition(posOrder[0]);
      }
    }
  };
  ```

- [ ] **Step 4: `handleStackDepthChange` 関数を追加**

  `handleUtilityModeChange` の直後に追加：

  ```typescript
  const handleStackDepthChange = (depth: StackDepth) => {
    setStackDepth(depth);
    const isShortStack = SHORT_STACK_DEPTHS.includes(depth);
    if (isShortStack) {
      // 非対応モードから抜ける
      if (UTILITY_MODES.includes(mode)) return;
      const validModes: Mode[] = myPosition === 'BB' ? ['bbDefense'] : ['open'];
      if (!validModes.includes(mode)) {
        setMode(myPosition === 'BB' ? 'bbDefense' : 'open');
      }
    }
  };
  ```

- [ ] **Step 5: `range` useMemo を短スタック分岐対応に更新**

  既存の `range = useMemo(...)` ブロック全体を以下に置き換える：

  ```typescript
  const range = useMemo((): Record<string, HandEntry> => {
    const isShortStack = SHORT_STACK_DEPTHS.includes(stackDepth);

    if (isShortStack) {
      if (mode === 'open') return getPushRange(myPosition, stackDepth);
      if (mode === 'bbDefense') return getCallRange(openerPosition, stackDepth);
      return {};
    }

    let base: Record<string, HandEntry>;
    switch (mode) {
      case 'open':
        base = getOpenRange(myPosition, rangeWidth);
        break;
      case 'vsOpen':
        base = getVsOpenRange(myPosition, openerPosition, rangeWidth);
        break;
      case 'vs3Bet':
        base = getVs3BetRange(myPosition, rangeWidth);
        break;
      case 'bbDefense':
        base = getBBDefenseRange(openerPosition, rangeWidth);
        break;
      case 'sbVsBb':
        base = getSBvsBBRange(sbVsBbScenario, rangeWidth);
        break;
      default:
        return {};
    }
    if (safeMode) {
      const safeModeKey = mode === 'sbVsBb' ? 'sbVsBb' : mode;
      return applySafeMode(base, safeModeKey);
    }
    return base;
  }, [mode, myPosition, openerPosition, rangeWidth, sbVsBbScenario, safeMode, stackDepth]);
  ```

- [ ] **Step 6: `scenarioLabel` useMemo を短スタック対応に更新**

  既存の `scenarioLabel = useMemo(...)` ブロック全体を以下に置き換える：

  ```typescript
  const scenarioLabel = useMemo(() => {
    const isShortStack = SHORT_STACK_DEPTHS.includes(stackDepth);
    const stackLabel = STACK_DEPTH_LABELS[stackDepth];
    const anteStr = hasAnte ? 'アンティあり' : 'アンティなし';
    const safeStr = safeMode ? ' / 安全寄り' : '';

    if (isShortStack) {
      if (mode === 'open') return `${myPosition} プッシュ / ${stackLabel} / ${anteStr}`;
      if (mode === 'bbDefense') return `BB vs ${openerPosition} プッシュ / ${stackLabel}`;
      return '';
    }

    switch (mode) {
      case 'open':
        return `${myPosition} Open / ${RANGE_WIDTH_LABELS[rangeWidth]} / ${stackLabel} / ${anteStr}${safeStr}`;
      case 'vsOpen':
        return `${myPosition} vs ${openerPosition} Open / ${stackLabel} / ${anteStr}${safeStr}`;
      case 'vs3Bet':
        return `${myPosition} Open vs 3Bet / ${stackLabel} / ${anteStr}${safeStr}`;
      case 'bbDefense':
        return `BB vs ${openerPosition} Open / ${RANGE_WIDTH_LABELS[rangeWidth]} / ${stackLabel} / ${anteStr}${safeStr}`;
      case 'sbVsBb':
        return sbVsBbScenario === 'sbOpen'
          ? `SB Open vs BB / ${RANGE_WIDTH_LABELS[rangeWidth]} / ${stackLabel} / ${anteStr}${safeStr}`
          : `BB Defense vs SB Open / ${stackLabel} / ${anteStr}${safeStr}`;
      default:
        return '';
    }
  }, [mode, myPosition, openerPosition, rangeWidth, hasAnte, sbVsBbScenario, safeMode, stackDepth]);
  ```

- [ ] **Step 7: Controls に `stackDepth` / `onStackDepthChange` props を渡す**

  `<Controls` の props に追加：

  ```tsx
  <Controls
    mode={mode}
    myPosition={myPosition}
    onPositionChange={handlePositionChange}
    onScenarioChange={handleScenarioChange}
    onUtilityModeChange={handleUtilityModeChange}
    openerPosition={openerPosition}
    onOpenerPositionChange={(p) => { setOpenerPosition(p); }}
    rangeWidth={rangeWidth}
    onRangeWidthChange={(w) => { setRangeWidth(w); }}
    hasAnte={hasAnte}
    onAnteChange={setHasAnte}
    sbVsBbScenario={sbVsBbScenario}
    safeMode={safeMode}
    onSafeModeChange={setSafeMode}
    stackDepth={stackDepth}
    onStackDepthChange={handleStackDepthChange}
  />
  ```

- [ ] **Step 8: ビルド確認**

  ```bash
  cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | grep -v "__tests__"
  ```

  Expected: Controls.tsx の props 不足エラーが出る（次タスクで修正）。それ以外はエラーなし。

---

## Task 4: Controls.tsx を更新

**Files:**
- Modify: `src/components/Controls.tsx`

- [ ] **Step 1: import に StackDepth 関連を追加**

  既存の import 行を以下に置き換える：

  ```typescript
  import type { Mode, Position, RangeWidth, StackDepth } from '../types';
  import { MODE_LABELS, RANGE_WIDTH_LABELS, STACK_DEPTH_LABELS, SHORT_STACK_DEPTHS } from '../types';
  ```

- [ ] **Step 2: 短スタック用シナリオ定義を追加**

  `POSITION_SCENARIOS` の直後に追加：

  ```typescript
  const SHORT_STACK_SCENARIOS: Record<Position, ScenarioTab[]> = {
    UTG: [{ label: 'プッシュ', mode: 'open' }],
    HJ: [{ label: 'プッシュ', mode: 'open' }],
    CO: [{ label: 'プッシュ', mode: 'open' }],
    BTN: [{ label: 'プッシュ', mode: 'open' }],
    SB: [{ label: 'プッシュ（vs BB）', mode: 'open' }],
    BB: [{ label: 'コール vs プッシュ', mode: 'bbDefense' }],
  };
  ```

- [ ] **Step 3: Props interface に stackDepth / onStackDepthChange を追加**

  既存の `interface Props` を以下に置き換える：

  ```typescript
  interface Props {
    mode: Mode;
    myPosition: Position;
    onPositionChange: (pos: Position) => void;
    onScenarioChange: (mode: Mode, sbScenario?: 'sbOpen' | 'bbDefVsSb') => void;
    onUtilityModeChange: (mode: Mode) => void;
    openerPosition: Position;
    onOpenerPositionChange: (pos: Position) => void;
    rangeWidth: RangeWidth;
    onRangeWidthChange: (w: RangeWidth) => void;
    hasAnte: boolean;
    onAnteChange: (v: boolean) => void;
    sbVsBbScenario: 'sbOpen' | 'bbDefVsSb';
    safeMode: boolean;
    onSafeModeChange: (v: boolean) => void;
    stackDepth: StackDepth;
    onStackDepthChange: (d: StackDepth) => void;
  }
  ```

- [ ] **Step 4: 関数シグネチャに props を追加して内部ロジックを更新**

  既存の `export default function Controls({...})` の引数部分と内部ロジックの `const isRangeMode` 〜 `const showRangeWidth` を以下に置き換える：

  ```typescript
  export default function Controls({
    mode, myPosition,
    onPositionChange, onScenarioChange, onUtilityModeChange,
    openerPosition, onOpenerPositionChange,
    rangeWidth, onRangeWidthChange,
    hasAnte, onAnteChange,
    sbVsBbScenario,
    safeMode, onSafeModeChange,
    stackDepth, onStackDepthChange,
  }: Props) {
    const isShortStack = SHORT_STACK_DEPTHS.includes(stackDepth);
    const isRangeMode = !UTILITY_MODES.includes(mode);
    const scenarios = isShortStack ? SHORT_STACK_SCENARIOS[myPosition] : POSITION_SCENARIOS[myPosition];
    const availableOpenerPos = getAvailableOpenerPositions(mode, myPosition);
    const showOpenerSelect = !isShortStack && ['vsOpen', 'bbDefense'].includes(mode)
      || isShortStack && mode === 'bbDefense';
    const showRangeWidth = !isShortStack && ['open', 'bbDefense', 'sbVsBb'].includes(mode);
    const stackDepths: StackDepth[] = ['100', '50', '20', '15', '10'];
  ```

- [ ] **Step 5: スタック深度ボタン行を追加**

  `{/* Position selector — always visible, primary control */}` の `<div>` の直前に追加：

  ```tsx
  {/* Stack depth selector */}
  <div className="flex flex-wrap justify-center gap-1.5">
    {stackDepths.map(d => (
      <button
        key={d}
        onClick={() => onStackDepthChange(d)}
        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${
          stackDepth === d
            ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
        }`}
      >
        {STACK_DEPTH_LABELS[d]}
      </button>
    ))}
  </div>
  ```

- [ ] **Step 6: 短スタック時にアンティ・セーフモードを非表示**

  既存の `{/* Ante + Safe mode */}` ブロック全体を以下に置き換える：

  ```tsx
  {/* Ante + Safe mode (100BB/50BBのみ) */}
  {!isShortStack && (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div className="flex items-center gap-1.5">
        <label className="text-sm text-gray-400 font-medium">アンティ:</label>
        <button
          onClick={() => onAnteChange(!hasAnte)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] ${
            hasAnte
              ? 'bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {hasAnte ? 'あり' : 'なし'}
        </button>
      </div>
      <button
        onClick={() => onSafeModeChange(!safeMode)}
        className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border min-h-[44px] ${
          safeMode
            ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-600/20'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-gray-700'
        }`}
      >
        🛡 {safeMode ? '安全寄りモード ON' : '安全寄りモード'}
      </button>
    </div>
  )}
  ```

- [ ] **Step 7: ビルド確認**

  ```bash
  cd "Y:/THマトリックス" && npx tsc --noEmit 2>&1 | grep -v "__tests__"
  ```

  Expected: エラーなし

- [ ] **Step 8: Commit**

  ```bash
  git add src/types.ts src/data/push-fold.ts src/App.tsx src/components/Controls.tsx
  git commit -m "feat: add stack depth selector with push/fold ranges for 10/15/20BB"
  ```

---

## Task 5: Push & 動作確認

- [ ] **Step 1: `git push`**

  ```bash
  git push origin main
  ```

- [ ] **Step 2: ローカル dev サーバーで動作確認**

  ```bash
  cd "Y:/THマトリックス" && npm run dev
  ```

  確認項目：
  - スタック選択ボタン（100BB〜10BB）が表示される
  - **10BB / UTG** → プッシュタブのみ → ハンド数 ~25（TT+, AJs+, AQo+, KQs = 約25ハンド）
  - **10BB / BTN** → ハンド数 ~81（全ハンドの~48%）
  - **10BB / BB** → 「コール vs プッシュ」タブ + 相手セレクタが表示される
  - **10BB / BB / vs BTN** → ハンド数 ~37（44+, A4s+...）
  - **100BB に戻す** → 通常のレンジ幅タブが復活する
  - **scenarioLabel** が「BTN プッシュ / 10BB / アンティなし」と表示される

- [ ] **Step 3: エッジケース確認**

  - BTN で 10BB に切り替えてから UTG に変更 → プッシュタブで UTG プッシュレンジが表示される
  - BBで10BBに切り替え → 「コール vs プッシュ」タブが表示され、SB選択で最も広いコールレンジが出る
  - 50BB → 100BB と同じレンジが表示される（50BBは将来の拡張用）
  - 短スタック → 100BBに戻す → アンティ・安全寄りモードが復活する

---

## Self-Review

**Spec coverage:**
- ✅ スタックデプス型追加 (Task 1)
- ✅ 10/15/20BB Nash push range 5ポジション × 3スタック (Task 2)
- ✅ 10/15/20BB Nash call range 5プッシャー × 3スタック (Task 2)
- ✅ App.tsx range routing (Task 3)
- ✅ scenarioLabel にスタック深度表示 (Task 3)
- ✅ スタック切替時のモード自動修正 (Task 3 Step 4)
- ✅ ポジション変更時の短スタック対応 (Task 3 Step 3)
- ✅ スタック選択UI (Task 4 Step 5)
- ✅ 短スタック時レンジ幅非表示 (Task 4 Step 4)
- ✅ 短スタック時アンティ・セーフモード非表示 (Task 4 Step 6)
- ✅ 既存 100BB レンジへの影響なし (ranges.ts 変更なし)

**Type consistency:**
- `StackDepth` 定義 Task 1 → import Task 2/3/4 ✓
- `SHORT_STACK_DEPTHS` 定義 Task 1 → 使用 Task 3/4 ✓
- `getPushRange(position, stackBB: StackDepth)` 定義 Task 2 → 呼び出し Task 3 ✓
- `getCallRange(pusherPos, stackBB: StackDepth)` 定義 Task 2 → 呼び出し Task 3 ✓
- Controls props `stackDepth` / `onStackDepthChange` 定義 Task 4 → 渡し Task 3 Step 7 ✓

**注意:** BBの `bbDefense` 短スタックモードでは `openerPosition` を「プッシュしてきた相手」として利用。既存の opener セレクタがそのまま使えるため UI 変更最小。
