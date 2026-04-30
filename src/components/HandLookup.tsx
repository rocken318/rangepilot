import { useState, useMemo, useEffect } from 'react';
import type { Position, Action, HandEntry } from '../types';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';
import { HAND_NOTES } from '../data/ranges';
import { getHandExplanation, STRENGTH_COLORS } from '../data/handExplanations';
import HandMatrix from './HandMatrix';

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
  bet: 'ベット',
  check: 'チェック',
};

function getActionBadgeClass(action: Action): string {
  switch (action) {
    case 'raise':
      return 'bg-red-600 text-white';
    case '3betValue': case '3betBluff': case '3bet':
      return 'bg-red-500 text-white';
    case '4betValue': case '4betBluff':
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
    case '3betValue': case '3betBluff': case '3bet':
      return 'border-red-500';
    case '4betValue': case '4betBluff':
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
  const lookup = (range: Record<string, HandEntry>): HandEntry | null =>
    range[handName] ?? null;

  if (position === 'UTG') {
    results.push({ label: 'オープン (UTG)', entry: lookup(getOpenRange('UTG', 'standard')), category: 'open' });
    results.push({ label: 'vs 3ベット', entry: lookup(getVs3BetRange('UTG', 'standard')), category: 'vs3Bet' });
  } else if (position === 'HJ') {
    results.push({ label: 'オープン (HJ)', entry: lookup(getOpenRange('HJ', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('HJ', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット', entry: lookup(getVs3BetRange('HJ', 'standard')), category: 'vs3Bet' });
  } else if (position === 'CO') {
    results.push({ label: 'オープン (CO)', entry: lookup(getOpenRange('CO', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('CO', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs HJオープン', entry: lookup(getVsOpenRange('CO', 'HJ', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット', entry: lookup(getVs3BetRange('CO', 'standard')), category: 'vs3Bet' });
  } else if (position === 'BTN') {
    results.push({ label: 'オープン (BTN)', entry: lookup(getOpenRange('BTN', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('BTN', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs HJオープン', entry: lookup(getVsOpenRange('BTN', 'HJ', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs COオープン', entry: lookup(getVsOpenRange('BTN', 'CO', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット', entry: lookup(getVs3BetRange('BTN', 'standard')), category: 'vs3Bet' });
  } else if (position === 'SB') {
    results.push({ label: 'SBオープン (vs BB)', entry: lookup(getSBvsBBRange('sbOpen', 'standard')), category: 'open' });
    results.push({ label: 'vs UTGオープン', entry: lookup(getVsOpenRange('SB', 'UTG', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs BTNオープン', entry: lookup(getVsOpenRange('SB', 'BTN', 'standard')), category: 'vsOpen' });
    results.push({ label: 'vs 3ベット', entry: lookup(getVs3BetRange('SB', 'standard')), category: 'vs3Bet' });
  } else if (position === 'BB') {
    results.push({ label: 'vs UTGオープン', entry: lookup(getBBDefenseRange('UTG', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs HJオープン', entry: lookup(getBBDefenseRange('HJ', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs COオープン', entry: lookup(getBBDefenseRange('CO', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs BTNオープン', entry: lookup(getBBDefenseRange('BTN', 'standard')), category: 'bbDefense' });
    results.push({ label: 'vs SBオープン', entry: lookup(getSBvsBBRange('bbDefVsSb', 'standard')), category: 'bbDefense' });
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

// ポジションごとのマトリックス表示設定
function getMatrixConfig(position: Position): {
  range: Record<string, HandEntry>;
  colorScheme: 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense';
  label: string;
  primaryMode: string;
} {
  if (position === 'BB') {
    return {
      range: getBBDefenseRange('BTN', 'standard'),
      colorScheme: 'bbDefense',
      label: 'vs BTNオープン (ディフェンスレンジ)',
      primaryMode: 'bbDefense',
    };
  }
  if (position === 'SB') {
    return {
      range: getSBvsBBRange('sbOpen', 'standard'),
      colorScheme: 'open',
      label: 'SBオープン vs BB',
      primaryMode: 'sbVsBb',
    };
  }
  return {
    range: getOpenRange(position, 'standard'),
    colorScheme: 'open',
    label: `${position}オープンレンジ`,
    primaryMode: 'open',
  };
}

// カテゴリからシナリオモードに変換
function categoryToMode(category: string, position: Position): string {
  if (category === 'open') return position === 'SB' ? 'sbVsBb' : 'open';
  if (category === 'vsOpen') return 'vsOpen';
  if (category === 'vs3Bet') return 'vs3Bet';
  return 'bbDefense';
}

export default function HandLookup({ position }: Props) {
  const [selectedHand, setSelectedHand] = useState<string | null>(null);

  // ポジション変更時に選択リセット
  useEffect(() => {
    setSelectedHand(null);
  }, [position]);

  const { range: matrixRange, colorScheme, label: matrixLabel, primaryMode } =
    useMemo(() => getMatrixConfig(position), [position]);

  const selectedEntry = selectedHand ? matrixRange[selectedHand] ?? null : null;

  const scenarios = useMemo(
    () => (selectedHand ? buildScenarios(position, selectedHand) : []),
    [position, selectedHand],
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

  const generalNote = selectedHand ? HAND_NOTES[selectedHand] : undefined;

  // プライマリシナリオの説明（ポジション特徴・ハンド概要用）
  const primaryExplanation = useMemo(() => {
    if (!selectedHand || !selectedEntry) return null;
    return getHandExplanation(selectedHand, selectedEntry.action, primaryMode, position);
  }, [selectedHand, selectedEntry, primaryMode, position]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-200">
        🔍 ハンド別ガイド
      </h2>

      {/* マトリックスラベル */}
      <p className="text-xs text-gray-400">
        {matrixLabel} — セルをタップしてハンドを選択
      </p>

      {/* マトリックス */}
      <HandMatrix
        range={matrixRange}
        onSelectHand={setSelectedHand}
        selectedHand={selectedHand}
        colorScheme={colorScheme}
        safeMode={false}
      />

      {/* ハンド詳細 */}
      {selectedHand && selectedEntry ? (
        <div className="space-y-4 pt-2 border-t border-gray-700/50">

          {/* ハンド名 + 強さバッジ */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-mono font-bold text-white">{selectedHand}</span>
            {primaryExplanation && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900/60 ${STRENGTH_COLORS[primaryExplanation.strengthCategory]}`}
              >
                {primaryExplanation.strengthLabel}
              </span>
            )}
          </div>

          {/* 汎用ノート */}
          {generalNote && (
            <div className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-sm text-gray-300">
              {generalNote}
            </div>
          )}

          {/* ポジション特徴 */}
          {primaryExplanation && (
            <div className="px-3 py-2.5 bg-indigo-900/20 border border-indigo-500/30 rounded-lg space-y-1.5">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                ポジション特徴
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {primaryExplanation.positionNote}
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {primaryExplanation.whyThisAction}
              </p>
            </div>
          )}

          {/* 初心者注意 */}
          {primaryExplanation?.beginnerWarning && (
            <div className="px-3 py-2.5 bg-amber-900/20 border border-amber-700/30 rounded-lg">
              <p className="text-xs font-semibold text-amber-400 mb-1">初心者注意</p>
              <p className="text-sm text-amber-200/80 leading-relaxed">
                {primaryExplanation.beginnerWarning}
              </p>
            </div>
          )}

          {/* 各シチュエーションでの立ち回り */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              各シチュエーションでの立ち回り
            </p>

            {CATEGORY_ORDER.map(category => {
              const group = groupedScenarios[category];
              if (!group || group.length === 0) return null;
              const mode = categoryToMode(category, position);

              return (
                <div key={category}>
                  <div className="text-sm font-semibold text-gray-400 mb-2">
                    {CATEGORY_LABELS[category]}
                  </div>
                  <div className="space-y-2">
                    {group.map((scenario, idx) => {
                      const entry = scenario.entry;
                      const action = entry?.action ?? 'fold';
                      const expl = entry
                        ? getHandExplanation(selectedHand, action, mode, position)
                        : null;

                      return (
                        <div
                          key={idx}
                          className={`pl-3 border-l-2 ${getActionBorderClass(action)} py-2 space-y-1`}
                        >
                          {/* ラベル + アクションバッジ */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-gray-300">{scenario.label}</span>
                            <span
                              className={`flex-shrink-0 text-xs px-2 py-0.5 rounded font-semibold ${getActionBadgeClass(action)}`}
                            >
                              {ACTION_NAMES[action] ?? action}
                            </span>
                          </div>

                          {/* 立ち回り説明 */}
                          {expl && (
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {expl.whyThisAction}
                            </p>
                          )}

                          {/* レンジデータのノート */}
                          {entry?.note && (
                            <p className="text-xs text-amber-300/80">{entry.note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* サマリー */}
          {totalCount > 0 && (
            <div className="pt-2 border-t border-gray-700 text-sm text-gray-400">
              <span className="text-green-400 font-semibold">{playCount}</span>
              {' '}シナリオでプレイ /{' '}
              <span className="text-gray-500 font-semibold">{foldCount}</span>
              {' '}シナリオでフォールド
              <span className="ml-2 text-gray-500">
                (参加率 {Math.round((playCount / totalCount) * 100)}%)
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          マトリックスをタップしてハンドの詳細を表示
        </p>
      )}
    </div>
  );
}
