import { useState, useCallback } from 'react';

const HAND_MEMOS_KEY = 'poker-hand-memos';
const FREE_MEMO_KEY = 'poker-range-memos';

interface HandMemo {
  id: string;
  hand: string;
  text: string;
  createdAt: number;
}

const EXAMPLE_MEMOS: HandMemo[] = [
  { id: 'example-1', hand: 'AJo', text: '3ベットにコールしすぎ注意', createdAt: Date.now() - 2000 },
  { id: 'example-2', hand: 'SBの弱いA', text: 'A8o以下でSBから入らない', createdAt: Date.now() - 1000 },
];

function loadHandMemos(): HandMemo[] | null {
  try {
    const raw = localStorage.getItem(HAND_MEMOS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as HandMemo[];
    return null;
  } catch {
    return null;
  }
}

function saveHandMemos(memos: HandMemo[]) {
  localStorage.setItem(HAND_MEMOS_KEY, JSON.stringify(memos));
}

export default function MemoView() {
  // ── Hand memos state ──────────────────────────────────────────────────────
  const [handMemos, setHandMemos] = useState<HandMemo[]>(() => loadHandMemos() ?? []);
  const [handMemosSeedUsed, setHandMemosSeedUsed] = useState(() => loadHandMemos() !== null);

  const [newHand, setNewHand] = useState('');
  const [newText, setNewText] = useState('');
  const [handError, setHandError] = useState('');
  const [toast, setToast] = useState('');
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ── Free memo state ───────────────────────────────────────────────────────
  const [memo, setMemo] = useState(() => localStorage.getItem(FREE_MEMO_KEY) ?? '');

  // Displayed memos: use real ones if seeded, else examples
  const displayedMemos = handMemosSeedUsed ? handMemos : EXAMPLE_MEMOS;

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToast(''), 2500);
    setToastTimer(t);
  }, [toastTimer]);

  // ── Add hand memo ─────────────────────────────────────────────────────────
  const handleAddHandMemo = () => {
    const hand = newHand.trim();
    const text = newText.trim();
    if (!hand && !text) {
      setHandError('ハンド名とメモを入力してください。');
      return;
    }
    if (!hand) {
      setHandError('ハンド名を入力してください。');
      return;
    }
    if (!text) {
      setHandError('メモ内容を入力してください。');
      return;
    }
    setHandError('');

    const newMemo: HandMemo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      hand,
      text,
      createdAt: Date.now(),
    };

    // On first real interaction, discard examples and start fresh
    const base = handMemosSeedUsed ? handMemos : [];
    const updated = [newMemo, ...base];
    setHandMemos(updated);
    setHandMemosSeedUsed(true);
    saveHandMemos(updated);
    setNewHand('');
    setNewText('');
    showToast('メモを追加しました。');
  };

  // ── Delete hand memo ──────────────────────────────────────────────────────
  const handleDeleteHandMemo = (id: string) => {
    // If we're deleting from the example list, seed first with examples minus this one
    const base = handMemosSeedUsed ? handMemos : EXAMPLE_MEMOS;
    const updated = base.filter(m => m.id !== id);
    setHandMemos(updated);
    setHandMemosSeedUsed(true);
    saveHandMemos(updated);
    showToast('メモを削除しました。');
  };

  // ── Save free memo ────────────────────────────────────────────────────────
  const handleSaveFreeMemo = () => {
    localStorage.setItem(FREE_MEMO_KEY, memo);
    showToast('フリーメモを保存しました。');
  };

  // ── Keyboard: Enter to add hand memo ─────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddHandMemo();
    }
  };

  // Sorted newest first (already inserted at front, but be explicit)
  const sortedMemos = [...displayedMemos].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-white">メモ</h2>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-lg text-sm text-blue-300 transition-opacity">
          {toast}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Section 1: ハンド別メモ                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white">ハンド別メモ</h3>
        <p className="text-sm text-gray-400">
          特定のハンドについての気づきや注意点を記録できます。
        </p>

        {/* Add form */}
        <div className="flex flex-wrap gap-2 items-start">
          <input
            type="text"
            value={newHand}
            onChange={e => { setNewHand(e.target.value); setHandError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="ハンド名 例: AJo"
            className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newText}
            onChange={e => { setNewText(e.target.value); setHandError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="メモ 例: 3ベットにコールしすぎ注意"
            className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddHandMemo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            追加
          </button>
        </div>

        {/* Validation error */}
        {handError && (
          <p className="text-xs text-red-400">{handError}</p>
        )}

        {/* Memo list */}
        {sortedMemos.length === 0 ? (
          <p className="text-sm text-gray-500">メモがまだありません。</p>
        ) : (
          <ul className="space-y-2">
            {sortedMemos.map(m => (
              <li
                key={m.id}
                className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
              >
                {/* Hand badge */}
                <span className="shrink-0 mt-0.5 px-2 py-0.5 bg-blue-600/20 text-blue-300 border border-blue-600/30 rounded text-xs font-mono font-bold whitespace-nowrap">
                  {m.hand}
                </span>
                {/* Note text */}
                <span className="flex-1 text-sm text-gray-200 leading-relaxed">
                  {m.text}
                </span>
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteHandMemo(m.id)}
                  aria-label="削除"
                  className="shrink-0 text-red-400 hover:text-red-300 transition-colors text-base leading-none mt-0.5"
                  title="削除"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {!handMemosSeedUsed && sortedMemos.length > 0 && (
          <p className="text-xs text-gray-500">
            ※ 上記はサンプルです。追加または削除すると保存が始まります。
          </p>
        )}
      </section>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <hr className="border-gray-700" />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Section 2: フリーメモ                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white">フリーメモ</h3>
        <p className="text-sm text-gray-400">
          気づいたことや調整メモを自由に記録できます。ブラウザのローカルストレージに保存されます。
        </p>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例：&#10;- BTNからのスチールでA9oを追加してみた&#10;- CO vs UTGでAJoをフォールドに変更&#10;- レギュラーのAさんは3ベットが多いので4ベットレンジを広めに"
        />
        <button
          onClick={handleSaveFreeMemo}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          保存
        </button>
      </section>
    </div>
  );
}
