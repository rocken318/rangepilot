import { readFileSync } from 'fs';
import { join } from 'path';

describe('robots.txt', () => {
  const content = readFileSync(join(process.cwd(), 'public', 'robots.txt'), 'utf-8');

  it('allows all crawlers', () => {
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');
  });

  it('includes sitemap reference', () => {
    expect(content).toContain('Sitemap: https://rangepilot.vercel.app/sitemap.xml');
  });
});
