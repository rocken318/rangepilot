import { XMLParser } from 'fast-xml-parser';

export type RawArticle = {
  title: string;
  url: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: Date;
  source: string;
  category: string;
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

export async function fetchRssArticles(
  feedUrl: string,
  source: string,
  category: string
): Promise<RawArticle[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'RangePilot/1.0 (poker news aggregator)' },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml) as {
      rss?: { channel?: { item?: unknown[] | unknown } };
    };

    const rawItems = parsed.rss?.channel?.item;
    console.log(`[rss] keys:`, Object.keys(parsed));
    if (parsed.rss) console.log(`[rss] channel keys:`, Object.keys(parsed.rss?.channel ?? {}));
    if (!rawItems) {
      console.log(`[rss] no items found in feed: ${feedUrl}`);
      return [];
    }

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const enclosure = i['enclosure'] as Record<string, string> | undefined;
      return {
        title: String(i['title'] ?? ''),
        url: String(i['link'] ?? ''),
        summary: String(i['description'] ?? ''),
        imageUrl: enclosure?.['@_url'] ?? null,
        publishedAt: new Date(String(i['pubDate'] ?? Date.now())),
        source,
        category,
      };
    }).filter((a) => a.url && a.title);
  } catch {
    return [];
  }
}
