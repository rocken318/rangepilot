import type { Metadata } from 'next';
import Script from 'next/script';
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

const MEDIA_NET_SITE_ID = process.env.NEXT_PUBLIC_MEDIA_NET_SITE_ID ?? '';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {MEDIA_NET_SITE_ID && (
          <Script
            id="media-net"
            strategy="afterInteractive"
            src={`//contextual.media.net/dmedianet.js?cid=${MEDIA_NET_SITE_ID}`}
          />
        )}
        {children}
      </body>
    </html>
  );
}
