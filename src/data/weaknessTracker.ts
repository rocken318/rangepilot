import type { WeaknessEntry, ReviewHistoryItem, ReviewResult } from '../types/review';

const WEAKNESS_KEY = 'rangepilot-weakness-tags';
const REVIEW_HISTORY_KEY = 'rangepilot-review-history';

// ── Weakness Tags ────────────────────────────────────────────────────────

export function loadWeaknesses(): WeaknessEntry[] {
  try {
    const raw = localStorage.getItem(WEAKNESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWeaknesses(entries: WeaknessEntry[]): void {
  localStorage.setItem(WEAKNESS_KEY, JSON.stringify(entries));
}

export function recordTags(tags: string[]): WeaknessEntry[] {
  const entries = loadWeaknesses();
  const now = Date.now();

  for (const tag of tags) {
    const existing = entries.find(e => e.tag === tag);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = now;
    } else {
      entries.push({ tag, count: 1, lastSeen: now, firstSeen: now });
    }
  }

  saveWeaknesses(entries);
  return entries;
}

/** Top N tags by count */
export function getTopTags(entries: WeaknessEntry[], n = 10): WeaknessEntry[] {
  return [...entries].sort((a, b) => b.count - a.count).slice(0, n);
}

/** Tags seen this week (last 7 days) */
export function getThisWeekTags(entries: WeaknessEntry[]): WeaknessEntry[] {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return entries.filter(e => e.lastSeen >= weekAgo);
}

/** Top 3 mistakes this week */
export function getTopMistakesThisWeek(entries: WeaknessEntry[]): WeaknessEntry[] {
  const POSITIVE_TAGS = new Set(['良いフォールド', '良いバリューベット']);
  const weekTags = getThisWeekTags(entries).filter(e => !POSITIVE_TAGS.has(e.tag));
  return weekTags.sort((a, b) => b.count - a.count).slice(0, 3);
}

/** Tags that are improving (seen less recently, high total count) */
export function getImprovingTags(entries: WeaknessEntry[]): WeaknessEntry[] {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return entries
    .filter(e => e.count >= 2 && e.lastSeen < weekAgo)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

/** Suggest today's practice theme based on most frequent recent tags */
export function getTodayTheme(entries: WeaknessEntry[]): string {
  const weekTags = getThisWeekTags(entries);
  if (weekTags.length === 0) return 'まだデータがありません。ハンドレビューを始めましょう！';

  const POSITIVE_TAGS = new Set(['良いフォールド', '良いバリューベット']);
  const mistakes = weekTags.filter(e => !POSITIVE_TAGS.has(e.tag));
  if (mistakes.length === 0) return '今週はミスが少ないです。この調子で続けましょう！';

  const top = mistakes.sort((a, b) => b.count - a.count)[0];
  return `今日の練習テーマ: 「${top.tag}」を意識してプレイしましょう`;
}

// ── Review History ───────────────────────────────────────────────────────

export function loadReviewHistory(): ReviewHistoryItem[] {
  try {
    const raw = localStorage.getItem(REVIEW_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReviewHistory(items: ReviewHistoryItem[]): void {
  // Keep last 100 reviews
  const trimmed = items.slice(-100);
  localStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(trimmed));
}

export function addReviewToHistory(
  input: ReviewHistoryItem['input'],
  result: ReviewResult,
): ReviewHistoryItem {
  const history = loadReviewHistory();
  const item: ReviewHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    input,
    result,
    timestamp: Date.now(),
  };
  history.push(item);
  saveReviewHistory(history);
  return item;
}
