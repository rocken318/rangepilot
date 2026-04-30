import { describe, it, expect, vi } from 'vitest';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PokerNews</title>
    <item>
      <title>Big Tournament Results</title>
      <link>https://pokernews.com/news/2026/04/results.htm</link>
      <description>Player wins $1M in latest event.</description>
      <pubDate>Wed, 30 Apr 2026 09:00:00 GMT</pubDate>
      <enclosure url="https://example.com/img.jpg" type="image/jpeg"/>
    </item>
  </channel>
</rss>`;

describe('fetchRssArticles', () => {
  it('parses RSS feed into RawArticle array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_RSS,
    }) as unknown as typeof fetch;

    const { fetchRssArticles } = await import('./rss');
    const articles = await fetchRssArticles('https://pokernews.com/rss', 'pokernews', 'tournament');

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Big Tournament Results');
    expect(articles[0].url).toBe('https://pokernews.com/news/2026/04/results.htm');
    expect(articles[0].source).toBe('pokernews');
    expect(articles[0].category).toBe('tournament');
  });

  it('returns empty array on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const { fetchRssArticles } = await import('./rss');
    const articles = await fetchRssArticles('https://pokernews.com/rss', 'pokernews', 'general');
    expect(articles).toEqual([]);
  });
});
