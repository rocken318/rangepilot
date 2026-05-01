'use client';

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
import VillainTypeView from './components/VillainTypeView';
import MemoView from './components/MemoView';
import SpotTestView from './components/SpotTestView';
import PositionGuideView from './components/PositionGuideView';
import PostflopGuideView from './components/PostflopGuideView';
import GlossaryView from './components/GlossaryView';
import LearningTrackerView from './components/LearningTrackerView';
import AIReviewView from './components/AIReviewView';
import PracticeModeView from './components/PracticeModeView';
import HandHistoryAnalyzer from './components/HandHistoryAnalyzer';
import GTOGuideView from './components/GTOGuideView';
import BooksView from './components/BooksView';
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

  const UTILITY_MODES: Mode[] = ['villainType', 'memo', 'spotTest', 'practiceMode', 'positionGuide', 'postflopGuide', 'glossary', 'learningTracker', 'aiReview', 'handHistoryAnalyzer', 'gtoGuide', 'books'];

  function getAvailableScenarios(pos: Position): { mode: Mode; sbScenario?: 'sbOpen' | 'bbDefVsSb' }[] {
    switch (pos) {
      case 'UTG': return [{ mode: 'open' }, { mode: 'vs3Bet' }];
      case 'HJ': case 'CO': case 'BTN': return [{ mode: 'open' }, { mode: 'vsOpen' }, { mode: 'vs3Bet' }];
      case 'SB': return [{ mode: 'sbVsBb', sbScenario: 'sbOpen' }, { mode: 'vsOpen' }, { mode: 'vs3Bet' }];
      case 'BB': return [{ mode: 'bbDefense' }, { mode: 'sbVsBb', sbScenario: 'bbDefVsSb' }];
    }
  }

  const handlePositionChange = (pos: Position) => {
    setMyPosition(pos);
    setSelectedHand(null);

    const scenarios = getAvailableScenarios(pos);

    // If in utility mode, switch to first range scenario for this position
    if (UTILITY_MODES.includes(mode)) {
      setMode(scenarios[0].mode);
      if (scenarios[0].sbScenario) setSbVsBbScenario(scenarios[0].sbScenario);
      return;
    }

    // Check if current mode is still available for new position
    const stillAvailable = scenarios.some(s => {
      if (s.mode !== mode) return false;
      if (s.mode === 'sbVsBb' && s.sbScenario !== sbVsBbScenario) return false;
      return true;
    });

    if (!stillAvailable) {
      setMode(scenarios[0].mode);
      if (scenarios[0].sbScenario) setSbVsBbScenario(scenarios[0].sbScenario);
    }

    // Adjust opener if it conflicts with new position
    const effectiveMode = stillAvailable ? mode : scenarios[0].mode;
    if (effectiveMode === 'vsOpen') {
      const posOrder: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      const myIdx = posOrder.indexOf(pos);
      const opIdx = posOrder.indexOf(openerPosition);
      if (opIdx >= myIdx) {
        setOpenerPosition(posOrder[0]);
      }
    }
  };

  const handleScenarioChange = (scenarioMode: Mode, sbScenario?: 'sbOpen' | 'bbDefVsSb') => {
    setMode(scenarioMode);
    // Don't reset selectedHand — user can compare same hand across scenarios
    if (sbScenario !== undefined) setSbVsBbScenario(sbScenario);

    // Set default opener for vsOpen if current one is invalid
    if (scenarioMode === 'vsOpen') {
      const posOrder: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      const myIdx = posOrder.indexOf(myPosition);
      const opIdx = posOrder.indexOf(openerPosition);
      if (opIdx >= myIdx) {
        setOpenerPosition(posOrder[0]);
      }
    }
  };

  const handleUtilityModeChange = (m: Mode) => {
    setMode(m);
    setSelectedHand(null);
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
  const showMatrix = !UTILITY_MODES.includes(mode);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1117] to-[#111827] text-gray-200">
      <header className="bg-gradient-to-r from-gray-900/90 via-gray-900/80 to-indigo-950/80 border-b border-gray-800 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-3 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                RangePilot
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                6max NLH プリフロップレンジ & ガイド
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/news"
                className="text-xs text-gray-400 hover:text-yellow-400 transition-colors font-semibold"
              >
                🃏 ニュース
              </a>
              {safeMode && (
                <div className="bg-green-600/20 border border-green-600/50 rounded-lg px-4 py-2">
                  <span className="text-sm font-bold text-green-400">安全寄りモード ON</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        <Controls
          mode={mode}
          myPosition={myPosition}
          onPositionChange={handlePositionChange}
          onScenarioChange={handleScenarioChange}
          onUtilityModeChange={handleUtilityModeChange}
          openerPosition={openerPosition}
          onOpenerPositionChange={(p) => { setOpenerPosition(p); }}
          rangeWidth={rangeWidth}
          onRangeWidthChange={(w) => { setRangeWidth(w); }}
          hasAnte={hasAnte}
          onAnteChange={setHasAnte}
          sbVsBbScenario={sbVsBbScenario}
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
        {mode === 'postflopGuide' && <PostflopGuideView />}
        {mode === 'glossary' && <GlossaryView />}
        {mode === 'learningTracker' && <LearningTrackerView />}
        {mode === 'aiReview' && <AIReviewView />}
        {mode === 'practiceMode' && <PracticeModeView safeMode={safeMode} />}
        {mode === 'handHistoryAnalyzer' && <HandHistoryAnalyzer safeMode={safeMode} />}
        {mode === 'gtoGuide' && <GTOGuideView />}
        {mode === 'books' && <BooksView />}

        {showMatrix && (
          <>
            <Legend mode={mode === 'sbVsBb' ? (sbVsBbScenario === 'sbOpen' ? 'open' : 'bbDefense') : mode} />

            <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center">
              <div className="w-full max-w-[640px]">
                <HandMatrix
                  range={range}
                  onSelectHand={setSelectedHand}
                  selectedHand={selectedHand}
                  colorScheme={colorScheme}
                  safeMode={safeMode}
                />
              </div>
              <div className="w-full max-w-[640px] lg:w-80 lg:max-w-none shrink-0 space-y-3">
                <HandDetail hand={selectedHand} entry={selectedEntry} safeMode={safeMode} mode={mode} position={myPosition} />
                <ExportControls range={range} scenarioLabel={scenarioLabel} />
              </div>
            </div>
          </>
        )}

        <Assumptions />

        <div className="mt-8 border-t border-gray-800/50 pt-4 pb-6">
          <p className="text-sm text-gray-500 leading-relaxed bg-gray-800/20 rounded-xl px-4 py-3">
            ※ このレンジは6maxキャッシュゲーム向けの実戦用目安です。GTO完全解ではありません。相手のタイプ、レイズサイズ、スタック、アンティ有無によって調整してください。
          </p>
        </div>
      </main>
    </div>
  );
}
