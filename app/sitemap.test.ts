import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('includes the homepage', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/'))).toBe(true);
  });

  it('includes the news route', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/news'))).toBe(true);
  });

  it('all entries have lastModified', async () => {
    const entries = await sitemap();
    entries.forEach((e) => {
      expect(e.lastModified).toBeDefined();
    });
  });
});
