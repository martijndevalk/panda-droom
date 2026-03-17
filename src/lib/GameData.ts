export type MathProblem = {
  question: string;
  answer: number;
  /** The two factors, used for visual hints (e.g. [3, 4] for "3 x 4") */
  factors?: [number, number];
  /** Stable key for performance tracking, e.g. "3×7" */
  factKey?: string;
  /** Whether this question is a review from a previously completed table */
  isReview?: boolean;
};

export type World = {
  id: string;
  title: string;
  description: string;
  /** The multiplication table number (1–10) */
  table: number;
  generateSequence: () => MathProblem[];
  requiredScore: number;
  /** Whether this world has a C-P-A intro (first-time drag-and-drop) */
  hasIntro: boolean;
};

/** Max questions per session to keep sessions short and stress-free. */
export const MAX_QUESTIONS_PER_SESSION = 10;

/**
 * Optimal table order for children with learning difficulties.
 * Starts with the easiest/most-pattern-based tables, progresses to harder ones.
 */
const TABLE_ORDER = [1, 10, 2, 5, 4, 3, 6, 7, 8, 9];

function createTableWorld(table: number, index: number): World {
  return {
    id: `table-${table}`,
    title: `Tafel van ${table}`,
    description: `${table} x 1 t/m ${table} x 10`,
    table,
    requiredScore: MAX_QUESTIONS_PER_SESSION,
    hasIntro: true,
    generateSequence: () => {
      // Generate all 10 facts for this table, shuffled
      const problems: MathProblem[] = Array.from({ length: 10 }, (_, i) => {
        const a = i + 1;
        return {
          question: `${a} × ${table} = ?`,
          answer: a * table,
          factors: [a, table] as [number, number],
          factKey: `${a}×${table}`,
        };
      });

      // Fisher-Yates shuffle
      for (let i = problems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [problems[i], problems[j]] = [problems[j], problems[i]];
      }

      return problems.slice(0, MAX_QUESTIONS_PER_SESSION);
    },
  };
}

export const Worlds: World[] = TABLE_ORDER.map((table, index) =>
  createTableWorld(table, index)
);
