import { useState, useCallback } from 'react';
import type { ReviewInput, ReviewResult, OpponentStats } from '../types/review';
import ReviewResultCard from './ReviewResultCard';
import WeaknessTracker from './WeaknessTracker';
import { recordTags, addReviewToHistory } from '../data/weaknessTracker';

const inputClass =
  'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'text-sm text-gray-400 font-medium mb-1';
const sectionClass =
  'bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 space-y-3';

const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

const defaultOpponent: OpponentStats = {
  name: '',
  vpip: '',
  pfr: '',
  threeBet: '',
  foldToThreeBet: '',
  cbet: '',
  foldToCbet: '',
  steal: '',
  checkRaise: '',
  wtsd: '',
  wsd: '',
};

export default function AIReviewView() {
  // Basic info
  const [heroHand, setHeroHand] = useState('');
  const [heroPosition, setHeroPosition] = useState('BTN');
  const [blinds, setBlinds] = useState('');
  const [effectiveStack, setEffectiveStack] = useState('');

  // Actions
  const [preflopAction, setPreflopAction] = useState('');
  const [flopAction, setFlopAction] = useState('');
  const [turnAction, setTurnAction] = useState('');
  const [riverAction, setRiverAction] = useState('');

  // Opponent
  const [opponent, setOpponent] = useState<OpponentStats>(defaultOpponent);
  const [opponentExpanded, setOpponentExpanded] = useState(false);

  // Decision & result
  const [heroDecision, setHeroDecision] = useState('');
  const [result, setResult] = useState('');
  const [memo, setMemo] = useState('');

  // UI state
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'tracker'>('form');

  const updateOpponent = useCallback(
    (field: keyof OpponentStats, value: string) => {
      setOpponent((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReviewResult(null);

    const input: ReviewInput = {
      heroHand,
      heroPosition,
      blinds,
      effectiveStack,
      preflopAction,
      flopAction,
      turnAction,
      riverAction,
      opponent,
      heroDecision,
      result,
      memo,
    };

    try {
      const res = await fetch('/api/analyze-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data: ReviewResult = await res.json();
      setReviewResult(data);

      recordTags(data.tags);
      addReviewToHistory(input, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [
    heroHand,
    heroPosition,
    blinds,
    effectiveStack,
    preflopAction,
    flopAction,
    turnAction,
    riverAction,
    opponent,
    heroDecision,
    result,
    memo,
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">AI Review</h2>
        <p className="text-sm text-gray-400">
          プレイ後のハンドをAIがレビューします（実戦中の使用は禁止です）
        </p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('form')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'form'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          ハンドレビュー
        </button>
        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tracker'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          弱点トラッカー
        </button>
      </div>

      {/* Tracker tab */}
      {activeTab === 'tracker' && <WeaknessTracker />}

      {/* Form tab */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          {/* Section 1: 基本情報 */}
          <div className={sectionClass}>
            <p className="text-base font-bold text-white mb-2">基本情報</p>

            <div className="space-y-1">
              <label className={labelClass}>自分のハンド</label>
              <input
                type="text"
                value={heroHand}
                onChange={(e) => setHeroHand(e.target.value)}
                placeholder="例: AhKd"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>自分のポジション</label>
              <select
                value={heroPosition}
                onChange={(e) => setHeroPosition(e.target.value)}
                className={inputClass}
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelClass}>ブラインド</label>
                <input
                  type="text"
                  value={blinds}
                  onChange={(e) => setBlinds(e.target.value)}
                  placeholder="例: 1/2"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>有効スタック</label>
                <input
                  type="text"
                  value={effectiveStack}
                  onChange={(e) => setEffectiveStack(e.target.value)}
                  placeholder="例: 100BB"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: アクション */}
          <div className={sectionClass}>
            <p className="text-base font-bold text-white mb-2">アクション</p>

            <div className="space-y-1">
              <label className={labelClass}>プリフロップ</label>
              <textarea
                rows={2}
                value={preflopAction}
                onChange={(e) => setPreflopAction(e.target.value)}
                placeholder="例: UTG raises 3BB, Hero calls"
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>フロップ</label>
              <textarea
                rows={2}
                value={flopAction}
                onChange={(e) => setFlopAction(e.target.value)}
                placeholder="例: Flop Ah Kd 7c. Villain bets 5BB, Hero calls"
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>ターン</label>
              <textarea
                rows={2}
                value={turnAction}
                onChange={(e) => setTurnAction(e.target.value)}
                placeholder="例: Turn 3s. Check, check"
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>リバー</label>
              <textarea
                rows={2}
                value={riverAction}
                onChange={(e) => setRiverAction(e.target.value)}
                placeholder="例: River Qh. Villain bets 15BB, Hero folds"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* Section 3: 相手情報 (collapsible) */}
          <div className={sectionClass}>
            <button
              type="button"
              onClick={() => setOpponentExpanded((v) => !v)}
              className="w-full flex items-center justify-between text-base font-bold text-white focus:outline-none"
            >
              <span>相手情報</span>
              <span className="text-gray-400 text-sm">
                {opponentExpanded ? '▲' : '▼'}
              </span>
            </button>

            {opponentExpanded && (
              <div className="space-y-3 mt-1">
                <div className="space-y-1">
                  <label className={labelClass}>相手名</label>
                  <input
                    type="text"
                    value={opponent.name}
                    onChange={(e) => updateOpponent('name', e.target.value)}
                    placeholder="例: Player1"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={labelClass}>VPIP</label>
                    <input
                      type="text"
                      value={opponent.vpip}
                      onChange={(e) => updateOpponent('vpip', e.target.value)}
                      placeholder="25"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>PFR</label>
                    <input
                      type="text"
                      value={opponent.pfr}
                      onChange={(e) => updateOpponent('pfr', e.target.value)}
                      placeholder="18"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>3BET</label>
                    <input
                      type="text"
                      value={opponent.threeBet}
                      onChange={(e) => updateOpponent('threeBet', e.target.value)}
                      placeholder="7"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Fold to 3Bet</label>
                    <input
                      type="text"
                      value={opponent.foldToThreeBet}
                      onChange={(e) =>
                        updateOpponent('foldToThreeBet', e.target.value)
                      }
                      placeholder="60%"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>C-Bet</label>
                    <input
                      type="text"
                      value={opponent.cbet}
                      onChange={(e) => updateOpponent('cbet', e.target.value)}
                      placeholder="65%"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Fold to C-Bet</label>
                    <input
                      type="text"
                      value={opponent.foldToCbet}
                      onChange={(e) => updateOpponent('foldToCbet', e.target.value)}
                      placeholder="50%"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Steal</label>
                    <input
                      type="text"
                      value={opponent.steal}
                      onChange={(e) => updateOpponent('steal', e.target.value)}
                      placeholder="30%"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Check/Raise</label>
                    <input
                      type="text"
                      value={opponent.checkRaise}
                      onChange={(e) => updateOpponent('checkRaise', e.target.value)}
                      placeholder="8%"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>WTSD</label>
                    <input
                      type="text"
                      value={opponent.wtsd}
                      onChange={(e) => updateOpponent('wtsd', e.target.value)}
                      placeholder="28%"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>WSD</label>
                    <input
                      type="text"
                      value={opponent.wsd}
                      onChange={(e) => updateOpponent('wsd', e.target.value)}
                      placeholder="55%"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: 判断と結果 */}
          <div className={sectionClass}>
            <p className="text-base font-bold text-white mb-2">判断と結果</p>

            <div className="space-y-1">
              <label className={labelClass}>自分の判断</label>
              <textarea
                rows={3}
                value={heroDecision}
                onChange={(e) => setHeroDecision(e.target.value)}
                placeholder="例: フロップでコールしたが、ターンでフォールドすべきだったかも"
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>結果</label>
              <input
                type="text"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="例: 相手がAQoで勝ち"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>自由メモ</label>
              <textarea
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例: 相手のベットサイズが大きかった"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !heroHand.trim()}
            className={`w-full min-h-[48px] rounded-xl font-bold text-white text-base transition-colors bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 ${
              !heroHand.trim() ? 'opacity-50 cursor-not-allowed' : ''
            } ${loading ? 'cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                分析中...
              </>
            ) : (
              'AIにレビューを依頼'
            )}
          </button>

          {/* Error display */}
          {error && (
            <div className="bg-red-900/20 border border-red-600/40 rounded-xl p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Result display */}
          {reviewResult && <ReviewResultCard result={reviewResult} />}
        </div>
      )}
    </div>
  );
}
