import { useState } from 'react';
import type { Position, Mode } from '../types';
import { getPositionGuide } from '../data/positionGuides';
import type { PositionGuide, DecisionFlow } from '../data/positionGuides';
import HandLookup from './HandLookup';

interface Props {
  onNavigate: (mode: Mode, position: Position, openerPosition?: Position) => void;
}

const POSITIONS: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// The first earlier position to use as openerPosition for vsOpen navigation
const VS_OPEN_OPENER: Partial<Record<Position, Position>> = {
  HJ: 'UTG',
  CO: 'UTG',
  BTN: 'UTG',
  SB: 'UTG',
  BB: 'UTG',
};

export default function PositionGuideView({ onNavigate }: Props) {
  const [selected, setSelected] = useState<Position>('BTN');
  const guide: PositionGuide = getPositionGuide(selected);

  return (
    <div className="max-w-2xl mx-auto px-2 py-4 space-y-4">
      {/* Position selector */}
      <div className="flex flex-wrap gap-2">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setSelected(pos)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              selected === pos
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Guide card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-4">
        {/* Title */}
        <h2 className="text-xl font-bold text-white">
          {/* positionGuides.ts uses 'title' field */}
          {(guide as PositionGuide & { title: string }).title}
        </h2>

        {/* Navigation shortcuts */}
        <div className="flex flex-wrap gap-2">
          {selected !== 'BB' && (
            <button
              onClick={() => onNavigate('open', selected)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md transition-colors"
            >
              → オープンレンジを見る
            </button>
          )}
          {selected !== 'UTG' && (
            <button
              onClick={() =>
                onNavigate(
                  'vsOpen',
                  selected,
                  VS_OPEN_OPENER[selected]
                )
              }
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md transition-colors"
            >
              → vs Openを見る
            </button>
          )}
          {selected !== 'BB' && (
            <button
              onClick={() => onNavigate('vs3Bet', selected)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md transition-colors"
            >
              → vs 3Betを見る
            </button>
          )}
        </div>

        {/* Hand lookup */}
        <HandLookup position={selected} onNavigate={onNavigate} />

        {/* 要点まとめ */}
        {guide.keyPoints?.length > 0 && (
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">★</span>
              要点まとめ
            </h3>
            <ul className="space-y-2">
              {guide.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-indigo-400 font-bold text-sm mt-0.5 shrink-0">{i + 1}.</span>
                  <span className="text-base text-gray-200 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 判断フロー */}
        {guide.decisionFlows?.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">▶</span>
              判断フロー
            </h3>
            {guide.decisionFlows.map((flow: DecisionFlow, fi: number) => (
              <div key={fi} className="bg-gray-800/60 border border-gray-600/50 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-cyan-300">{flow.title}</h4>
                <div className="space-y-1">
                  {flow.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-2">
                      <div className="flex flex-col items-center shrink-0 mt-1">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          si === 0 ? 'bg-cyan-500 border-cyan-400' :
                          si === flow.steps.length - 1 ? 'bg-gray-500 border-gray-400' :
                          'bg-gray-700 border-gray-500'
                        }`} />
                        {si < flow.steps.length - 1 && (
                          <div className="w-0.5 h-4 bg-gray-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed pb-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {/* ポジションの特徴 */}
          <SectionCard
            title="ポジションの特徴"
            borderColor="border-gray-500"
          >
            <p className="text-sm text-gray-300 leading-relaxed">{guide.feature}</p>
          </SectionCard>

          {/* 基本方針 */}
          <SectionCard
            title="基本方針"
            borderColor="border-gray-500"
          >
            <p className="text-sm text-gray-300 leading-relaxed">{guide.basicPlan}</p>
          </SectionCard>

          {/* オープンレンジの考え方 */}
          <SectionCard
            title="オープンレンジの考え方"
            borderColor="border-gray-500"
          >
            <p className="text-sm text-gray-300 leading-relaxed">{guide.openStrategy}</p>
          </SectionCard>

          {/* 前にレイズが入った時の対応 */}
          <SectionCard
            title="前にレイズが入った時の対応"
            borderColor="border-gray-500"
          >
            <p className="text-sm text-gray-300 leading-relaxed">{guide.vsOpenStrategy}</p>
          </SectionCard>

          {/* 3ベットされた時の対応 */}
          <SectionCard
            title="3ベットされた時の対応"
            borderColor="border-gray-500"
          >
            <p className="text-sm text-gray-300 leading-relaxed">{guide.vs3BetStrategy}</p>
          </SectionCard>

          {/* ポストフロップでの立ち回り */}
          <SectionCard
            title="ポストフロップでの立ち回り"
            borderColor="border-gray-500"
          >
            <p className="text-sm text-gray-300 leading-relaxed">{guide.postflopPlan}</p>
          </SectionCard>

          {/* よくあるミス */}
          <div className="bg-amber-900/20 border border-amber-600/40 rounded-lg p-3 space-y-2">
            <h3 className="text-sm font-bold text-white border-l-2 border-amber-500 pl-2">
              よくあるミス
            </h3>
            <ul className="space-y-1 pl-3">
              {guide.commonMistakes.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 初心者向け安全ルール */}
          <div className="bg-amber-900/20 border border-amber-600/40 rounded-lg p-3 space-y-2">
            <h3 className="text-sm font-bold text-white border-l-2 border-amber-500 pl-2 flex items-center gap-1">
              <span>🛡</span>
              <span>初心者向け安全ルール</span>
            </h3>
            <ul className="space-y-1 pl-3">
              {guide.safeRules.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 攻めていい場面 */}
          <div className="bg-green-900/20 border border-green-600/40 rounded-lg p-3 space-y-2">
            <h3 className="text-sm font-bold text-white border-l-2 border-green-500 pl-2">
              攻めていい場面
            </h3>
            <ul className="space-y-1 pl-3">
              {guide.attackSpots.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-green-400 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 降りるべき場面 */}
          <div className="bg-red-900/20 border border-red-600/40 rounded-lg p-3 space-y-2">
            <h3 className="text-sm font-bold text-white border-l-2 border-red-500 pl-2">
              降りるべき場面
            </h3>
            <ul className="space-y-1 pl-3">
              {guide.foldSpots.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-red-400 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 相手タイプ別調整 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-3">
            <h3 className="text-sm font-bold text-white border-l-2 border-blue-500 pl-2">
              相手タイプ別調整
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <OpponentCard
                label="タイトな相手"
                text={guide.opponentAdjustments.tight}
              />
              <OpponentCard
                label="コーリングステーション"
                text={guide.opponentAdjustments.callingStation}
              />
              <OpponentCard
                label="ルースアグレッシブ"
                text={guide.opponentAdjustments.lag}
              />
              <OpponentCard
                label="3ベットが多い相手"
                text={guide.opponentAdjustments.threeBetHeavy}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  borderColor: string;
  children: React.ReactNode;
}

function SectionCard({ title, borderColor, children }: SectionCardProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
      <h3 className={`text-sm font-bold text-white border-l-2 ${borderColor} pl-2`}>
        {title}
      </h3>
      {children}
    </div>
  );
}

interface OpponentCardProps {
  label: string;
  text: string;
}

function OpponentCard({ label, text }: OpponentCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 space-y-1">
      <p className="text-xs font-bold text-gray-300">{label}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
    </div>
  );
}
