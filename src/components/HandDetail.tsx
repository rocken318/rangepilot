import { useMemo } from 'react';
import type { HandEntry, Action, Mode, Position } from '../types';
import { HAND_NOTES } from '../data/ranges';
import { getHandExplanation, STRENGTH_COLORS } from '../data/handExplanations';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';

interface Props {
  hand: string | null;
  entry: HandEntry | null;
  safeMode?: boolean;
  mode?: Mode;
  position?: Position;
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

const ACTION_COLORS: Record<Action, string> = {
  raise: 'text-red-400',
  '3betValue': 'text-red-400',
  '3betBluff': 'text-rose-400',
  '3bet': 'text-red-400',
  call: 'text-blue-400',
  mixed: 'text-yellow-400',
  fold: 'text-gray-500',
  '4betValue': 'text-purple-400',
  '4betBluff': 'text-purple-300',
};

function getActionBadgeClass(action: Action): string {
  switch (action) {
    case 'raise': return 'bg-red-600 text-white';
    case '3betValue': case '3betBluff': case '3bet': return 'bg-red-500 text-white';
    case '4betValue': case '4betBluff': return 'bg-purple-600 text-white';
    case 'call': return 'bg-blue-600 text-white';
    case 'mixed': return 'bg-yellow-500 text-gray-900';
    case 'fold': return 'bg-gray-600 text-gray-300';
    default: return 'bg-gray-600 text-gray-300';
  }
}

function getActionBorderClass(action: Action): string {
  switch (action) {
    case 'raise': return 'border-red-600';
    case '3betValue': case '3betBluff': case '3bet': return 'border-red-500';
    case '4betValue': case '4betBluff': return 'border-purple-600';
    case 'call': return 'border-blue-600';
    case 'mixed': return 'border-yellow-500';
    case 'fold': return 'border-gray-600';
    default: return 'border-gray-600';
  }
}

interface ScenarioResult {
  label: string;
  entry: HandEntry | null;
  category: 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense';
}

const CATEGORY_LABELS: Record<string, string> = {
  open: 'オープン',
  vsOpen: 'vs オープンレイズ',
  vs3Bet: 'vs 3ベット',
  bbDefense: 'BBディフェンス',
};

const CATEGORY_ORDER = ['open', 'vsOpen', 'vs3Bet', 'bbDefense'];

function buildScenarios(position: Position, handName: string): ScenarioResult[] {
  const results: ScenarioResult[] = [];
  const lookup = (range: Record<string, HandEntry>): HandEntry | null => range[handName] ?? null;

  if (position === 'UTG') {
    results.push({ label: 'オープン (UTG)', entry: lookup(getOpenRange('UTG', 'standard')), category: 'open' });
    results.push({ label: 'vs 3ベット (UTG)', entry: lookup(getVs3BetRange('UTG', 'standard')), category: 'vs3Bet' });
  } else if (position === 'HJ') {
    results.push({ label: 'オープン (HJ)', entry: lookup(getOpenRange('HJ', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('HJ', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット (HJ)', entry: lookup(getVs3BetRange('HJ', 'standard')), category: 'vs3Bet' });
  } else if (position === 'CO') {
    results.push({ label: 'オープン (CO)', entry: lookup(getOpenRange('CO', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('CO', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs HJオープン', entry: lookup(getVsOpenRange('CO', 'HJ', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット (CO)', entry: lookup(getVs3BetRange('CO', 'standard')), category: 'vs3Bet' });
  } else if (position === 'BTN') {
    results.push({ label: 'オープン (BTN)', entry: lookup(getOpenRange('BTN', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('BTN', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs HJオープン', entry: lookup(getVsOpenRange('BTN', 'HJ', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs COオープン', entry: lookup(getVsOpenRange('BTN', 'CO', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット (BTN)', entry: lookup(getVs3BetRange('BTN', 'standard')), category: 'vs3Bet' });
  } else if (position === 'SB') {
    results.push({ label: 'SBオープン (vs BB)', entry: lookup(getSBvsBBRange('sbOpen', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('SB', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs BTNオープン', entry: lookup(getVsOpenRange('SB', 'BTN', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット (SB)', entry: lookup(getVs3BetRange('SB', 'standard')), category: 'vs3Bet' });
  } else if (position === 'BB') {
    results.push({ label: 'vs UTG', entry: lookup(getBBDefenseRange('UTG', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs HJ', entry: lookup(getBBDefenseRange('HJ', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs CO', entry: lookup(getBBDefenseRange('CO', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs BTN', entry: lookup(getBBDefenseRange('BTN', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs SB', entry: lookup(getBBDefenseRange('SB', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs SBオープン', entry: lookup(getSBvsBBRange('bbDefVsSb', 'standard')), category: 'bbDefense' });
  }

  return results;
}

export default function HandDetail({ hand, entry, safeMode, mode, position }: Props) {
  const scenarios = useMemo(
    () => (hand && position ? buildScenarios(position, hand) : []),
    [hand, position],
  );

  const groupedScenarios = useMemo(() => {
    const groups: Record<string, ScenarioResult[]> = {};
    for (const s of scenarios) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [scenarios]);

  const playCount = scenarios.filter(s => s.entry && s.entry.action !== 'fold').length;
  const foldCount = scenarios.filter(s => s.entry && s.entry.action === 'fold').length;
  const totalCount = scenarios.filter(s => s.entry !== null).length;

  if (!hand || !entry) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 shadow-md shadow-black/20">
        <p className="text-gray-500 text-base">マトリックスをタップしてハンドの詳細を表示</p>
      </div>
    );
  }

  const generalNote = HAND_NOTES[hand];
  const actionNote = entry.note;
  const hasSafeDiff = safeMode && entry.normalAction && entry.normalAction !== entry.action;

  return (
    <div className={`rounded-xl p-5 border space-y-4 shadow-md shadow-black/20 ${hasSafeDiff ? 'bg-green-900/20 border-green-700/50' : 'bg-gray-800/50 border-gray-700'}`}>
      {/* Current scenario action */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold font-mono text-white">{hand}</span>
        <span className={`text-base font-medium ${ACTION_COLORS[entry.action]}`}>
          {ACTION_NAMES[entry.action]}
        </span>
      </div>

      {hasSafeDiff && (
        <div className="bg-green-800/30 rounded px-3 py-2 border border-green-700/30">
          <p className="text-sm text-green-300">
            安全寄りモードで変更: <span className="text-gray-400 line-through">{ACTION_NAMES[entry.normalAction!]}</span> → <span className="font-bold">{ACTION_NAMES[entry.action]}</span>
          </p>
        </div>
      )}

      {actionNote && <p className="text-sm text-amber-300/90">{actionNote}</p>}
      {generalNote && <p className="text-sm text-gray-300">{generalNote}</p>}

      {/* WHY explanation */}
      {mode && position && (() => {
        const explanation = getHandExplanation(hand, entry.action, mode, position);
        return (
          <div className="border-t border-gray-700/50 pt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${STRENGTH_COLORS[explanation.strengthCategory]} bg-gray-900/50`}>
                {explanation.strengthLabel}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">なぜこのアクション？</p>
              <p className="text-sm text-gray-300 leading-relaxed">{explanation.whyThisAction}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">ポジションの影響</p>
              <p className="text-sm text-gray-300 leading-relaxed">{explanation.positionNote}</p>
            </div>
            {explanation.beginnerWarning && (
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-amber-400 mb-0.5">初心者注意</p>
                <p className="text-sm text-amber-200/80">{explanation.beginnerWarning}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* All scenarios for this hand */}
      {scenarios.length > 0 && (
        <div className="border-t border-gray-700/50 pt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">全シナリオ概要</p>

          {CATEGORY_ORDER.map(category => {
            const group = groupedScenarios[category];
            if (!group || group.length === 0) return null;
            return (
              <div key={category}>
                <div className="text-xs font-semibold text-gray-400 mb-1">
                  {CATEGORY_LABELS[category]}
                </div>
                <div className="space-y-1">
                  {group.map((scenario, idx) => {
                    const e = scenario.entry;
                    const action = e?.action ?? 'fold';
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 pl-2 border-l-2 ${getActionBorderClass(action)} py-1`}
                      >
                        <span className="flex-1 text-xs text-gray-300 truncate">{scenario.label}</span>
                        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-semibold ${getActionBadgeClass(action)}`}>
                          {ACTION_NAMES[action] ?? action}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {totalCount > 0 && (
            <div className="text-xs text-gray-500 pt-1">
              <span className="text-green-400 font-semibold">{playCount}</span> プレイ / <span className="text-gray-400 font-semibold">{foldCount}</span> フォールド
              <span className="ml-1">(参加率 {Math.round((playCount / totalCount) * 100)}%)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
