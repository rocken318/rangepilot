import type { ParsedHand, HandAnalysisResult, EvaluationLabel, HeroAction, SpotType } from '../types/handHistory';
import type { Position, Action } from '../types';
import {
  getOpenRange, getVsOpenRange, getVs3BetRange,
  getBBDefenseRange, getSBvsBBRange,
} from '../data/ranges';

const EVALUATION_JA: Record<EvaluationLabel, string> = {
  Good: '良い判断',
  OK: '許容範囲',
  Caution: '注意',
  Mistake: 'ミス寄り',
  Unknown: '判定不能',
};

const ACTION_LABELS: Record<string, string> = {
  raise: 'オープンレイズ',
  mixed: 'レイズまたはフォールド（状況次第）',
  fold: 'フォールド',
  '3betValue': '3ベット（バリュー）',
  '3betBluff': '3ベット（ブラフ）',
  '3bet': '3ベット',
  call: 'コール',
  '4betValue': '4ベット（バリュー）',
  '4betBluff': '4ベット（ブラフ）',
};

function heroActionLabel(action: HeroAction): string {
  const map: Record<HeroAction, string> = {
    raise: 'オープンレイズ',
    call: 'コール',
    '3bet': '3ベット',
    '4bet': '4ベット',
    fold: 'フォールド',
    check: 'チェック',
    unknown: '不明',
  };
  return map[action];
}

function getRangeForSpot(
  spotType: SpotType,
  heroPosition: Position,
  openerPosition: Position | null
): Record<string, { action: Action }> | null {
  try {
    switch (spotType) {
      case 'open':
        return getOpenRange(heroPosition, 'standard');
      case 'vsOpen':
        if (!openerPosition) return null;
        return getVsOpenRange(heroPosition, openerPosition, 'standard');
      case 'vs3Bet':
        return getVs3BetRange(heroPosition, 'standard');
      case 'bbDefense':
        if (!openerPosition) return null;
        return getBBDefenseRange(openerPosition, 'standard');
      case 'sbVsBb':
        return getSBvsBBRange('sbOpen', 'standard');
      default:
        return null;
    }
  } catch {
    return null;
  }
}

type EvalResult = {
  evaluation: EvaluationLabel;
  comment: string;
  safeModeComment: string;
  recommendedAction: string;
};

function evaluateOpenAction(heroAction: HeroAction, rangeAction: Action): EvalResult {
  const rec = ACTION_LABELS[rangeAction] ?? rangeAction;

  if (rangeAction === 'fold') {
    if (heroAction === 'fold') return {
      evaluation: 'Good',
      comment: 'フォールドが正解です。このハンドはこのポジションからオープンする価値がありません。',
      safeModeComment: 'フォールドで問題ありません。安全寄りに徹しましょう。',
      recommendedAction: rec,
    };
    return {
      evaluation: 'Mistake',
      comment: `${heroActionLabel(heroAction)}は過剰です。このハンドはこのポジションからオープンするには弱すぎます。`,
      safeModeComment: 'フォールドが最善です。弱いハンドで無理に参加しないことが安全寄りの基本です。',
      recommendedAction: rec,
    };
  }

  if (rangeAction === 'raise') {
    if (heroAction === 'raise') return {
      evaluation: 'Good',
      comment: 'レイズが正解です。このハンドはこのポジションから自信を持ってオープンできます。',
      safeModeComment: '問題ありません。自信を持ってオープンしましょう。',
      recommendedAction: rec,
    };
    if (heroAction === 'fold') return {
      evaluation: 'Mistake',
      comment: 'フォールドはもったいないです。このハンドはオープンレイズに値します。',
      safeModeComment: '安全寄りでもこのハンドはオープンできます。見逃しです。',
      recommendedAction: rec,
    };
    return {
      evaluation: 'Caution',
      comment: `${heroActionLabel(heroAction)}はこのスポットでは非推奨です。通常はオープンレイズが推奨されます。`,
      safeModeComment: '基本的なオープンレイズを選びましょう。',
      recommendedAction: rec,
    };
  }

  if (rangeAction === 'mixed') {
    if (heroAction === 'raise' || heroAction === 'fold') return {
      evaluation: 'OK',
      comment: `このハンドはオープンするかフォールドかが状況次第です。${heroActionLabel(heroAction)}は許容範囲内です。`,
      safeModeComment: 'フォールドが安全寄りの選択です。',
      recommendedAction: rec,
    };
    return {
      evaluation: 'Caution',
      comment: `${heroActionLabel(heroAction)}はこのスポットでは一般的ではありません。`,
      safeModeComment: 'フォールドが安全です。',
      recommendedAction: rec,
    };
  }

  return { evaluation: 'Unknown', comment: '判定できませんでした。', safeModeComment: '判定できませんでした。', recommendedAction: rec };
}

function evaluateVsOpenAction(heroAction: HeroAction, rangeAction: Action): EvalResult {
  const rec = ACTION_LABELS[rangeAction] ?? rangeAction;
  const is3bet = rangeAction === '3betValue' || rangeAction === '3betBluff' || rangeAction === '3bet';
  const isMixed = rangeAction === 'mixed';

  if (rangeAction === 'fold') {
    if (heroAction === 'fold') return {
      evaluation: 'Good',
      comment: 'フォールドが正解です。相手のオープンに対してこのハンドはレンジ外です。',
      safeModeComment: 'フォールドで正解です。',
      recommendedAction: rec,
    };
    return {
      evaluation: 'Mistake',
      comment: `${heroActionLabel(heroAction)}は過剰です。このハンドはフォールドが推奨されます。`,
      safeModeComment: 'フォールドで問題ありません。安全寄りならなおさらです。',
      recommendedAction: rec,
    };
  }

  if (rangeAction === 'call') {
    if (heroAction === 'call') return {
      evaluation: 'Good',
      comment: 'コールが正解です。このハンドは相手のオープンにコールで参加できます。',
      safeModeComment: 'コールで問題ありません。',
      recommendedAction: rec,
    };
    if (heroAction === '3bet') return {
      evaluation: 'OK',
      comment: '3ベットも選択肢ですが、コールが標準です。相手や状況次第で3ベットもあり得ます。',
      safeModeComment: '初中級者はコールを推奨します。3ベットはリスクが上がります。',
      recommendedAction: rec,
    };
    if (heroAction === 'fold') return {
      evaluation: 'Caution',
      comment: 'フォールドはやや消極的です。このハンドはコールで参加できます。',
      safeModeComment: '安全寄りならフォールドも許容ですが、コールでもOKです。',
      recommendedAction: rec,
    };
  }

  if (is3bet) {
    if (heroAction === '3bet') return {
      evaluation: 'Good',
      comment: '3ベットが正解です。このハンドは相手のオープンに積極的に3ベットできます。',
      safeModeComment: '3ベットも正解ですが、初中級者はコールも許容範囲です。',
      recommendedAction: rec,
    };
    if (heroAction === 'call') return {
      evaluation: 'OK',
      comment: 'コールも許容範囲ですが、3ベットがより推奨されます。相手レンジに対しバリューを取れます。',
      safeModeComment: '安全寄りモードではコールで十分です。',
      recommendedAction: rec,
    };
    if (heroAction === 'fold') return {
      evaluation: 'Caution',
      comment: 'フォールドはもったいないです。このハンドは3ベットまたはコールで参加できます。',
      safeModeComment: '安全寄りならコールが最低限の選択です。',
      recommendedAction: rec,
    };
  }

  if (isMixed) {
    if (heroAction === 'fold' || heroAction === 'call' || heroAction === '3bet') return {
      evaluation: 'OK',
      comment: `${heroActionLabel(heroAction)}は許容範囲です。このハンドは状況次第でアクションが変わります。`,
      safeModeComment: 'フォールドまたはコールが安全寄りの選択です。',
      recommendedAction: rec,
    };
  }

  return { evaluation: 'Unknown', comment: '判定できませんでした。', safeModeComment: '判定できませんでした。', recommendedAction: rec };
}

function evaluateVs3BetAction(heroAction: HeroAction, rangeAction: Action): EvalResult {
  const rec = ACTION_LABELS[rangeAction] ?? rangeAction;
  const is4bet = rangeAction === '4betValue' || rangeAction === '4betBluff';
  const isMixed = rangeAction === 'mixed';

  if (rangeAction === 'fold') {
    if (heroAction === 'fold') return {
      evaluation: 'Good',
      comment: 'フォールドが正解です。3ベットに対してこのハンドはレンジ外です。',
      safeModeComment: 'フォールドで正解です。',
      recommendedAction: rec,
    };
    return {
      evaluation: 'Mistake',
      comment: `${heroActionLabel(heroAction)}は過剰です。3ベットに対してこのハンドはフォールドが推奨されます。`,
      safeModeComment: 'フォールドが安全です。3ベットへの過剰な反応は禁物です。',
      recommendedAction: rec,
    };
  }

  if (rangeAction === 'call') {
    if (heroAction === 'call') return {
      evaluation: 'Good',
      comment: 'コールが正解です。3ベットに対してコールで見ていける強さがあります。',
      safeModeComment: 'コールで問題ありません。',
      recommendedAction: rec,
    };
    if (heroAction === 'fold') return {
      evaluation: 'Caution',
      comment: 'フォールドはやや保守的です。このハンドは3ベットにコールできます。',
      safeModeComment: '安全寄りならフォールドも許容ですが、コールも良い選択です。',
      recommendedAction: rec,
    };
    if (heroAction === '4bet') return {
      evaluation: 'Caution',
      comment: '4ベットは強すぎる反応です。コールが標準的な選択です。',
      safeModeComment: '4ベットは避け、コールまたはフォールドにしましょう。',
      recommendedAction: rec,
    };
  }

  if (is4bet) {
    if (heroAction === '4bet') return {
      evaluation: 'Good',
      comment: '4ベットが正解です。相手の3ベットに対して強く反撃できるハンドです。',
      safeModeComment: '4ベットが正解ですが、初中級者はコールも許容範囲です。',
      recommendedAction: rec,
    };
    if (heroAction === 'call') return {
      evaluation: 'OK',
      comment: 'コールも許容範囲ですが、4ベットがより推奨されます。',
      safeModeComment: '安全寄りならコールが無難です。',
      recommendedAction: rec,
    };
    if (heroAction === 'fold') return {
      evaluation: 'Caution',
      comment: 'フォールドはもったいないです。4ベットまたはコールが推奨されます。',
      safeModeComment: '安全寄りならコールを検討してください。',
      recommendedAction: rec,
    };
  }

  if (isMixed) {
    if (heroAction === 'fold' || heroAction === 'call' || heroAction === '4bet') return {
      evaluation: 'OK',
      comment: `${heroActionLabel(heroAction)}は許容範囲です。状況次第でアクションが変わる難しい局面です。`,
      safeModeComment: 'フォールドまたはコールが安全寄りの選択です。',
      recommendedAction: rec,
    };
  }

  return { evaluation: 'Unknown', comment: '判定できませんでした。', safeModeComment: '判定できませんでした。', recommendedAction: rec };
}

/** Main analysis function: returns null if hand cannot be analyzed */
export function analyzeHand(parsed: ParsedHand): HandAnalysisResult | null {
  if (!parsed.heroPosition || !parsed.heroHand || parsed.spotType === 'unknown') return null;

  const heroPosition = parsed.heroPosition;
  const range = getRangeForSpot(parsed.spotType, heroPosition, parsed.openerPosition);
  if (!range) return null;

  const entry = range[parsed.heroHand];
  const rangeAction = entry?.action ?? null;

  if (!rangeAction) {
    return {
      heroPosition,
      heroHand: parsed.heroHand,
      spotType: parsed.spotType,
      heroAction: parsed.heroAction,
      recommendedAction: '判定不能（レンジデータなし）',
      evaluation: 'Unknown',
      evaluationJa: EVALUATION_JA.Unknown,
      comment: 'このハンドのレンジデータが見つかりませんでした。',
      safeModeComment: 'レンジデータが見つかりませんでした。安全寄りにフォールドを推奨します。',
      openerPosition: parsed.openerPosition,
    };
  }

  let evalResult: EvalResult;

  switch (parsed.spotType) {
    case 'open':
      evalResult = evaluateOpenAction(parsed.heroAction, rangeAction);
      break;
    case 'vsOpen':
    case 'bbDefense':
    case 'sbVsBb':
      evalResult = evaluateVsOpenAction(parsed.heroAction, rangeAction);
      break;
    case 'vs3Bet':
      evalResult = evaluateVs3BetAction(parsed.heroAction, rangeAction);
      break;
    default:
      evalResult = { evaluation: 'Unknown', comment: '判定不能です。', safeModeComment: '判定不能です。', recommendedAction: '不明' };
  }

  return {
    heroPosition,
    heroHand: parsed.heroHand,
    spotType: parsed.spotType,
    heroAction: parsed.heroAction,
    recommendedAction: evalResult.recommendedAction,
    evaluation: evalResult.evaluation,
    evaluationJa: EVALUATION_JA[evalResult.evaluation],
    comment: evalResult.comment,
    safeModeComment: evalResult.safeModeComment,
    openerPosition: parsed.openerPosition,
  };
}
