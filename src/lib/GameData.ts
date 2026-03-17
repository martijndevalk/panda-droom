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
 * Each world has a themed name and emoji for the adventure map.
 */
const WORLD_THEMES: { table: number; emoji: string; name: string }[] = [
  { table: 1,  emoji: '🏝️', name: 'Bamboe Baai' },
  { table: 10, emoji: '🐊', name: 'Croco Creek' },
  { table: 2,  emoji: '🌿', name: 'Junglepad' },
  { table: 5,  emoji: '🍌', name: 'Bananenbrug' },
  { table: 4,  emoji: '🏛️', name: 'Ruïnevallei' },
  { table: 3,  emoji: '💎', name: 'Kristallengrot' },
  { table: 6,  emoji: '🌋', name: 'Lavastroom' },
  { table: 7,  emoji: '🌬️', name: 'Winderige Piek' },
  { table: 8,  emoji: '⛰️', name: 'Donderdal' },
  { table: 9,  emoji: '🏰', name: 'Vulkaan Fortress' },
];

function createTableWorld(theme: typeof WORLD_THEMES[number]): World {
  const { table, emoji, name } = theme;
  return {
    id: `table-${table}`,
    title: `${emoji} ${name}`,
    description: `Tafel van ${table}`,
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

export const Worlds: World[] = WORLD_THEMES.map(createTableWorld);
