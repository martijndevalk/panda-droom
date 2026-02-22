import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PandaCoach } from './components/PandaCoach';
import { Numpad } from './components/Numpad';
import { BambooGrowth } from './components/BambooGrowth';
import { CategorySelector } from './components/CategorySelector';
import { VisualMathDisplay } from './components/VisualMathDisplay';
import { FeedbackAnimation, SlideInContainer, SuccessParticles, Pulse } from './components/AnimationWrappers';
import { useMathGame } from './hooks/useMathGame';
import confetti from 'canvas-confetti';

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [pandaEmotion, setPandaEmotion] = useState<'happy' | 'neutral' | 'encouraging' | 'celebrating' | 'thinking'>('happy');
  const [pandaText, setPandaText] = useState('Kies een oefening om te beginnen! 🐼');
  const [showCategorySelector, setShowCategorySelector] = useState(true);
  const [feedbackState, setFeedbackState] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');
  const [showShake, setShowShake] = useState(false);
  const [showSuccessParticles, setShowSuccessParticles] = useState(false);

  const { 
    gameState, 
    category,
    nextQuestion, 
    checkAnswer, 
    resetBambooGrowth,
    changeCategory,
    isBambooComplete 
  } = useMathGame('plus');

  // Trigger confetti wanneer bamboo compleet is
  useEffect(() => {
    if (isBambooComplete) {
      // Extra groot confetti effect voor de mijlpaal!
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#b8f3d8', '#fef6c7', '#cfe8fc', '#e9d5ff', '#fed7aa'],
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#b8f3d8', '#fef6c7', '#cfe8fc', '#e9d5ff', '#fed7aa'],
        });
      }, 100);
      
      setPandaEmotion('celebrating');
      setPandaText('🎉 Geweldig! Je hebt 5 goede antwoorden! 🎉');
      
      // Reset na 3 seconden
      setTimeout(() => {
        resetBambooGrowth();
        nextQuestion();
        setPandaEmotion('happy');
        setPandaText('Laten we doorgaan!');
        setInputValue('');
      }, 3000);
    }
  }, [isBambooComplete, resetBambooGrowth, nextQuestion]);

  const handleNumberClick = (num: number) => {
    if (isBambooComplete) return; // Blokkeer input tijdens viering
    setInputValue((prev) => prev + num);
    setPandaEmotion('thinking');
    setPandaText('Typ het antwoord...');
  };

  const handleBackspace = () => {
    if (isBambooComplete) return;
    setInputValue((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!inputValue || isBambooComplete) return;
    
    const userAnswer = parseInt(inputValue);
    const isCorrect = checkAnswer(userAnswer);
    
    if (isCorrect) {
      setFeedbackState('correct');
      setShowSuccessParticles(true);
      setPandaEmotion('happy');
      
      // Varieer de positieve feedback
      const successMessages = [
        'Yes! Dat is goed! 🎉',
        'Perfect! Super gedaan! ⭐',
        'Geweldig! Je bent een ster! 🌟',
        'Fantastisch! Dat klopt! 🎊',
        'Top! Helemaal goed! 💪',
      ];
      setPandaText(successMessages[Math.floor(Math.random() * successMessages.length)]);
      
      // Na 1.5 seconden, volgende vraag
      setTimeout(() => {
        setShowSuccessParticles(false);
        if (!isBambooComplete) {
          nextQuestion();
          setInputValue('');
          setFeedbackState('neutral');
          setPandaEmotion('neutral');
          setPandaText('Probeer deze! 💪');
        }
      }, 1500);
    } else {
      setFeedbackState('incorrect');
      setShowShake(true);
      setPandaEmotion('encouraging');
      
      // Varieer de aanmoedigende feedback
      const encouragementMessages = [
        'Bijna goed! Probeer het nog eens! 💪',
        'Oeps! Probeer nog een keer! Je kunt het! 😊',
        'Niet helemaal! Probeer opnieuw! 🐼',
        'Bijna! Kijk nog eens goed! 👀',
        'Hmm, probeer het nog eens! Jij kunt het! 💚',
      ];
      setPandaText(encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]);
      
      setInputValue('');
      
      // Reset shake animatie
      setTimeout(() => {
        setShowShake(false);
        setFeedbackState('neutral');
      }, 600);
    }
  };

  const handleCategorySelect = (newCategory: typeof category) => {
    changeCategory(newCategory);
    setShowCategorySelector(false);
    setPandaEmotion('happy');
    setPandaText('Super! Laten we beginnen!');
    setInputValue('');
  };

  const handleBackToCategories = () => {
    setShowCategorySelector(true);
    setPandaEmotion('neutral');
    setPandaText('Kies een oefening!');
    setInputValue('');
  };

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isBambooComplete) return;
    
    if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(parseInt(e.key));
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Layout>
      <div 
        className="flex-1 flex flex-col items-center justify-start md:justify-center gap-6 p-4 md:p-8 overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Score en terug knop */}
        {!showCategorySelector && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button
              onClick={handleBackToCategories}
              className="bg-white rounded-2xl px-4 py-2 shadow-md hover:shadow-lg transition-shadow text-sm"
            >
              ← Terug
            </button>
            <div className="bg-white rounded-2xl px-6 py-2 shadow-md">
              <span className="text-lg font-medium">Score: {gameState.score}</span>
            </div>
          </div>
        )}

        <PandaCoach 
          emotion={pandaEmotion} 
          text={pandaText}
        />

        {showCategorySelector ? (
          <CategorySelector 
            currentCategory={category}
            onSelectCategory={handleCategorySelect}
          />
        ) : (
          <>
            {/* Bamboo Growth Indicator */}
            <SlideInContainer delay={0.1}>
              <BambooGrowth growth={gameState.bambooGrowth} />
            </SlideInContainer>

            {/* Visuele weergave van de som */}
            {gameState.currentQuestion && (
              <SlideInContainer key={gameState.currentQuestion.id} delay={0.2}>
                <VisualMathDisplay question={gameState.currentQuestion} />
              </SlideInContainer>
            )}

            {/* Huidige vraag tekst */}
            {gameState.currentQuestion && (
              <SlideInContainer delay={0.3}>
                <div className="bg-accent rounded-3xl px-8 py-4 shadow-xl">
                  <p className="text-3xl md:text-4xl text-center font-medium text-foreground">
                    {gameState.currentQuestion.displayText}
                  </p>
                </div>
              </SlideInContainer>
            )}

            {/* Input display met feedback animatie */}
            <SlideInContainer delay={0.4}>
              <FeedbackAnimation 
                isCorrect={feedbackState === 'correct' ? true : feedbackState === 'incorrect' ? false : null}
                showShake={showShake}
              >
                <div className="bg-white rounded-3xl px-12 py-8 shadow-xl min-w-[250px] relative">
                  <SuccessParticles show={showSuccessParticles} />
                  <div className="text-5xl md:text-6xl text-center font-medium text-foreground min-h-[80px] flex items-center justify-center">
                    {inputValue || '_'}
                  </div>
                </div>
              </FeedbackAnimation>
            </SlideInContainer>

            <SlideInContainer delay={0.5}>
              <Pulse active={!inputValue && feedbackState === 'neutral'}>
                <Numpad
                  onNumberClick={handleNumberClick}
                  onBackspace={handleBackspace}
                  onSubmit={handleSubmit}
                  disabled={isBambooComplete}
                />
              </Pulse>
            </SlideInContainer>

            <p className="text-xs md:text-sm text-muted-foreground">
              Je kunt ook je toetsenbord gebruiken! ⌨️
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}