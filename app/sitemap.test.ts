import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

describe('sitemap', () => {
  it('includes the homepage', async () => {
    const { default: sitemap } = await import('./sitemap');
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/'))).toBe(true);
  });

  it('includes the news route', async () => {
    const { default: sitemap } = await import('./sitemap');
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/news'))).toBe(true);
  });

  it('all entries have lastModified', async () => {
    const { default: sitemap } = await import('./sitemap');
    const entries = await sitemap();
    entries.forEach((e) => {
      expect(e.lastModified).toBeDefined();
    });
  });
});
