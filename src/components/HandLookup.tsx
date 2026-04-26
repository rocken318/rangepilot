import { useState, useMemo } from 'react';
import type { Position, Action, HandEntry } from '../types';
import { RANKS } from '../types';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';
import { HAND_NOTES } from '../data/ranges';

interface Props {
  position: Position;
}

const ACTION_NAMES: Record<Action, string> = {
  raise: 'レイズ',
  '3betValue': '3ベット(V)',
  '3betBluff': '3ベット(B)',
  '3bet': '3ベット',
  call: 'コール',
  mixed: '相手次第',
  fold: 'フォールド',
  '4betValue': '4ベット(V)',
  '4betBluff': '4ベット(B)',
};

function getActionBadgeClass(action: Action): string {
  switch (action) {
    case 'raise':
      return 'bg-red-600 text-white';
    case '3betValue':
    case '3betBluff':
    case '3bet':
      return 'bg-red-500 text-white';
    case '4betValue':
    case '4betBluff':
      return 'bg-purple-600 text-white';
    case 'call':
      return 'bg-blue-600 text-white';
    case 'mixed':
      return 'bg-yellow-500 text-gray-900';
    case 'fold':
      return 'bg-gray-600 text-gray-300';
    default:
      return 'bg-gray-600 text-gray-300';
  }
}

function getActionBorderClass(action: Action): string {
  switch (action) {
    case 'raise':
      return 'border-red-600';
    case '3betValue':
    case '3betBluff':
    case '3bet':
      return 'border-red-500';
    case '4betValue':
    case '4betBluff':
      return 'border-purple-600';
    case 'call':
      return 'border-blue-600';
    case 'mixed':
      return 'border-yellow-500';
    case 'fold':
      return 'border-gray-600';
    default:
      return 'border-gray-600';
  }
}

interface ScenarioResult {
  label: string;
  entry: HandEntry | null;
  category: 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense';
}

function buildScenarios(position: Position, handName: string): ScenarioResult[] {
  const results: ScenarioResult[] = [];

  const lookup = (range: Record<string, HandEntry>): HandEntry | null => {
    return range[handName] ?? null;
  };

  if (position === 'UTG') {
    const openRange = getOpenRange('UTG', 'standard');
    results.push({ label: 'オープン (UTG)', entry: lookup(openRange), category: 'open' });

    const vs3BetRange = getVs3BetRange('UTG', 'standard');
    results.push({ label: 'vs 3ベット (UTG)', entry: lookup(vs3BetRange), category: 'vs3Bet' });
  }

  else if (position === 'HJ') {
    const openRange = getOpenRange('HJ', 'standard');
    results.push({ label: 'オープン (HJ)', entry: lookup(openRange), category: 'open' });

    const vsUTG = getVsOpenRange('HJ', 'UTG', 'standard');
    results.push({ label: 'vs UTGオープン', entry: lookup(vsUTG), category: 'vsOpen' });

    const vs3BetRange = getVs3BetRange('HJ', 'standard');
    results.push({ label: 'vs 3ベット (HJ)', entry: lookup(vs3BetRange), category: 'vs3Bet' });
  }

  else if (position === 'CO') {
    const openRange = getOpenRange('CO', 'standard');
    results.push({ label: 'オープン (CO)', entry: lookup(openRange), category: 'open' });

    const vsUTG = getVsOpenRange('CO', 'UTG', 'standard');
    results.push({ label: 'vs UTGオープン', entry: lookup(vsUTG), category: 'vsOpen' });

    const vsHJ = getVsOpenRange('CO', 'HJ', 'standard');
    results.push({ label: 'vs HJオープン', entry: lookup(vsHJ), category: 'vsOpen' });

    const vs3BetRange = getVs3BetRange('CO', 'standard');
    results.push({ label: 'vs 3ベット (CO)', entry: lookup(vs3BetRange), category: 'vs3Bet' });
  }

  else if (position === 'BTN') {
    const openRange = getOpenRange('BTN', 'standard');
    results.push({ label: 'オープン (BTN)', entry: lookup(openRange), category: 'open' });

    const vsUTG = getVsOpenRange('BTN', 'UTG', 'standard');
    results.push({ label: 'vs UTGオープン', entry: lookup(vsUTG), category: 'vsOpen' });

    const vsHJ = getVsOpenRange('BTN', 'HJ', 'standard');
    results.push({ label: 'vs HJオープン', entry: lookup(vsHJ), category: 'vsOpen' });

    const vsCO = getVsOpenRange('BTN', 'CO', 'standard');
    results.push({ label: 'vs COオープン', entry: lookup(vsCO), category: 'vsOpen' });

    const vs3BetRange = getVs3BetRange('BTN', 'standard');
    results.push({ label: 'vs 3ベット (BTN)', entry: lookup(vs3BetRange), category: 'vs3Bet' });
  }

  else if (position === 'SB') {
    const sbOpenRange = getSBvsBBRange('sbOpen', 'standard');
    results.push({ label: 'SBオープン (vs BB)', entry: lookup(sbOpenRange), category: 'open' });

    const vsUTG = getVsOpenRange('SB', 'UTG', 'standard');
    results.push({ label: 'vs UTGオープン', entry: lookup(vsUTG), category: 'vsOpen' });

    const vsBTN = getVsOpenRange('SB', 'BTN', 'standard');
    results.push({ label: 'vs BTNオープン', entry: lookup(vsBTN), category: 'vsOpen' });

    const vs3BetRange = getVs3BetRange('SB', 'standard');
    results.push({ label: 'vs 3ベット (SB)', entry: lookup(vs3BetRange), category: 'vs3Bet' });
  }

  else if (position === 'BB') {
    const bbVsUTG = getBBDefenseRange('UTG', 'standard');
    results.push({ label: 'BBディフェンス vs UTG', entry: lookup(bbVsUTG), category: 'bbDefense' });

    const bbVsHJ = getBBDefenseRange('HJ', 'standard');
    results.push({ label: 'BBディフェンス vs HJ', entry: lookup(bbVsHJ), category: 'bbDefense' });

    const bbVsCO = getBBDefenseRange('CO', 'standard');
    results.push({ label: 'BBディフェンス vs CO', entry: lookup(bbVsCO), category: 'bbDefense' });

    const bbVsBTN = getBBDefenseRange('BTN', 'standard');
    results.push({ label: 'BBディフェンス vs BTN', entry: lookup(bbVsBTN), category: 'bbDefense' });

    const bbVsSB = getBBDefenseRange('SB', 'standard');
    results.push({ label: 'BBディフェンス vs SB', entry: lookup(bbVsSB), category: 'bbDefense' });

    const bbVsBTNOpen = getVsOpenRange('BB', 'BTN', 'standard');
    results.push({ label: 'vs BTNオープン (3bet)', entry: lookup(bbVsBTNOpen), category: 'vsOpen' });

    const bbDefVsSb = getSBvsBBRange('bbDefVsSb', 'standard');
    results.push({ label: 'BBディフェンス vs SBオープン', entry: lookup(bbDefVsSb), category: 'bbDefense' });
  }

  return results;
}

const CATEGORY_LABELS: Record<string, string> = {
  open: 'オープン',
  vsOpen: 'vs オープンレイズ',
  vs3Bet: 'vs 3ベット',
  bbDefense: 'BBディフェンス',
};

const CATEGORY_ORDER = ['open', 'vsOpen', 'vs3Bet', 'bbDefense'];

export default function HandLookup({ position }: Props) {
  const [rank1, setRank1] = useState<string>('A');
  const [rank2, setRank2] = useState<string>('K');
  const [type, setType] = useState<'s' | 'o'>('s');

  const isPair = rank1 === rank2;

  const handName = useMemo(() => {
    if (isPair) {
      return `${rank1}${rank2}`;
    }
    const idx1 = RANKS.indexOf(rank1 as typeof RANKS[number]);
    const idx2 = RANKS.indexOf(rank2 as typeof RANKS[number]);
    if (idx1 < idx2) {
      return `${rank1}${rank2}${type}`;
    } else {
      return `${rank2}${rank1}${type}`;
    }
  }, [rank1, rank2, type, isPair]);

  const scenarios = useMemo(() => buildScenarios(position, handName), [position, handName]);

  const generalNote = HAND_NOTES[handName];

  const playCount = scenarios.filter(s => s.entry && s.entry.action !== 'fold').length;
  const foldCount = scenarios.filter(s => s.entry && s.entry.action === 'fold').length;
  const totalCount = scenarios.filter(s => s.entry !== null).length;

  const groupedScenarios = useMemo(() => {
    const groups: Record<string, ScenarioResult[]> = {};
    for (const s of scenarios) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [scenarios]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-200 mb-3">
        🔍 ハンド別ガイド
      </h2>

      {/* Selector row */}
      <div className="space-y-3 mb-4">
        {/* Card 1 */}
        <div>
          <div className="text-sm font-medium text-gray-400 mb-1">カード1</div>
          <div className="flex flex-wrap gap-1.5">
            {RANKS.map(r => (
              <button
                key={r}
                onClick={() => setRank1(r)}
                className={`text-sm px-2.5 py-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded font-mono font-semibold transition-colors ${
                  rank1 === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Card 2 */}
        <div>
          <div className="text-sm font-medium text-gray-400 mb-1">カード2</div>
          <div className="flex flex-wrap gap-1.5">
            {RANKS.map(r => (
              <button
                key={r}
                onClick={() => setRank2(r)}
                className={`text-sm px-2.5 py-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded font-mono font-semibold transition-colors ${
                  rank2 === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Type selector */}
        <div>
          <div className="text-sm font-medium text-gray-400 mb-1">タイプ</div>
          {isPair ? (
            <span className="text-sm px-4 py-2.5 min-h-[40px] rounded bg-gray-700 text-gray-300 font-semibold">
              ペア
            </span>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => setType('s')}
                className={`text-sm px-4 py-2.5 min-h-[40px] rounded font-semibold transition-colors ${
                  type === 's'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                s (スーテッド)
              </button>
              <button
                onClick={() => setType('o')}
                className={`text-sm px-4 py-2.5 min-h-[40px] rounded font-semibold transition-colors ${
                  type === 'o'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                o (オフスート)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hand name display */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl font-mono font-bold text-white">
          {handName}
        </span>
        <span className="text-xs text-gray-400">
          {isPair ? 'ポケットペア' : type === 's' ? 'スーテッド' : 'オフスート'}
        </span>
      </div>

      {/* General hand note */}
      {generalNote && (
        <div className="mb-3 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-gray-300">
          {generalNote}
        </div>
      )}

      {/* Scenario results grouped by category */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map(category => {
          const group = groupedScenarios[category];
          if (!group || group.length === 0) return null;
          return (
            <div key={category}>
              <div className="text-sm font-semibold text-gray-400 mb-1 uppercase tracking-wide">
                {CATEGORY_LABELS[category]}
              </div>
              <div className="space-y-1">
                {group.map((scenario, idx) => {
                  const entry = scenario.entry;
                  const action = entry?.action ?? 'fold';
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 pl-2 border-l-2 ${getActionBorderClass(action)} py-2`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-300">{scenario.label}</span>
                        {entry?.note && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate" title={entry.note}>
                            {entry.note}
                          </p>
                        )}
                      </div>
                      <span
                        className={`flex-shrink-0 text-sm px-2 py-1 rounded font-semibold ${getActionBadgeClass(action)}`}
                      >
                        {ACTION_NAMES[action] ?? action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary line */}
      <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
        {totalCount > 0 ? (
          <>
            <span className="text-green-400 font-semibold">{playCount}</span>
            <span> シナリオでプレイ / </span>
            <span className="text-gray-500 font-semibold">{foldCount}</span>
            <span> シナリオでフォールド</span>
            {totalCount > 0 && (
              <span className="ml-2 text-gray-500">
                (参加率 {Math.round((playCount / totalCount) * 100)}%)
              </span>
            )}
          </>
        ) : (
          <span>データなし</span>
        )}
      </div>
    </div>
  );
}
