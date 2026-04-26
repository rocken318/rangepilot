import type { Mode, Position, RangeWidth } from '../types';
import { MODE_LABELS, RANGE_WIDTH_LABELS } from '../types';

interface ScenarioTab {
  label: string;
  mode: Mode;
  sbScenario?: 'sbOpen' | 'bbDefVsSb';
}

const POSITION_SCENARIOS: Record<Position, ScenarioTab[]> = {
  UTG: [
    { label: 'オープン', mode: 'open' },
    { label: 'vs 3ベット', mode: 'vs3Bet' },
  ],
  HJ: [
    { label: 'オープン', mode: 'open' },
    { label: 'vs オープン', mode: 'vsOpen' },
    { label: 'vs 3ベット', mode: 'vs3Bet' },
  ],
  CO: [
    { label: 'オープン', mode: 'open' },
    { label: 'vs オープン', mode: 'vsOpen' },
    { label: 'vs 3ベット', mode: 'vs3Bet' },
  ],
  BTN: [
    { label: 'オープン', mode: 'open' },
    { label: 'vs オープン', mode: 'vsOpen' },
    { label: 'vs 3ベット', mode: 'vs3Bet' },
  ],
  SB: [
    { label: 'SBオープン', mode: 'sbVsBb', sbScenario: 'sbOpen' },
    { label: 'vs オープン', mode: 'vsOpen' },
    { label: 'vs 3ベット', mode: 'vs3Bet' },
  ],
  BB: [
    { label: 'BBディフェンス', mode: 'bbDefense' },
    { label: 'vs SBオープン', mode: 'sbVsBb', sbScenario: 'bbDefVsSb' },
  ],
};

const ALL_POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const UTILITY_MODES: Mode[] = ['villainType', 'memo', 'spotTest', 'positionGuide'];
const rangeWidths: RangeWidth[] = ['ultraTight', 'tight', 'standard', 'loose', 'ultraLoose'];

function getAvailableOpenerPositions(mode: Mode, myPos: Position): Position[] {
  const posOrder: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  if (mode === 'vsOpen') {
    const myIdx = posOrder.indexOf(myPos);
    return posOrder.filter((_, i) => i < myIdx);
  }
  if (mode === 'bbDefense') {
    return ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
  }
  return [];
}

interface Props {
  mode: Mode;
  myPosition: Position;
  onPositionChange: (pos: Position) => void;
  onScenarioChange: (mode: Mode, sbScenario?: 'sbOpen' | 'bbDefVsSb') => void;
  onUtilityModeChange: (mode: Mode) => void;
  openerPosition: Position;
  onOpenerPositionChange: (pos: Position) => void;
  rangeWidth: RangeWidth;
  onRangeWidthChange: (w: RangeWidth) => void;
  hasAnte: boolean;
  onAnteChange: (v: boolean) => void;
  sbVsBbScenario: 'sbOpen' | 'bbDefVsSb';
  safeMode: boolean;
  onSafeModeChange: (v: boolean) => void;
}

export default function Controls({
  mode, myPosition,
  onPositionChange, onScenarioChange, onUtilityModeChange,
  openerPosition, onOpenerPositionChange,
  rangeWidth, onRangeWidthChange,
  hasAnte, onAnteChange,
  sbVsBbScenario,
  safeMode, onSafeModeChange,
}: Props) {
  const isRangeMode = !UTILITY_MODES.includes(mode);
  const scenarios = POSITION_SCENARIOS[myPosition];
  const availableOpenerPos = getAvailableOpenerPositions(mode, myPosition);
  const showOpenerSelect = ['vsOpen', 'bbDefense'].includes(mode);
  const showRangeWidth = ['open', 'bbDefense', 'sbVsBb'].includes(mode);

  const isScenarioActive = (s: ScenarioTab) => {
    if (s.mode !== mode) return false;
    if (s.mode === 'sbVsBb' && s.sbScenario !== sbVsBbScenario) return false;
    return true;
  };

  return (
    <div className="space-y-3">
      {/* Position selector — always visible, primary control */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {ALL_POSITIONS.map(pos => (
          <button
            key={pos}
            onClick={() => onPositionChange(pos)}
            className={`px-5 py-3 rounded-xl text-base sm:text-lg font-bold transition-colors min-h-[48px] min-w-[56px] ${
              myPosition === pos && isRangeMode
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Scenario tabs + sub-controls (range mode only) */}
      {isRangeMode && (
        <div className="bg-gray-800/40 rounded-2xl p-3 space-y-3 border border-gray-700/50">
          {/* Scenario tabs */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {scenarios.map(s => (
              <button
                key={s.label}
                onClick={() => onScenarioChange(s.mode, s.sbScenario)}
                className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-colors min-h-[44px] ${
                  isScenarioActive(s)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Opener position */}
          {showOpenerSelect && availableOpenerPos.length > 0 && (
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-center">
              <label className="text-sm text-gray-400 font-medium">相手:</label>
              <div className="flex flex-wrap justify-center gap-1.5">
                {availableOpenerPos.map(pos => (
                  <button
                    key={pos}
                    onClick={() => onOpenerPositionChange(pos)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] min-w-[48px] ${
                      openerPosition === pos
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Range width */}
          {showRangeWidth && (
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-center">
              <label className="text-sm text-gray-400 font-medium">レンジ幅:</label>
              <div className="flex flex-wrap justify-center gap-1.5">
                {rangeWidths.map(w => (
                  <button
                    key={w}
                    onClick={() => onRangeWidthChange(w)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] ${
                      rangeWidth === w
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {RANGE_WIDTH_LABELS[w]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ante + Safe mode */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-sm text-gray-400 font-medium">アンティ:</label>
              <button
                onClick={() => onAnteChange(!hasAnte)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] ${
                  hasAnte
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {hasAnte ? 'あり' : 'なし'}
              </button>
            </div>
            <button
              onClick={() => onSafeModeChange(!safeMode)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border min-h-[44px] ${
                safeMode
                  ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-600/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border-gray-700'
              }`}
            >
              🛡 {safeMode ? '安全寄りモード ON' : '安全寄りモード'}
            </button>
          </div>
        </div>
      )}

      {/* Utility mode tabs — secondary, smaller */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {UTILITY_MODES.map(m => (
          <button
            key={m}
            onClick={() => onUtilityModeChange(m)}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[36px] ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800/60 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Safe mode description */}
      {safeMode && isRangeMode && (
        <div className="bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3 text-sm text-green-300/80">
          🛡 安全寄りモード: コール範囲を狭め、3ベット/4ベットブラフを制限、弱いオフスートをフォールドに変更しています。
        </div>
      )}
    </div>
  );
}
