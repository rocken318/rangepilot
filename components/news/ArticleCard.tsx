import type { Article } from '../../lib/supabase';
import Link from 'next/link';

interface Props {
  article: Article;
  lang: 'ja' | 'en';
}

function slugify(url: string): string {
  return encodeURIComponent(url);
}

const SOURCE_LABELS: Record<string, string> = {
  pokernews: 'PokerNews',
  cardplayer: 'Card Player',
  gpi: 'Global Poker Index',
};

export default function ArticleCard({ article, lang }: Props) {
  const title = lang === 'ja' ? article.title_ja : article.title_en;
  const summary = lang === 'ja' ? article.summary_ja : article.summary_en;
  const date = new Date(article.published_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Link
      href={`/news/${slugify(article.source_url)}`}
      className="group block rounded-xl overflow-hidden border border-gray-700/50 hover:border-yellow-500/40 transition-colors bg-gray-900/40"
    >
      {article.image_url && (
        <div className="aspect-video overflow-hidden bg-gray-800">
          <img
            src={article.image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="text-yellow-500/70 font-semibold">
            {SOURCE_LABELS[article.source] ?? article.source}
          </span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
          {title}
        </h3>
        {summary && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{summary}</p>
        )}
      </div>
    </Link>
  );
}
