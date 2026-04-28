export type Suit = 'S' | 'H' | 'D' | 'C';
export type CardSize = 'sm' | 'md' | 'lg';

const RANK_SVG: Record<string, string> = {
  'A': '1', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', 'T': '10',
  'J': 'jack', 'Q': 'queen', 'K': 'king',
};

const SUIT_SVG: Record<Suit, string> = {
  'S': 'spade', 'H': 'heart', 'D': 'diamond', 'C': 'club',
};

const SIZE_CLASSES: Record<CardSize, string> = {
  sm: 'w-10 h-14',
  md: 'w-14 h-20',
  lg: 'w-20 h-28',
};

function suitGlow(suit: Suit): string {
  if (suit === 'H' || suit === 'D') return 'drop-shadow(0 0 8px rgba(255,60,60,0.8))';
  return 'drop-shadow(0 0 8px rgba(80,120,255,0.8))';
}

/** Convert RangePilot hand notation (e.g. "AQo", "99", "KJs") to two { rank, suit } pairs */
export function handToCards(hand: string): [{ rank: string; suit: Suit }, { rank: string; suit: Suit }] {
  const isPair = hand.length === 2 && hand[0] === hand[1];
  const isSuited = hand.endsWith('s');
  const rank1 = hand[0];
  const rank2 = hand.length >= 2 ? hand[1] : hand[0];

  if (isPair) {
    return [{ rank: rank1, suit: 'S' }, { rank: rank2, suit: 'H' }];
  } else if (isSuited) {
    return [{ rank: rank1, suit: 'S' }, { rank: rank2, suit: 'S' }];
  } else {
    return [{ rank: rank1, suit: 'S' }, { rank: rank2, suit: 'D' }];
  }
}

interface PokerCardProps {
  rank: string;
  suit: Suit;
  size?: CardSize;
  className?: string;
}

export default function PokerCard({ rank, suit, size = 'md', className = '' }: PokerCardProps) {
  const rankId = RANK_SVG[rank] ?? rank.toLowerCase();
  const suitId = SUIT_SVG[suit];
  const href = `/cards/svg-cards.svg#${suitId}_${rankId}`;

  return (
    <div
      className={`relative overflow-hidden bg-white select-none rounded-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.7)] ${SIZE_CLASSES[size]} ${className}`}
      style={{
        border: '2.5px solid rgba(255,255,255,0.9)',
        filter: suitGlow(suit),
      }}
    >
      <svg
        viewBox="0 0 169.075 244.640"
        className="absolute inset-0 w-full h-full"
        aria-label={`${rank} of ${suitId}s`}
      >
        <use href={href} />
      </svg>
    </div>
  );
}
