import type { Article } from '../../lib/supabase';
import Link from 'next/link';

interface Props {
  article: Article;
  lang: 'ja' | 'en';
  variant: 'hero' | 'grid' | 'row';
}

function slugify(url: string): string {
  return encodeURIComponent(url);
}

const SOURCE_LABELS: Record<string, string> = {
  upswingpoker: 'Upswing Poker',
  wpt: 'World Poker Tour',
  pokerstrategy: 'PokerStrategy',
  pokernews: 'PokerNews',
  cardplayer: 'Card Player',
};

const CATEGORY_LABELS: Record<string, string> = {
  tournament: 'TOURNAMENT',
  strategy: 'STRATEGY',
  general: 'GENERAL',
};

const FALLBACK_IMAGES: Record<string, string> = {
  tournament: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=800&q=80',
  strategy: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&q=80',
  general: 'https://images.unsplash.com/photo-1596731498067-2e1bc3b9a1cf?w=800&q=80',
};

function getImageUrl(article: Article): string {
  return article.image_url ?? FALLBACK_IMAGES[article.category] ?? FALLBACK_IMAGES.general;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '1時間以内';
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export default function ArticleCard({ article, lang, variant }: Props) {
  const title = lang === 'ja' ? article.title_ja : article.title_en;
  const summary = lang === 'ja' ? article.summary_ja : article.summary_en;
  const imgUrl = getImageUrl(article);
  const relTime = getRelativeTime(article.published_at);
  const badge = CATEGORY_LABELS[article.category] ?? article.category.toUpperCase();
  const source = SOURCE_LABELS[article.source] ?? article.source;
  const href = `/news/${slugify(article.source_url)}`;

  // ── HERO ──────────────────────────────────────────────
  if (variant === 'hero') {
    return (
      <Link href={href} className="group block relative rounded-xl overflow-hidden">
        <img
          src={imgUrl}
          alt={title}
          className="w-full h-64 sm:h-80 object-cover brightness-60 group-hover:brightness-70 transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded">
              {badge}
            </span>
            <span className="text-gray-400 text-[11px]">{source} · {relTime}</span>
          </div>
          <h2 className="text-white text-xl sm:text-2xl font-black leading-tight mb-2 group-hover:text-yellow-300 transition-colors">
            {title}
          </h2>
          {summary && (
            <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">{summary}</p>
          )}
        </div>
      </Link>
    );
  }

  // ── GRID ──────────────────────────────────────────────
  if (variant === 'grid') {
    return (
      <Link
        href={href}
        className="group block rounded-xl overflow-hidden border border-[#1e2d3a] hover:border-yellow-500/40 transition-colors bg-[#111c27]"
      >
        <img
          src={imgUrl}
          alt={title}
          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
              {badge}
            </span>
            <span className="text-gray-500 text-[10px]">{relTime}</span>
          </div>
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
            {title}
          </h3>
          <p className="text-[11px] text-gray-500">{source}</p>
        </div>
      </Link>
    );
  }

  // ── ROW ───────────────────────────────────────────────
  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-xl overflow-hidden border border-[#1e2d3a] hover:border-yellow-500/40 transition-colors bg-[#111c27]"
    >
      <img
        src={imgUrl}
        alt={title}
        className="w-24 sm:w-28 h-20 object-cover flex-shrink-0"
      />
      <div className="py-2 pr-3 flex flex-col justify-center space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
            {badge}
          </span>
          <span className="text-gray-500 text-[10px]">{relTime}</span>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
          {title}
        </h3>
        <p className="text-[11px] text-gray-500">{source}</p>
      </div>
    </Link>
  );
}
