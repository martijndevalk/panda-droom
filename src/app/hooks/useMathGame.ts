import { useState, useCallback, useEffect } from 'react';

export type MathCategory = 'numbers' | 'plus' | 'minus' | 'multiply';

export interface MathQuestion {
  id: string;
  category: MathCategory;
  operand1: number;
  operand2?: number;
  correctAnswer: number;
  displayText: string;
}

export interface GameState {
  currentQuestion: MathQuestion | null;
  score: number;
  correctStreak: number;
  bambooGrowth: number; // 0-5, elke correcte +1
  totalAnswered: number;
  correctAnswers: number;
}

// Helper functie om random getal te genereren
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Genereer een vraag op basis van categorie
const generateQuestion = (category: MathCategory): MathQuestion => {
  const id = `${category}-${Date.now()}-${Math.random()}`;
  
  switch (category) {
    case 'numbers': {
      // Getalherkenning: toon aantal objecten, vraag het getal
      const number = randomInt(0, 100);
      return {
        id,
        category,
        operand1: number,
        correctAnswer: number,
        displayText: `Hoeveel zie je er?`,
      };
    }
    
    case 'plus': {
      // Optellen tot 20
      const num1 = randomInt(1, 15);
      const num2 = randomInt(1, 20 - num1);
      return {
        id,
        category,
        operand1: num1,
        operand2: num2,
        correctAnswer: num1 + num2,
        displayText: `${num1} + ${num2} = ?`,
      };
    }
    
    case 'minus': {
      // Aftrekken tot 20
      const num1 = randomInt(5, 20);
      const num2 = randomInt(1, num1);
      return {
        id,
        category,
        operand1: num1,
        operand2: num2,
        correctAnswer: num1 - num2,
        displayText: `${num1} - ${num2} = ?`,
      };
    }
    
    case 'multiply': {
      // Tafels 1 t/m 10
      const num1 = randomInt(1, 10);
      const num2 = randomInt(1, 10);
      return {
        id,
        category,
        operand1: num1,
        operand2: num2,
        correctAnswer: num1 * num2,
        displayText: `${num1} × ${num2} = ?`,
      };
    }
  }
};

export function useMathGame(initialCategory: MathCategory = 'plus') {
  const [category, setCategory] = useState<MathCategory>(initialCategory);
  const [gameState, setGameState] = useState<GameState>(() => ({
    currentQuestion: generateQuestion(initialCategory),
    score: 0,
    correctStreak: 0,
    bambooGrowth: 0,
    totalAnswered: 0,
    correctAnswers: 0,
  }));

  // Genereer nieuwe vraag
  const nextQuestion = useCallback(() => {
    const newQuestion = generateQuestion(category);
    setGameState((prev) => ({
      ...prev,
      currentQuestion: newQuestion,
    }));
  }, [category]);

  // Controleer antwoord
  const checkAnswer = useCallback((userAnswer: number): boolean => {
    if (!gameState.currentQuestion) return false;
    
    const isCorrect = userAnswer === gameState.currentQuestion.correctAnswer;
    
    setGameState((prev) => {
      const newCorrectStreak = isCorrect ? prev.correctStreak + 1 : 0;
      const newBambooGrowth = isCorrect 
        ? Math.min(prev.bambooGrowth + 1, 5) 
        : prev.bambooGrowth;
      
      return {
        ...prev,
        score: isCorrect ? prev.score + 10 : prev.score,
        correctStreak: newCorrectStreak,
        bambooGrowth: newBambooGrowth,
        totalAnswered: prev.totalAnswered + 1,
        correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      };
    });
    
    return isCorrect;
  }, [gameState.currentQuestion]);

  // Reset bamboo growth na beloning
  const resetBambooGrowth = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      bambooGrowth: 0,
    }));
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState({
      currentQuestion: generateQuestion(category),
      score: 0,
      correctStreak: 0,
      bambooGrowth: 0,
      totalAnswered: 0,
      correctAnswers: 0,
    });
  }, [category]);

  // Verander categorie
  const changeCategory = useCallback((newCategory: MathCategory) => {
    setCategory(newCategory);
    setGameState((prev) => ({
      ...prev,
      currentQuestion: generateQuestion(newCategory),
    }));
  }, []);

  // Check of bamboo volledig gegroeid is (beloning moment!)
  const isBambooComplete = gameState.bambooGrowth >= 5;

  return {
    gameState,
    category,
    nextQuestion,
    checkAnswer,
    resetBambooGrowth,
    resetGame,
    changeCategory,
    isBambooComplete,
  };
}
