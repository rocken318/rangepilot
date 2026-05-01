'use client';

import { useState } from 'react';
import type { Article } from '../../../lib/supabase';
import LangToggle from '../../../components/news/LangToggle';
import MediaNetBanner from '../../../components/ads/MediaNetBanner';
import BookShelf from '../../../components/ads/BookShelf';
import Link from 'next/link';

interface Props {
  article: Article;
}

export default function ArticleDetailClient({ article }: Props) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  const title = lang === 'ja' ? article.title_ja : article.title_en;
  const summary = lang === 'ja' ? article.summary_ja : article.summary_en;
  const date = new Date(article.published_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <Link href="/news" className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4 block">
          ← ニュース一覧
        </Link>

        <div className="flex gap-6">
          {/* Article */}
          <article className="flex-1 min-w-0">
            {article.image_url && (
              <img
                src={article.image_url}
                alt={title}
                className="w-full aspect-video object-cover rounded-xl mb-4"
              />
            )}

            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="text-xs text-gray-500">{date}</div>
              <LangToggle lang={lang} onChange={setLang} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-4">
              {title}
            </h1>

            {summary && (
              <p className="text-sm text-gray-300 leading-relaxed mb-6 border-l-2 border-yellow-500/40 pl-4">
                {summary}
              </p>
            )}

            <MediaNetBanner slotId="mn-article-mid" className="my-6 min-h-[250px]" />

            {/* Link to original article */}
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white transition-colors border border-gray-700/50"
            >
              🔗 元記事を読む（英語）
            </a>

            <MediaNetBanner slotId="mn-article-bottom" className="mt-6 min-h-[90px]" />
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
            <BookShelf />
            <MediaNetBanner slotId="mn-detail-sidebar" className="min-h-[250px]" />
          </aside>
        </div>
      </div>
    </div>
  );
}
