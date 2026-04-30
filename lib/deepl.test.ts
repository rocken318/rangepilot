import { describe, it, expect, vi } from 'vitest';

describe('translateToJapanese', () => {
  it('returns translated text from DeepL API response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        translations: [{ text: 'ポーカーニュース' }],
      }),
    }) as unknown as typeof fetch;

    const { translateToJapanese } = await import('./deepl');
    const result = await translateToJapanese('Poker News');
    expect(result).toBe('ポーカーニュース');
  });

  it('returns original text when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    const { translateToJapanese } = await import('./deepl');
    const result = await translateToJapanese('Fallback text');
    expect(result).toBe('Fallback text');
  });
});
