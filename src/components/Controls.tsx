import type { Mode, Position, RangeWidth } from '../types';
import { MODE_LABELS, RANGE_WIDTH_LABELS, POSITIONS } from '../types';

interface Props {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  myPosition: Position;
  onMyPositionChange: (pos: Position) => void;
  openerPosition: Position;
  onOpenerPositionChange: (pos: Position) => void;
  rangeWidth: RangeWidth;
  onRangeWidthChange: (w: RangeWidth) => void;
  hasAnte: boolean;
  onAnteChange: (v: boolean) => void;
  sbVsBbScenario: 'sbOpen' | 'bbDefVsSb';
  onSbVsBbScenarioChange: (s: 'sbOpen' | 'bbDefVsSb') => void;
  safeMode: boolean;
  onSafeModeChange: (v: boolean) => void;
}

const modes: Mode[] = ['open', 'vsOpen', 'vs3Bet', 'bbDefense', 'sbVsBb', 'villainType', 'memo', 'spotTest', 'positionGuide'];
const rangeWidths: RangeWidth[] = ['ultraTight', 'tight', 'standard', 'loose', 'ultraLoose'];

function getAvailableMyPositions(mode: Mode): Position[] {
  switch (mode) {
    case 'open': return ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
    case 'vsOpen': return ['HJ', 'CO', 'BTN', 'SB', 'BB'];
    case 'vs3Bet': return ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
    case 'bbDefense': return ['BB'];
    case 'sbVsBb': return ['SB', 'BB'];
    default: return POSITIONS;
  }
}

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

export default function Controls({
  mode, onModeChange,
  myPosition, onMyPositionChange,
  openerPosition, onOpenerPositionChange,
  rangeWidth, onRangeWidthChange,
  hasAnte, onAnteChange,
  sbVsBbScenario, onSbVsBbScenarioChange,
  safeMode, onSafeModeChange,
}: Props) {
  const availableMyPos = getAvailableMyPositions(mode);
  const availableOpenerPos = getAvailableOpenerPositions(mode, myPosition);
  const showPositionSelect = !['villainType', 'memo'].includes(mode);
  const showOpenerSelect = ['vsOpen', 'bbDefense'].includes(mode);
  const showRangeWidth = ['open', 'bbDefense', 'sbVsBb'].includes(mode);
  const showSbVsBbScenario = mode === 'sbVsBb';

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-1.5">
        {modes.map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-4 py-2.5 rounded-xl text-sm sm:text-base font-medium transition-colors min-h-[44px] ${
              mode === m
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Sub-controls card */}
      <div className="bg-gray-800/40 rounded-2xl p-3 space-y-3 border border-gray-700/50">
        {/* Safe mode toggle */}
        <div className="flex items-center gap-1.5">
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

        {/* Position select */}
        {showPositionSelect && !showSbVsBbScenario && (
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-gray-400 font-medium">自分:</label>
            <div className="flex gap-1.5">
              {availableMyPos.map(pos => (
                <button
                  key={pos}
                  onClick={() => onMyPositionChange(pos)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] min-w-[48px] ${
                    myPosition === pos
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SB vs BB scenario */}
        {showSbVsBbScenario && (
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-gray-400 font-medium">シナリオ:</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => onSbVsBbScenarioChange('sbOpen')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] ${
                  sbVsBbScenario === 'sbOpen'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                SB Open vs BB
              </button>
              <button
                onClick={() => onSbVsBbScenarioChange('bbDefVsSb')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] ${
                  sbVsBbScenario === 'bbDefVsSb'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                BB Defense vs SB
              </button>
            </div>
          </div>
        )}

        {/* Opener position */}
        {showOpenerSelect && availableOpenerPos.length > 0 && (
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-gray-400 font-medium">相手:</label>
            <div className="flex gap-1.5">
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
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-gray-400 font-medium">レンジ幅:</label>
            <div className="flex gap-1.5">
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

        {/* Ante toggle */}
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
      </div>

      {/* Safe mode description */}
      {safeMode && (
        <div className="bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3 text-sm text-green-300/80">
          🛡 安全寄りモード: コール範囲を狭め、3ベット/4ベットブラフを制限、弱いオフスートをフォールドに変更しています。通常モードとの差分はセルをクリックして確認できます。
        </div>
      )}
    </div>
  );
}
