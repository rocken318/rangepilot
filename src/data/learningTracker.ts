const STORAGE_KEY = 'rangepilot-learning-stats';
const MAX_ATTEMPTS = 500;
const DEFAULT_RECENT_N = 50;

export interface QuizAttempt {
  spotId: string;
  userChoice: string;
  correctAction: string;
  result: 'correct' | 'incorrect' | 'acceptable';
  timestamp: number;
  position: string;
  scenario: string;
  tags: string[];
}

export interface LearningStats {
  attempts: QuizAttempt[];
  streaks: { current: number; best: number };
}

const defaultStats = (): LearningStats => ({
  attempts: [],
  streaks: { current: 0, best: 0 },
});

export function loadStats(): LearningStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as LearningStats;
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      streaks: parsed.streaks ?? { current: 0, best: 0 },
    };
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: LearningStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function recordAttempt(attempt: QuizAttempt): LearningStats {
  const stats = loadStats();

  const isPositive = attempt.result === 'correct' || attempt.result === 'acceptable';
  const current = isPositive ? stats.streaks.current + 1 : 0;
  const best = Math.max(current, stats.streaks.best);

  const attempts = [...stats.attempts, attempt].slice(-MAX_ATTEMPTS);

  const updated: LearningStats = {
    attempts,
    streaks: { current, best },
  };

  saveStats(updated);
  return updated;
}

export function getWeakSpots(
  stats: LearningStats
): { spotId: string; attempts: number; errors: number; rate: number }[] {
  const map: Record<string, { attempts: number; errors: number }> = {};

  for (const a of stats.attempts) {
    if (!map[a.spotId]) map[a.spotId] = { attempts: 0, errors: 0 };
    map[a.spotId].attempts++;
    if (a.result === 'incorrect') map[a.spotId].errors++;
  }

  return Object.entries(map)
    .filter(([, v]) => v.errors >= 2)
    .map(([spotId, v]) => ({
      spotId,
      attempts: v.attempts,
      errors: v.errors,
      rate: v.errors / v.attempts,
    }))
    .sort((a, b) => b.rate - a.rate);
}

export function getStatsByPosition(
  stats: LearningStats
): Record<string, { correct: number; total: number }> {
  const result: Record<string, { correct: number; total: number }> = {};

  for (const a of stats.attempts) {
    if (!result[a.position]) result[a.position] = { correct: 0, total: 0 };
    result[a.position].total++;
    if (a.result === 'correct' || a.result === 'acceptable') result[a.position].correct++;
  }

  return result;
}

export function getStatsByScenario(
  stats: LearningStats
): Record<string, { correct: number; total: number }> {
  const result: Record<string, { correct: number; total: number }> = {};

  for (const a of stats.attempts) {
    if (!result[a.scenario]) result[a.scenario] = { correct: 0, total: 0 };
    result[a.scenario].total++;
    if (a.result === 'correct' || a.result === 'acceptable') result[a.scenario].correct++;
  }

  return result;
}

export function getStatsByTag(
  stats: LearningStats
): Record<string, { correct: number; total: number }> {
  const result: Record<string, { correct: number; total: number }> = {};

  for (const a of stats.attempts) {
    for (const tag of a.tags) {
      if (!result[tag]) result[tag] = { correct: 0, total: 0 };
      result[tag].total++;
      if (a.result === 'correct' || a.result === 'acceptable') result[tag].correct++;
    }
  }

  return result;
}

export function getRecentAccuracy(stats: LearningStats, lastN: number = DEFAULT_RECENT_N): number {
  const recent = stats.attempts.slice(-lastN);
  if (recent.length === 0) return 0;
  const correct = recent.filter(
    (a) => a.result === 'correct' || a.result === 'acceptable'
  ).length;
  return correct / recent.length;
}

export function getTodayStats(stats: LearningStats): { correct: number; total: number } {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayStart = startOfDay.getTime();

  const todayAttempts = stats.attempts.filter((a) => a.timestamp >= dayStart);
  const correct = todayAttempts.filter(
    (a) => a.result === 'correct' || a.result === 'acceptable'
  ).length;

  return { correct, total: todayAttempts.length };
}
