import type { ReviewResult } from '../types/review';

interface Props {
  result: ReviewResult;
}

const POSITIVE_TAGS = new Set(['良いフォールド', '良いバリューベット']);

const severityConfig = {
  low: {
    containerClass: 'bg-blue-900/30 border-blue-700/40',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-800/50 border border-blue-600/50 text-blue-300',
    label: '軽微',
    dot: false,
  },
  medium: {
    containerClass: 'bg-yellow-900/30 border-yellow-700/40',
    textClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-800/50 border border-yellow-600/50 text-yellow-300',
    label: '注意',
    dot: false,
  },
  high: {
    containerClass: 'bg-red-900/30 border-red-700/40',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-800/50 border border-red-600/50 text-red-300',
    label: '重要',
    dot: true,
  },
} as const;

function tagStyle(tag: string): string {
  if (POSITIVE_TAGS.has(tag)) {
    return 'bg-green-600/20 text-green-400 border border-green-600/30';
  }
  if (
    tag.includes('ミス') ||
    tag.includes('悪い') ||
    tag.includes('過剰') ||
    tag.includes('弱い') ||
    tag.includes('エラー')
  ) {
    return 'bg-red-600/20 text-red-400 border border-red-600/30';
  }
  return 'bg-gray-600/20 text-gray-400 border border-gray-600/30';
}

export default function ReviewResultCard({ result }: Props) {
  const sev = severityConfig[result.severity];

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-5">
      {/* Severity header bar */}
      <div
        className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${sev.containerClass}`}
      >
        <div className="flex items-center gap-2.5">
          {sev.dot && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          )}
          <span
            className={`text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${sev.badgeClass}`}
          >
            {sev.label}
          </span>
        </div>
        <span className={`text-xs font-semibold tracking-wide ${sev.textClass}`}>
          AI Review
        </span>
      </div>

      {/* Summary */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <p className="text-base text-gray-200 leading-relaxed">{result.summary}</p>
      </div>

      {/* Good Points */}
      {result.goodPoints.length > 0 && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 space-y-2.5">
          <h3 className="text-sm font-semibold text-green-400 flex items-center gap-1.5">
            <span className="text-green-500">✓</span>
            良かった点
          </h3>
          <ul className="space-y-1.5">
            {result.goodPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                <span className="mt-0.5 text-green-500 font-bold shrink-0">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mistakes */}
      {result.mistakes.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 space-y-2.5">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
            <span className="text-red-500">✕</span>
            改善点
          </h3>
          <ul className="space-y-1.5">
            {result.mistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                <span className="mt-0.5 text-red-500 font-bold shrink-0">✕</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Rules */}
      {result.nextRules.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 space-y-2.5">
          <h3 className="text-sm font-semibold text-blue-400">次回のルール</h3>
          <ul className="space-y-1.5">
            {result.nextRules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                <span className="mt-0.5 text-blue-400 shrink-0">→</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opponent Note */}
      {result.opponentNote && (
        <div className="bg-gray-700/20 border border-gray-600/30 rounded-lg p-4 space-y-1.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            相手メモ
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">{result.opponentNote}</p>
        </div>
      )}

      {/* Tags */}
      {result.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.tags.map((tag, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tagStyle(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
