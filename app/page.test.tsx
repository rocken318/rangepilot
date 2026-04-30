import { describe, it, expect } from 'vitest';

describe('page module', () => {
  it('exports a default function', async () => {
    const mod = await import('./page');
    expect(typeof mod.default).toBe('function');
  });
});
