import { useState, useMemo } from 'react';
import type { Mode, Position, RangeWidth, HandEntry } from './types';
import { RANGE_WIDTH_LABELS } from './types';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange, applySafeMode,
} from './data/ranges';
import Controls from './components/Controls';
import HandMatrix from './components/HandMatrix';
import Legend from './components/Legend';
import HandDetail from './components/HandDetail';
import ExportControls from './components/ExportControls';
import HandLookup from './components/HandLookup';
import VillainTypeView from './components/VillainTypeView';
import MemoView from './components/MemoView';
import SpotTestView from './components/SpotTestView';
import PositionGuideView from './components/PositionGuideView';
import Assumptions from './components/Assumptions';

export default function App() {
  const [mode, setMode] = useState<Mode>('open');
  const [myPosition, setMyPosition] = useState<Position>('UTG');
  const [openerPosition, setOpenerPosition] = useState<Position>('UTG');
  const [rangeWidth, setRangeWidth] = useState<RangeWidth>('standard');
  const [hasAnte, setHasAnte] = useState(false);
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [sbVsBbScenario, setSbVsBbScenario] = useState<'sbOpen' | 'bbDefVsSb'>('sbOpen');
  const [safeMode, setSafeMode] = useState(false);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setSelectedHand(null);
    if (m === 'open') setMyPosition('UTG');
    if (m === 'vsOpen') { setMyPosition('HJ'); setOpenerPosition('UTG'); }
    if (m === 'vs3Bet') setMyPosition('UTG');
    if (m === 'bbDefense') { setMyPosition('BB'); setOpenerPosition('UTG'); }
    if (m === 'sbVsBb') { setMyPosition('SB'); setSbVsBbScenario('sbOpen'); }
  };

  const handleMyPositionChange = (pos: Position) => {
    setMyPosition(pos);
    setSelectedHand(null);
    if (mode === 'vsOpen') {
      const posOrder: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      const myIdx = posOrder.indexOf(pos);
      const opIdx = posOrder.indexOf(openerPosition);
      if (opIdx >= myIdx) {
        setOpenerPosition(posOrder[0]);
      }
    }
  };

  const range = useMemo((): Record<string, HandEntry> => {
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
  }, [mode, myPosition, openerPosition, rangeWidth, sbVsBbScenario, safeMode]);

  const scenarioLabel = useMemo(() => {
    const anteStr = hasAnte ? 'アンティあり' : 'アンティなし';
    const safeStr = safeMode ? ' / 安全寄り' : '';
    switch (mode) {
      case 'open':
        return `${myPosition} Open / ${RANGE_WIDTH_LABELS[rangeWidth]} / 100BB / ${anteStr}${safeStr}`;
      case 'vsOpen':
        return `${myPosition} vs ${openerPosition} Open / 100BB / ${anteStr}${safeStr}`;
      case 'vs3Bet':
        return `${myPosition} Open vs 3Bet / 100BB / ${anteStr}${safeStr}`;
      case 'bbDefense':
        return `BB vs ${openerPosition} Open / ${RANGE_WIDTH_LABELS[rangeWidth]} / 100BB / ${anteStr}${safeStr}`;
      case 'sbVsBb':
        return sbVsBbScenario === 'sbOpen'
          ? `SB Open vs BB / ${RANGE_WIDTH_LABELS[rangeWidth]} / 100BB / ${anteStr}${safeStr}`
          : `BB Defense vs SB Open / 100BB / ${anteStr}${safeStr}`;
      default:
        return '';
    }
  }, [mode, myPosition, openerPosition, rangeWidth, hasAnte, sbVsBbScenario, safeMode]);

  const colorScheme = (() => {
    switch (mode) {
      case 'open': return 'open' as const;
      case 'vsOpen': return 'vsOpen' as const;
      case 'vs3Bet': return 'vs3Bet' as const;
      case 'bbDefense': return 'bbDefense' as const;
      case 'sbVsBb': return sbVsBbScenario === 'sbOpen' ? 'open' as const : 'bbDefense' as const;
      default: return 'open' as const;
    }
  })();

  const handCount = useMemo(() => {
    return Object.values(range).filter(e => e.action !== 'fold').length;
  }, [range]);

  const selectedEntry = selectedHand ? range[selectedHand] || null : null;
  const showMatrix = !['villainType', 'memo', 'spotTest', 'positionGuide'].includes(mode);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1117] to-[#111827] text-gray-200">
      <header className="bg-gradient-to-r from-gray-900/90 via-gray-900/80 to-indigo-950/80 border-b border-gray-800 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                RangePilot
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                6max NLH プリフロップレンジ & ガイド
              </p>
            </div>
            {safeMode && (
              <div className="bg-green-600/20 border border-green-600/50 rounded-lg px-4 py-2">
                <span className="text-sm font-bold text-green-400">安全寄りモード ON</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5 rounded-xl">
        <Controls
          mode={mode}
          onModeChange={handleModeChange}
          myPosition={myPosition}
          onMyPositionChange={handleMyPositionChange}
          openerPosition={openerPosition}
          onOpenerPositionChange={(p) => { setOpenerPosition(p); setSelectedHand(null); }}
          rangeWidth={rangeWidth}
          onRangeWidthChange={(w) => { setRangeWidth(w); setSelectedHand(null); }}
          hasAnte={hasAnte}
          onAnteChange={setHasAnte}
          sbVsBbScenario={sbVsBbScenario}
          onSbVsBbScenarioChange={(s) => { setSbVsBbScenario(s); setSelectedHand(null); }}
          safeMode={safeMode}
          onSafeModeChange={setSafeMode}
        />

        {showMatrix && (
          <div className={`rounded-xl px-5 py-3 border ${safeMode ? 'bg-green-900/20 border-green-700/50' : 'bg-gray-800/60 border-gray-700'}`}>
            <p className="text-base sm:text-lg font-bold text-white">{scenarioLabel}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              プレイ可能ハンド数: {handCount} / 169
              {hasAnte && (
                <span className="ml-2 text-amber-400">
                  ⚠ アンティあり：スチール・ディフェンスを少し広めに
                </span>
              )}
              {safeMode && (
                <span className="ml-2 text-green-400">
                  🛡 コール・ブラフを絞った安全寄りレンジ
                </span>
              )}
            </p>
          </div>
        )}

        {mode === 'villainType' && <VillainTypeView />}
        {mode === 'memo' && <MemoView />}
        {mode === 'spotTest' && <SpotTestView safeMode={safeMode} />}
        {mode === 'positionGuide' && (
          <PositionGuideView
            onNavigate={(m, pos, openerPos) => {
              setMode(m);
              setMyPosition(pos);
              if (openerPos) setOpenerPosition(openerPos);
              setSelectedHand(null);
            }}
          />
        )}

        {showMatrix && (
          <>
            <Legend mode={mode === 'sbVsBb' ? (sbVsBbScenario === 'sbOpen' ? 'open' : 'bbDefense') : mode} />

            <div className="flex flex-col lg:flex-row gap-5 justify-center">
              <div className="flex-1 min-w-0 max-w-[800px]">
                <HandMatrix
                  range={range}
                  onSelectHand={setSelectedHand}
                  selectedHand={selectedHand}
                  colorScheme={colorScheme}
                  safeMode={safeMode}
                />
              </div>
              <div className="lg:w-80 shrink-0 space-y-3">
                <HandDetail hand={selectedHand} entry={selectedEntry} safeMode={safeMode} />
                <ExportControls range={range} scenarioLabel={scenarioLabel} />
                <HandLookup
                  position={myPosition}
                  onNavigate={(m, pos, openerPos) => {
                    setMode(m);
                    setMyPosition(pos);
                    if (openerPos) setOpenerPosition(openerPos);
                    setSelectedHand(null);
                  }}
                />
              </div>
            </div>
          </>
        )}

        <Assumptions />

        <div className="mt-8 pb-6 border-t border-gray-800/50 pt-4">
          <p className="text-sm text-gray-500 leading-relaxed bg-gray-800/20 rounded-xl px-4 py-3">
            ※ このレンジは6maxキャッシュゲーム向けの実戦用目安です。GTO完全解ではありません。相手のタイプ、レイズサイズ、スタック、アンティ有無によって調整してください。
          </p>
        </div>
      </main>
    </div>
  );
}
