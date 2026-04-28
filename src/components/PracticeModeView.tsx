import { useState, useMemo, useCallback } from 'react';
import type { HandEntry } from '../types';
import type { ReviewInput, ReviewResult } from '../types/review';
import { SPOTS, USER_CHOICE_LABELS, choiceMatchesAction, isMixedAction } from '../data/spots';
import type { SpotQuestion, UserChoice } from '../data/spots';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';
import { loadStats, recordAttempt } from '../data/learningTracker';

interface Props {
  safeMode: boolean;
}

const ALL_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;

type ResultKind = 'correct' | 'incorrect' | 'acceptable';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lookupAnswer(q: SpotQuestion): HandEntry | null {
  let range: Record<string, HandEntry>;
  switch (q.lookupMode) {
    case 'open':
      range = getOpenRange(q.lookupMyPos, 'standard');
      break;
    case 'vsOpen':
      range = getVsOpenRange(q.lookupMyPos, q.lookupOpenerPos!, 'standard');
      break;
    case 'vs3Bet':
      range = getVs3BetRange(q.lookupMyPos, 'standard');
      break;
    case 'bbDefense':
      range = getBBDefenseRange(q.lookupOpenerPos!, 'standard');
      break;
    case 'sbVsBb':
      range = getSBvsBBRange(q.lookupSbBbScenario!, 'standard');
      break;
    default:
      return null;
  }
  return range[q.hand] || null;
}

/** Display a poker hand like "AQo" or "99" as two styled card boxes */
function HandCards({ hand }: { hand: string }) {
  const isPair = hand.length === 2;
  const rank1 = hand[0];
  const rank2 = hand.length >= 2 ? hand[1] : hand[0];
  const suited = hand.endsWith('s');

  const cardBase = 'w-14 h-20 sm:w-16 sm:h-24 rounded-xl flex items-center justify-center shadow-lg border-2';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3 justify-center">
        <div className={`${cardBase} bg-white border-gray-200`}>
          <span className="text-3xl sm:text-4xl font-black text-gray-900">{rank1}</span>
        </div>
        <div className={`${cardBase} ${suited ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
          <span className={`text-3xl sm:text-4xl font-black ${suited ? 'text-blue-700' : 'text-gray-900'}`}>{rank2}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 font-medium">
        {isPair ? 'ペア' : suited ? 'スーテッド' : 'オフスート'}
      </span>
    </div>
  );
}

/** Position badges row — highlights hero and opener */
function PositionBadges({ heroPos, openerPos }: { heroPos: string; openerPos?: string }) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {ALL_POSITIONS.map(pos => {
        const isHero = pos === heroPos;
        const isOpener = pos === openerPos;
        return (
          <div
            key={pos}
            className={`relative px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              isHero
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-110'
                : isOpener
                ? 'bg-orange-600/80 text-white'
                : 'bg-gray-700/60 text-gray-500'
            }`}
          >
            {pos}
            {isHero && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-emerald-500 text-white px-1 rounded font-bold whitespace-nowrap">
                You
              </span>
            )}
            {isOpener && !isHero && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-orange-500 text-white px-1 rounded font-bold whitespace-nowrap">
                Raise
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const CHOICE_STYLES: Record<UserChoice, string> = {
  raise: 'bg-red-700 hover:bg-red-600 active:bg-red-800 text-white border-red-600',
  call: 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white border-blue-600',
  '3bet': 'bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white border-rose-600',
  '4bet': 'bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white border-purple-600',
  fold: 'bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100 border-gray-600',
};

const RESULT_CONFIG: Record<ResultKind, { label: string; icon: string; border: string; bg: string; text: string }> = {
  correct: { label: '正解！', icon: '✅', border: 'border-green-500', bg: 'bg-green-900/30', text: 'text-green-400' },
  incorrect: { label: '不正解', icon: '❌', border: 'border-red-500', bg: 'bg-red-900/30', text: 'text-red-400' },
  acceptable: { label: '許容範囲', icon: '🔶', border: 'border-yellow-500', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
};

export default function PracticeModeView({ safeMode }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState<SpotQuestion>(() => pickRandom(SPOTS));
  const [selectedChoice, setSelectedChoice] = useState<UserChoice | null>(null);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [answerEntry, setAnswerEntry] = useState<HandEntry | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(() => loadStats().streaks.current);
  const [aiResult, setAiResult] = useState<ReviewResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(1);

  const handleChoice = useCallback((choice: UserChoice) => {
    if (selectedChoice !== null) return;

    const entry = lookupAnswer(currentQuestion);
    setAnswerEntry(entry);
    setSelectedChoice(choice);
    setAiResult(null);
    setAiError(null);

    let kind: ResultKind;
    if (!entry || entry.action === 'fold') {
      kind = choice === 'fold' ? 'correct' : 'incorrect';
    } else if (isMixedAction(entry.action)) {
      kind = 'acceptable';
    } else {
      kind = choiceMatchesAction(choice, entry.action) ? 'correct' : 'incorrect';
    }

    setResultKind(kind);
    setScore(s => ({ correct: s.correct + (kind !== 'incorrect' ? 1 : 0), total: s.total + 1 }));

    const updated = recordAttempt({
      spotId: currentQuestion.id,
      userChoice: choice,
      correctAction: entry?.action ?? 'fold',
      result: kind,
      timestamp: Date.now(),
      position: currentQuestion.myPosition,
      scenario: currentQuestion.scenario,
      tags: currentQuestion.tags,
    });
    setStreak(updated.streaks.current);
  }, [selectedChoice, currentQuestion]);

  const handleNext = useCallback(() => {
    setCurrentQuestion(pickRandom(SPOTS));
    setSelectedChoice(null);
    setResultKind(null);
    setAnswerEntry(null);
    setAiResult(null);
    setAiError(null);
    setQuestionCount(n => n + 1);
  }, []);

  const handleAskAI = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    const input: ReviewInput = {
      heroHand: currentQuestion.hand,
      heroPosition: currentQuestion.myPosition,
      blinds: '0.5/1.0 (100BB)',
      effectiveStack: '100BB',
      preflopAction: currentQuestion.situationLabel,
      flopAction: '',
      turnAction: '',
      riverAction: '',
      opponent: {
        name: '', vpip: '', pfr: '', threeBet: '', foldToThreeBet: '',
        cbet: '', foldToCbet: '', steal: '', checkRaise: '', wtsd: '', wsd: '',
      },
      heroDecision: selectedChoice ?? '',
      result: '',
      memo: '練習モードからの質問です。プリフロップの判断のみ簡潔に解説してください。',
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
      setAiResult(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI解説の取得に失敗しました');
    } finally {
      setAiLoading(false);
    }
  }, [currentQuestion, selectedChoice]);

  const resultConfig = resultKind ? RESULT_CONFIG[resultKind] : null;
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const actionLabel = useMemo(() => {
    if (!answerEntry) return 'フォールド';
    const map: Record<string, string> = {
      raise: 'オープンレイズ', call: 'コール', fold: 'フォールド',
      '3betValue': '3ベット（バリュー）', '3betBluff': '3ベット（ブラフ）',
      '3bet': '3ベット', mixed: '状況次第（レイズ or フォールド）',
      '4betValue': '4ベット（バリュー）', '4betBluff': '4ベット（ブラフ）',
    };
    return map[answerEntry.action] ?? answerEntry.action;
  }, [answerEntry]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Score header */}
      <div className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700/50">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            スコア: <span className="text-white font-bold">{score.correct}/{score.total}</span>
          </span>
          {score.total > 0 && (
            <span className="text-gray-400">
              正解率: <span className="text-white font-bold">{accuracy}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {streak > 1 && (
            <span className="bg-orange-600/30 border border-orange-600/40 rounded-lg px-2 py-1 text-orange-300 font-bold">
              🔥 {streak}連続
            </span>
          )}
          <span className="text-gray-500 text-xs">Q.{questionCount}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-gray-800/40 rounded-2xl p-5 border border-gray-700/50 space-y-5">
        {/* Position badges */}
        <PositionBadges
          heroPos={currentQuestion.myPosition}
          openerPos={currentQuestion.openerPosition}
        />

        {/* Hand cards */}
        <div className="flex justify-center py-2">
          <HandCards hand={currentQuestion.hand} />
        </div>

        {/* Situation text */}
        <div className="text-center">
          <p className="text-base sm:text-lg text-gray-200 font-medium">{currentQuestion.situationLabel}</p>
          <p className="text-sm text-gray-400 mt-1">どうする？</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          {currentQuestion.choices.map(choice => {
            const isSelected = selectedChoice === choice;
            const isDisabled = selectedChoice !== null;
            const isCorrectAnswer = answerEntry && choiceMatchesAction(choice, answerEntry.action);

            let extraClass = '';
            if (selectedChoice !== null) {
              if (isSelected && resultKind === 'correct') extraClass = 'ring-2 ring-green-400 scale-105';
              else if (isSelected && resultKind === 'incorrect') extraClass = 'ring-2 ring-red-400 opacity-80';
              else if (isSelected && resultKind === 'acceptable') extraClass = 'ring-2 ring-yellow-400';
              else if (isCorrectAnswer && !isSelected) extraClass = 'ring-2 ring-green-500 opacity-90';
              else extraClass = 'opacity-40';
            }

            return (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                disabled={isDisabled}
                className={`px-5 py-3 rounded-xl text-sm sm:text-base font-bold border transition-all min-h-[48px] min-w-[80px] ${CHOICE_STYLES[choice]} ${extraClass} disabled:cursor-not-allowed`}
              >
                {USER_CHOICE_LABELS[choice]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result + Explanation */}
      {resultConfig && (
        <div className={`rounded-xl border-2 ${resultConfig.border} ${resultConfig.bg} p-5 space-y-4`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{resultConfig.icon}</span>
            <span className={`text-lg font-bold ${resultConfig.text}`}>{resultConfig.label}</span>
            {answerEntry && (
              <span className="ml-auto text-sm text-gray-300">
                正解: <span className="font-bold text-white">{actionLabel}</span>
              </span>
            )}
          </div>

          {/* Static explanation */}
          <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
            <p>{currentQuestion.explanation}</p>
            {currentQuestion.beginnerTip && (
              <p className="text-xs text-gray-400 italic">{currentQuestion.beginnerTip}</p>
            )}
          </div>

          {/* SafeMode explanation */}
          {safeMode && currentQuestion.safeExplanation && (
            <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 text-sm text-green-300">
              🛡 安全寄り: {currentQuestion.safeExplanation}
            </div>
          )}

          {/* AI explanation */}
          {!aiResult && (
            <button
              onClick={handleAskAI}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-indigo-700 hover:bg-indigo-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiLoading ? '🤖 AI解説を取得中...' : '🤖 AIにもっと詳しく聞く'}
            </button>
          )}
          {aiError && (
            <p className="text-xs text-red-400">⚠ {aiError}</p>
          )}
          {aiResult && (
            <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs text-indigo-400 font-semibold">🤖 AI解説</p>
              <p className="text-sm text-gray-300 leading-relaxed">{aiResult.summary}</p>
              {aiResult.nextRules.length > 0 && (
                <ul className="text-xs text-gray-400 space-y-1 mt-2">
                  {aiResult.nextRules.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Next button */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl text-sm font-bold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            次の問題 →
          </button>
        </div>
      )}
    </div>
  );
}
