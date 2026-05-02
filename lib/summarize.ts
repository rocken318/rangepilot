import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ArticleInput = { title: string; summary: string };
type ArticleOutput = { title_ja: string; summary_ja: string };

export async function summarizeBatch(articles: ArticleInput[]): Promise<ArticleOutput[]> {
  if (articles.length === 0) return [];

  const prompt = `以下の英語ポーカーニュース記事を日本語に翻訳・要約してください。

ルール:
- title_ja: タイトルを自然な日本語に翻訳
- summary_ja: 内容を2〜3文の自然な日本語要約に。宣伝文句・「The post appeared first on...」等は除外
- JSONの配列のみを返す（他のテキスト不要）

入力:
${JSON.stringify(articles, null, 2)}

出力形式:
[{"title_ja": "...", "summary_ja": "..."}, ...]`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as { results?: ArticleOutput[] } | ArticleOutput[];

  // Handle both {results: [...]} and [...] response shapes
  const results = Array.isArray(parsed) ? parsed : (parsed as { results?: ArticleOutput[] }).results ?? [];

  // Fallback: if count mismatch, return originals
  if (results.length !== articles.length) {
    console.error(`[summarize] count mismatch: got ${results.length}, expected ${articles.length}`);
    return articles.map((a) => ({ title_ja: a.title, summary_ja: a.summary }));
  }

  return results;
}
