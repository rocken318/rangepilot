import type { HandEntry, Action } from '../types';
import { getHandName } from '../types';
import type { StackDepth } from '../types';

// ── ヘルパー（ranges.ts と同じ実装）────────────────────────────
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

// sf('A','K','T') → AKs, AQs, AJs, ATs
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
// ============================================================

function makePushRange(position: string, stackBB: StackDepth): Record<string, HandEntry> {
  const r = emptyRange();
  const note = `${stackBB}BB: 全イン（プッシュ）推奨`;

  if (stackBB === '10') {
    if (position === 'UTG') {
      setHands(r, pp('T', 'A'), 'raise', note);
      setHands(r, sf('A','K','J'), 'raise', note);
      setHands(r, ['AQo', 'AKo', 'KQs'], 'raise', note);
    } else if (position === 'HJ') {
      setHands(r, pp('8', 'A'), 'raise', note);
      setHands(r, sf('A','K','T'), 'raise', note);
      setHands(r, ['AJo', 'AQo', 'AKo', 'KQs', 'QJs'], 'raise', note);
    } else if (position === 'CO') {
      setHands(r, pp('6', 'A'), 'raise', note);
      setHands(r, sf('A','K','8'), 'raise', note);
      setHands(r, ['ATo','AJo','AQo','AKo'], 'raise', note);
      setHands(r, ['KTs','KJs','KQs','KJo','QTs','QJs','JTs'], 'raise', note);
    } else if (position === 'BTN') {
      setHands(r, pp('3', 'A'), 'raise', note);
      setHands(r, sf('A','K','2'), 'raise', note);
      setHands(r, ['A7o','A8o','A9o','ATo','AJo','AQo','AKo'], 'raise', note);
      setHands(r, ['K7s','K8s','K9s','KTs','KJs','KQs'], 'raise', note);
      setHands(r, ['K9o','KTo','KJo','KQo'], 'raise', note);
      setHands(r, ['Q9s','QTs','QJs','QTo','QJo','J9s','JTs','T9s'], 'raise', note);
    } else if (position === 'SB') {
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
      setHands(r, pp('Q', 'A'), 'raise', note);
      setHands(r, ['AKs', 'AKo'], 'raise', note);
    } else if (position === 'HJ') {
      setHands(r, pp('J', 'A'), 'raise', note);
      setHands(r, ['AQs','AKs','AKo','KQs'], 'raise', note);
    } else if (position === 'CO') {
      setHands(r, pp('T', 'A'), 'raise', note);
      setHands(r, sf('A','K','J'), 'raise', note);
      setHands(r, ['AQo','AKo','KQs'], 'raise', note);
    } else if (position === 'BTN') {
      setHands(r, pp('7', 'A'), 'raise', note);
      setHands(r, sf('A','K','7'), 'raise', note);
      setHands(r, ['ATo','AJo','AQo','AKo'], 'raise', note);
      setHands(r, ['K9s','KTs','KJs','KQs','KJo','KQo'], 'raise', note);
      setHands(r, ['QTs','QJs','QJo','JTs'], 'raise', note);
    } else if (position === 'SB') {
      setHands(r, pp('5', 'A'), 'raise', note);
      setHands(r, sf('A','K','5'), 'raise', note);
      setHands(r, ['A8o','A9o','ATo','AJo','AQo','AKo'], 'raise', note);
      setHands(r, ['K9s','KTs','KJs','KQs','KJo','KQo'], 'raise', note);
      setHands(r, ['QTs','QJs','QJo','JTs','T9s'], 'raise', note);
    }
  }

  else if (stackBB === '20') {
    if (position === 'UTG') {
      setHands(r, pp('K', 'A'), 'raise', note);
      setHands(r, ['AKs','AKo'], 'raise', note);
    } else if (position === 'HJ') {
      setHands(r, pp('Q', 'A'), 'raise', note);
      setHands(r, ['AQs','AKs','AKo'], 'raise', note);
    } else if (position === 'CO') {
      setHands(r, pp('J', 'A'), 'raise', note);
      setHands(r, sf('A','K','Q'), 'raise', note);
      setHands(r, ['AKo','KQs'], 'raise', note);
    } else if (position === 'BTN') {
      setHands(r, pp('8', 'A'), 'raise', note);
      setHands(r, sf('A','K','T'), 'raise', note);
      setHands(r, ['AJo','AQo','AKo'], 'raise', note);
      setHands(r, ['KTs','KJs','KQs','KQo','QJs'], 'raise', note);
    } else if (position === 'SB') {
      setHands(r, pp('5', 'A'), 'raise', note);
      setHands(r, sf('A','K','7'), 'raise', note);
      setHands(r, ['A9o','ATo','AJo','AQo','AKo'], 'raise', note);
      setHands(r, ['KTs','KJs','KQs','KQo','QJs','JTs'], 'raise', note);
    }
  }

  return r;
}

// ============================================================
// CALL RANGES（プッシュに対するBBコールレンジ、アクション='call'）
// ============================================================

function makeCallRange(pusherPos: string, stackBB: StackDepth): Record<string, HandEntry> {
  const r = emptyRange();
  const note = `${stackBB}BB: コール推奨（vs ${pusherPos} プッシュ）`;

  if (stackBB === '10') {
    if (pusherPos === 'UTG') {
      setHands(r, pp('8', 'A'), 'call', note);
      setHands(r, sf('A','K','T'), 'call', note);
      setHands(r, ['AJo','AQo','AKo','KQs'], 'call', note);
    } else if (pusherPos === 'HJ') {
      setHands(r, pp('6', 'A'), 'call', note);
      setHands(r, sf('A','K','9'), 'call', note);
      setHands(r, ['AJo','AQo','AKo','KTs','KJs','KQs','QJs'], 'call', note);
    } else if (pusherPos === 'CO') {
      setHands(r, pp('5', 'A'), 'call', note);
      setHands(r, sf('A','K','7'), 'call', note);
      setHands(r, ['ATo','AJo','AQo','AKo'], 'call', note);
      setHands(r, ['K9s','KTs','KJs','KQs','KJo','QTs','QJs','JTs'], 'call', note);
    } else if (pusherPos === 'BTN') {
      setHands(r, pp('4', 'A'), 'call', note);
      setHands(r, sf('A','K','4'), 'call', note);
      setHands(r, ['A8o','A9o','ATo','AJo','AQo','AKo'], 'call', note);
      setHands(r, ['K8s','K9s','KTs','KJs','KQs','KTo','KJo','KQo'], 'call', note);
      setHands(r, ['Q9s','QTs','QJs','QJo','JTs','T9s'], 'call', note);
    } else if (pusherPos === 'SB') {
      setHands(r, pp('3', 'A'), 'call', note);
      setHands(r, sf('A','K','2'), 'call', note);
      setHands(r, ['A6o','A7o','A8o','A9o','ATo','AJo','AQo','AKo'], 'call', note);
      setHands(r, ['K7s','K8s','K9s','KTs','KJs','KQs','K9o','KTo','KJo','KQo'], 'call', note);
      setHands(r, ['Q9s','QTs','QJs','QTo','QJo','J9s','JTs','T9s'], 'call', note);
    }
  }

  else if (stackBB === '15') {
    if (pusherPos === 'UTG') {
      setHands(r, pp('Q', 'A'), 'call', note);
      setHands(r, ['AKs','AKo'], 'call', note);
    } else if (pusherPos === 'HJ') {
      setHands(r, pp('J', 'A'), 'call', note);
      setHands(r, ['AQs','AKs','AKo','KQs'], 'call', note);
    } else if (pusherPos === 'CO') {
      setHands(r, pp('T', 'A'), 'call', note);
      setHands(r, sf('A','K','J'), 'call', note);
      setHands(r, ['AQo','AKo','KQs'], 'call', note);
    } else if (pusherPos === 'BTN') {
      setHands(r, pp('7', 'A'), 'call', note);
      setHands(r, sf('A','K','8'), 'call', note);
      setHands(r, ['AJo','AQo','AKo','KTs','KJs','KQs','KQo','QJs'], 'call', note);
    } else if (pusherPos === 'SB') {
      setHands(r, pp('5', 'A'), 'call', note);
      setHands(r, sf('A','K','5'), 'call', note);
      setHands(r, ['A9o','ATo','AJo','AQo','AKo'], 'call', note);
      setHands(r, ['K9s','KTs','KJs','KQs','KJo','KQo','QTs','QJs','JTs'], 'call', note);
    }
  }

  else if (stackBB === '20') {
    if (pusherPos === 'UTG') {
      setHands(r, pp('Q', 'A'), 'call', note);
      setHands(r, ['AKs','AKo'], 'call', note);
    } else if (pusherPos === 'HJ') {
      setHands(r, pp('J', 'A'), 'call', note);
      setHands(r, ['AQs','AKs','AKo','KQs'], 'call', note);
    } else if (pusherPos === 'CO') {
      setHands(r, pp('T', 'A'), 'call', note);
      setHands(r, sf('A','K','J'), 'call', note);
      setHands(r, ['AQo','AKo','KQs'], 'call', note);
    } else if (pusherPos === 'BTN') {
      setHands(r, pp('8', 'A'), 'call', note);
      setHands(r, sf('A','K','T'), 'call', note);
      setHands(r, ['AJo','AQo','AKo','KQs','KQo','QJs'], 'call', note);
    } else if (pusherPos === 'SB') {
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
