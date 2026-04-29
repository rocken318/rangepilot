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

// Clockwise physical seat order
const POSITION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;

// Fixed display slot positions — slot 0 is ALWAYS the hero (bottom-center)
// Slots 1-5 go clockwise: bottom-right, right, top-right, top-left, left
const DISPLAY_SLOT_POSITIONS: CSSProperties[] = [
  { bottom: '-4%', left: '50%', transform: 'translateX(-50%)' }, // 0 hero
  { bottom: '8%',  right: '8%'  },                               // 1 bottom-right
  { top: '38%',    right: '0%'  },                               // 2 right
  { top: '4%',     right: '10%' },                               // 3 top-right
  { top: '4%',     left: '10%'  },                               // 4 top-left
  { top: '38%',    left: '0%'   },                               // 5 left
];

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
  bet:   'bg-gradient-to-b from-emerald-500 to-emerald-700 border-emerald-400/40 text-white hover:from-emerald-400 hover:to-emerald-600',
  check: 'bg-gradient-to-b from-slate-500 to-slate-700 border-slate-400/40 text-gray-100 hover:from-slate-400 hover:to-slate-600',
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

    let kind: ResultKind;

    if (currentQuestion.street && currentQuestion.street !== 'preflop') {
      // Post-flop: use explicit correctAction
      const correct = currentQuestion.correctAction;
      kind = choice === correct ? 'correct' : 'incorrect';
      setAnswerEntry(correct ? { hand: currentQuestion.hand, action: correct as any } : null);
    } else {
      // Pre-flop: existing range lookup
      const entry = lookupAnswer(currentQuestion);
      setAnswerEntry(entry);
      if (!entry || entry.action === 'fold') {
        kind = choice === 'fold' ? 'correct' : 'incorrect';
      } else if (isMixedAction(entry.action)) {
        kind = 'acceptable';
      } else {
        kind = choiceMatchesAction(choice, entry.action) ? 'correct' : 'incorrect';
      }
    }

    setSelectedChoice(choice);
    setAiResult(null);
    setAiError(null);
    setResultKind(kind);
    setScore(s => ({ correct: s.correct + (kind !== 'incorrect' ? 1 : 0), total: s.total + 1 }));
    const updated = recordAttempt({
      spotId: currentQuestion.id,
      userChoice: choice,
      correctAction: currentQuestion.correctAction ?? 'fold',
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
  const heroIdx = Math.max(0, POSITION_ORDER.findIndex(p => p === currentQuestion.myPosition));

  const actionLabel = useMemo(() => {
    if (!answerEntry) return 'フォールド';
    const map: Record<string, string> = {
      raise: 'オープンレイズ', call: 'コール', fold: 'フォールド',
      '3betValue': '3ベット（バリュー）', '3betBluff': '3ベット（ブラフ）',
      '3bet': '3ベット', mixed: '状況次第',
      '4betValue': '4ベット（バリュー）', '4betBluff': '4ベット（ブラフ）',
      bet: 'ベット', check: 'チェック',
    };
    return map[answerEntry.action] ?? answerEntry.action;
  }, [answerEntry]);

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center px-2 py-4"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="w-full max-w-2xl flex flex-col gap-4">

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

      {/* Green felt poker table — leather border + felt surface */}
      <div
        style={{
          borderRadius: '50% / 42%',
          background: 'linear-gradient(180deg, #3a2510 0%, #1e1208 100%)',
          padding: '12px',
          boxShadow: resultConfig
            ? `${resultConfig.tableGlow}, 0 8px 40px rgba(0,0,0,0.8)`
            : '0 8px 40px rgba(0,0,0,0.8)',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Inner felt — relative container for absolute seat badges */}
        <div
          className="relative"
          style={{
            borderRadius: '50% / 42%',
            background: 'radial-gradient(ellipse at 50% 45%, #1a5c2a 0%, #0f4420 55%, #0a3018 100%)',
            minHeight: '340px',
          }}
        >
          {/* Felt inner ring */}
          <div
            className="absolute inset-3 pointer-events-none"
            style={{ borderRadius: '50% / 42%', border: '1.5px solid rgba(255,255,255,0.07)' }}
          />
          {/* Center ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(30,120,50,0.18) 0%, transparent 65%)' }}
          />

          {/* Seat badges — hero always at slot 0 (bottom-center), clockwise rotation */}
          {DISPLAY_SLOT_POSITIONS.map((slotStyle, slotIdx) => {
          const pos = POSITION_ORDER[(heroIdx + slotIdx) % POSITION_ORDER.length];
          const isHero = slotIdx === 0;
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
              style={slotStyle}
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

          {/* Center: pot + cards + situation */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 pb-14">
          {/* Pot display */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white/80"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span style={{ color: '#a3e635' }}>●</span>
            <span>ポット</span>
            <span className="font-bold text-white">{currentQuestion.potBB ?? 2.5}BB</span>
          </div>

          {/* Board cards (post-flop) */}
          {currentQuestion.board && currentQuestion.board.length > 0 && (
            <div className="flex gap-1.5">
              {currentQuestion.board.map((card, i) => (
                <PokerCard key={i} rank={card.rank} suit={card.suit} size="sm" />
              ))}
            </div>
          )}

          {/* Street label */}
          {currentQuestion.street && currentQuestion.street !== 'preflop' && (
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(134,239,172,0.6)' }}>
              {currentQuestion.street === 'flop' ? 'フロップ' : currentQuestion.street === 'turn' ? 'ターン' : 'リバー'}
            </div>
          )}

          {/* Hero hole cards */}
          <div className="flex gap-2">
            <PokerCard rank={card1.rank} suit={card1.suit} size="lg" />
            <PokerCard rank={card2.rank} suit={card2.suit} size="lg" />
          </div>

          {/* Situation label */}
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold text-white/80 drop-shadow-lg leading-snug">
              {currentQuestion.situationLabel}
            </p>
            {selectedChoice === null && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(134,239,172,0.5)' }}>どうする？</p>
            )}
          </div>
          </div>
        </div>{/* end inner felt */}
      </div>{/* end leather border wrapper */}

      {/* Action buttons — casino gradient style */}
      <div
        className="flex flex-wrap justify-center gap-3 px-2 py-3 rounded-xl"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {currentQuestion.choices.map(choice => {
          const isSelected = selectedChoice === choice;
          const isDisabled = selectedChoice !== null;
          const isCorrectAnswer = currentQuestion.correctAction
            ? choice === currentQuestion.correctAction
            : answerEntry && choiceMatchesAction(choice, answerEntry.action);

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
            {(answerEntry || currentQuestion.correctAction) && (
              <span className="ml-auto text-sm text-gray-300">
                正解: <span className="font-bold text-white">
                  {answerEntry ? actionLabel : USER_CHOICE_LABELS[currentQuestion.correctAction!]}
                </span>
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
      </div>{/* end max-w-2xl */}
    </div>
  );
}
