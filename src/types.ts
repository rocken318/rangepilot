export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export type Mode =
  | 'open'
  | 'vsOpen'
  | 'vs3Bet'
  | 'bbDefense'
  | 'sbVsBb'
  | 'villainType'
  | 'memo'
  | 'spotTest'
  | 'positionGuide'
  | 'postflopGuide'
  | 'glossary'
  | 'learningTracker';

export type RangeWidth = 'ultraTight' | 'tight' | 'standard' | 'loose' | 'ultraLoose';

export type VillainType = 'standard' | 'tight' | 'lag' | 'callingStation' | 'aggressive3bet';

export type OpenAction = 'raise' | 'mixed' | 'fold';

export type VsOpenAction = '3betValue' | '3betBluff' | 'call' | 'mixed' | 'fold';

export type Vs3BetAction = '4betValue' | '4betBluff' | 'call' | 'mixed' | 'fold';

export type BbDefenseAction = '3bet' | 'call' | 'mixed' | 'fold';

export type Action = OpenAction | VsOpenAction | Vs3BetAction | BbDefenseAction;

export interface HandEntry {
  hand: string;
  action: Action;
  note?: string;
  /** 通常モードでのアクション（安全寄りモード時に差分表示用） */
  normalAction?: Action;
}

export interface ScenarioRange {
  [hand: string]: HandEntry;
}

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

export const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

export const MODE_LABELS: Record<Mode, string> = {
  open: 'オープンレンジ',
  vsOpen: 'vs オープンレイズ',
  vs3Bet: 'vs 3ベット',
  bbDefense: 'BBディフェンス',
  sbVsBb: 'SB vs BB',
  villainType: '相手タイプ別調整',
  memo: 'メモ',
  spotTest: 'スポットテスト',
  positionGuide: 'ポジション別ガイド',
  postflopGuide: 'ポストフロップ基礎',
  glossary: '用語集',
  learningTracker: '学習トラッカー',
};

export const RANGE_WIDTH_LABELS: Record<RangeWidth, string> = {
  ultraTight: '超狭め',
  tight: '狭め',
  standard: '標準',
  loose: '広め',
  ultraLoose: '超広め',
};

export const VILLAIN_TYPE_LABELS: Record<VillainType, string> = {
  standard: '標準',
  tight: 'タイト',
  lag: 'ルースアグレッシブ',
  callingStation: 'コーリングステーション',
  aggressive3bet: '3ベットが多い相手',
};

export function getHandName(row: number, col: number): string {
  const r1 = RANKS[row];
  const r2 = RANKS[col];
  if (row === col) return `${r1}${r2}`;
  if (row < col) return `${r1}${r2}s`;
  return `${r2}${r1}o`;
}

export function getHandType(row: number, col: number): 'pair' | 'suited' | 'offsuit' {
  if (row === col) return 'pair';
  if (row < col) return 'suited';
  return 'offsuit';
}
