'use client';

import { useState } from 'react';
import type { Article } from '../../../lib/supabase';
import Link from 'next/link';
import MediaNetBanner from '../../../components/ads/MediaNetBanner';
import BookShelf from '../../../components/ads/BookShelf';

interface Props {
  article: Article;
  related: Article[];
}

const FALLBACK_IMAGES: Record<string, string> = {
  tournament: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=800&q=80',
  strategy: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&q=80',
  general: 'https://images.unsplash.com/photo-1596731498067-2e1bc3b9a1cf?w=800&q=80',
};

const CATEGORY_LABELS: Record<string, string> = {
  tournament: 'TOURNAMENT',
  strategy: 'STRATEGY',
  general: 'GENERAL',
};

const SOURCE_LABELS: Record<string, string> = {
  upswingpoker: 'Upswing Poker',
  wpt: 'World Poker Tour',
  pokerstrategy: 'PokerStrategy',
  pokernews: 'PokerNews',
  cardplayer: 'Card Player',
};

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '1時間以内';
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function getReadTime(text: string | null): string {
  if (!text) return '';
  const mins = Math.max(1, Math.ceil(text.length / 400));
  return `読了約${mins}分`;
}

export default function ArticleDetailClient({ article, related }: Props) {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  const title = lang === 'ja' ? article.title_ja : article.title_en;
  const body = article.body_ja;
  const summary = lang === 'ja' ? article.summary_ja : article.summary_en;
  const imgUrl = article.image_url ?? FALLBACK_IMAGES[article.category] ?? FALLBACK_IMAGES.general;
  const badge = CATEGORY_LABELS[article.category] ?? article.category.toUpperCase();
  const source = SOURCE_LABELS[article.source] ?? article.source;
  const date = new Date(article.published_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      {/* Site header */}
      <div className="bg-[#070d14] border-b-2 border-yellow-400">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link href="/news" className="flex items-center gap-2 text-yellow-400 text-sm font-bold hover:text-yellow-300 transition-colors">
            ← ニュース一覧
          </Link>
          <button
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="text-xs text-gray-400 border border-gray-700 px-3 py-1 rounded-full hover:border-yellow-400/50 hover:text-yellow-400 transition-colors"
          >
            {lang === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* ── MAIN ARTICLE ── */}
          <article className="flex-1 min-w-0">

            {/* Meta */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded">
                {badge}
              </span>
              <span className="text-gray-500 text-xs">{date}</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{source}</span>
              {body && (
                <>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{getReadTime(body)}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4">
              {title}
            </h1>

            {/* Hero image */}
            <img
              src={imgUrl}
              alt={title}
              className="w-full aspect-video object-cover rounded-xl mb-5"
            />

            {/* Points summary box */}
            {article.points_ja && article.points_ja.length > 0 && (
              <div className="bg-[#0a1520] border-l-4 border-yellow-400 rounded-r-lg p-4 mb-5">
                <p className="text-yellow-400 text-xs font-bold tracking-widest mb-2">📋 この記事のポイント</p>
                <ul className="space-y-1.5">
                  {article.points_ja.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 font-bold mt-0.5">▸</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Article body */}
            <div className="text-gray-300 text-sm leading-relaxed space-y-4 mb-6">
              {body ? (
                body.split('\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : summary ? (
                <p className="border-l-2 border-yellow-500/30 pl-4">{summary}</p>
              ) : null}
            </div>

            <MediaNetBanner slotId="mn-article-mid" className="my-6 min-h-[250px]" />

            {/* Source link */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1e2d3a]">
              <span className="text-gray-600 text-xs">原文: {source}（英語）</span>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-400 border border-yellow-400/40 px-3 py-1.5 rounded hover:bg-yellow-400/10 transition-colors"
              >
                元記事を読む →
              </a>
            </div>

            <MediaNetBanner slotId="mn-article-bottom" className="mt-6 min-h-[90px]" />
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-5">

            {/* Related articles */}
            {related.length > 0 && (
              <div>
                <p className="text-yellow-400 text-xs font-bold tracking-widest mb-3 border-b border-[#1e2d3a] pb-2">
                  関連記事
                </p>
                <div className="space-y-4">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/news/${encodeURIComponent(r.source_url)}`}
                      className="group block"
                    >
                      <img
                        src={r.image_url ?? FALLBACK_IMAGES[r.category] ?? FALLBACK_IMAGES.general}
                        alt={r.title_ja}
                        className="w-full h-28 object-cover rounded-lg mb-2 group-hover:opacity-80 transition-opacity"
                      />
                      <p className="text-xs text-gray-300 font-semibold leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
                        {r.title_ja}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">{getRelativeTime(r.published_at)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA card */}
            <div className="bg-yellow-400/5 border border-yellow-400/30 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-yellow-400 text-xs font-bold mb-1">ハンドを練習する</p>
              <p className="text-gray-500 text-[10px] mb-3">RangePilotで実戦トレーニング</p>
              <a
                href="/"
                className="block text-[11px] bg-yellow-400 text-black font-bold py-1.5 px-3 rounded hover:bg-yellow-300 transition-colors"
              >
                トレーニング開始
              </a>
            </div>

            <BookShelf />
            <MediaNetBanner slotId="mn-detail-sidebar" className="min-h-[250px]" />
          </aside>
        </div>
      </div>
    </div>
  );
}
