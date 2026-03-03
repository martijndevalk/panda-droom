export type MathProblem = {
  question: string;
  answer: number;
};

export type World = {
  id: string;
  title: string;
  description: string;
  generateSequence: () => MathProblem[];
  requiredScore: number;
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const Worlds: World[] = [
  {
    id: "world-1",
    title: "Wereld 1: Getallen",
    description: "Cijfers 0 t/m 100",
    requiredScore: 5,
    generateSequence: () => {
      // 5 questions
      return Array.from({ length: 5 }).map(() => {
        const num = randomInt(0, 100);
        return { question: `Typ het getal: ${num}`, answer: num };
      });
    }
  },
  {
    id: "world-2",
    title: "Wereld 2: Plus & Min",
    description: "Sommen tot 20",
    requiredScore: 5,
    generateSequence: () => {
      return Array.from({ length: 5 }).map(() => {
        const isPlus = Math.random() > 0.5;
        if (isPlus) {
          const a = randomInt(1, 10);
          const b = randomInt(1, 10);
          return { question: `${a} + ${b} = ?`, answer: a + b };
        } else {
          const a = randomInt(10, 20);
          const b = randomInt(1, a);
          return { question: `${a} - ${b} = ?`, answer: a - b };
        }
      });
    }
  },
  {
    id: "world-3",
    title: "Wereld 3: Tafel van 2",
    description: "Keer-sommen (x2)",
    requiredScore: 10,
    generateSequence: () => {
      return Array.from({ length: 10 }).map((_, i) => {
        const a = i + 1;
        return { question: `${a} x 2 = ?`, answer: a * 2 };
      });
    }
  },
  {
    id: "world-4",
    title: "Wereld 4: Tafel van 5 & 10",
    description: "Keer-sommen (x5, x10)",
    requiredScore: 10,
    generateSequence: () => {
      // Randomly mix 5 and 10
      return Array.from({ length: 10 }).map(() => {
        const base = Math.random() > 0.5 ? 5 : 10;
        const a = randomInt(1, 10);
        return { question: `${a} x ${base} = ?`, answer: a * base };
      });
    }
  }
];
