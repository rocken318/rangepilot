import { useState } from 'react';
import {
  loadStats,
  getWeakSpots,
  getStatsByPosition,
  getStatsByScenario,
  getStatsByTag,
  getRecentAccuracy,
  getTodayStats,
  saveStats,
} from '../data/learningTracker';
import type { LearningStats } from '../data/learningTracker';

const SCENARIO_LABELS: Record<string, string> = {
  open: 'オープン',
  vsOpen: 'vsオープン',
  vs3Bet: 'vs3ベット',
  bbDefense: 'BBディフェンス',
  sbVsBb: 'SBvsBB',
};

function getBarColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

interface BreakdownRowProps {
  label: string;
  correct: number;
  total: number;
}

function BreakdownRow({ label, correct, total }: BreakdownRowProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const barColor = getBarColor(pct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-400 tabular-nums">
          {correct}/{total}
          <span className="ml-2 text-white font-semibold">{pct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

export default function LearningTrackerView() {
  const [stats, setStats] = useState<LearningStats>(() => loadStats());

  const recentAccuracy = getRecentAccuracy(stats);
  const todayStats = getTodayStats(stats);
  const positionStats = getStatsByPosition(stats);
  const scenarioStats = getStatsByScenario(stats);
  const tagStats = getStatsByTag(stats);
  const weakSpots = getWeakSpots(stats);

  const topTags = Object.entries(tagStats)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const topWeakSpots = weakSpots.slice(0, 10);

  const handleReset = () => {
    if (window.confirm('学習データをリセットしますか？')) {
      const empty: LearningStats = { attempts: [], streaks: { current: 0, best: 0 } };
      saveStats(empty);
      setStats(loadStats());
    }
  };

  const hasData = stats.attempts.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">学習トラッカー</h2>
        {hasData && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-400">総問題数 </span>
            <span className="text-sm font-bold text-white">{stats.attempts.length}</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-300 text-base leading-relaxed">
            まだテストを受けていません。スポットテストでクイズに挑戦してみましょう！
          </p>
        </div>
      )}

      {/* Overall Stats Card */}
      {hasData && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">総合成績</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-900 rounded-lg p-3 space-y-1">
              <div className="text-xs text-gray-500">総問題数</div>
              <div className="text-xl font-bold text-white">{stats.attempts.length}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 space-y-1">
              <div className="text-xs text-gray-500">直近50問正答率</div>
              <div className="text-xl font-bold text-white">
                {Math.round(recentAccuracy * 100)}%
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 space-y-1">
              <div className="text-xs text-gray-500">連続正解</div>
              <div className="text-xl font-bold text-emerald-400">{stats.streaks.current}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 space-y-1">
              <div className="text-xs text-gray-500">最高記録</div>
              <div className="text-xl font-bold text-yellow-400">{stats.streaks.best}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 space-y-1">
              <div className="text-xs text-gray-500">今日</div>
              <div className="text-xl font-bold text-white">
                {todayStats.correct}
                <span className="text-sm font-normal text-gray-500"> / {todayStats.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position Breakdown */}
      {hasData && Object.keys(positionStats).length > 0 && (
        <SectionCard title="ポジション別正答率">
          <div className="space-y-3">
            {Object.entries(positionStats)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([position, { correct, total }]) => (
                <BreakdownRow
                  key={position}
                  label={position}
                  correct={correct}
                  total={total}
                />
              ))}
          </div>
        </SectionCard>
      )}

      {/* Scenario Breakdown */}
      {hasData && Object.keys(scenarioStats).length > 0 && (
        <SectionCard title="シナリオ別正答率">
          <div className="space-y-3">
            {Object.entries(scenarioStats)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([scenario, { correct, total }]) => (
                <BreakdownRow
                  key={scenario}
                  label={SCENARIO_LABELS[scenario] ?? scenario}
                  correct={correct}
                  total={total}
                />
              ))}
          </div>
        </SectionCard>
      )}

      {/* Tag Breakdown */}
      {hasData && topTags.length > 0 && (
        <SectionCard title="カテゴリ別正答率">
          <div className="space-y-3">
            {topTags.map(([tag, { correct, total }]) => (
              <BreakdownRow key={tag} label={tag} correct={correct} total={total} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Weak Spots */}
      {hasData && (
        <SectionCard title="苦手なスポット">
          {topWeakSpots.length === 0 ? (
            <p className="text-gray-400 text-sm">
              まだ苦手なスポットはありません。テストを続けてください！
            </p>
          ) : (
            <div className="space-y-2">
              {topWeakSpots.map((spot) => (
                <div
                  key={spot.spotId}
                  className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3"
                >
                  <span className="text-gray-200 font-mono text-sm">{spot.spotId}</span>
                  <div className="flex items-center gap-4 text-sm tabular-nums">
                    <span className="text-gray-500">
                      {spot.attempts}問
                    </span>
                    <span className="text-red-400 font-semibold">
                      ミス {spot.errors}回
                    </span>
                    <span className="text-red-300 font-bold">
                      {Math.round(spot.rate * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Reset Button */}
      {hasData && (
        <div className="flex justify-end pb-4">
          <button
            onClick={handleReset}
            className="bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-600/30 transition-colors"
          >
            学習データをリセット
          </button>
        </div>
      )}
    </div>
  );
}
