import { useState, useMemo } from 'react';
import type { Position } from '../types';
import { RANKS } from '../types';
import {
  getOpenRange,
  getVsOpenRange,
  getVs3BetRange,
  getBBDefenseRange,
  getSBvsBBRange,
} from '../data/ranges';

type ScenarioType = 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense' | 'sbVsBb';

const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  open: 'オープン',
  vsOpen: 'vsオープン',
  vs3Bet: 'vs 3ベット',
  bbDefense: 'BBディフェンス',
  sbVsBb: 'SB vs BB',
};

const RAISE_ACTIONS = ['raise', '3betValue', '3betBluff', '3bet', '4betValue', '4betBluff'];

function actionColor(action: string): string {
  if (RAISE_ACTIONS.includes(action)) return '#16a34a';
  if (action === 'call') return '#2563eb';
  if (action === 'mixed') return '#ca8a04';
  return '#1f2937';
}

function actionLabel(action: string): string {
  if (RAISE_ACTIONS.includes(action)) return 'R';
  if (action === 'call') return 'C';
  if (action === 'mixed') return 'Mix';
  return '';
}

function getRange(
  scenarioType: ScenarioType,
  heroPos: Position,
  openerPos: Position,
) {
  switch (scenarioType) {
    case 'open':
      return getOpenRange(heroPos, 'standard');
    case 'vsOpen':
      return getVsOpenRange(heroPos, openerPos, 'standard');
    case 'vs3Bet':
      return getVs3BetRange(heroPos, 'standard');
    case 'bbDefense':
      return getBBDefenseRange(openerPos, 'standard');
    case 'sbVsBb':
      return getSBvsBBRange(heroPos === 'SB' ? 'sbOpen' : 'bbDefVsSb', 'standard');
  }
}

function scenarioDescription(
  scenarioType: ScenarioType,
  heroPos: Position,
  openerPos: Position,
): string {
  switch (scenarioType) {
    case 'open':
      return `${heroPos} オープン レンジ`;
    case 'vsOpen':
      return `${heroPos} vs ${openerPos} オープン`;
    case 'vs3Bet':
      return `${heroPos} オープン vs 3ベット`;
    case 'bbDefense':
      return `BB vs ${openerPos} オープン`;
    case 'sbVsBb':
      return heroPos === 'SB' ? 'SB オープン vs BB' : 'BB ディフェンス vs SB';
  }
}

export default function GTOGuideView() {
  const [scenarioType, setScenarioType] = useState<ScenarioType>('open');
  const [heroPos, setHeroPos] = useState<Position>('UTG');
  const [openerPos, setOpenerPos] = useState<Position>('UTG');
  const [hoveredHand, setHoveredHand] = useState<string | null>(null);

  const range = useMemo(
    () => getRange(scenarioType, heroPos, openerPos),
    [scenarioType, heroPos, openerPos],
  );

  const showOpener = scenarioType === 'vsOpen' || scenarioType === 'bbDefense';
  const showHero =
    scenarioType !== 'bbDefense' && scenarioType !== 'sbVsBb';
  const showSbBbHero = scenarioType === 'sbVsBb';

  const handCount = useMemo(
    () => Object.values(range).filter(e => e.action !== 'fold').length,
    [range],
  );

  const hoveredEntry = hoveredHand ? range[hoveredHand] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gray-800/60 border border-gray-700 px-5 py-3">
        <h2 className="text-lg font-bold text-white">GTOガイド</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          シナリオ別レンジをマトリックスで確認できます
        </p>
      </div>

      {/* Scenario selector */}
      <div className="rounded-xl bg-gray-800/60 border border-gray-700 px-5 py-4 space-y-3">
        {/* Scenario type */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5">シナリオ</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCENARIO_LABELS) as ScenarioType[]).map(s => (
              <button
                key={s}
                onClick={() => setScenarioType(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  scenarioType === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {SCENARIO_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Hero position (not shown for bbDefense) */}
        {showHero && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5">自分のポジション</p>
            <div className="flex gap-2">
              {POSITIONS.filter(p => {
                if (scenarioType === 'vsOpen') return p !== 'UTG' && p !== 'BB';
                return true;
              }).map(p => (
                <button
                  key={p}
                  onClick={() => setHeroPos(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    heroPos === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SB/BB selector for sbVsBb */}
        {showSbBbHero && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5">役割</p>
            <div className="flex gap-2">
              {(['SB', 'BB'] as Position[]).map(p => (
                <button
                  key={p}
                  onClick={() => setHeroPos(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    heroPos === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Opener position */}
        {showOpener && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5">オープナーのポジション</p>
            <div className="flex gap-2">
              {POSITIONS.filter(p => {
                if (scenarioType === 'vsOpen') {
                  const posOrder = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
                  return posOrder.indexOf(p) < posOrder.indexOf(heroPos);
                }
                if (scenarioType === 'bbDefense') return p !== 'BB';
                return true;
              }).map(p => (
                <button
                  key={p}
                  onClick={() => setOpenerPos(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    openerPos === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current scenario info */}
      <div className="rounded-xl bg-gray-800/60 border border-gray-700 px-5 py-3 flex items-center justify-between">
        <p className="text-base font-bold text-white">
          {scenarioDescription(scenarioType, heroPos, openerPos)}
        </p>
        <p className="text-sm text-gray-400">
          プレイ可能: <span className="text-white font-semibold">{handCount}</span> / 169
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {[
          { color: '#16a34a', label: 'レイズ / 3ベット (R)' },
          { color: '#2563eb', label: 'コール (C)' },
          { color: '#ca8a04', label: 'ミックス (Mix)' },
          { color: '#1f2937', label: 'フォールド' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color, border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-max">
          {/* Column header row */}
          <div className="flex">
            <div className="w-7 h-6" /> {/* corner spacer */}
            {RANKS.map(r => (
              <div
                key={r}
                className="w-[42px] h-6 flex items-center justify-center text-xs text-gray-500 font-mono"
              >
                {r}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {RANKS.map((rowRank, rowIdx) => (
            <div key={rowRank} className="flex">
              {/* Row label */}
              <div className="w-7 flex items-center justify-center text-xs text-gray-500 font-mono">
                {rowRank}
              </div>

              {RANKS.map((colRank, colIdx) => {
                let handKey: string;
                if (rowIdx === colIdx) {
                  handKey = `${rowRank}${colRank}`;
                } else if (rowIdx < colIdx) {
                  handKey = `${rowRank}${colRank}s`;
                } else {
                  handKey = `${colRank}${rowRank}o`;
                }

                const entry = range[handKey];
                const action = entry?.action ?? 'fold';
                const bg = actionColor(action);
                const label = actionLabel(action);
                const isFold = action === 'fold';
                const isHovered = hoveredHand === handKey;

                return (
                  <div
                    key={colIdx}
                    onMouseEnter={() => setHoveredHand(handKey)}
                    onMouseLeave={() => setHoveredHand(null)}
                    style={{
                      backgroundColor: bg,
                      width: 42,
                      height: 34,
                      border: isHovered
                        ? '2px solid #e2e8f0'
                        : '1px solid rgba(0,0,0,0.4)',
                      opacity: isFold ? 0.4 : 1,
                      cursor: 'default',
                      transition: 'opacity 0.1s, border 0.1s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      margin: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {handKey}
                    </span>
                    {!isFold && label && (
                      <span
                        style={{
                          fontSize: 9,
                          color: 'rgba(255,255,255,0.7)',
                          lineHeight: 1,
                          marginTop: 2,
                        }}
                      >
                        {label} 100%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredEntry && hoveredHand && (
        <div className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-3">
          <p className="text-sm font-bold text-white">
            {hoveredHand}{' '}
            <span
              style={{ color: actionColor(hoveredEntry.action) }}
              className="ml-2"
            >
              {hoveredEntry.action === 'fold'
                ? 'フォールド'
                : hoveredEntry.action === 'call'
                ? 'コール'
                : hoveredEntry.action === 'mixed'
                ? 'ミックス'
                : 'レイズ / 3ベット'}
            </span>
          </p>
          {hoveredEntry.note && (
            <p className="text-xs text-gray-400 mt-1">{hoveredEntry.note}</p>
          )}
        </div>
      )}
    </div>
  );
}
