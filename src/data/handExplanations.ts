// handExplanations.ts
// ハンドの強さとプレイ方針の理由を日本語で説明するデータ/ユーティリティモジュール

export type HandStrength = 'premium' | 'strong' | 'playable' | 'marginal' | 'trash';

export interface HandExplanation {
  strengthCategory: HandStrength;
  strengthLabel: string;      // e.g. "プレミアムハンド", "マージナルハンド"
  whyThisAction: string;      // コンテキストに基づくアクションの理由
  positionNote: string;       // ポジションがこのハンドに与える影響
  beginnerWarning?: string;   // 初心者が犯しやすいミス（任意）
}

export const STRENGTH_LABELS: Record<HandStrength, string> = {
  premium: 'プレミアムハンド',
  strong: '強いハンド',
  playable: 'プレイアブル',
  marginal: 'マージナル',
  trash: '弱いハンド',
};

export const STRENGTH_COLORS: Record<HandStrength, string> = {
  premium: 'text-yellow-400',
  strong: 'text-orange-400',
  playable: 'text-blue-400',
  marginal: 'text-gray-400',
  trash: 'text-gray-600',
};

// ──────────────────────────────────────────────
// ランク変換・パースユーティリティ
// ──────────────────────────────────────────────

const RANK_ORDER: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

interface ParsedHand {
  isPair: boolean;
  rank1: string;
  rank2: string;
  isSuited: boolean;
  isOffsuit: boolean;
  rank1Val: number;
  rank2Val: number;
}

function parseHand(hand: string): ParsedHand {
  const trimmed = hand.trim();

  // ペア判定: 2文字でどちらも同じランク (e.g. "AA", "77")
  if (trimmed.length === 2 && trimmed[0] === trimmed[1] && RANK_ORDER[trimmed[0]] !== undefined) {
    const r = trimmed[0];
    return {
      isPair: true,
      rank1: r,
      rank2: r,
      isSuited: false,
      isOffsuit: false,
      rank1Val: RANK_ORDER[r] ?? 0,
      rank2Val: RANK_ORDER[r] ?? 0,
    };
  }

  // スーテッド / オフスート判定: 3文字 (e.g. "AKs", "T9o")
  const suffix = trimmed.slice(-1).toLowerCase();
  const isSuited = suffix === 's';
  const isOffsuit = suffix === 'o';
  const rankPart = (isSuited || isOffsuit) ? trimmed.slice(0, -1) : trimmed;
  const rank1 = rankPart[0] ?? '';
  const rank2 = rankPart[1] ?? '';

  return {
    isPair: false,
    rank1,
    rank2,
    isSuited,
    isOffsuit,
    rank1Val: RANK_ORDER[rank1] ?? 0,
    rank2Val: RANK_ORDER[rank2] ?? 0,
  };
}

// ──────────────────────────────────────────────
// ハンド強度分類
// ──────────────────────────────────────────────

function classifyHandStrength(hand: string): HandStrength {
  const h = parseHand(hand);

  if (h.isPair) {
    if (h.rank1Val >= 12) return 'premium';  // AA, KK, QQ
    if (h.rank1Val >= 10) return 'strong';   // JJ, TT
    if (h.rank1Val >= 7)  return 'playable'; // 99, 88, 77
    return 'marginal';                        // 66–22
  }

  const hi = Math.max(h.rank1Val, h.rank2Val);
  const lo = Math.min(h.rank1Val, h.rank2Val);
  // プレミアム
  if (hi === 14 && lo === 13) return 'premium'; // AK (s or o)

  // 強いハンド
  if (h.isSuited) {
    if (hi === 14 && lo === 12) return 'strong'; // AQs
    if (hi === 14 && lo === 11) return 'strong'; // AJs
    if (hi === 13 && lo === 12) return 'strong'; // KQs
  }
  if (!h.isSuited) {
    if (hi === 14 && lo === 12) return 'strong'; // AQo
  }

  // プレイアブル
  if (h.isSuited) {
    if (hi === 14) return 'playable';            // ATs–A2s (全てのスーテッドエース)
    if (hi === 13 && lo === 11) return 'playable'; // KJs
    if (hi === 12 && lo === 11) return 'playable'; // QJs
    if (hi === 11 && lo === 10) return 'playable'; // JTs
    if (hi === 10 && lo === 9)  return 'playable'; // T9s
  }
  if (!h.isSuited) {
    if (hi === 13 && lo === 12) return 'playable'; // KQo
    if (hi === 14 && lo === 11) return 'playable'; // AJo
    if (hi === 14 && lo === 10) return 'playable'; // ATo
  }

  // マージナル
  if (h.isSuited) {
    if (hi === 13) return 'marginal'; // K9s–K2s
    if (hi === 12) return 'marginal'; // Q9s–Q2s
    if (hi === 11 && lo === 9) return 'marginal'; // J9s
    if (hi === 10 && lo === 8) return 'marginal'; // T8s
    if (hi === 9  && lo === 8) return 'marginal'; // 98s
    if (hi === 8  && lo === 7) return 'marginal'; // 87s
    if (hi === 7  && lo === 6) return 'marginal'; // 76s
  }
  if (!h.isSuited) {
    if (hi === 13 && lo === 11) return 'marginal'; // KJo
    if (hi === 12 && lo === 11) return 'marginal'; // QJo
    if (hi === 11 && lo === 10) return 'marginal'; // JTo
  }

  // それ以外はトラッシュ
  return 'trash';
}

// ──────────────────────────────────────────────
// 説明テキスト生成ヘルパー
// ──────────────────────────────────────────────

function handCharacteristic(h: ParsedHand): string {
  if (h.isPair) {
    if (h.rank1Val >= 10) return 'オーバーペアを作りやすいポケットペアです';
    return 'セットを引けた場合に大きなポットを獲得できるポケットペアです';
  }
  if (h.isSuited) {
    const gap = Math.abs(h.rank1Val - h.rank2Val);
    if (gap <= 1) return 'フラッシュドローとストレートドローの両方を持つスーテッドコネクターです';
    if (gap <= 3) return 'フラッシュドローを持つスーテッドハンドです';
    return 'ナッツフラッシュの可能性を秘めたスーテッドハンドです';
  }
  if (!h.isSuited) {
    const gap = Math.abs(h.rank1Val - h.rank2Val);
    if (gap <= 1) return 'ストレートの可能性があるコネクターです';
    if (h.rank1Val === 14) return 'トップペアを作れるエースハイのハンドです';
    return 'ブロードウェイカードを含むハンドです';
  }
  return 'このハンドはボードの状況によって価値が変わります';
}

function buildWhyThisAction(
  action: string,
  mode: string,
  strength: HandStrength,
  h: ParsedHand,
  position: string
): string {
  const char = handCharacteristic(h);

  // ─ open ─
  if (mode === 'open') {
    if (action === 'raise' || action === 'open') {
      switch (strength) {
        case 'premium':
          return `${position}からオープンする最強クラスのハンドです。${char}。積極的にレイズしてバリューを構築しましょう。`;
        case 'strong':
          return `${position}からオープンする価値が高いハンドです。${char}。レイズしてポットを建て、良いボードでバリューを取れます。`;
        case 'playable':
          return `${position}からオープンできるハンドです。${char}。適切なポジションであればレイズでオープンする価値があります。`;
        case 'marginal':
          return `ポジション次第でオープン可能なマージナルなハンドです。${char}。レイトポジションに限りオープンを検討しましょう。`;
        default:
          return `このハンドでのオープンは基本的に推奨されません。${char}。コールドコールされた場合に不利な状況になりやすいです。`;
      }
    }
    if (action === 'fold') {
      return `${position}からはこのハンドでオープンするにはリスクが高すぎます。${char}。後ろのプレイヤーに対してドミネートされる可能性があります。`;
    }
  }

  // ─ vsOpen ─
  if (mode === 'vsOpen') {
    if (action === 'call') {
      switch (strength) {
        case 'premium':
        case 'strong':
          return `相手のオープンに対して十分なエクイティがあります。${char}。コールしてフロップのテクスチャを見ながらプレイしましょう。`;
        case 'playable':
          return `相手のオープンに対してコールする十分なエクイティがあります。${char}。ポジションがある場合は特にコールが有効です。`;
        case 'marginal':
          return `相手のオープンに対するコールはポジション次第です。${char}。ポジションがない場合はフォールドも選択肢に入ります。`;
        default:
          return `相手のオープンに対するコールは推奨されません。コールドコールはエクイティが低く、搾取されやすい状況を作ります。`;
      }
    }
    if (action === '3betValue' || (action === '3bet' && (strength === 'premium' || strength === 'strong'))) {
      return `相手のオープンに対してバリュー3ベットができるハンドです。${char}。3ベットすることでポットを大きくし、エクイティを最大化できます。`;
    }
    if (action === '3betBluff') {
      return `このハンドは3ベットブラフの候補です。${char}。ブロッカー効果やエクイティを持ちながら相手にプレッシャーをかけられます。`;
    }
    if (action === 'fold') {
      return `相手のオープンレンジに対してこのハンドはエクイティが不足しています。${char}。ドミネートされる可能性が高く、フォールドが最善です。`;
    }
    if (action === 'call' || action === 'raise') {
      return `相手のオープンに対して適切な対応を取りましょう。${char}。ポジションと相手のオープンレンジを考慮してください。`;
    }
  }

  // ─ vs3Bet ─
  if (mode === 'vs3Bet') {
    if (action === '4betValue' || action === '4bet') {
      return `相手の3ベットに対してバリュー4ベットが可能なハンドです。${char}。4ベットすることでオールインを目指すか、コールを引き出せます。`;
    }
    if (action === '4betBluff') {
      return `このハンドは4ベットブラフの候補です。${char}。ブロッカー効果を活かして相手の5ベットレンジに対してプレッシャーをかけられます。`;
    }
    if (action === 'call') {
      return `相手の3ベットに対してコールする価値があるハンドです。${char}。フロップでセットやドローを引いた場合に大きなペイオフが期待できます。`;
    }
    if (action === 'fold') {
      return `相手の3ベットレンジに対してこのハンドはエクイティが不足しています。${char}。ドミネートされるリスクが高いため、フォールドが賢明です。`;
    }
  }

  // ─ bbDefense ─
  if (mode === 'bbDefense') {
    if (action === 'call') {
      return `BBからはすでにベットしているため、このハンドでディフェンスできます。${char}。オッズが良くエクイティを活かしたコールが可能です。`;
    }
    if (action === '3betValue' || action === '3bet') {
      return `BBからバリュー3ベットが可能なハンドです。${char}。相手のオープンレンジに対してアドバンテージを持っています。`;
    }
    if (action === '3betBluff') {
      return `BBから3ベットブラフを仕掛ける候補ハンドです。${char}。ポジションが不利な分、積極的に3ベットでイニシアチブを取ることも有効です。`;
    }
    if (action === 'fold') {
      return `BBからでもこのハンドはディフェンスするには弱すぎます。${char}。コールしてもフロップで苦しい状況になりやすいため、フォールドが推奨されます。`;
    }
  }

  // ─ sbVsBb ─
  if (mode === 'sbVsBb') {
    if (action === 'raise' || action === 'open') {
      return `SBからBBに対してこのハンドでオープンできます。${char}。ヘッズアップの状況ではオープンレンジを広げられます。`;
    }
    if (action === 'call') {
      return `SBからBBのオープンに対してコールする価値があります。${char}。ポジションが不利な点を考慮しながらプレイしましょう。`;
    }
    if (action === 'fold') {
      return `SBからはポジションが不利なため、このハンドはフォールドが賢明です。${char}。BBに対してポジションを与えたままプレイするリスクがあります。`;
    }
  }

  // ─ mixed（ボーダーラインハンド）─
  if (action === 'mixed') {
    return `このハンドはボーダーラインであり、レンジの一部でプレイし一部でフォールドするのが最適です。${char}。状況に応じてフレキシブルに対応しましょう。`;
  }

  // ─ フォールバック ─
  return `${char}。ポジションと相手のレンジを考慮してアクションを決定しましょう。`;
}

function buildPositionNote(position: string, _strength: HandStrength): string {
  const pos = position.toUpperCase();

  if (pos === 'UTG' || pos === 'UTG+1' || pos === 'UTG+2') {
    return `アーリーポジションからは後ろに多くのプレイヤーが控えており、強いハンドに絞る必要があります。このポジションではタイトなレンジでプレイしましょう。`;
  }
  if (pos === 'HJ' || pos === 'MP') {
    return `ミドルポジションではアーリーよりやや広いレンジでプレイできます。ただし後ろのプレイヤーの動向には注意が必要です。`;
  }
  if (pos === 'CO') {
    return `カットオフはレイトポジションに近く、比較的広いレンジでオープンできます。BTNとBBへの対応を意識してプレイしましょう。`;
  }
  if (pos === 'BTN') {
    return `レイトポジションのボタンでは最もオープンレンジを広げられます。ポストフロップでのポジションアドバンテージを最大限に活用しましょう。`;
  }
  if (pos === 'SB') {
    return `SBはポストフロップで常にアウトオブポジションになるため、プレイするハンドを慎重に選ぶ必要があります。強いハンドには積極的に3ベットも検討しましょう。`;
  }
  if (pos === 'BB') {
    return `BBはブラインドを守る必要があるため、適切なディフェンスレンジを持つことが重要です。すでにベット済みなので相手に対してエクイティ上のアドバンテージがあります。`;
  }

  // 不明なポジション
  return `ポジションはプレイ戦略に大きく影響します。レイトポジションほどオープンレンジを広げられ、アーリーポジションほどタイトにプレイする必要があります。`;
}

function buildBeginnerWarning(
  hand: string,
  h: ParsedHand,
  action: string,
  strength: HandStrength
): string | undefined {
  // エースラグ オフスート (A + 低いランク, オフスート または スーツ不明)
  if (!h.isPair && h.isOffsuit && h.rank1Val === 14 && h.rank2Val <= 9) {
    return `Aがあるからといって安易にプレイしないでください。キッカー負けのリスクが高く、フロップでトップペアを作っても上のキッカーに負けることがあります。`;
  }

  // 小さなペアでのアーリーポジションオープン
  if (h.isPair && h.rank1Val <= 6 && (action === 'raise' || action === 'open')) {
    return `セットを引けなければフォールドする覚悟でプレイしてください。セットは平均して約8.5回に1回しか完成しないため、ポットオッズを常に意識しましょう。`;
  }

  // スーテッドトラッシュ
  if (h.isSuited && strength === 'trash') {
    return `スーテッドだからといって全てプレイ可能ではありません。フラッシュが完成する確率は低く、フラッシュを追うためのエクイティが見合わないことが多いです。`;
  }

  // KJo, QJo, JTo などドミネートされやすいブロードウェイ
  if (!h.isPair && h.isOffsuit && strength === 'marginal' &&
    h.rank1Val >= 10 && h.rank2Val >= 10) {
    return `ブロードウェイハンドですがドミネートされやすいです。AKo/AQo/KQoなどの強いハンドに対して大きく不利な状況になるため、早いポジションでは注意が必要です。`;
  }

  // 3ベットブラフ
  if (action === '3betBluff') {
    return `ブラフ3ベットは初心者には難しいアクションです。相手のフォールドエクイティと自分のエクイティを正確に計算しないと、長期的にマイナスになります。まずはバリューでの3ベットをマスターしましょう。`;
  }

  // 4ベットブラフ
  if (action === '4betBluff') {
    return `4ベットブラフは高度なテクニックです。相手のレンジ、スタックサイズ、テーブルダイナミクスを総合的に考慮する必要があります。初心者は慎重に扱いましょう。`;
  }

  return undefined;
}

// ──────────────────────────────────────────────
// メインエクスポート関数
// ──────────────────────────────────────────────

/**
 * ハンドの説明を生成する
 * @param hand     ハンド文字列 (e.g. "AKs", "77", "T9o")
 * @param action   アクション (e.g. "raise", "call", "fold", "3betValue", "3betBluff", "4betValue", "4betBluff", "mixed")
 * @param mode     シナリオ (e.g. "open", "vsOpen", "vs3Bet", "bbDefense", "sbVsBb")
 * @param position ポジション (e.g. "UTG", "BTN", "BB")
 */
export function getHandExplanation(
  hand: string,
  action: string,
  mode: string,
  position: string
): HandExplanation {
  const strengthCategory = classifyHandStrength(hand);
  const strengthLabel = STRENGTH_LABELS[strengthCategory];
  const h = parseHand(hand);

  const whyThisAction = buildWhyThisAction(action, mode, strengthCategory, h, position);
  const positionNote = buildPositionNote(position, strengthCategory);
  const beginnerWarning = buildBeginnerWarning(hand, h, action, strengthCategory);

  return {
    strengthCategory,
    strengthLabel,
    whyThisAction,
    positionNote,
    beginnerWarning,
  };
}
