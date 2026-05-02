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
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error('[summarize] no JSON array found in response:', content.slice(0, 200));
    return articles.map((a) => ({ title_ja: a.title, summary_ja: a.summary }));
  }

  const results: ArticleOutput[] = JSON.parse(match[0]);
  if (results.length !== articles.length) {
    console.error(`[summarize] count mismatch: got ${results.length}, expected ${articles.length}`);
    return articles.map((a) => ({ title_ja: a.title, summary_ja: a.summary }));
  }

  return results;
}

export async function generateArticle(
  title: string,
  bodyEn: string,
): Promise<{ body_ja: string; points_ja: string[] }> {
  const source = bodyEn.trim() || title;

  const prompt = `以下の英語ポーカーニュースを日本語の記事に変換してください。

ルール:
- body_ja: 400〜600字の自然な日本語本文。引用があれば「〜と語った」等で含める。宣伝文句・「The post appeared first on...」は除外。
- points_ja: この記事の重要ポイントを3つ、各15〜30字の箇条書きで。

英語原文:
${source.slice(0, 2000)}

JSON形式のみ出力（説明不要）:
{"body_ja": "...", "points_ja": ["...", "...", "..."]}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content ?? '';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[generateArticle] no JSON found:', content.slice(0, 200));
      return { body_ja: '', points_ja: [] };
    }

    const parsed = JSON.parse(match[0]) as { body_ja?: string; points_ja?: string[] };
    return {
      body_ja: parsed.body_ja ?? '',
      points_ja: Array.isArray(parsed.points_ja) ? parsed.points_ja.slice(0, 3) : [],
    };
  } catch (err) {
    console.error('[generateArticle] error:', err);
    return { body_ja: '', points_ja: [] };
  }
}
