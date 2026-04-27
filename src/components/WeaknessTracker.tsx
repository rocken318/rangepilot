import { useState } from 'react';
import {
  loadWeaknesses,
  getTopTags,
  getTopMistakesThisWeek,
  getImprovingTags,
  getTodayTheme,
} from '../data/weaknessTracker';

const POSITIVE_TAGS = ['良いフォールド', '良いバリューベット'];

function getTagColor(tag: string): string {
  if (POSITIVE_TAGS.includes(tag)) {
    return 'bg-green-900/40 text-green-300 border border-green-700/50';
  }
  return 'bg-red-900/40 text-red-300 border border-red-700/50';
}

export default function WeaknessTracker() {
  const [entries] = useState(() => loadWeaknesses());
  const [now] = useState(() => Date.now());
  const topMistakes = getTopMistakesThisWeek(entries).slice(0, 3);
  const topTags = getTopTags(entries, 8);
  const improving = getImprovingTags(entries);
  const theme = getTodayTheme(entries);

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-xl font-bold text-white">弱点トラッカー</h2>

      {/* Today's Theme */}
      <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-4">
        <p className="text-base text-indigo-300">🎯 {theme}</p>
      </div>

      {/* This Week's Top Mistakes */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">今週の主なミス</h3>
        {topMistakes.length === 0 ? (
          <p className="text-sm text-gray-500">今週はまだデータがありません</p>
        ) : (
          <ol className="space-y-2">
            {topMistakes.map((item, index) => (
              <li key={item.tag} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-900/50 text-red-400 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-gray-200">{item.tag}</span>
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 text-xs font-medium border border-red-700/50">
                  {item.count}回
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* All-Time Frequent Tags */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">よく出るタグ</h3>
        {topTags.length === 0 ? (
          <p className="text-sm text-gray-500">まだタグがありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...topTags]
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <span
                  key={item.tag}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTagColor(item.tag)}`}
                >
                  {item.tag}
                  <span className="opacity-75">{item.count}</span>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Improving Tags */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">改善中の点</h3>
        {improving.length === 0 ? (
          <p className="text-sm text-gray-500">改善データはまだありません</p>
        ) : (
          <ul className="space-y-2">
            {improving.map((item) => {
              const daysSinceLast = Math.floor((now - item.lastSeen) / (1000 * 60 * 60 * 24));
              return (
                <li key={item.tag} className="flex items-center gap-3">
                  <span className="flex-shrink-0 text-green-400 text-base">↓</span>
                  <span className="flex-1 text-sm text-green-300 font-medium">{item.tag}</span>
                  <span className="flex-shrink-0 text-xs text-gray-500">
                    最後に出現: {daysSinceLast}日前
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
