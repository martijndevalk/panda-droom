/**
 * Performance Tracker — tracks per-fact accuracy and spaced repetition data.
 *
 * Persists all data in localStorage under `panda-droom-performance`.
 * Uses a simple spaced repetition model: correct answers increase the
 * streak and double the review interval; wrong answers reset the streak
 * and make the fact immediately due for review.
 */

const STORAGE_KEY = 'panda-droom-performance';

export type FactRecord = {
  /** Total number of correct answers. */
  correct: number;
  /** Total number of wrong answers. */
  wrong: number;
  /** Current consecutive-correct streak. */
  streak: number;
  /** Timestamp (ms) of the last attempt. */
  lastSeen: number;
  /** Timestamp (ms) of the last correct answer. */
  lastCorrect: number;
};

type PerformanceData = {
  facts: Record<string, FactRecord>;
  leaves: number;
  totalReviewSessions: number;
  longestStreak: number;
};

function getDefaultData(): PerformanceData {
  return { facts: {}, leaves: 0, totalReviewSessions: 0, longestStreak: 0 };
}

function load(): PerformanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...getDefaultData(), ...JSON.parse(raw) };
  } catch { /* corrupted — start fresh */ }
  return getDefaultData();
}

function save(data: PerformanceData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Build a stable key for a multiplication fact, e.g. `"3×7"`. */
export function getFactKey(a: number, b: number): string {
  return `${a}×${b}`;
}

/** Record a correct or wrong answer for a given fact. */
export function recordAnswer(factKey: string, isCorrect: boolean): void {
  const data = load();
  const prev: FactRecord = data.facts[factKey] ?? {
    correct: 0,
    wrong: 0,
    streak: 0,
    lastSeen: 0,
    lastCorrect: 0,
  };

  const now = Date.now();

  if (isCorrect) {
    prev.correct++;
    prev.streak++;
    prev.lastCorrect = now;
  } else {
    prev.wrong++;
    prev.streak = 0;
  }
  prev.lastSeen = now;

  // Track global longest streak
  if (prev.streak > data.longestStreak) {
    data.longestStreak = prev.streak;
  }

  data.facts[factKey] = prev;
  save(data);
}

/** Get all fact records. */
export function getFactRecords(): Record<string, FactRecord> {
  return load().facts;
}

/**
 * Get facts that the child finds difficult.
 *
 * A fact is "weak" when:
 * - streak < 2 AND the child has attempted it at least once
 * - OR wrong > correct
 *
 * @param tableNumbers — only consider facts from these tables (e.g. [1, 10, 2])
 */
export function getWeakFacts(tableNumbers: number[]): { key: string; record: FactRecord }[] {
  const records = load().facts;
  const results: { key: string; record: FactRecord }[] = [];

  for (const [key, record] of Object.entries(records)) {
    // Check if this fact belongs to one of the requested tables
    if (!isFactInTables(key, tableNumbers)) continue;

    const attempted = record.correct + record.wrong > 0;
    if (attempted && (record.streak < 2 || record.wrong > record.correct)) {
      results.push({ key, record });
    }
  }

  // Sort by weakness: lowest streak first, then most wrong
  return results.sort((a, b) => a.record.streak - b.record.streak || b.record.wrong - a.record.wrong);
}

/**
 * Get facts that are "due" for review based on spaced repetition intervals.
 *
 * Interval = baseInterval × 2^streak (capped).
 * - streak 0 → 0 (immediately due)
 * - streak 1 → 1 day
 * - streak 2 → 2 days
 * - streak 3 → 4 days
 * - streak 4+ → 8 days (cap)
 */
export function getDueFacts(tableNumbers: number[]): { key: string; record: FactRecord }[] {
  const records = load().facts;
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const results: { key: string; record: FactRecord }[] = [];

  for (const [key, record] of Object.entries(records)) {
    if (!isFactInTables(key, tableNumbers)) continue;
    if (record.correct === 0 && record.wrong === 0) continue;

    const interval = Math.min(Math.pow(2, record.streak), 8) * ONE_DAY;
    const timeSinceLastCorrect = now - (record.lastCorrect || record.lastSeen);

    if (timeSinceLastCorrect >= interval) {
      results.push({ key, record });
    }
  }

  // Sort by most overdue first
  return results.sort((a, b) => {
    const aOverdue = now - (a.record.lastCorrect || a.record.lastSeen);
    const bOverdue = now - (b.record.lastCorrect || b.record.lastSeen);
    return bOverdue - aOverdue;
  });
}

// ---------------------------------------------------------------------------
// Leaves (bamboe-blaadjes)
// ---------------------------------------------------------------------------

export function getLeafCount(): number {
  return load().leaves;
}

export function addLeaves(n: number): number {
  const data = load();
  data.leaves += n;
  save(data);
  return data.leaves;
}

// ---------------------------------------------------------------------------
// Review session tracking
// ---------------------------------------------------------------------------

export function recordReviewSession(): void {
  const data = load();
  data.totalReviewSessions++;
  save(data);
}

export function getStats(): { leaves: number; totalReviewSessions: number; longestStreak: number } {
  const data = load();
  return {
    leaves: data.leaves,
    totalReviewSessions: data.totalReviewSessions,
    longestStreak: data.longestStreak,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Check if a fact key like `"3×7"` belongs to one of the given tables.
 * A fact `a×b` belongs to table `b`.
 */
function isFactInTables(factKey: string, tableNumbers: number[]): boolean {
  const parts = factKey.split('×');
  if (parts.length !== 2) return false;
  const b = parseInt(parts[1], 10);
  return tableNumbers.includes(b);
}
