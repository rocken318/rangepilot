import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RangePilot | ポーカーGTOレンジ練習ツール',
    template: '%s | RangePilot',
  },
  description:
    'GTOポーカーのプリフロップレンジを練習・学習できる無料ツール。オープン・3ベット・BBディフェンスなど全シナリオ対応。最新のポーカーニュースも毎日更新。',
  keywords: ['ポーカー', 'GTO', 'レンジ', '練習', 'プリフロップ', 'poker', 'range', 'training'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    alternateLocale: ['en_US'],
    title: 'RangePilot | ポーカーGTOレンジ練習ツール',
    description: 'GTOポーカー練習ツール＋毎日更新のポーカーニュース',
    siteName: 'RangePilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RangePilot | ポーカーGTOレンジ練習ツール',
    description: 'GTOポーカー練習ツール＋毎日更新のポーカーニュース',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
