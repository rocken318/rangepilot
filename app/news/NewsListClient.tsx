'use client';

import { useState } from 'react';
import type { Article } from '../../lib/supabase';
import ArticleCard from '../../components/news/ArticleCard';
import BookShelf from '../../components/ads/BookShelf';
import MediaNetBanner from '../../components/ads/MediaNetBanner';

interface Props {
  articles: Article[];
}

type Category = 'all' | 'tournament' | 'strategy' | 'general';

export default function NewsListClient({ articles }: Props) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [category, setCategory] = useState<Category>('all');

  const filtered = category === 'all'
    ? articles
    : articles.filter((a) => a.category === category);

  const hero = filtered[0];
  const gridArticles = filtered.slice(1, 4);
  const rowArticles = filtered.slice(4);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      {/* ── SITE HEADER ── */}
      <div className="sticky top-0 z-10 bg-[#070d14] border-b-2 border-yellow-400">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-black text-sm tracking-wide">♠ RANGEPILOT</span>
            <span className="text-[#2a3a4a]">|</span>
            <span className="text-yellow-400 text-xs font-bold">POKER NEWS</span>
            <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
              毎朝更新
            </span>
          </div>
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="text-xs text-gray-400 border border-gray-700 px-3 py-1 rounded-full hover:border-yellow-400/50 hover:text-yellow-400 transition-colors"
          >
            {lang === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── CATEGORY FILTER ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['all', 'tournament', 'strategy', 'general'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'text-gray-400 border-gray-700 hover:border-yellow-400/50 hover:text-yellow-400'
              }`}
            >
              {cat === 'all' ? 'すべて' : cat === 'tournament' ? 'トーナメント' : cat === 'strategy' ? '戦略' : '一般'}
            </button>
          ))}
        </div>

        {/* ── AD TOP ── */}
        <MediaNetBanner slotId="mn-banner-top" className="mb-6 min-h-[90px]" />

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-20">記事がありません</p>
        ) : (
          <div className="flex gap-6">
            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* HERO */}
              {hero && <ArticleCard article={hero} lang={lang} variant="hero" />}

              {/* 3-COLUMN GRID */}
              {gridArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {gridArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} lang={lang} variant="grid" />
                  ))}
                </div>
              )}

              {/* AD INFEED */}
              {rowArticles.length > 0 && (
                <MediaNetBanner slotId="mn-infeed-1" className="min-h-[90px]" />
              )}

              {/* ROW LIST */}
              {rowArticles.length > 0 && (
                <div className="space-y-3">
                  {rowArticles.map((a, i) => (
                    <div key={a.id}>
                      <ArticleCard article={a} lang={lang} variant="row" />
                      {(i + 1) % 8 === 0 && (
                        <MediaNetBanner slotId={`mn-infeed-${i + 2}`} className="mt-3 min-h-[90px]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
              <BookShelf />
              <MediaNetBanner slotId="mn-sidebar" className="min-h-[250px]" />
            </aside>
          </div>
        )}

        {/* ── BACK LINK ── */}
        <div className="mt-10 text-center">
          <a href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            ← トレーニングツールに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
