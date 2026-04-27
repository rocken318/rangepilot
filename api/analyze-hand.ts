import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `あなたは6max NLHキャッシュゲームのポーカー学習コーチです。
目的はユーザーの上達支援であり、実戦中のリアルタイム意思決定支援ではありません。
回答はプレイ後レビューとして行ってください。
ユーザーが今すぐ押すべきボタンを指示するのではなく、ハンド終了後の分析として説明してください。
初心者にも分かる日本語で、短く具体的に答えてください。
GTO理論をベースにしつつ、相手スタッツに応じたエクスプロイトも説明してください。
特に以下を重視してください：
- プリフロップ判断
- 3BETへの対応
- AJo/KQoなど支配されやすいハンドの扱い
- 弱いワンペアで粘りすぎないこと
- 魚相手にはブラフを減らしてバリューを増やすこと
- リバーの大きいベットへの対応
- 相手のスタッツからのタイプ分類

出力は必ず以下のJSON形式で返してください：
{
  "summary": "結論を1〜2文",
  "goodPoints": ["良かった点1", "良かった点2"],
  "mistakes": ["ミスの可能性1", "ミスの可能性2"],
  "nextRules": ["次回のルール1", "次回のルール2"],
  "opponentNote": "相手メモ用の短文",
  "tags": ["タグ1", "タグ2"],
  "severity": "low | medium | high"
}`;

function buildUserPrompt(body: Record<string, unknown>): string {
  const o = (body.opponent ?? {}) as Record<string, string>;
  return `以下のハンドをプレイ後レビューしてください。

【自分のハンド】
${body.heroHand ?? ''}

【自分のポジション】
${body.heroPosition ?? ''}

【ブラインド】
${body.blinds ?? ''}

【有効スタック】
${body.effectiveStack ?? ''}

【プリフロップ】
${body.preflopAction ?? ''}

【フロップ】
${body.flopAction ?? ''}

【ターン】
${body.turnAction ?? ''}

【リバー】
${body.riverAction ?? ''}

【相手】
${o.name ?? ''}

【相手スタッツ】
VPIP: ${o.vpip ?? ''}
PFR: ${o.pfr ?? ''}
3BET: ${o.threeBet ?? ''}
Fold to 3Bet: ${o.foldToThreeBet ?? ''}
C-Bet: ${o.cbet ?? ''}
Fold to C-Bet: ${o.foldToCbet ?? ''}
Steal: ${o.steal ?? ''}
Check/Raise: ${o.checkRaise ?? ''}
WTSD: ${o.wtsd ?? ''}
WSD: ${o.wsd ?? ''}

【自分の判断】
${body.heroDecision ?? ''}

【結果】
${body.result ?? ''}

【自由メモ】
${body.memo ?? ''}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenAI API key is not configured. Set OPENAI_API_KEY in Vercel Environment Variables.',
    });
  }

  try {
    const body = req.body as Record<string, unknown>;
    if (!body.heroHand) {
      return res.status(400).json({ error: 'heroHand is required' });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'Empty response from OpenAI' });
    }

    const parsed = JSON.parse(content);

    // Validate required fields with defaults
    const result = {
      summary: parsed.summary ?? '',
      goodPoints: Array.isArray(parsed.goodPoints) ? parsed.goodPoints : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      nextRules: Array.isArray(parsed.nextRules) ? parsed.nextRules : [],
      opponentNote: parsed.opponentNote ?? '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      severity: ['low', 'medium', 'high'].includes(parsed.severity) ? parsed.severity : 'medium',
    };

    return res.status(200).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: `AI analysis failed: ${message}` });
  }
}
