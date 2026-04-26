import type { HandEntry, Action } from '../types';
import { HAND_NOTES } from '../data/ranges';

interface Props {
  hand: string | null;
  entry: HandEntry | null;
  safeMode?: boolean;
}

const ACTION_NAMES: Record<Action, string> = {
  raise: 'レイズ',
  '3betValue': '3ベット（バリュー）',
  '3betBluff': '3ベット（ブラフ）',
  '3bet': '3ベット',
  call: 'コール',
  mixed: '相手次第 / 混合',
  fold: 'フォールド',
  '4betValue': '4ベット（バリュー）',
  '4betBluff': '4ベット（ブラフ）',
};

const ACTION_COLORS: Record<Action, string> = {
  raise: 'text-red-400',
  '3betValue': 'text-red-400',
  '3betBluff': 'text-rose-400',
  '3bet': 'text-red-400',
  call: 'text-blue-400',
  mixed: 'text-yellow-400',
  fold: 'text-gray-500',
  '4betValue': 'text-purple-400',
  '4betBluff': 'text-purple-300',
};

export default function HandDetail({ hand, entry, safeMode }: Props) {
  if (!hand || !entry) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 shadow-md shadow-black/20">
        <p className="text-gray-500 text-base">セルをクリックしてハンドの詳細を表示</p>
      </div>
    );
  }

  const generalNote = HAND_NOTES[hand];
  const actionNote = entry.note;
  const hasSafeDiff = safeMode && entry.normalAction && entry.normalAction !== entry.action;

  return (
    <div className={`rounded-xl p-5 border space-y-2 shadow-md shadow-black/20 ${hasSafeDiff ? 'bg-green-900/20 border-green-700/50' : 'bg-gray-800/50 border-gray-700'}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold font-mono text-white">{hand}</span>
        <span className={`text-base font-medium ${ACTION_COLORS[entry.action]}`}>
          {ACTION_NAMES[entry.action]}
        </span>
      </div>

      {/* Safe mode diff */}
      {hasSafeDiff && (
        <div className="bg-green-800/30 rounded px-3 py-2 border border-green-700/30">
          <p className="text-sm text-green-300">
            🛡 安全寄りモードで変更: <span className="text-gray-400 line-through">{ACTION_NAMES[entry.normalAction!]}</span> → <span className="font-bold">{ACTION_NAMES[entry.action]}</span>
          </p>
        </div>
      )}

      {actionNote && (
        <p className="text-base text-amber-300/90">
          {actionNote}
        </p>
      )}
      {generalNote && (
        <p className="text-base text-gray-300">
          {generalNote}
        </p>
      )}
      {!generalNote && !actionNote && (
        <p className="text-base text-gray-500">
          詳細な注釈はありません。
        </p>
      )}
    </div>
  );
}
