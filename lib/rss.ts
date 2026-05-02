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
    if (xml.trimStart().startsWith('<html') || xml.trimStart().startsWith('<!DOCTYPE')) {
      console.log(`[rss] got HTML instead of XML: ${feedUrl}`);
      return [];
    }

    const parsed = parser.parse(xml) as {
      rss?: { channel?: { item?: unknown[] | unknown } };
      feed?: { entry?: unknown[] | unknown };
    };

    // Support both RSS 2.0 (rss.channel.item) and Atom (feed.entry)
    const rawItems = parsed.rss?.channel?.item ?? parsed.feed?.entry;
    if (!rawItems) {
      console.log(`[rss] no items found in feed: ${feedUrl}`, Object.keys(parsed));
      return [];
    }

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const enclosure = i['enclosure'] as Record<string, string> | undefined;
      const rawSummary = String(i['description'] ?? i['summary'] ?? '');
      const summary = rawSummary.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      return {
        title: String(i['title'] ?? ''),
        url: String(i['link'] ?? ''),
        summary,
        imageUrl: enclosure?.['@_url'] ?? null,
        publishedAt: new Date(String(i['pubDate'] ?? i['published'] ?? Date.now())),
        source,
        category,
      };
    }).filter((a) => a.url && a.title);
  } catch {
    return [];
  }
}
