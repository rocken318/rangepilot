import type { Metadata } from 'next';
import { supabase } from '../../lib/supabase';
import NewsListClient from './NewsListClient';

export const metadata: Metadata = {
  title: 'ポーカーニュース | RangePilot',
  description: '海外ポーカーニュースを毎日日本語に翻訳してお届け。トーナメント結果、戦略記事など。',
};

export const revalidate = 3600;

export default async function NewsPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(40);

  return <NewsListClient articles={articles ?? []} />;
}
