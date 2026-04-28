import { useState, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { HandEntry } from '../types';
import type { ReviewInput, ReviewResult } from '../types/review';
import { SPOTS, USER_CHOICE_LABELS, choiceMatchesAction, isMixedAction } from '../data/spots';
import type { SpotQuestion, UserChoice } from '../data/spots';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';
import { loadStats, recordAttempt } from '../data/learningTracker';
import PokerCard, { handToCards } from './PokerCard';

interface Props {
  safeMode: boolean;
}

const ALL_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;

// Seat positions — percentage-based within the table container
const SEAT_POSITIONS: Record<string, CSSProperties> = {
  UTG: { top: '4%',    left: '12%'  },
  HJ:  { top: '4%',    right: '12%' },
  CO:  { top: '38%',   right: '-2%' },
  BTN: { bottom: '4%', right: '12%' },
  SB:  { bottom: '4%', left: '12%'  },
  BB:  { top: '38%',   left: '-2%'  },
};

// Avatar ring color per seat
const SEAT_COLORS: Record<string, string> = {
  UTG: '#3b82f6',
  HJ:  '#8b5cf6',
  CO:  '#f97316',
  BTN: '#ef4444',
  SB:  '#eab308',
  BB:  '#14b8a6',
};

// Action badge appearance
type ActionBadgeKind = 'RAISE' | '3-BET' | '4-BET' | 'CALL' | 'FOLD';
const ACTION_BADGE_STYLE: Record<ActionBadgeKind, string> = {
  'RAISE': 'bg-orange-500/90 text-white',
  '3-BET': 'bg-rose-600/90 text-white',
  '4-BET': 'bg-purple-600/90 text-white',
  'CALL':  'bg-sky-500/90 text-white',
  'FOLD':  'bg-gray-600/70 text-gray-300',
};

// Map UserChoice → ActionBadgeKind
const CHOICE_TO_BADGE: Record<string, ActionBadgeKind> = {
  raise: 'RAISE',
  call:  'CALL',
  '3bet': '3-BET',
  '4bet': '4-BET',
  fold:  'FOLD',
};

type ResultKind = 'correct' | 'incorrect' | 'acceptable';

const RESULT_CONFIG: Record<ResultKind, {
  label: string; icon: string;
  border: string; bg: string; text: string;
  tableGlow: string;
}> = {
  correct:    { label: '正解！',   icon: '✅', border: 'border-green-500',  bg: 'bg-green-900/30',  text: 'text-green-400',  tableGlow: '0 0 40px rgba(74,222,128,0.45)'  },
  incorrect:  { label: '不正解',   icon: '❌', border: 'border-red-500',    bg: 'bg-red-900/30',    text: 'text-red-400',    tableGlow: '0 0 40px rgba(239,68,68,0.45)'   },
  acceptable: { label: '許容範囲', icon: '🔶', border: 'border-yellow-500', bg: 'bg-yellow-900/30', text: 'text-yellow-400', tableGlow: '0 0 40px rgba(251,191,36,0.45)'  },
};

// Casino-style gradient button styles per choice
const CHOICE_STYLES: Record<UserChoice, string> = {
  raise: 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300/60 text-gray-900 hover:from-amber-300 hover:to-amber-500',
  call:  'bg-gradient-to-b from-sky-500 to-sky-700 border-sky-400/40 text-white hover:from-sky-400 hover:to-sky-600',
  '3bet':'bg-gradient-to-b from-rose-600 to-rose-800 border-rose-500/40 text-white hover:from-rose-500 hover:to-rose-700',
  '4bet':'bg-gradient-to-b from-purple-600 to-purple-800 border-purple-500/40 text-white hover:from-purple-500 hover:to-purple-700',
  fold:  'bg-gradient-to-b from-gray-600 to-gray-800 border-gray-500/40 text-gray-100 hover:from-gray-500 hover:to-gray-700',
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lookupAnswer(q: SpotQuestion): HandEntry | null {
  let range: Record<string, HandEntry>;
  switch (q.lookupMode) {
    case 'open':      range = getOpenRange(q.lookupMyPos, 'standard'); break;
    case 'vsOpen':    range = getVsOpenRange(q.lookupMyPos, q.lookupOpenerPos!, 'standard'); break;
    case 'vs3Bet':    range = getVs3BetRange(q.lookupMyPos, 'standard'); break;
    case 'bbDefense': range = getBBDefenseRange(q.lookupOpenerPos!, 'standard'); break;
    case 'sbVsBb':    range = getSBvsBBRange(q.lookupSbBbScenario!, 'standard'); break;
    default: return null;
  }
  return range[q.hand] || null;
}

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
      flopAction: '', turnAction: '', riverAction: '',
      opponent: { name:'', vpip:'', pfr:'', threeBet:'', foldToThreeBet:'', cbet:'', foldToCbet:'', steal:'', checkRaise:'', wtsd:'', wsd:'' },
      heroDecision: selectedChoice ?? '',
      result: '',
      memo: '練習モードからの質問です。プリフロップの判断のみ簡潔に解説してください。',
    };
    try {
      const res = await fetch('/api/analyze-hand', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setAiResult(await res.json());
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI解説の取得に失敗しました');
    } finally {
      setAiLoading(false);
    }
  }, [currentQuestion, selectedChoice]);

  const resultConfig = resultKind ? RESULT_CONFIG[resultKind] : null;
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const [card1, card2] = handToCards(currentQuestion.hand);

  const actionLabel = useMemo(() => {
    if (!answerEntry) return 'フォールド';
    const map: Record<string, string> = {
      raise: 'オープンレイズ', call: 'コール', fold: 'フォールド',
      '3betValue': '3ベット（バリュー）', '3betBluff': '3ベット（ブラフ）',
      '3bet': '3ベット', mixed: '状況次第',
      '4betValue': '4ベット（バリュー）', '4betBluff': '4ベット（ブラフ）',
    };
    return map[answerEntry.action] ?? answerEntry.action;
  }, [answerEntry]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Casino HUD */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border"
        style={{ background: 'rgba(10,12,10,0.9)', borderColor: 'rgba(212,175,55,0.3)' }}
      >
        <div className="flex items-center gap-4">
          <span style={{ color: '#ffd700', fontFamily: 'monospace' }} className="text-sm font-bold">
            🃏 {score.correct}<span style={{ color: '#4b5563' }}>/{score.total}</span>
          </span>
          {score.total > 0 && (
            <span className="text-xs text-gray-400">
              正解率 <span style={{ color: '#ffd700' }} className="font-bold">{accuracy}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {streak > 1 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(212,100,0,0.25)', border: '1px solid rgba(212,100,0,0.5)', color: '#ffa040' }}
            >
              🔥 {streak}連続
            </span>
          )}
          <span className="text-xs text-gray-600">Q.{questionCount}</span>
        </div>
      </div>

      {/* Green felt poker table */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #1a5c2a 0%, #0f4420 55%, #0a3018 100%)',
          minHeight: '280px',
          boxShadow: resultConfig ? resultConfig.tableGlow : 'none',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Felt inner border ring */}
        <div
          className="absolute inset-3 rounded-2xl pointer-events-none"
          style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
        />
        {/* Center ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(30,120,50,0.18) 0%, transparent 65%)' }}
        />

        {/* Seat badges — CoinPoker avatar style */}
        {ALL_POSITIONS.map(pos => {
          const isHero = pos === currentQuestion.myPosition;
          const isOpener = pos === currentQuestion.openerPosition;
          const isDealer = pos === 'BTN';

          // Determine action badge to show
          let badge: ActionBadgeKind | null = null;
          if (isOpener && !isHero) {
            badge = 'RAISE';
          } else if (!isHero && !isOpener) {
            badge = 'FOLD';
          }
          // After hero answers, show hero's action
          if (isHero && selectedChoice !== null) {
            badge = CHOICE_TO_BADGE[selectedChoice] ?? null;
          }

          // Avatar ring color
          const ringColor = isHero
            ? '#4ade80'
            : isOpener
            ? '#f97316'
            : SEAT_COLORS[pos];

          return (
            <div
              key={pos}
              className="absolute flex flex-col items-center gap-0.5"
              style={SEAT_POSITIONS[pos]}
            >
              {/* Avatar circle */}
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${SEAT_COLORS[pos]}cc, ${SEAT_COLORS[pos]}66)`,
                    border: `2px solid ${ringColor}`,
                    boxShadow: isHero
                      ? `0 0 12px ${ringColor}88`
                      : isOpener
                      ? `0 0 8px ${ringColor}66`
                      : 'none',
                  }}
                >
                  {pos.slice(0, 2)}
                </div>

                {/* Position label — top-left corner of avatar */}
                <div
                  className="absolute -top-2 -left-1 text-[9px] font-bold px-1 rounded"
                  style={{ background: 'rgba(0,0,0,0.85)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {pos}
                </div>

                {/* Dealer button */}
                {isDealer && (
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                    style={{ background: '#fff', color: '#1f2937', border: '1.5px solid #9ca3af' }}
                  >
                    D
                  </div>
                )}
              </div>

              {/* Stack */}
              <div className="text-[10px] text-gray-400 font-mono">100BB</div>

              {/* Action badge */}
              {badge && (
                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ACTION_BADGE_STYLE[badge]}`}>
                  {badge}
                </div>
              )}
            </div>
          );
        })}

        {/* Center: cards + situation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
          <div className="flex gap-3">
            <PokerCard rank={card1.rank} suit={card1.suit} size="lg" />
            <PokerCard rank={card2.rank} suit={card2.suit} size="lg" />
          </div>
          <div className="text-center">
            <p className="text-sm sm:text-base font-semibold text-white/90 drop-shadow-lg">
              {currentQuestion.situationLabel}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(134,239,172,0.6)' }}>どうする？</p>
          </div>
        </div>
      </div>

      {/* Action buttons — casino gradient style */}
      <div className="flex flex-wrap justify-center gap-2">
        {currentQuestion.choices.map(choice => {
          const isSelected = selectedChoice === choice;
          const isDisabled = selectedChoice !== null;
          const isCorrectAnswer = answerEntry && choiceMatchesAction(choice, answerEntry.action);

          let extraClass = '';
          if (selectedChoice !== null) {
            if (isSelected && resultKind === 'correct')         extraClass = 'ring-2 ring-green-400 scale-105';
            else if (isSelected && resultKind === 'incorrect')  extraClass = 'ring-2 ring-red-400 opacity-80';
            else if (isSelected && resultKind === 'acceptable') extraClass = 'ring-2 ring-yellow-400';
            else if (isCorrectAnswer && !isSelected)            extraClass = 'ring-2 ring-green-500';
            else                                                extraClass = 'opacity-35';
          }

          return (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={isDisabled}
              className={`px-5 py-3 rounded-xl text-sm sm:text-base font-bold border transition-all active:scale-[0.97] min-h-[48px] min-w-[80px] ${CHOICE_STYLES[choice]} ${extraClass} disabled:cursor-not-allowed`}
            >
              {USER_CHOICE_LABELS[choice]}
            </button>
          );
        })}
      </div>

      {/* Result + explanation panel */}
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

          <div className="text-sm text-gray-300 leading-relaxed space-y-1">
            <p>{currentQuestion.explanation}</p>
            {currentQuestion.beginnerTip && (
              <p className="text-xs text-gray-400 italic">{currentQuestion.beginnerTip}</p>
            )}
          </div>

          {safeMode && currentQuestion.safeExplanation && (
            <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 text-sm text-green-300">
              🛡 安全寄り: {currentQuestion.safeExplanation}
            </div>
          )}

          {!aiResult && (
            <button
              onClick={handleAskAI}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-indigo-700 hover:bg-indigo-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiLoading ? '🤖 AI解説を取得中...' : '🤖 AIにもっと詳しく聞く'}
            </button>
          )}
          {aiError && <p className="text-xs text-red-400">⚠ {aiError}</p>}
          {aiResult && (
            <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs text-indigo-400 font-semibold">🤖 AI解説</p>
              <p className="text-sm text-gray-300 leading-relaxed">{aiResult.summary}</p>
              {aiResult.nextRules.length > 0 && (
                <ul className="text-xs text-gray-400 space-y-1 mt-1">
                  {aiResult.nextRules.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            次の問題 →
          </button>
        </div>
      )}
    </div>
  );
}
