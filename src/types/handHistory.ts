import type { Position } from '../types';

export type { Position };

export type HeroAction = 'raise' | 'call' | '3bet' | '4bet' | 'fold' | 'check' | 'unknown';

export type SpotType = 'open' | 'vsOpen' | 'vs3Bet' | 'bbDefense' | 'sbVsBb' | 'unknown';

export type EvaluationLabel = 'Good' | 'OK' | 'Caution' | 'Mistake' | 'Unknown';

export interface ActionEntry {
  position: Position;
  action: string;
  amount?: string;
}

export interface ParsedHand {
  heroPosition: Position | null;
  heroHand: string | null;
  heroAction: HeroAction;
  spotType: SpotType;
  openerPosition: Position | null;
  threeBetPosition: Position | null;
  actions: ActionEntry[];
}

export interface HandAnalysisResult {
  heroPosition: Position;
  heroHand: string;
  spotType: SpotType;
  heroAction: HeroAction;
  recommendedAction: string;
  evaluation: EvaluationLabel;
  evaluationJa: string;
  comment: string;
  safeModeComment: string;
  openerPosition: Position | null;
}
