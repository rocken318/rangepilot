import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

beforeEach(() => {
  vi.resetModules();
  process.env.CRON_SECRET = 'test-secret';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

describe('GET /api/cron/fetch-news', () => {
  it('returns 401 when authorization header is missing', async () => {
    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/cron/fetch-news');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when wrong secret is provided', async () => {
    const { GET } = await import('./route');
    const req = new NextRequest('http://localhost/api/cron/fetch-news', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
