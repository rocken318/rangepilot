import { Fragment, useRef } from 'react';
import type { HandEntry, Action } from '../types';
import { RANKS, getHandName, getHandType } from '../types';

interface Props {
  range: Record<string, HandEntry>;
  onSelectHand: (hand: string) => void;
  selectedHand: string | null;
  colorScheme: 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense';
  safeMode?: boolean;
}

const ACTION_COLORS: Record<string, Record<Action, string>> = {
  open: {
    raise: 'bg-red-600 hover:bg-red-500 text-white',
    mixed: 'bg-yellow-500 hover:bg-yellow-400 text-gray-900',
    fold: 'bg-gray-700 hover:bg-gray-600 text-gray-400',
    '3betValue': 'bg-red-600 hover:bg-red-500 text-white',
    '3betBluff': 'bg-red-600 hover:bg-red-500 text-white',
    call: 'bg-blue-600 hover:bg-blue-500 text-white',
    '4betValue': 'bg-purple-600 hover:bg-purple-500 text-white',
    '4betBluff': 'bg-purple-600 hover:bg-purple-500 text-white',
    '3bet': 'bg-red-600 hover:bg-red-500 text-white',
    bet: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    check: 'bg-slate-600 hover:bg-slate-500 text-white',
  },
  vsOpen: {
    '3betValue': 'bg-red-600 hover:bg-red-500 text-white',
    '3betBluff': 'bg-rose-500 hover:bg-rose-400 text-white',
    call: 'bg-blue-600 hover:bg-blue-500 text-white',
    mixed: 'bg-yellow-500 hover:bg-yellow-400 text-gray-900',
    fold: 'bg-gray-700 hover:bg-gray-600 text-gray-400',
    raise: 'bg-red-600 hover:bg-red-500 text-white',
    '4betValue': 'bg-purple-600 hover:bg-purple-500 text-white',
    '4betBluff': 'bg-purple-600 hover:bg-purple-500 text-white',
    '3bet': 'bg-red-600 hover:bg-red-500 text-white',
    bet: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    check: 'bg-slate-600 hover:bg-slate-500 text-white',
  },
  vs3Bet: {
    '4betValue': 'bg-purple-700 hover:bg-purple-600 text-white',
    '4betBluff': 'bg-purple-500 hover:bg-purple-400 text-white',
    call: 'bg-blue-600 hover:bg-blue-500 text-white',
    mixed: 'bg-yellow-500 hover:bg-yellow-400 text-gray-900',
    fold: 'bg-gray-700 hover:bg-gray-600 text-gray-400',
    raise: 'bg-red-600 hover:bg-red-500 text-white',
    '3betValue': 'bg-red-600 hover:bg-red-500 text-white',
    '3betBluff': 'bg-rose-500 hover:bg-rose-400 text-white',
    '3bet': 'bg-red-600 hover:bg-red-500 text-white',
    bet: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    check: 'bg-slate-600 hover:bg-slate-500 text-white',
  },
  bbDefense: {
    '3bet': 'bg-red-600 hover:bg-red-500 text-white',
    '3betValue': 'bg-red-600 hover:bg-red-500 text-white',
    '3betBluff': 'bg-rose-500 hover:bg-rose-400 text-white',
    call: 'bg-blue-600 hover:bg-blue-500 text-white',
    mixed: 'bg-yellow-500 hover:bg-yellow-400 text-gray-900',
    fold: 'bg-gray-700 hover:bg-gray-600 text-gray-400',
    raise: 'bg-red-600 hover:bg-red-500 text-white',
    '4betValue': 'bg-purple-600 hover:bg-purple-500 text-white',
    '4betBluff': 'bg-purple-600 hover:bg-purple-500 text-white',
    bet: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    check: 'bg-slate-600 hover:bg-slate-500 text-white',
  },
};

const ACTION_LABELS: Record<Action, string> = {
  raise: 'R',
  '3betValue': '3B-V',
  '3betBluff': '3B-B',
  '3bet': '3B',
  call: 'C',
  mixed: 'M',
  fold: 'F',
  '4betValue': '4B-V',
  '4betBluff': '4B-B',
  bet: 'B',
  check: 'Ch',
};

export default function HandMatrix({ range, onSelectHand, selectedHand, colorScheme, safeMode }: Props) {
  const matrixRef = useRef<HTMLDivElement>(null);
  const colors = ACTION_COLORS[colorScheme] || ACTION_COLORS.open;

  return (
    <div ref={matrixRef} id="hand-matrix" className="w-full overflow-x-auto flex justify-center">
      <div className="grid gap-[2px] bg-gray-800 p-[2px] rounded-xl shadow-lg shadow-black/20 w-full" style={{
        gridTemplateColumns: `auto repeat(13, 1fr)`,
        minWidth: '640px',
        maxWidth: '800px',
      }}>
        {/* Header row */}
        <div className="bg-gray-900 p-1.5 text-sm text-gray-500 flex items-center justify-center font-mono" />
        {RANKS.map(rank => (
          <div key={rank} className="bg-gray-900 p-1.5 text-sm text-gray-400 flex items-center justify-center font-mono font-bold">
            {rank}
          </div>
        ))}

        {/* Matrix rows */}
        {RANKS.map((rowRank, row) => (
          <Fragment key={`row-${row}`}>
            {/* Row label */}
            <div className="bg-gray-900 p-1.5 text-sm text-gray-400 flex items-center justify-center font-mono font-bold">
              {rowRank}
            </div>
            {RANKS.map((_colRank, col) => {
              const handName = getHandName(row, col);
              const entry = range[handName] || { hand: handName, action: 'fold' as Action };
              const handType = getHandType(row, col);
              const isSelected = selectedHand === handName;
              const colorClass = colors[entry.action] || colors.fold;
              const hasSafeDiff = safeMode && entry.normalAction && entry.normalAction !== entry.action;

              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => onSelectHand(handName)}
                  className={`
                    relative p-1 text-center cursor-pointer transition-all duration-150
                    ${colorClass}
                    ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 z-10 scale-110' : ''}
                    ${handType === 'pair' ? 'font-bold' : ''}
                  `}
                  style={{ aspectRatio: '1', minWidth: 0, minHeight: 0 }}
                  title={`${handName}: ${ACTION_LABELS[entry.action]}${hasSafeDiff ? ` (通常: ${ACTION_LABELS[entry.normalAction!]})` : ''}`}
                >
                  <div className="text-xs sm:text-sm leading-tight font-mono">
                    {handName}
                  </div>
                  <div className="text-[9px] sm:text-xs leading-none opacity-80">
                    {ACTION_LABELS[entry.action]}
                  </div>
                  {/* Safe mode diff indicator */}
                  {hasSafeDiff && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
