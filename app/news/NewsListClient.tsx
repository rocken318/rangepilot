'use client';

import { useState } from 'react';
import type { Article } from '../../lib/supabase';
import ArticleCard from '../../components/news/ArticleCard';
import LangToggle from '../../components/news/LangToggle';
import CategoryFilter from '../../components/news/CategoryFilter';
import BookShelf from '../../components/ads/BookShelf';
import MediaNetBanner from '../../components/ads/MediaNetBanner';

interface Props {
  articles: Article[];
}

export default function NewsListClient({ articles }: Props) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [category, setCategory] = useState<'all' | 'tournament' | 'general'>('all');

  const filtered = category === 'all'
    ? articles
    : articles.filter((a) => a.category === category);

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white mb-1">
            🃏 ポーカーニュース
          </h1>
          <p className="text-sm text-gray-400">海外の最新ポーカーニュースを毎朝更新</p>
        </div>

        {/* Ad banner */}
        <MediaNetBanner slotId="mn-banner-top" className="mb-4 min-h-[90px]" />

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <CategoryFilter active={category} onChange={setCategory} />
          <LangToggle lang={lang} onChange={setLang} />
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Articles grid */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">記事がありません</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((article, i) => (
                  <>
                    <ArticleCard key={article.id} article={article} lang={lang} />
                    {/* Insert ad every 6 articles */}
                    {(i + 1) % 6 === 0 && (
                      <div key={`ad-${i}`} className="sm:col-span-2">
                        <MediaNetBanner slotId={`mn-infeed-${i}`} className="min-h-[90px]" />
                      </div>
                    )}
                  </>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — hidden on mobile */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
            <BookShelf />
            <MediaNetBanner slotId="mn-sidebar" className="min-h-[250px]" />
          </aside>
        </div>

        {/* Back to app link */}
        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← トレーニングツールに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
