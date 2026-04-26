import { useState, useMemo, useCallback } from 'react';
import type { HandEntry } from '../types';
import { SPOTS, USER_CHOICE_LABELS, choiceMatchesAction, isMixedAction } from '../data/spots';
import type { SpotQuestion, UserChoice } from '../data/spots';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';

interface Props {
  safeMode: boolean;
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

type ResultKind = 'correct' | 'incorrect' | 'acceptable';

const CHOICE_BUTTON_COLORS: Record<UserChoice, string> = {
  raise: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
  call: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white',
  '3bet': 'bg-red-500 hover:bg-red-400 active:bg-red-600 text-white',
  '4bet': 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white',
  fold: 'bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-gray-100',
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SpotTestView({ safeMode }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState<SpotQuestion>(() => pickRandom(SPOTS));
  const [selectedChoice, setSelectedChoice] = useState<UserChoice | null>(null);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [answerEntry, setAnswerEntry] = useState<HandEntry | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const handleChoice = useCallback((choice: UserChoice) => {
    if (selectedChoice !== null) return; // Already answered

    const entry = lookupAnswer(currentQuestion);
    setAnswerEntry(entry);
    setSelectedChoice(choice);

    if (!entry || entry.action === 'fold') {
      // If range says fold or no entry
      const kind = choice === 'fold' ? 'correct' : 'incorrect';
      setResultKind(kind);
      setScore(s => ({
        correct: s.correct + (kind === 'correct' ? 1 : 0),
        total: s.total + 1,
      }));
    } else if (isMixedAction(entry.action)) {
      // Mixed: any answer is acceptable
      setResultKind('acceptable');
      setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
    } else {
      const isCorrect = choiceMatchesAction(choice, entry.action);
      const kind: ResultKind = isCorrect ? 'correct' : 'incorrect';
      setResultKind(kind);
      setScore(s => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        total: s.total + 1,
      }));
    }
  }, [selectedChoice, currentQuestion]);

  const handleNext = useCallback(() => {
    setCurrentQuestion(pickRandom(SPOTS));
    setSelectedChoice(null);
    setResultKind(null);
    setAnswerEntry(null);
  }, []);

  const resultConfig = useMemo(() => {
    if (!resultKind) return null;
    switch (resultKind) {
      case 'correct':
        return {
          label: '正解！',
          borderClass: 'border-green-500',
          bgClass: 'bg-green-900/30',
          textClass: 'text-green-400',
          badgeClass: 'bg-green-700 text-green-100',
        };
      case 'incorrect':
        return {
          label: '不正解',
          borderClass: 'border-red-500',
          bgClass: 'bg-red-900/30',
          textClass: 'text-red-400',
          badgeClass: 'bg-red-700 text-red-100',
        };
      case 'acceptable':
        return {
          label: '許容範囲',
          borderClass: 'border-yellow-500',
          bgClass: 'bg-yellow-900/30',
          textClass: 'text-yellow-400',
          badgeClass: 'bg-yellow-700 text-yellow-100',
        };
    }
  }, [resultKind]);

  const q = currentQuestion;
  const answered = selectedChoice !== null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header with score */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">スポットテスト</h2>
        <div className="flex items-center gap-2">
          {safeMode && (
            <div className="bg-green-600/20 border border-green-600/50 rounded-lg px-2 py-0.5">
              <span className="text-xs font-bold text-green-400">安全寄り ON</span>
            </div>
          )}
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-right">
            <div className="text-xs text-gray-400">スコア</div>
            <div className="text-lg font-bold text-white">
              {score.correct} <span className="text-gray-500 font-normal">/ {score.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4 shadow-lg shadow-black/10">
        {/* Situation label */}
        <div className="text-sm font-mono text-gray-400 bg-gray-900 rounded-lg px-4 py-2 inline-block">
          {q.situationLabel}
        </div>

        {/* Question text */}
        <p className="text-lg text-gray-200 leading-relaxed">
          {q.question}
        </p>

        {/* Hand display */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-wide">あなたのハンド</span>
          <span className="text-4xl font-mono font-bold text-white bg-gray-900 rounded-lg px-5 py-3 border border-gray-600 tracking-wider">
            {q.hand}
          </span>
        </div>

        {/* Choice buttons */}
        <div className="space-y-2">
          <p className="text-sm text-gray-400">アクションを選んでください</p>
          <div className="flex flex-wrap gap-3">
            {q.choices.map((choice) => {
              const isSelected = selectedChoice === choice;
              const isCorrectChoice =
                answered &&
                answerEntry &&
                (isMixedAction(answerEntry.action)
                  ? true
                  : choiceMatchesAction(choice, answerEntry.action));

              let extraClass = '';
              if (answered) {
                if (isSelected && resultKind === 'correct') {
                  extraClass = 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-800';
                } else if (isSelected && resultKind === 'acceptable') {
                  extraClass = 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800';
                } else if (isSelected && resultKind === 'incorrect') {
                  extraClass = 'ring-2 ring-red-400 ring-offset-2 ring-offset-gray-800 opacity-60';
                } else if (!isSelected && isCorrectChoice) {
                  extraClass = 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-800 opacity-80';
                } else if (!isSelected) {
                  extraClass = 'opacity-40 cursor-not-allowed';
                }
              }

              return (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  disabled={answered}
                  className={`
                    px-8 py-4 rounded-xl font-semibold text-lg min-h-[56px] min-w-[100px] shadow-md transition-all duration-150
                    ${CHOICE_BUTTON_COLORS[choice]}
                    ${extraClass}
                    ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {USER_CHOICE_LABELS[choice]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result panel */}
      {answered && resultConfig && (
        <div className={`border rounded-xl p-6 space-y-4 ${resultConfig.borderClass} ${resultConfig.bgClass}`}>
          {/* Result badge + answer label */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-2xl font-bold ${resultConfig.textClass}`}>
              {resultConfig.label}
            </span>
            {answerEntry && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${resultConfig.badgeClass}`}>
                正解: {answerEntry.action}
                {answerEntry.note && ` (${answerEntry.note})`}
              </span>
            )}
            {resultKind === 'acceptable' && (
              <span className="text-xs text-yellow-300">
                このハンドはmixed（状況次第）です。どのアクションも場面によっては正解になります。
              </span>
            )}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">解説</p>
              <p className="text-base text-gray-200 leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {/* Safe explanation (show when safeMode is on, or always for context) */}
          {q.safeExplanation && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                安全寄りモード {safeMode ? '(現在ON)' : '(参考)'}
              </p>
              <p className="text-base text-gray-300 leading-relaxed">{q.safeExplanation}</p>
            </div>
          )}

          {/* Beginner tip */}
          {q.beginnerTip && (
            <div className="bg-blue-900/30 border border-blue-700/40 rounded-lg p-4 space-y-1">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">初心者ヒント</p>
              <p className="text-base text-blue-200 leading-relaxed">{q.beginnerTip}</p>
            </div>
          )}

          {/* Context note */}
          {q.contextNote && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">状況別まとめ</p>
              <p className="text-base text-gray-300 leading-relaxed font-mono">{q.contextNote}</p>
            </div>
          )}

          {/* Large size note */}
          {q.largeSizeNote && (
            <div className="bg-amber-900/30 border border-amber-700/40 rounded-lg p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">サイズが大きい場合</p>
              <p className="text-base text-amber-200 leading-relaxed">{q.largeSizeNote}</p>
            </div>
          )}

          {/* Next button */}
          <button
            onClick={handleNext}
            className="w-full mt-2 py-4 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-bold rounded-xl transition-colors text-lg min-h-[56px]"
          >
            次の問題へ →
          </button>
        </div>
      )}
    </div>
  );
}
