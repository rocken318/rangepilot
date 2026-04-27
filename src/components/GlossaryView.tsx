import { useState, useMemo } from 'react';
import { GLOSSARY } from '../data/glossary';
import type { GlossaryEntry } from '../data/glossary';

type Category = 'all' | 'basic' | 'preflop' | 'postflop' | 'advanced';

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'すべて',
  basic: '基本',
  preflop: 'プリフロップ',
  postflop: 'ポストフロップ',
  advanced: '上級',
};

const CATEGORY_BADGE: Record<GlossaryEntry['category'], string> = {
  basic: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  preflop: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  postflop: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  advanced: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
};

export default function GlossaryView() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return GLOSSARY.filter((entry) => {
      if (activeCategory !== 'all' && entry.category !== activeCategory) return false;
      if (q) {
        return (
          entry.term.toLowerCase().includes(q) ||
          entry.reading.toLowerCase().includes(q) ||
          entry.definition.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [search, activeCategory]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">用語集</h2>
          <span className="bg-gray-700 text-gray-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {filteredEntries.length}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">ポーカーの基本用語を日本語で解説</p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="用語を検索..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Term cards */}
      {filteredEntries.length === 0 ? (
        <p className="text-center text-gray-500 py-12">該当する用語が見つかりません</p>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.term}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-2"
            >
              {/* Top row */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-lg font-bold text-white">{entry.term}</span>
                <span className="text-sm text-gray-400 ml-2">{entry.reading}</span>
                <span
                  className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[entry.category]}`}
                >
                  {CATEGORY_LABELS[entry.category]}
                </span>
              </div>

              {/* Definition */}
              <p className="text-base text-gray-300 leading-relaxed">{entry.definition}</p>

              {/* Example */}
              {entry.example && (
                <div className="bg-gray-900/50 rounded-lg px-3 py-2 text-sm text-gray-400 italic">
                  例: {entry.example}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
