import { useState } from 'react';

export default function Assumptions() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/40 transition-colors"
      >
        <span className="text-xs font-medium flex items-center gap-1.5">
          📋 前提条件
        </span>
        <span className="text-xs text-gray-500 select-none">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-700/60">
          {/* Game parameters */}
          <div className="pt-2 space-y-1">
            <p className="text-xs font-semibold text-gray-300 mb-1.5">ゲーム設定</p>
            <ul className="space-y-1">
              {[
                ['ゲーム', '6max NLH キャッシュゲーム'],
                ['スタック', '100BB'],
                ['オープンサイズ', 'EP 2.5BB / LP 2.2–2.5BB'],
                ['3ベットサイズ', 'IP 3x / OOP 3.5–4x'],
                ['4ベットサイズ', '3betの 2.2–2.5x'],
                ['レーキ', 'ローステークス想定'],
              ].map(([label, value]) => (
                <li key={label} className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-500 shrink-0 w-28">{label}</span>
                  <span className="text-xs text-gray-300">{value}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-2 italic">
              ※ GTO完全解ではなく実戦用の目安です
            </p>
          </div>

          {/* Warning section */}
          <div className="rounded-md border border-amber-600/40 bg-amber-900/20 px-3 py-2 space-y-1.5">
            <p className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              ⚠️ 3ベットが大きい場合（10BB+）の注意
            </p>
            <ul className="space-y-1">
              {[
                ['AJo / KQo', 'フォールド寄りに調整'],
                ['小さいペア (22–66)', 'セットマイニングのオッズが合わない'],
                ['スーテッドコネクター', 'コールの利益が薄くなる'],
              ].map(([hand, note]) => (
                <li key={hand} className="flex items-baseline gap-2">
                  <span className="text-xs text-amber-300 shrink-0 w-36 font-medium">{hand}</span>
                  <span className="text-xs text-amber-200/70">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
