import type { HandEntry, Action } from '../types';
import { getHandName } from '../types';

// Helper: create a full 13x13 fold range
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

// All pocket pairs from max down to min (inclusive)
const pp = (min: string, max?: string): string[] => {
  const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
  const minIdx = ranks.indexOf(min);
  const maxIdx = max ? ranks.indexOf(max) : 0;
  const result: string[] = [];
  for (let i = maxIdx; i <= minIdx; i++) {
    result.push(`${ranks[i]}${ranks[i]}`);
  }
  return result;
};

// Suited hands: e.g. suitedFrom('A', 'K', 'T') => AKs, AQs, AJs, ATs
const suitedFrom = (high: string, from: string, to?: string): string[] => {
  const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
  const fromIdx = ranks.indexOf(from);
  const toIdx = to ? ranks.indexOf(to) : fromIdx;
  const result: string[] = [];
  for (let i = fromIdx; i <= toIdx; i++) {
    result.push(`${high}${ranks[i]}s`);
  }
  return result;
};


// ============================================================
// OPEN RANGES
// ============================================================

function makeOpenRange(position: string, width: string): Record<string, HandEntry> {
  const r = emptyRange();

  if (position === 'UTG') {
    if (width === 'ultraTight') {
      setHands(r, pp('T', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','J')], 'raise');
      setHands(r, ['AKo'], 'raise');
      setHands(r, pp('9','9'), 'mixed', 'テーブルが緩いならレイズ');
    } else if (width === 'tight') {
      setHands(r, pp('7', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','T'), 'KQs', 'QJs'], 'raise');
      setHands(r, ['AKo','AQo'], 'raise');
      setHands(r, ['A9s','KJs','QTs','JTs'], 'mixed', '状況次第でレイズ');
      setHands(r, pp('6','6'), 'mixed', 'テーブルが緩いならオープン');
    } else if (width === 'standard') {
      setHands(r, pp('5', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','9'), 'KQs','KJs','KTs', 'QJs','QTs','JTs'], 'raise');
      setHands(r, ['AKo','AQo','AJo','KQo'], 'raise');
      setHands(r, ['A8s','K9s','T9s','98s'], 'mixed', '状況次第でオープン');
      setHands(r, pp('4','4'), 'mixed', '弱いがセット狙いで参加可能');
    } else if (width === 'loose') {
      setHands(r, pp('3', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','7'), 'KQs','KJs','KTs','K9s', 'QJs','QTs','JTs','T9s','98s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo'], 'raise');
      setHands(r, ['A6s','K8s','Q9s','J9s','87s'], 'mixed');
      setHands(r, pp('2','2'), 'mixed');
    } else { // ultraLoose
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','5'), 'KQs','KJs','KTs','K9s','K8s', 'QJs','QTs','Q9s', 'JTs','J9s','T9s','98s','87s','76s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo','QJo'], 'raise');
      setHands(r, ['A4s','A3s','K7s','Q8s','J8s','T8s','65s'], 'mixed');
    }
  }

  else if (position === 'HJ') {
    if (width === 'ultraTight') {
      setHands(r, pp('8', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','T'), 'KQs'], 'raise');
      setHands(r, ['AKo','AQo'], 'raise');
      setHands(r, pp('7','7'), 'mixed');
      setHands(r, ['A9s','KJs','QJs'], 'mixed');
    } else if (width === 'tight') {
      setHands(r, pp('5', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','9'), 'KQs','KJs','KTs', 'QJs','QTs','JTs'], 'raise');
      setHands(r, ['AKo','AQo','AJo','KQo'], 'raise');
      setHands(r, ['A8s','K9s','T9s','98s'], 'mixed');
      setHands(r, pp('4','4'), 'mixed');
    } else if (width === 'standard') {
      setHands(r, pp('3', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','7'), 'KQs','KJs','KTs','K9s', 'QJs','QTs','JTs','T9s','98s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo'], 'raise');
      setHands(r, ['A6s','K8s','Q9s','J9s','87s','76s'], 'mixed');
      setHands(r, ['KJo'], 'mixed', 'HJからKJoは微妙。相手次第');
      setHands(r, pp('2','2'), 'mixed');
    } else if (width === 'loose') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','5'), 'KQs','KJs','KTs','K9s','K8s', 'QJs','QTs','Q9s', 'JTs','J9s','T9s','98s','87s','76s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo','QJo'], 'raise');
      setHands(r, ['A4s','A3s','K7s','Q8s','J8s','T8s','65s'], 'mixed');
    } else { // ultraLoose
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','2'), 'KQs','KJs','KTs','K9s','K8s','K7s', 'QJs','QTs','Q9s','Q8s', 'JTs','J9s','J8s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo'], 'raise');
      setHands(r, ['K6s','Q7s','J7s','T7s','96s','85s','74s','53s'], 'mixed');
    }
  }

  else if (position === 'CO') {
    if (width === 'ultraTight') {
      setHands(r, pp('5', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','9'), 'KQs','KJs','KTs', 'QJs','QTs','JTs'], 'raise');
      setHands(r, ['AKo','AQo','AJo','KQo'], 'raise');
      setHands(r, ['A8s','K9s','T9s','98s'], 'mixed');
      setHands(r, pp('4','4'), 'mixed');
    } else if (width === 'tight') {
      setHands(r, pp('3', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','7'), 'KQs','KJs','KTs','K9s', 'QJs','QTs','JTs','T9s','98s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo'], 'raise');
      setHands(r, ['A6s','K8s','Q9s','J9s','87s','76s'], 'mixed');
      setHands(r, pp('2','2'), 'mixed');
    } else if (width === 'standard') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','5'), 'KQs','KJs','KTs','K9s','K8s', 'QJs','QTs','Q9s', 'JTs','J9s','T9s','98s','87s','76s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo','QJo'], 'raise');
      setHands(r, ['A4s','A3s','K7s','Q8s','J8s','T8s','65s','54s'], 'mixed');
      setHands(r, ['A9o','KTo'], 'mixed', 'CO���準ではギリギリ。相手次第');
    } else if (width === 'loose') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','2'), 'KQs','KJs','KTs','K9s','K8s','K7s', 'QJs','QTs','Q9s','Q8s', 'JTs','J9s','J8s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'], 'raise');
      setHands(r, ['K6s','Q7s','J7s','T7s','96s','85s','53s'], 'mixed');
      setHands(r, ['A8o','K9o'], 'mixed');
    } else { // ultraLoose
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','2'), 'KQs','KJs','KTs','K9s','K8s','K7s','K6s', 'QJs','QTs','Q9s','Q8s','Q7s', 'JTs','J9s','J8s','J7s','T9s','T8s','T7s','98s','97s','96s','87s','86s','85s','76s','75s','74s','65s','64s','54s','53s','43s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','A8o','A7o','KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o'], 'raise');
      setHands(r, ['K5s','Q6s','J6s','T6s','95s','84s','73s','63s','52s','42s'], 'mixed');
    }
  }

  else if (position === 'BTN') {
    // 修正: ultraTight はCO tightレベル、tightはCO standard レベルに調整
    if (width === 'ultraTight') {
      setHands(r, pp('3', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','7'), 'KQs','KJs','KTs','K9s', 'QJs','QTs','JTs','T9s','98s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo'], 'raise');
      setHands(r, ['A6s','K8s','Q9s','J9s','87s','76s'], 'mixed');
      setHands(r, pp('2','2'), 'mixed');
    } else if (width === 'tight') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','5'), 'KQs','KJs','KTs','K9s','K8s', 'QJs','QTs','Q9s', 'JTs','J9s','T9s','98s','87s','76s','65s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo'], 'raise');
      setHands(r, ['A4s','A3s','K7s','Q8s','J8s','T8s','54s'], 'mixed');
      setHands(r, ['A8o','K9o','QTo','JTo'], 'mixed');
    } else if (width === 'standard') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','2'), 'KQs','KJs','KTs','K9s','K8s','K7s', 'QJs','QTs','Q9s','Q8s', 'JTs','J9s','J8s','T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s','43s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','A8o','KQo','KJo','KTo','K9o','QJo','QTo','JTo','J9o','T9o'], 'raise');
      setHands(r, ['K6s','Q7s','J7s','T6s','96s','85s','74s','63s'], 'mixed');
      setHands(r, ['A7o','Q9o','98o','87o'], 'mixed');
    } else if (width === 'loose') {
      setHands(r, pp('2', 'A'), 'raise');
      // Almost all suited
      for (let i = 0; i < 13; i++) {
        for (let j = i + 1; j < 13; j++) {
          const h = getHandName(i, j);
          if (r[h].action === 'fold') r[h] = { hand: h, action: 'raise' };
        }
      }
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','KQo','KJo','KTo','K9o','K8o','QJo','QTo','Q9o','Q8o','JTo','J9o','J8o','T9o','T8o','98o','97o','87o','86o','76o','75o','65o'], 'raise');
      setHands(r, ['A4o','A3o','A2o','K7o','Q7o','J7o','T7o','96o','85o','74o','64o','54o'], 'mixed');
    } else { // ultraLoose
      for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 13; j++) {
          const h = getHandName(i, j);
          r[h] = { hand: h, action: 'raise' };
        }
      }
      setHands(r, ['K6o','K5o','K4o','K3o','K2o','Q6o','Q5o','Q4o','Q3o','Q2o','J6o','J5o','J4o','J3o','J2o','T6o','T5o','T4o','T3o','T2o','95o','94o','93o','92o','84o','83o','82o','73o','72o','63o','62o','52o','42o','32o'], 'mixed');
    }
  }

  else if (position === 'SB') {
    // SBはレイズ or フォールド（リンプなし）
    if (width === 'ultraTight') {
      setHands(r, pp('5', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','9'), 'KQs','KJs','KTs', 'QJs','QTs','JTs','T9s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','KQo'], 'raise');
      setHands(r, ['A8s','K9s','98s','87s'], 'mixed');
      setHands(r, pp('4','4'), 'mixed');
    } else if (width === 'tight') {
      setHands(r, pp('3', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','7'), 'KQs','KJs','KTs','K9s', 'QJs','QTs','JTs','T9s','98s','87s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo'], 'raise');
      setHands(r, ['A6s','K8s','Q9s','J9s','76s','65s'], 'mixed');
      setHands(r, pp('2','2'), 'mixed');
    } else if (width === 'standard') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','5'), 'KQs','KJs','KTs','K9s','K8s', 'QJs','QTs','Q9s', 'JTs','J9s','T9s','98s','87s','76s','65s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo'], 'raise');
      setHands(r, ['A4s','A3s','K7s','Q8s','J8s','T8s','54s','43s'], 'mixed');
      setHands(r, ['A8o','K9o','QTo','JTo'], 'mixed');
    } else if (width === 'loose') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','2'), 'KQs','KJs','KTs','K9s','K8s','K7s','K6s', 'QJs','QTs','Q9s','Q8s','Q7s', 'JTs','J9s','J8s','T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s','43s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','A8o','A7o','KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o'], 'raise');
      setHands(r, ['K5s','Q6s','J7s','T6s','96s','85s','74s','63s','52s'], 'mixed');
      setHands(r, ['A6o','A5o','K8o','Q8o','J8o','T8o','98o','87o'], 'mixed');
    } else { // ultraLoose
      setHands(r, pp('2', 'A'), 'raise');
      for (let i = 0; i < 13; i++) {
        for (let j = i + 1; j < 13; j++) {
          const h = getHandName(i, j);
          if (r[h].action === 'fold') r[h] = { hand: h, action: 'raise' };
        }
      }
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','KQo','KJo','KTo','K9o','K8o','K7o','QJo','QTo','Q9o','Q8o','JTo','J9o','J8o','T9o','T8o','98o','97o','87o','76o','65o'], 'raise');
      setHands(r, ['A2o','K6o','K5o','K4o','K3o','K2o','Q7o','Q6o','J7o','T7o','96o','86o','85o','75o','74o','64o','54o','53o'], 'mixed');
    }
  }

  return r;
}


// ============================================================
// VS OPEN RANGES（修正版）
// ============================================================

function makeVsOpenRange(myPos: string, openerPos: string, _width: string): Record<string, HandEntry> {
  const r = emptyRange();

  if (myPos === 'BB') {
    if (openerPos === 'UTG') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs'], '3betValue');
      setHands(r, ['AKo'], '3betValue');
      setHands(r, ['A5s','A4s'], '3betBluff', 'ブロッカー+ナッツフラッシュ可能性');
      setHands(r, pp('J','5'), 'call', 'セット狙い・インプライドオッズ');
      setHands(r, ['AJs','ATs','A9s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s'], 'call');
      setHands(r, ['AQo','AJo','KQo'], 'call');
      setHands(r, ['ATo','KJo'], 'mixed', 'UTG相手には基本フォールド寄り。低レートではフォールドが安全');
    } else if (openerPos === 'HJ') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs','AJs'], '3betValue');
      setHands(r, ['AKo','AQo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s'], '3betBluff');
      setHands(r, pp('J','5'), 'call');
      setHands(r, ['ATs','A9s','A8s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s','65s','54s'], 'call');
      setHands(r, ['AJo','ATo','KQo','KJo'], 'call');
      setHands(r, ['QJo'], 'mixed', 'OOPでQJoはマージナル');
      setHands(r, ['A9o','KTo','QTo','JTo'], 'mixed');
    } else if (openerPos === 'CO') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs','AJs','ATs'], '3betValue');
      setHands(r, ['AKo','AQo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s','A2s'], '3betBluff');
      setHands(r, ['K9s','Q9s','J9s'], '3betBluff', '低頻度ブラフ3ベット');
      setHands(r, pp('J','3'), 'call');
      setHands(r, ['A9s','A8s','A7s','A6s','KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s'], 'call');
      setHands(r, ['AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'], 'call');
      setHands(r, ['A8o','K9o','Q9o'], 'mixed');
    } else if (openerPos === 'BTN') {
      setHands(r, [...pp('T','A'), 'AKs','AQs','AJs','ATs','A9s'], '3betValue');
      setHands(r, ['AKo','AQo','AJo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s','A2s','K9s','Q9s','J9s','T8s','97s','86s','75s','64s'], '3betBluff');
      setHands(r, pp('9','2'), 'call');
      setHands(r, ['A8s','A7s','A6s','KQs','KJs','KTs','K9s','K8s','K7s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s','43s'], 'call');
      setHands(r, ['ATo','A9o','A8o','A7o','KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o','98o','87o'], 'call');
      setHands(r, ['A6o','A5o','K8o','Q8o','J8o','T8o'], 'mixed', 'BTNスチール相手でも弱いオフスートは慎重に');
    } else if (openerPos === 'SB') {
      setHands(r, [...pp('T','A'), 'AKs','AQs','AJs','ATs','A9s'], '3betValue');
      setHands(r, ['AKo','AQo','AJo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s','A2s','A8s','K8s','K7s','Q9s','J9s','T8s','97s','86s','75s','64s','53s'], '3betBluff');
      setHands(r, pp('9','2'), 'call');
      setHands(r, ['A7s','A6s','KQs','KJs','KTs','K9s','K8s','K7s','K6s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s','43s'], 'call');
      setHands(r, ['ATo','A9o','A8o','A7o','A6o','A5o','KQo','KJo','KTo','K9o','K8o','QJo','QTo','Q9o','JTo','J9o','T9o','98o','87o','76o'], 'call');
      setHands(r, ['A4o','A3o','K7o','Q8o','J8o','T8o','97o','86o'], 'mixed');
    }
    return r;
  }

  if (myPos === 'SB') {
    // 修正: SBはOOPなので3ベット or フォールド寄り。コールを大幅に減らす
    if (openerPos === 'UTG') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs'], '3betValue');
      setHands(r, ['AKo'], '3betValue');
      setHands(r, ['A5s','A4s'], '3betBluff');
      // SBのOOPコールは最小限に
      setHands(r, pp('J','T'), 'call', 'OOP。セット狙い限定。ポットが膨らんだらフォールドも視野');
      setHands(r, ['AJs','ATs','KQs'], 'call');
      setHands(r, ['AQo'], 'mixed', 'OOPなので3ベットかフォールドが望ましい');
      setHands(r, ['AJo','KQo'], 'mixed', 'OOPでのコールは危険。3ベットかフォールド推奨');
    } else if (openerPos === 'HJ') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs','AJs'], '3betValue');
      setHands(r, ['AKo','AQo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s'], '3betBluff');
      setHands(r, pp('J','8'), 'call', 'OOPセット狙い');
      setHands(r, ['ATs','KQs','KJs','QJs','JTs'], 'call');
      setHands(r, ['AJo','KQo'], 'mixed', 'OOPなので3ベットかフォールド寄り');
    } else if (openerPos === 'CO') {
      setHands(r, [...pp('J','A'), 'AKs','AQs','AJs','ATs'], '3betValue');
      setHands(r, ['AKo','AQo','AJo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s','A2s','K9s','Q9s'], '3betBluff');
      setHands(r, pp('T','5'), 'call');
      setHands(r, ['A9s','A8s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s'], 'call');
      setHands(r, ['ATo','KQo','KJo'], 'call');
      setHands(r, ['QJo'], 'mixed', 'OOPでのコールは難しい');
    } else if (openerPos === 'BTN') {
      setHands(r, [...pp('T','A'), 'AKs','AQs','AJs','ATs','A9s'], '3betValue');
      setHands(r, ['AKo','AQo','AJo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s','A2s','K8s','K7s','Q9s','J9s','T8s','97s','86s','75s','64s'], '3betBluff');
      // SB vs BTN: コールを絞る（OOP）
      setHands(r, pp('9','5'), 'call', 'セ���ト狙い');
      setHands(r, ['A8s','A7s','A6s','KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','65s','54s'], 'call');
      setHands(r, ['ATo','A9o','KQo','KJo','KTo'], 'call');
      setHands(r, ['QJo','QTo','JTo'], 'mixed', 'OOP。3ベットかフォールドの方が安全');
    }
    return r;
  }

  // IP callers: BTN, CO, HJ
  if (myPos === 'BTN') {
    if (openerPos === 'UTG') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs'], '3betValue');
      setHands(r, ['AKo'], '3betValue');
      setHands(r, ['A5s','A4s'], '3betBluff');
      setHands(r, pp('J','4'), 'call');
      setHands(r, ['AJs','ATs','A9s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s','65s'], 'call');
      setHands(r, ['AQo','AJo','KQo'], 'call');
      setHands(r, ['ATo','KJo'], 'mixed', 'UTG相手にIPあるが慎重に');
    } else if (openerPos === 'HJ') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs','AJs'], '3betValue');
      setHands(r, ['AKo','AQo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s'], '3betBluff');
      setHands(r, ['K9s','Q9s'], '3betBluff', '低頻度ブラフ');
      setHands(r, pp('J','3'), 'call');
      setHands(r, ['ATs','A9s','A8s','KQs','KJs','KTs','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','65s','54s'], 'call');
      setHands(r, ['AJo','ATo','KQo','KJo'], 'call');
      setHands(r, ['QJo','QTo'], 'mixed');
    } else if (openerPos === 'CO') {
      setHands(r, [...pp('J','A'), 'AKs','AQs','AJs','ATs'], '3betValue');
      setHands(r, ['AKo','AQo','AJo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s','A2s','K9s','Q9s','J9s','T8s'], '3betBluff');
      setHands(r, pp('T','2'), 'call');
      setHands(r, ['A9s','A8s','A7s','A6s','KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s'], 'call');
      setHands(r, ['ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo','T9o'], 'call');
      setHands(r, ['A8o','K9o','Q9o','J9o'], 'mixed');
    }
  }

  else if (myPos === 'CO') {
    if (openerPos === 'UTG') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs'], '3betValue');
      setHands(r, ['AKo'], '3betValue');
      setHands(r, ['A5s','A4s'], '3betBluff');
      setHands(r, pp('J','5'), 'call');
      setHands(r, ['AJs','ATs','KQs','KJs','QJs','JTs','T9s','98s','87s'], 'call');
      setHands(r, ['AQo','AJo','KQo'], 'call');
      setHands(r, ['ATo','KJo'], 'mixed');
    } else if (openerPos === 'HJ') {
      setHands(r, [...pp('Q','A'), 'AKs','AQs','AJs'], '3betValue');
      setHands(r, ['AKo','AQo'], '3betValue');
      setHands(r, ['A5s','A4s','A3s'], '3betBluff');
      setHands(r, pp('J','4'), 'call');
      setHands(r, ['ATs','A9s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s','65s'], 'call');
      setHands(r, ['AJo','ATo','KQo','KJo'], 'call');
      setHands(r, ['QJo'], 'mixed');
    }
  }

  else if (myPos === 'HJ') {
    if (openerPos === 'UTG') {
      setHands(r, [...pp('Q','A'), 'AKs'], '3betValue');
      setHands(r, ['AKo'], '3betValue');
      setHands(r, ['A5s'], '3betBluff');
      setHands(r, pp('J','6'), 'call');
      setHands(r, ['AQs','AJs','ATs','KQs','KJs','QJs','JTs','T9s','98s'], 'call');
      setHands(r, ['AQo','KQo'], 'call');
      setHands(r, ['AJo','KJo'], 'mixed', 'UTG相手にはフォールド寄り');
    }
  }

  return r;
}


// ============================================================
// VS 3BET RANGES（修正版）
// ============================================================

function makeVs3BetRange(myPos: string, _width: string): Record<string, HandEntry> {
  const r = emptyRange();

  if (myPos === 'UTG') {
    setHands(r, [...pp('K','A'), 'AKs'], '4betValue');
    setHands(r, ['AKo'], '4betValue');
    setHands(r, ['A5s'], '4betBluff', 'Aブロッカー+ナッ���フラッシュ候補。低頻度で4ベット');
    setHands(r, ['A4s'], '4betBluff', '低頻度の4ベットブラフ候補');
    setHands(r, pp('Q','J'), 'call', 'セット狙い+強いオーバーペア');
    setHands(r, ['AQs','AJs','KQs'], 'call');
    // 修正: ATs, QJsをcallからmixedに、T9sをfoldに
    setHands(r, ['AQo'], 'mixed', '相手次第。タイト相手にはフォールドも。OOPで難しい');
    setHands(r, pp('T','9'), 'mixed', 'セット狙い限定。大きい3ベットにはフォールド');
    setHands(r, ['ATs','KJs','QJs','JTs'], 'mixed', 'スタックが深ければコール検討。通常はフォールド寄り');
    setHands(r, ['AJo'], 'fold', 'UTGオープンへの3ベットに対してAJoはフォールド。ドミネートされやすい');
    setHands(r, ['KQo'], 'mixed', 'タイト相手はフォールド。ルース相手はコール検討');
  }

  else if (myPos === 'HJ') {
    setHands(r, [...pp('K','A'), 'AKs','AQs'], '4betValue');
    setHands(r, ['AKo'], '4betValue');
    setHands(r, ['A5s','A4s'], '4betBluff');
    setHands(r, pp('Q','T'), 'call');
    setHands(r, ['AJs','ATs','KQs','KJs','QJs','JTs'], 'call');
    setHands(r, ['AQo'], 'call');
    setHands(r, pp('9','8'), 'mixed', 'セット狙い。大きい3ベットにはフォールド');
    setHands(r, ['KTs','QTs','T9s','98s'], 'mixed');
    // 修正: AJo, AToをmixed/foldに
    setHands(r, ['AJo'], 'mixed', '相手次第。タイト3ベッターにはフォールド推奨');
    setHands(r, ['KQo'], 'mixed', '相手のレンジ次第');
    setHands(r, ['ATo'], 'fold', '3ベットに対してAToはほぼフォールド。キッカー負けリスク大');
  }

  else if (myPos === 'CO') {
    setHands(r, [...pp('K','A'), 'AKs','AQs'], '4betValue');
    setHands(r, ['AKo','AQo'], '4betValue');
    setHands(r, ['A5s','A4s','A3s'], '4betBluff');
    setHands(r, pp('Q','8'), 'call');
    setHands(r, ['AJs','ATs','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s'], 'call');
    setHands(r, ['AJo','KQo'], 'call');
    // 修正: KJoをmixedに、ATo/QJoをfoldに
    setHands(r, pp('7','6'), 'mixed', 'セット狙いで参加可能');
    setHands(r, ['A9s','K9s','87s','76s','65s'], 'mixed');
    setHands(r, ['KJo'], 'mixed', '3ベットに対してKJoは微妙。IP限定でコール検討');
    setHands(r, ['ATo'], 'mixed', '相手がルースならコール。タイトならフォールド');
  }

  else if (myPos === 'BTN') {
    setHands(r, [...pp('K','A'), 'AKs','AQs','AJs'], '4betValue');
    setHands(r, ['AKo','AQo'], '4betValue');
    // 修正: A5sの重複を解消。4betBluff候補を明確に
    setHands(r, ['A5s','A4s','A3s','A2s'], '4betBluff', 'Aブロッカー+ホイール候補。4ベットブラフの最有力');
    setHands(r, pp('Q','7'), 'call');
    setHands(r, ['ATs','A9s','A8s','A7s','A6s','KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','54s'], 'call');
    // 修正: オフスートのコールを大幅に絞る
    setHands(r, ['AJo','KQo','KJo'], 'call');
    setHands(r, pp('6','5'), 'mixed', 'セット狙い限定。大きい3ベットにはフォールド');
    setHands(r, ['K8s','Q8s','J8s'], 'mixed');
    setHands(r, ['ATo','KTo','QJo'], 'mixed', '3ベットに対してオフスートは基本フォールド寄り');
    // 修正: 弱いオフスートは明確にfold
    setHands(r, ['A9o','QTo','JTo','T9o'], 'fold', 'オフスートの中位ハンドは3ベットに対してフォールド');
  }

  else if (myPos === 'SB') {
    setHands(r, [...pp('K','A'), 'AKs','AQs'], '4betValue');
    setHands(r, ['AKo','AQo'], '4betValue');
    setHands(r, ['A5s','A4s'], '4betBluff');
    setHands(r, pp('Q','8'), 'call');
    setHands(r, ['AJs','ATs','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s'], 'call');
    // 修正: SB OOPでのオフスートコールを削減
    setHands(r, ['AJo','KQo'], 'call');
    setHands(r, pp('7','6'), 'mixed');
    setHands(r, ['A9s','K9s','87s','76s','65s'], 'mixed');
    setHands(r, ['KJo'], 'mixed', 'OOPでKJoは微妙。フォールド寄り');
    // 修正: 弱いオフスートをfoldに
    setHands(r, ['ATo','KTo','QJo'], 'fold', 'OOPで3ベットに対して弱いオフスートはフォールド');
  }

  return r;
}


// ============================================================
// BB DEFENSE RANGES
// ============================================================

function makeBBDefenseRange(openerPos: string, width: string): Record<string, HandEntry> {
  const r = emptyRange();

  const isWider = width === 'loose' || width === 'ultraLoose';
  const isTighter = width === 'tight' || width === 'ultraTight';

  if (openerPos === 'UTG') {
    setHands(r, [...pp('Q','A'), 'AKs','AQs'], '3bet');
    setHands(r, ['AKo'], '3bet');
    setHands(r, ['A5s','A4s'], '3bet', 'ブロッカー3ベット');
    setHands(r, pp('J','5'), 'call', 'セット狙い');
    setHands(r, ['AJs','ATs','A9s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s'], 'call');
    setHands(r, ['AQo','AJo','KQo'], 'call');
    if (isWider) {
      setHands(r, ['A8s','A7s','K9s','Q9s','65s','54s'], 'call');
      setHands(r, ['ATo','KJo'], 'call');
      setHands(r, pp('4','3'), 'call');
    }
    if (isTighter) {
      setHands(r, pp('7','5'), 'fold');
      setHands(r, ['A9s','76s'], 'fold');
    }
    setHands(r, ['ATo','KJo'], 'mixed', 'UTG相手には基本フォールド寄り。低レートではフォールド推奨');
  }

  else if (openerPos === 'HJ') {
    setHands(r, [...pp('Q','A'), 'AKs','AQs','AJs'], '3bet');
    setHands(r, ['AKo','AQo'], '3bet');
    setHands(r, ['A5s','A4s','A3s'], '3bet');
    setHands(r, pp('J','4'), 'call');
    setHands(r, ['ATs','A9s','A8s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','87s','76s','65s','54s'], 'call');
    setHands(r, ['AJo','ATo','KQo','KJo'], 'call');
    if (isWider) {
      setHands(r, ['A7s','A6s','K9s','K8s','Q9s','J8s','T8s','43s'], 'call');
      setHands(r, ['A9o','KTo','QJo'], 'call');
      setHands(r, pp('3','2'), 'call');
    }
    setHands(r, ['QJo','QTo','JTo'], 'mixed', 'HJ相手にオフスートブロードウェイは微妙');
  }

  else if (openerPos === 'CO') {
    setHands(r, [...pp('Q','A'), 'AKs','AQs','AJs','ATs'], '3bet');
    setHands(r, ['AKo','AQo'], '3bet');
    setHands(r, ['A5s','A4s','A3s','A2s'], '3bet');
    setHands(r, ['K9s','Q9s','J9s'], '3bet', '低頻度ブラフ3ベット');
    setHands(r, pp('J','3'), 'call');
    setHands(r, ['A9s','A8s','A7s','A6s','KQs','KJs','KTs','K9s','K8s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s'], 'call');
    setHands(r, ['AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'], 'call');
    if (isWider) {
      setHands(r, ['K7s','Q7s','J7s','T7s','96s','85s','74s','43s'], 'call');
      setHands(r, ['A8o','K9o','Q9o','J9o'], 'call');
      setHands(r, pp('2','2'), 'call');
    }
    setHands(r, ['A8o','K9o','T9o'], 'mixed');
  }

  else if (openerPos === 'BTN') {
    setHands(r, [...pp('T','A'), 'AKs','AQs','AJs','ATs','A9s'], '3bet');
    setHands(r, ['AKo','AQo','AJo'], '3bet');
    setHands(r, ['A5s','A4s','A3s','A2s','K8s','K7s','Q9s','J9s','T8s','97s','86s','75s','64s'], '3bet', 'BTNスチールへの3ベットブラフ');
    setHands(r, pp('9','2'), 'call');
    setHands(r, ['A8s','A7s','A6s','KQs','KJs','KTs','K9s','K8s','K7s','K6s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','J7s','T9s','T8s','T7s','98s','97s','96s','87s','86s','85s','76s','75s','74s','65s','64s','63s','54s','53s','43s'], 'call');
    setHands(r, ['ATo','A9o','A8o','A7o','KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o','98o','87o'], 'call');
    if (isTighter) {
      setHands(r, ['K6s','J7s','T7s','96s','85s','74s','63s'], 'fold');
      setHands(r, ['A7o','K9o','Q9o','J9o','T9o','98o','87o'], 'fold');
    }
    setHands(r, ['A6o','A5o','K8o','Q8o','J8o','T8o'], 'mixed', '弱いオフスート。守りすぎ注意');
  }

  else if (openerPos === 'SB') {
    setHands(r, [...pp('T','A'), 'AKs','AQs','AJs','ATs','A9s'], '3bet');
    setHands(r, ['AKo','AQo','AJo'], '3bet');
    setHands(r, ['A5s','A4s','A3s','A2s','A8s','K8s','K7s','K6s','Q9s','Q8s','J9s','J8s','T8s','T7s','97s','96s','86s','85s','75s','74s','64s','63s','53s','52s'], '3bet', 'SB相手には広く3ベット');
    setHands(r, pp('9','2'), 'call');
    setHands(r, ['A7s','A6s','KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','QJs','QTs','Q9s','Q8s','Q7s','Q6s','JTs','J9s','J8s','J7s','J6s','T9s','T8s','T7s','T6s','98s','97s','96s','95s','87s','86s','85s','84s','76s','75s','74s','73s','65s','64s','63s','62s','54s','53s','52s','43s','42s','32s'], 'call');
    setHands(r, ['ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','KQo','KJo','KTo','K9o','K8o','K7o','QJo','QTo','Q9o','Q8o','JTo','J9o','J8o','T9o','T8o','98o','97o','87o','86o','76o','65o'], 'call');
    if (isTighter) {
      setHands(r, ['K5s','Q6s','J6s','T6s','95s','84s','73s','62s','32s'], 'fold');
      setHands(r, ['A4o','A3o','K7o','Q8o','J8o','T8o','97o','86o','76o','65o'], 'fold');
    }
    setHands(r, ['A2o','K6o','K5o','Q7o','J7o','T7o','96o','85o','75o'], 'mixed');
  }

  return r;
}


// ============================================================
// SB vs BB RANGES
// ============================================================

function makeSBvsBBRange(scenario: 'sbOpen' | 'bbDefVsSb', width: string): Record<string, HandEntry> {
  const r = emptyRange();

  if (scenario === 'sbOpen') {
    if (width === 'ultraTight') {
      setHands(r, pp('5', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','8'), 'KQs','KJs','KTs', 'QJs','QTs','JTs','T9s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','KQo','KJo'], 'raise');
      setHands(r, ['A7s','K9s','Q9s','98s','87s'], 'mixed');
      setHands(r, pp('4','3'), 'mixed');
    } else if (width === 'tight') {
      setHands(r, pp('3', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','5'), 'KQs','KJs','KTs','K9s','K8s', 'QJs','QTs','Q9s', 'JTs','J9s','T9s','98s','87s','76s','65s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','KQo','KJo','KTo','QJo','QTo','JTo'], 'raise');
      setHands(r, ['A4s','A3s','K7s','Q8s','J8s','T8s','54s'], 'mixed');
      setHands(r, ['A8o','K9o','Q9o','J9o','T9o'], 'mixed');
      setHands(r, pp('2','2'), 'mixed');
    } else if (width === 'standard') {
      setHands(r, pp('2', 'A'), 'raise');
      setHands(r, [...suitedFrom('A','K','2'), 'KQs','KJs','KTs','K9s','K8s','K7s','K6s', 'QJs','QTs','Q9s','Q8s','Q7s', 'JTs','J9s','J8s','T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s','43s'], 'raise');
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','A8o','A7o','KQo','KJo','KTo','K9o','QJo','QTo','Q9o','JTo','J9o','T9o','98o','87o'], 'raise');
      setHands(r, ['K5s','Q6s','J7s','T6s','96s','85s','74s','63s','52s','42s','32s'], 'mixed');
      setHands(r, ['A6o','A5o','A4o','K8o','Q8o','J8o','T8o','97o','86o','76o','65o'], 'mixed');
    } else if (width === 'loose') {
      setHands(r, pp('2', 'A'), 'raise');
      for (let i = 0; i < 13; i++) {
        for (let j = i + 1; j < 13; j++) {
          const h = getHandName(i, j);
          if (r[h].action === 'fold') r[h] = { hand: h, action: 'raise' };
        }
      }
      setHands(r, ['AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o','KQo','KJo','KTo','K9o','K8o','K7o','QJo','QTo','Q9o','Q8o','Q7o','JTo','J9o','J8o','J7o','T9o','T8o','T7o','98o','97o','87o','86o','76o','75o','65o','64o','54o'], 'raise');
      setHands(r, ['K6o','K5o','K4o','Q6o','Q5o','J6o','J5o','T6o','96o','95o','85o','84o','74o','73o','63o','53o','43o'], 'mixed');
    } else { // ultraLoose
      for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 13; j++) {
          const h = getHandName(i, j);
          r[h] = { hand: h, action: 'raise' };
        }
      }
      setHands(r, ['K3o','K2o','Q4o','Q3o','Q2o','J4o','J3o','J2o','T5o','T4o','T3o','T2o','94o','93o','92o','83o','82o','73o','72o','62o','52o','42o','32o'], 'mixed');
    }
  }

  else if (scenario === 'bbDefVsSb') {
    setHands(r, [...pp('T','A'), 'AKs','AQs','AJs','ATs','A9s'], '3bet');
    setHands(r, ['AKo','AQo','AJo'], '3bet');
    setHands(r, ['A5s','A4s','A3s','A2s','A8s','K8s','K7s','K6s','Q9s','Q8s','J9s','J8s','T8s','T7s','97s','96s','86s','85s','75s','74s','64s','63s','53s','52s'], '3bet', 'SB相手にはポジションの優位性を活かして広く3ベット');
    setHands(r, pp('9','2'), 'call');
    setHands(r, ['A7s','A6s','KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','QJs','QTs','Q9s','Q8s','Q7s','Q6s','JTs','J9s','J8s','J7s','J6s','T9s','T8s','T7s','T6s','98s','97s','96s','95s','87s','86s','85s','84s','76s','75s','74s','73s','65s','64s','63s','62s','54s','53s','52s','43s','42s','32s'], 'call');
    setHands(r, ['ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o','KQo','KJo','KTo','K9o','K8o','K7o','K6o','QJo','QTo','Q9o','Q8o','Q7o','Q6o','JTo','J9o','J8o','J7o','T9o','T8o','T7o','T6o','98o','97o','96o','87o','86o','85o','76o','75o','74o','65o','64o','54o','53o'], 'call');
    setHands(r, ['K5o','K4o','K3o','K2o','Q5o','Q4o','Q3o','Q2o','J6o','J5o','J4o','J3o','J2o','T5o','T4o','95o','94o','84o','83o','73o','63o','43o'], 'mixed', 'やや広い守り。相手のサイズ次第');
  }

  return r;
}


// ============================================================
// SAFE MODE (安全寄りモード)
// ============================================================

/**
 * 安全寄りモード: 通常レンジを初心者向けに絞る
 * - コール範囲を狭める
 * - 3ベットブラフを減らす
 * - BBディフェンスを狭める
 * - SBコールをほぼ消す
 * - 弱いオフスートを積極的にフォールドに
 */
export function applySafeMode(range: Record<string, HandEntry>, mode: string): Record<string, HandEntry> {
  const result: Record<string, HandEntry> = {};

  // ハンドの強さを大まかに判定するヘルパー
  const isWeakOffsuit = (h: string): boolean => {
    if (!h.endsWith('o')) return false;
    const r1 = h[0];
    const r2 = h[1];
    const ranks = 'AKQJT98765432';
    const i1 = ranks.indexOf(r1);
    const i2 = ranks.indexOf(r2);
    // Gap > 3 or both below T
    return (i2 - i1) > 3 || (i1 >= 4 && i2 >= 4);
  };

  const isSmallPair = (h: string): boolean => {
    return h.length === 2 && h[0] === h[1] && '2345'.includes(h[0]);
  };

  const isMediumPair = (h: string): boolean => {
    return h.length === 2 && h[0] === h[1] && '678'.includes(h[0]);
  };

  for (const [hand, entry] of Object.entries(range)) {
    const e = { ...entry };
    const origAction = e.action;

    if (mode === 'open') {
      // オープン: mixed → fold（弱いハンド）
      if (e.action === 'mixed' && (isWeakOffsuit(hand) || isSmallPair(hand))) {
        e.action = 'fold';
        e.note = `⚠ 安全寄り: フォールド推奨（通常は${origAction === 'mixed' ? '状況次第' : origAction}）`;
        e.normalAction = origAction;
      }
    }

    else if (mode === 'vsOpen' || mode === 'bbDefense') {
      // 3ベットブラフを減らす（A5sだけ残す���
      if (e.action === '3betBluff' && hand !== 'A5s') {
        e.action = 'fold';
        e.note = `��� 安全寄り: 3ベットブラフは控える（通常はブラフ3ベット候補）`;
        e.normalAction = origAction;
      }
      // 弱いオフスートのコールをフォールドに
      if (e.action === 'call' && isWeakOffsuit(hand)) {
        e.action = 'fold';
        e.note = `⚠ 安全寄り: 弱いオフスートはフォールド推奨（通常はコール）`;
        e.normalAction = origAction;
      }
      // mixedは基本フォールドに
      if (e.action === 'mixed') {
        e.action = 'fold';
        e.note = `�� 安全寄り: 迷うならフォールド（通常は状況次第）`;
        e.normalAction = origAction;
      }
      // 小さいペアのコールをフォールドに（vs open）
      if (e.action === 'call' && isSmallPair(hand)) {
        e.action = 'fold';
        e.note = `⚠ ���全寄り: 小さいペアは安く入れない限りフォールド（通常はセット狙い��`;
        e.normalAction = origAction;
      }
    }

    else if (mode === 'vs3Bet') {
      // 4ベットブラフを減らす（A5sだけ残す）
      if (e.action === '4betBluff' && hand !== 'A5s') {
        e.action = 'fold';
        e.note = `⚠ 安���寄り: 4ベットブラフは慎重に（通常は4ベットブラフ候補）`;
        e.normalAction = origAction;
      }
      // 3ベットに対してオフスートのコールは全フォールド
      if (e.action === 'call' && hand.endsWith('o')) {
        e.action = 'fold';
        e.note = `⚠ 安全寄り: 3ベットに対してオフスートはフォールド推奨（通常はコール）`;
        e.normalAction = origAction;
      }
      // 小さい/中ペアのコールを制限
      if (e.action === 'call' && (isSmallPair(hand) || isMediumPair(hand))) {
        e.action = 'fold';
        e.note = `⚠ 安全寄���: 3ベットに対して小〜中ペアはフォールド（通常はセット狙い）`;
        e.normalAction = origAction;
      }
      // mixedはフォールドに
      if (e.action === 'mixed') {
        e.action = 'fold';
        e.note = `⚠ 安��寄り: 迷うならフォールド（通常は状況次第）`;
        e.normalAction = origAction;
      }
    }

    else if (mode === 'sbVsBb') {
      // SBオープン: mixedをフォールドに
      if (e.action === 'mixed') {
        e.action = 'fold';
        e.note = `⚠ 安全寄り: 微妙なハンドはフォールド（通常は状況次第）`;
        e.normalAction = origAction;
      }
    }

    result[hand] = e;
  }

  return result;
}


// ============================================================
// HAND NOTES（拡充版）
// ============================================================

export const HAND_NOTES: Record<string, string> = {
  // Pocket Pairs
  'AA': 'モンスターハンド。プリフロップでオールインも辞さない。常にレイズ/4ベット。',
  'KK': 'AA以外には最強。プリフロップは常にアグレッシブに。Aが落ちた時だけ注意。',
  'QQ': '非常に強いが、AやKが出ると難しくなる。プリフロップは積極的にプレイ。',
  'JJ': '強いが過大評価しやすい。3ベットポットではオーバーカードに注意。AKT以上のボードでは慎重に。',
  'TT': 'ミドルペアの中では最強。3ベットにはコール寄り。フロップのオーバーカードに注意。',
  '99': 'セット狙いが基本。3ベットにはスタックが深ければコール。小さいポットを心がける。',
  '88': 'セット狙い。大きい3ベットには基本フォールド。ポジションが重要。',
  '77': 'セッ���狙い。安く入れるならプレイ。大きいレイズにはフォールド。',
  '66': '安く入れるならセット狙い。大きい3ベットには基本フォールド。低レートではオープンコールOK、3ベットポットでは危険。',
  '55': 'セット狙い専用。ポジションなしや大きいレイズには注意。セットにならなければ基本諦める。',
  '44': 'セット狙い。マルチウェイで安く入れる時のみ。3ベットに対しては基本フォールド。',
  '33': '低いポケットペア。セット以外で利益を出すのは難しい。3ベットには必ずフォールド。',
  '22': '最弱のポケットペア。セット狙い専用。インプライドオッズが必要。大きいレイズや3ベットには必ずフォールド。',

  // Strong Aces
  'AKs': 'プレミアムハンド。スーテッドでさらに強い。常に3ベット/4ベット候補。',
  'AKo': 'プレミアムハンド。常にレイズ/3ベット。4ベットポットでもプレイ可能。',
  'AQs': '非常に強い。ほとんどの状況でレイズ/3ベット。vs UTGの3ベットのみ慎重に。',
  'AQo': '強いがAKsには劣る。IPではアグレッシブに、OOPでは少し慎重に。3ベットポットOOPでは特に注意。初心者はOOPで過大評価しやす���。',
  'AJs': '強いスーテッドA。オープンは全ポジションから。3ベットにはポジション次第。',
  'AJo': '⚠ 初心者注意ハンド。オープンなら強いが、3ベットに対しては相手次第。タイト相手にはフォールド寄り。UTG/HJオープンへの3ベットにはほぼフォールド。「Aがあるから」で参加すると事故りやすい��',
  'ATs': 'スーテッドの強み。オープンは広くできる。3ベットにはIPならコール。',
  'ATo': 'マージナル。レイトポジションからのオープンは可能。3ベットにはかなり弱い。フォールド推奨。',

  // Weak Aces suited
  'A9s': 'ミドルスーテッドA。ポジション次第でオープン可能��3ベットにはフォールド寄り。',
  'A8s': 'スーテッドの価値あり。レイトポジションからオープン。3ベットには弱い���',
  'A7s': 'スーテッドで価値あり。BTN/COからオープン可能。',
  'A6s': 'スーテッドの価値。レイトポジション限定。',
  'A5s': '⚠ 重要ハンド。フラッシュ・ストレート・4ベットブラフ候補。A5oとは別物。ホイールストレートの可能性。Aブロッカーとしての価値が高く、3ベット/4ベットブラフの最有力候補。スーテッドAの中で特別な位置。',
  'A4s': 'A5sに次ぐ4ベットブラフ候補。ホイールストレート��可能性。',
  'A3s': 'スーテッドAとしての価値。3ベットブラフ候補。A3oとは全く別物。',
  'A2s': '最弱のスーテッドA。ブラフ候補としての価値。A2oは罠ハンド。',

  // Weak Aces offsuit
  'A9o': '弱いオフスートA。レイトポジション限定。3ベットにはほ���フォールド。',
  'A8o': 'マージナル。BTN以降のみ。キッカー負けに注意。',
  'A7o': 'BTN/SBのスチール候補程度。ポストフロップで難しい。',
  'A6o': '弱いオフスー��A。BTNスチール程度。',
  'A5o': 'ストレートの可能性はあるが、A5sとは全く違う。基本フォールド。スーテッドとオフスートの差が最も出るハンドの一つ���',
  'A4o': '罠ハンド。A2o〜A5oのオフスートは初心者が損しやすい。「Aがあるから」でプレイしない。',
  'A3o': '罠ハンド。弱いオフスートAはポストフロップで苦しむ。',
  'A2o': '⚠ 最弱のA。罠になりやすい。トップペアでもキッカー負け多発。基本フォールド。初心者が最も損しやすいハンドの一つ。「Aを持っている」安心感に騙されない。',

  // Broadway
  'KQs': '強いブロードウェイスーテッド。広くオープン可能。3ベットにもコール。フラッシュ+ストレートの可���性。',
  'KQo': '⚠ 初心者注意ハンド。オープンは強いが、3ベットに対してはポジション次第。UTG/HJの3ベットに対してはフォールド寄り。「ブロードウェイ2枚だから」と3ベットポットに参加しすぎない。AKにドミネートされやすい。',
  'KJs': 'ブロードウェイ��ーテッド。オープンは強い。3ベットにはIPならコール検討だが、OOPではフォールド寄り。スーテッドの価値を活かせるかがポイント。',
  'KJo': 'マージナル。レイトポジション限定。3ベットにはフォールド寄り。KQoよりさらに弱い。',
  'KTs': 'スーテッドの価値。オープン可能。ストレート候補。',
  'KTo': 'レイトポジション限定。3ベットにはフォールド。',
  'QJs': '強いスーテッドコネクター。ストレート・フラッシュ候補。広くプレイ可能。',
  'QJo': '⚠ 初心者注意ハンド。見た目は強そうだが、実際はマージナル。レイトポジションからのオープンは可能だが、レイズに対してはフォールド寄り。KQ、AJ、AQにドミネートされやすい。3ベットには基本フォールド。',
  'QTs': 'スーテッドコネクター。ポジションありで強い。',
  'JTs': '⚠ 人気のスーテッドコネクター。ストレート・フラッシュ両方の可能性。IPで強い。ただし過大評価しやすい。3ベットポットでは慎重に。ポジションなしでは価値が大きく下がる���',
  'JTo': '⚠ レイトポジション限定。IPでのみプレイ。3ベットに対しては確実にフォールド。JTsとは全く別のハンド。',

  // Suited Connectors
  'T9s': '⚠ 優秀なスーテッドコネクター。多くのストレート候補。IPで価値大。ポジションありならコール候補だが、ポジションなしでは大きく価値が下がる。大きいレイズには参加しない。',
  '98s': '良いスーテッドコネ���ター。安く入れれば大きいポットが取れる。',
  '87s': '⚠ ポジションありならコール候補。ポジションなしや大きいレイズには注意。安く入れてフラッシュ・ストレートを狙うハンド。フロップで何もヒットしなければ素直に降りる。',
  '76s': 'スーテッ��コネクター。IPで安く入れるなら。',
  '65s': '小���いスーテッドコネクター。インプライドオッズ次第。',
  '54s': '最小のプレイアブルなスーテッドコネクター。ホイール可能。',

  // King suited
  'K9s': 'マージナル。レイトポジション・3ベットブラフ候補。',
  'K8s': 'レイトポジ���ョン限定。BBディフェンスには使える。',
  'K7s': 'レイ���ポジション限定。',
  'K6s': 'BTN/SBのスチール程度。',
  'K5s': 'ほぼBTN以降限定。',

  // Queen suited
  'Q9s': 'マージナル。3ベットブラフ候補にもなる。',
  'Q8s': 'レイトポジショ���限定。',

  // Jacks
  'J9s': 'スーテ��ドコネクター気味。IPで価値あり。',
  'J8s': 'マージナル。BBディフェンスでは使える。',

  // Tens
  'T8s': 'スーテッドワンギャッパー。IP���価値あり。',
  'T7s': 'マージナル。広いレンジのBBディフェンスに。',

  // Low suited connectors
  '97s': 'スーテッドワンギャッパー。BTNやBBで使える。',
  '96s': 'マージナル。BBディフェンス程度。',
  '86s': 'ス��テッドワンギャッパー。BBディフェンスで。',
  '85s': 'マージナル。',
  '75s': 'スーテッドワンギャッパー。BTNやBBで使える��',
  '74s': 'マージナル。BBディフェンスの広いレンジに。',
  '64s': 'ストレート候補。BTNやBBの広いレンジに。',
  '63s': 'マージナル。BBディフェン��の広いレンジに。',
  '53s': 'スト���ート候補。BBディフェンスの���いレンジに。',
  '43s': '最小のスーテッドコネクター。BBの広いディフェンスに���',
};


// ============================================================
// PUBLIC API
// ============================================================

export function getOpenRange(position: string, width: string): Record<string, HandEntry> {
  return makeOpenRange(position, width);
}

export function getVsOpenRange(myPos: string, openerPos: string, width: string): Record<string, HandEntry> {
  return makeVsOpenRange(myPos, openerPos, width);
}

export function getVs3BetRange(myPos: string, width: string): Record<string, HandEntry> {
  return makeVs3BetRange(myPos, width);
}

export function getBBDefenseRange(openerPos: string, width: string): Record<string, HandEntry> {
  return makeBBDefenseRange(openerPos, width);
}

export function getSBvsBBRange(scenario: 'sbOpen' | 'bbDefVsSb', width: string): Record<string, HandEntry> {
  return makeSBvsBBRange(scenario, width);
}

// Villain type adjustments (text-based guidance)
export const VILLAIN_ADJUSTMENTS: Record<string, { title: string; tips: string[] }> = {
  tight: {
    title: 'タイトな相手への調整',
    tips: [
      'スチールを増やす：タイトな相手はフォールドが多いため、BTN/CO/SBからのスチールを積極的に。',
      '3ベットブラフを少し増やす：A5s、A4s辺りの3ベットブ��フが通りやすい。',
      'コールはしすぎない：タイトな相手がレイズした時は本当に強い。弱いコールは損。',
      'バリュー3ベットのレンジをやや広げる：AQo、AJs辺りもバリュー3ベットに。',
      '相手の3ベットには敬意を払う：タイトな相手の3ベットはほぼプレミアム。AJo、KQo辺りはフォールド。',
    ],
  },
  lag: {
    title: 'ルースアグレッシブへの調整',
    tips: [
      '強い手で3ベット：LAG相手には広いレンジで参加してくるため、強い手でのバリュー3ベットが効く��',
      '弱いコールを減らす：LAGにポジションなしでマージナルハンドをコールするのは損。',
      'ポジションありで少し広く守る：IPがあれば、LAGの攻撃を利用できる。',
      '無理なブラフキャッチはしない：LAGは多くのバレルを打ってくるが、トップペア以上でないとキャッチは難しい。',
      'トラップを活用：AA/KKでのスロープレイが有効な場面がある��',
    ],
  },
  callingStation: {
    title: 'コーリングステーションへの調整',
    tips: [
      'ブラフを減らす：コーリングステーションはコールしすぎるため、ブラフが通りにくい。',
      'バリューを厚くする：トップペア良キッカー以上で大きめにベット。相手が降りないことを利用。',
      '3ベットブラフを減らす：3ベットしても降りない相手にブラフは無意味。',
      'トップペア良キッカー以上でしっかり取る：2ペアやセットでは大きなポットを目指す。',
      'ドローが完成したら大きくベット：相手はペイオフしてくれる。',
      'セカンドペア以下はチェック寄り：コーリングステーションにマージナルハンドでベットしても損。',
    ],
  },
  aggressive3bet: {
    title: '3ベットが多い相手への調整',
    tips: [
      '4ベット候補を明確にする：AA、KK、AKsは常に4ベット。QQ、AQsも4ベットバリューに。',
      'A5sの4ベットブラフを準備：Aブロッカー+ホイール可能性のあるA5sが最適。',
      'AJoやKQoの扱いに注意：3ベットが多い相手にはコールよりフォールド。ドミネートされている可能性���',
      'コールレンジを絞る：3ベットにコールするなら、IPで強いハンド（QQ〜TT、AQs、KQs等）のみ。',
      'トラップも検討：AA/KKでコールして5ベットを誘発させる戦略。',
      '自分のオープンレンジを少し��る：3ベットされるのを前提に、フォールドするハンドでオープンしない。',
    ],
  },
  cbetResistant: {
    title: 'Cベットに降りない相手への調整',
    tips: [
      '空振りCベットを減らす：相手が降りないので、エアーでのCベットは損。',
      'バリューベットを大きめにする：トップペア以上で大きくベット。',
      'チェックバックを増やす：マージナルハンドはポットコントロール。',
      'ターン/リバーで強い手を作ってからベット：セカンドバレルは本当に強い時だけ。',
      'ブラフはダブルバレル以降に：フロップでフォールドしない相手でも、ターンで降りることはある。',
    ],
  },
};

// Ante adjustment descriptions
export const ANTE_ADJUSTMENTS = {
  description: 'アンティがある場合の調整',
  tips: [
    'BTN、CO、SBのスチールを少し広げる：ポットが大きくなるため、スチールの利益が増える。',
    'BBディフェンスを少し広げる：アンティ分オッズが良くなるため、広く守る。',
    'UTG/HJは広げすぎない：アーリーポジションはアンティがあっても基本は変わらない。',
    'オープンサイズを少し小さくできる：ポットが大きい分、2.2〜2.5BBでも十分。',
  ],
};
