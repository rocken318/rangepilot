export interface OpponentStats {
  name: string;
  vpip: string;
  pfr: string;
  threeBet: string;
  foldToThreeBet: string;
  cbet: string;
  foldToCbet: string;
  steal: string;
  checkRaise: string;
  wtsd: string;
  wsd: string;
}

export interface ReviewInput {
  heroHand: string;
  heroPosition: string;
  blinds: string;
  effectiveStack: string;
  preflopAction: string;
  flopAction: string;
  turnAction: string;
  riverAction: string;
  opponent: OpponentStats;
  heroDecision: string;
  result: string;
  memo: string;
}

export interface ReviewResult {
  summary: string;
  goodPoints: string[];
  mistakes: string[];
  nextRules: string[];
  opponentNote: string;
  tags: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface WeaknessEntry {
  tag: string;
  count: number;
  lastSeen: number;
  firstSeen: number;
}

export interface ReviewHistoryItem {
  id: string;
  input: ReviewInput;
  result: ReviewResult;
  timestamp: number;
}
