/**
 * Review Selector — picks review questions for both normal levels
 * and dedicated practice (Oefenplein) sessions.
 *
 * Normal level: 2–3 review questions mixed into a 10-question session.
 * Practice session: 8 questions, 100 % review.
 */

import { MathProblem, Worlds } from './GameData';
import { getWeakFacts, getDueFacts, getFactKey } from './performanceTracker';

/**
 * Build a MathProblem from a fact key like `"3×7"`.
 */
function factKeyToProblem(factKey: string): MathProblem {
  const [aStr, bStr] = factKey.split('×');
  const a = parseInt(aStr, 10);
  const b = parseInt(bStr, 10);
  return {
    question: `${a} × ${b} = ?`,
    answer: a * b,
    factors: [a, b],
    factKey,
    isReview: true,
  };
}

/**
 * Get all table numbers from worlds that the child has completed.
 * "Completed" = appears in unlockedWorlds AND is not the last unlocked
 * (the last unlocked is the one they're currently working on).
 */
function getCompletedTableNumbers(unlockedWorlds: string[], excludeTable?: number): number[] {
  const tables: number[] = [];
  for (const world of Worlds) {
    if (!unlockedWorlds.includes(world.id)) continue;
    if (excludeTable !== undefined && world.table === excludeTable) continue;
    tables.push(world.table);
  }
  return tables;
}

/**
 * Generate a random fact from the given table numbers.
 */
function randomFactFromTables(tableNumbers: number[]): MathProblem {
  const table = tableNumbers[Math.floor(Math.random() * tableNumbers.length)];
  const a = Math.floor(Math.random() * 10) + 1;
  const factKey = getFactKey(a, table);
  return factKeyToProblem(factKey);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Select 2–3 review questions to mix into a normal level session.
 *
 * @param currentTable   — the table the child is currently practicing
 * @param unlockedWorlds — all unlocked world IDs
 * @returns An array of 0–3 review MathProblems (0 if no completed tables)
 */
export function selectReviewForLevel(
  currentTable: number,
  unlockedWorlds: string[],
): MathProblem[] {
  const completedTables = getCompletedTableNumbers(unlockedWorlds, currentTable);
  if (completedTables.length === 0) return [];

  const count = completedTables.length >= 3 ? 3 : 2;
  const selected = new Set<string>();
  const result: MathProblem[] = [];

  // Priority 1: weak facts
  const weak = getWeakFacts(completedTables);
  for (const { key } of weak) {
    if (selected.size >= count) break;
    if (!selected.has(key)) {
      selected.add(key);
      result.push(factKeyToProblem(key));
    }
  }

  // Priority 2: due facts
  if (selected.size < count) {
    const due = getDueFacts(completedTables);
    for (const { key } of due) {
      if (selected.size >= count) break;
      if (!selected.has(key)) {
        selected.add(key);
        result.push(factKeyToProblem(key));
      }
    }
  }

  // Priority 3: random facts from completed tables
  let attempts = 0;
  while (selected.size < count && attempts < 20) {
    const problem = randomFactFromTables(completedTables);
    if (problem.factKey && !selected.has(problem.factKey)) {
      selected.add(problem.factKey);
      result.push(problem);
    }
    attempts++;
  }

  return result;
}

/**
 * Generate a full practice session for the Oefenplein.
 *
 * @param unlockedWorlds — all unlocked world IDs
 * @param specificTable  — optional: only practice this table
 * @param mode           — 'weak' for weak facts focus, 'mix' for all tables mix, 'table' for single table
 * @returns 8 review MathProblems
 */
export function selectPracticeSession(
  unlockedWorlds: string[],
  specificTable?: number,
  mode: 'weak' | 'mix' | 'table' = specificTable !== undefined ? 'table' : 'mix',
): MathProblem[] {
  const SESSION_SIZE = 8;
  const completedTables = specificTable !== undefined
    ? [specificTable]
    : getCompletedTableNumbers(unlockedWorlds);

  if (completedTables.length === 0) return [];

  const selected = new Set<string>();
  const result: MathProblem[] = [];

  if (mode === 'weak') {
    // Mode 'weak': Prioritize all weak facts, and if fewer than SESSION_SIZE, add due facts and random facts
    const weak = getWeakFacts(completedTables);
    for (const { key } of weak) {
      if (result.length >= SESSION_SIZE) break;
      result.push(factKeyToProblem(key));
      selected.add(key);
    }

    if (result.length < SESSION_SIZE) {
      const due = getDueFacts(completedTables);
      for (const { key } of due) {
        if (result.length >= SESSION_SIZE) break;
        if (!selected.has(key)) {
          selected.add(key);
          result.push(factKeyToProblem(key));
        }
      }
    }

    let attempts = 0;
    while (result.length < SESSION_SIZE && attempts < 40) {
      const problem = randomFactFromTables(completedTables);
      if (problem.factKey) {
        result.push(problem);
      }
      attempts++;
    }
  } else if (mode === 'mix') {
    // Mode 'mix': Balanced random mix across all completed tables
    let attempts = 0;
    while (result.length < SESSION_SIZE && attempts < 60) {
      const problem = randomFactFromTables(completedTables);
      if (problem.factKey && !selected.has(problem.factKey)) {
        selected.add(problem.factKey);
        result.push(problem);
      }
      attempts++;
    }
    // Fallback if not enough unique facts found
    while (result.length < SESSION_SIZE) {
      result.push(randomFactFromTables(completedTables));
    }
  } else {
    // Mode 'table': Specific table practice
    const weak = getWeakFacts(completedTables);
    for (const { key } of weak) {
      if (result.length >= SESSION_SIZE) break;
      if (!selected.has(key)) {
        selected.add(key);
        result.push(factKeyToProblem(key));
      }
    }

    let attempts = 0;
    while (result.length < SESSION_SIZE && attempts < 40) {
      const problem = randomFactFromTables(completedTables);
      if (problem.factKey && !selected.has(problem.factKey)) {
        selected.add(problem.factKey);
        result.push(problem);
      }
      attempts++;
    }
    while (result.length < SESSION_SIZE) {
      result.push(randomFactFromTables(completedTables));
    }
  }

  // Shuffle (Fisher-Yates)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.slice(0, SESSION_SIZE);
}

/**
 * Mix review questions into a normal level sequence at spread-out positions.
 *
 * Inserts reviews at positions 3, 6, and optionally 8 (0-indexed)
 * to spread them evenly through the session.
 */
export function mixReviewIntoSequence(
  sequence: MathProblem[],
  reviewQuestions: MathProblem[],
): MathProblem[] {
  if (reviewQuestions.length === 0) return sequence;

  const result = [...sequence];
  const insertPositions = [3, 6, 8]; // 0-indexed positions

  for (let i = 0; i < reviewQuestions.length && i < insertPositions.length; i++) {
    const pos = Math.min(insertPositions[i], result.length);
    result.splice(pos, 0, reviewQuestions[i]);
  }

  return result;
}
