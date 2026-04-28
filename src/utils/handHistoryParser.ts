import type { ParsedHand, HeroAction, SpotType, ActionEntry } from '../types/handHistory';
import type { Position } from '../types';

const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
const VALID_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

function getRank(card: string): string {
  const r = card[0].toUpperCase();
  return r === '1' ? 'T' : r;
}

function getSuit(card: string): string {
  return card[card.length - 1].toLowerCase();
}

/** Normalizes two card strings (e.g. "As", "Qd") into hand notation (e.g. "AQo") */
export function normalizeHand(card1: string, card2: string): string {
  const r1 = getRank(card1);
  const r2 = getRank(card2);
  const s1 = getSuit(card1);
  const s2 = getSuit(card2);

  const idx1 = RANK_ORDER.indexOf(r1 as typeof RANK_ORDER[number]);
  const idx2 = RANK_ORDER.indexOf(r2 as typeof RANK_ORDER[number]);

  let highRank: string, lowRank: string, highSuit: string, lowSuit: string;
  if (idx1 <= idx2) {
    highRank = r1; lowRank = r2; highSuit = s1; lowSuit = s2;
  } else {
    highRank = r2; lowRank = r1; highSuit = s2; lowSuit = s1;
  }

  if (highRank === lowRank) return `${highRank}${lowRank}`;
  return `${highRank}${lowRank}${highSuit === lowSuit ? 's' : 'o'}`;
}

/** Parse raw hand history text into a structured ParsedHand object */
export function parseHandHistory(text: string): ParsedHand {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let heroPosition: Position | null = null;
  let heroHand: string | null = null;
  let heroAction: HeroAction = 'unknown';
  const actions: ActionEntry[] = [];

  for (const line of lines) {
    // "Hero is BTN" (case-insensitive)
    const heroPosMatch = line.match(/\bHero\s+is\s+(UTG|HJ|CO|BTN|SB|BB)\b/i);
    if (heroPosMatch) {
      heroPosition = heroPosMatch[1].toUpperCase() as Position;
    }

    // "Dealt to Hero [As Qd]"
    const handMatch = line.match(/Dealt\s+to\s+Hero\s+\[([2-9TtJjQqKkAa]+[shdc])\s+([2-9TtJjQqKkAa]+[shdc])\]/i);
    if (handMatch) {
      heroHand = normalizeHand(handMatch[1], handMatch[2]);
    }

    // Actions: "HJ raises to 3bb" / "UTG folds" / "Hero calls" / "CO 3-bets to 9bb"
    const actionMatch = line.match(
      /\b(UTG|HJ|CO|BTN|SB|BB|Hero)\s*[:：]?\s*(raises?|calls?|folds?|checks?|3[\s-]?bets?|4[\s-]?bets?)\b(?:\s+to\s+(\S+))?/i
    );
    if (actionMatch) {
      const actorRaw = actionMatch[1].toUpperCase();
      const pos: Position | null =
        actorRaw === 'HERO'
          ? heroPosition
          : (VALID_POSITIONS.includes(actorRaw as Position) ? actorRaw as Position : null);
      if (!pos) continue;

      const verb = actionMatch[2].toLowerCase().replace(/[\s-]/g, '');
      let normalizedAction: string;
      if (verb.startsWith('raise')) normalizedAction = 'raise';
      else if (verb.startsWith('call')) normalizedAction = 'call';
      else if (verb.startsWith('fold')) normalizedAction = 'fold';
      else if (verb.startsWith('check')) normalizedAction = 'check';
      else if (verb.startsWith('3')) normalizedAction = '3bet';
      else if (verb.startsWith('4')) normalizedAction = '4bet';
      else normalizedAction = verb;

      const entry: ActionEntry = { position: pos, action: normalizedAction };
      if (actionMatch[3]) entry.amount = actionMatch[3];
      actions.push(entry);

      if (actorRaw === 'HERO') {
        heroAction = normalizedAction as HeroAction;
      }
    }
  }

  // Determine spot type and key positions
  let spotType: SpotType = 'unknown';
  let openerPosition: Position | null = null;
  let threeBetPosition: Position | null = null;

  const firstRaise = actions.find(a => a.action === 'raise');
  const first3Bet = actions.find(a => a.action === '3bet');

  if (firstRaise) {
    if (firstRaise.position === heroPosition) {
      spotType = 'open';
    } else {
      openerPosition = firstRaise.position;
      if (first3Bet) {
        threeBetPosition = first3Bet.position;
        if (first3Bet.position === heroPosition) {
          spotType = 'vsOpen';
        } else {
          spotType = 'vs3Bet';
        }
      } else if (heroPosition === 'BB') {
        spotType = 'bbDefense';
      } else if (heroPosition === 'SB' && openerPosition === 'SB') {
        spotType = 'sbVsBb';
      } else {
        spotType = 'vsOpen';
      }
    }
  } else if (heroPosition !== null && heroAction !== 'unknown') {
    spotType = 'open';
  }

  return {
    heroPosition,
    heroHand,
    heroAction,
    spotType,
    openerPosition,
    threeBetPosition,
    actions,
  };
}

export const SAMPLE_HAND_HISTORY = `PokerStars Hand #123456789
Table 'Testudo' 6-max Seat #4 is the button
Seat 1: UTG ($100 in chips)
Seat 2: HJ ($100 in chips)
Seat 3: CO ($100 in chips)
Seat 4: BTN ($100 in chips)
Seat 5: SB ($100 in chips)
Seat 6: BB ($100 in chips)
Hero is BTN
SB: posts small blind $0.50
BB: posts big blind $1.00
Dealt to Hero [As Qd]
UTG: folds
HJ: raises to 3bb
CO: folds
Hero: calls
SB: folds
BB: folds`;
