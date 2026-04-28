import { useState, useCallback } from 'react';
import { parseHandHistory, SAMPLE_HAND_HISTORY } from '../utils/handHistoryParser';
import { analyzeHand } from '../utils/handAnalysis';
import type { HandAnalysisResult, EvaluationLabel } from '../types/handHistory';

interface Props {
  safeMode: boolean;
}

const SPOT_TYPE_LABELS: Record<string, string> = {
  open: 'オープン機会',
  vsOpen: 'vs オープンレイズ',
  vs3Bet: 'vs 3ベット',
  bbDefense: 'BB ディフェンス',
  sbVsBb: 'SB vs BB',
  unknown: '不明',
};

const HERO_ACTION_LABELS: Record<string, string> = {
  raise: 'オープンレイズ',
  call: 'コール',
  '3bet': '3ベット',
  '4bet': '4ベット',
  fold: 'フォールド',
  check: 'チェック',
  unknown: '不明',
};

const EVAL_COLORS: Record<EvaluationLabel, { border: string; bg: string; badge: string; text: string }> = {
  Good: { border: 'border-green-500', bg: 'bg-green-900/20', badge: 'bg-green-700 text-green-100', text: 'text-green-400' },
  OK: { border: 'border-blue-500', bg: 'bg-blue-900/20', badge: 'bg-blue-700 text-blue-100', text: 'text-blue-400' },
  Caution: { border: 'border-yellow-500', bg: 'bg-yellow-900/20', badge: 'bg-yellow-700 text-yellow-100', text: 'text-yellow-400' },
  Mistake: { border: 'border-red-500', bg: 'bg-red-900/20', badge: 'bg-red-700 text-red-100', text: 'text-red-400' },
  Unknown: { border: 'border-gray-600', bg: 'bg-gray-800/40', badge: 'bg-gray-700 text-gray-300', text: 'text-gray-400' },
};

const EVAL_JA: Record<EvaluationLabel, string> = {
  Good: '良い判断',
  OK: '許容範囲',
  Caution: '注意',
  Mistake: 'ミス寄り',
  Unknown: '判定不能',
};

export default function HandHistoryAnalyzer({ safeMode }: Props) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<HandAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    setError(null);
    setResult(null);

    if (!text.trim()) {
      setError('ハンドヒストリーを入力してください。');
      return;
    }

    const parsed = parseHandHistory(text);

    if (!parsed.heroPosition) {
      setError('Heroのポジションを検出できませんでした。「Hero is BTN」のような記述を含めてください。');
      return;
    }
    if (!parsed.heroHand) {
      setError('Heroのハンドを検出できませんでした。「Dealt to Hero [As Qd]」のような記述を含めてください。');
      return;
    }
    if (parsed.heroAction === 'unknown') {
      setError('Heroのアクションを検出できませんでした。「Hero: calls」などの記述を含めてください。');
      return;
    }
    if (parsed.spotType === 'unknown') {
      setError('スポットタイプを特定できませんでした。アクションの記述を確認してください。');
      return;
    }

    const analysisResult = analyzeHand(parsed);
    if (!analysisResult) {
      setError('解析に失敗しました。ハンドヒストリーの形式を確認してください。');
      return;
    }

    setResult(analysisResult);
  }, [text]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target?.result as string ?? '');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }, []);

  const handleSample = useCallback(() => {
    setText(SAMPLE_HAND_HISTORY);
    setResult(null);
    setError(null);
  }, []);

  const colors = result ? EVAL_COLORS[result.evaluation] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">ハンド履歴解析</h2>
        <p className="text-sm text-gray-400 mt-1">
          プレイしたハンドを貼り付けて、プリフロップ判断をRangePilotのレンジデータで添削します。
        </p>
      </div>

      {/* Input area */}
      <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 space-y-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={'PokerStars Hand #123...\nHero is BTN\nDealt to Hero [As Qd]\nUTG folds\nHJ raises to 3bb\nHero calls\n...'}
          rows={10}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors min-h-[40px] flex items-center gap-1.5">
            <span>📁</span> .txtファイルを読み込む
            <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={handleSample}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors min-h-[40px]"
          >
            📋 サンプルを読み込む
          </button>
          <button
            onClick={handleAnalyze}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors min-h-[40px] ml-auto"
          >
            🔍 解析する
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* Result card */}
      {result && colors && (
        <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-5 space-y-4`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-white">解析結果</h3>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${colors.badge}`}>
              {EVAL_JA[result.evaluation]}
            </span>
          </div>

          {/* Hand info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoBlock label="ハンド" value={result.heroHand} highlight />
            <InfoBlock label="Hero" value={result.heroPosition} />
            <InfoBlock label="スポット" value={SPOT_TYPE_LABELS[result.spotType]} />
            {result.openerPosition && (
              <InfoBlock label="オープナー" value={result.openerPosition} />
            )}
            <InfoBlock
              label="実際のアクション"
              value={HERO_ACTION_LABELS[result.heroAction] ?? result.heroAction}
            />
            <InfoBlock label="推奨アクション" value={result.recommendedAction} highlight />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <p className="text-sm text-gray-300 leading-relaxed">{result.comment}</p>
            {safeMode && (
              <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 text-sm text-green-300">
                🛡 安全寄り: {result.safeModeComment}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-900/60 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-white' : 'text-gray-200'}`}>{value}</p>
    </div>
  );
}
