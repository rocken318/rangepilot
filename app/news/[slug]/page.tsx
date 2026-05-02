import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import ArticleDetailClient from './ArticleDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const url = decodeURIComponent(slug);
  const { data } = await supabase
    .from('articles')
    .select('title_ja, summary_ja, body_ja')
    .eq('source_url', url)
    .single();

  if (!data) return { title: 'Article Not Found' };

  return {
    title: `${data.title_ja} | RangePilot`,
    description: data.summary_ja ?? undefined,
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const url = decodeURIComponent(slug);

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('source_url', url)
    .single();

  if (!article) notFound();

  // Fetch related articles (same category, exclude current)
  const { data: related } = await supabase
    .from('articles')
    .select('*')
    .eq('category', article.category)
    .neq('source_url', url)
    .order('published_at', { ascending: false })
    .limit(3);

  return <ArticleDetailClient article={article} related={related ?? []} />;
}
