const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export async function translateToJapanese(text: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return text;

  try {
    const res = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: 'JA',
        source_lang: 'EN',
      }),
    });

    if (!res.ok) return text;

    const data = await res.json() as { translations: { text: string }[] };
    return data.translations[0]?.text ?? text;
  } catch {
    return text;
  }
}

export async function translateBatch(texts: string[]): Promise<string[]> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return texts;

  try {
    const res = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: 'JA',
        source_lang: 'EN',
      }),
    });

    if (!res.ok) return texts;

    const data = await res.json() as { translations: { text: string }[] };
    return data.translations.map((t, i) => t.text ?? texts[i]);
  } catch {
    return texts;
  }
}
