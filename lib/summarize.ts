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

入力:
${JSON.stringify(articles, null, 2)}

JSON配列のみ出力（説明不要）:
[{"title_ja": "...", "summary_ja": "..."}, ...]`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? '';

  // Extract JSON array from response
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error('[summarize] no JSON array found in response:', content.slice(0, 200));
    return articles.map((a) => ({ title_ja: a.title, summary_ja: a.summary }));
  }

  const results: ArticleOutput[] = JSON.parse(match[0]);

  // Fallback: if count mismatch, return originals
  if (results.length !== articles.length) {
    console.error(`[summarize] count mismatch: got ${results.length}, expected ${articles.length}`);
    return articles.map((a) => ({ title_ja: a.title, summary_ja: a.summary }));
  }

  return results;
}
