import { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { PandaCoach } from './components/PandaCoach';
import { Numpad } from './components/Numpad';
import { BambooGrowth } from './components/BambooGrowth';
import { CategorySelector } from './components/CategorySelector';
import { QuestPanel, QuestProgress } from './components/QuestPanel';
import { VisualMathDisplay } from './components/VisualMathDisplay';
import { FeedbackAnimation, SlideInContainer, SuccessParticles } from './components/AnimationWrappers';
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
  const [claimedQuests, setClaimedQuests] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    gameState,
    category,
    nextQuestion,
    checkAnswer,
    resetBambooGrowth,
    changeCategory,
    isBambooComplete
  } = useMathGame('plus');

  const currentLevel = Math.max(1, Math.floor(gameState.score / 50) + 1);
  const xpForCurrentLevel = (currentLevel - 1) * 50;
  const xpProgress = Math.min(1, Math.max(0, (gameState.score - xpForCurrentLevel) / 50));
  const xpPointsToNext = Math.max(0, currentLevel * 50 - gameState.score);
  const xpLabel =
    xpPointsToNext === 0
      ? 'Je bent klaar voor het volgende level!'
      : `${xpPointsToNext} punten tot level ${currentLevel + 1}`;

  const accuracy = gameState.totalAnswered === 0
    ? 0
    : Math.round((gameState.correctAnswers / gameState.totalAnswered) * 100);

  const quests: QuestProgress[] = [
    {
      id: 'focus-streak',
      title: 'Focusstreak',
      description: '3 vragen zonder niks fout? Houd die energie!',
      goal: 3,
      current: gameState.correctStreak,
      reward: 'Streak-sticker',
      emoji: '⭐️',
    },
    {
      id: 'bamboo-boost',
      title: 'Bamboe-bouwer',
      description: 'Laat de bamboe helemaal groeien (5 goede antwoorden).',
      goal: 5,
      current: gameState.bambooGrowth,
      reward: 'Bamboe-sticker',
      emoji: '🎋',
    },
    {
      id: 'precision',
      title: 'Nauwkeurigheidstest',
      description: '80%+ goed? Knap gewerkt!',
      goal: 80,
      current: accuracy,
      reward: 'Precision-sticker',
      currentLabel: `${accuracy}%`,
      goalLabel: '80%',
      emoji: '🎯',
    },
  ];

  const quickTips = [
    { icon: '🐾', title: 'Stap 1', description: 'Kies een categorie waar je zin in hebt.' },
    { icon: '🧠', title: 'Stap 2', description: 'Los de som op en typ je antwoord.' },
    { icon: '🏆', title: 'Stap 3', description: 'Claim je sticker als je een quest rond is.' },
  ];

  const stickersEarned = claimedQuests.length;
  const xpBarPercent = Math.min(100, Math.max(0, xpProgress * 100));

  const handleClaimQuest = (questId: string) => {
    setClaimedQuests((prev) => {
      if (prev.includes(questId)) return prev;
      return [...prev, questId];
    });
    setToastMessage('Sticker ontvangen! ⭐️');
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2300);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
        className="flex-1 flex flex-col items-center justify-start md:justify-center gap-6 p-4 md:p-8 relative"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {toastMessage && (
          <div className="absolute top-5 right-5 z-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-2 rounded-3xl shadow-2xl">
            <p className="text-sm font-semibold text-center">{toastMessage}</p>
            <p className="text-xs text-primary-foreground/80 text-center">
              {stickersEarned} {stickersEarned === 1 ? 'sticker' : 'stickers'} in je album
            </p>
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
          <div className="w-full max-w-6xl pt-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-[0_20px_60px_rgba(15,23,42,0.15)] flex flex-col gap-6 p-5 md:p-7">
              <SlideInContainer delay={0.05}>
                <div className="rounded-3xl bg-gradient-to-r from-blue-50 via-white to-pink-50 p-4">
                  <p className="text-sm font-semibold text-foreground">Zo werkt het!</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {quickTips.map((tip) => (
                      <div
                        key={tip.title}
                        className="flex items-center gap-2 rounded-2xl border border-white/70 px-3 py-2 bg-slate-50/90 shadow-sm flex-1 min-w-[150px]"
                      >
                        <span className="text-2xl">{tip.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                          <p className="text-[0.65rem] text-muted-foreground">{tip.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SlideInContainer>
              <div className="grid gap-6 lg:grid-cols-[1.35fr,1.05fr,0.9fr]">
                <SlideInContainer delay={0.15}>
                  <QuestPanel
                    level={currentLevel}
                    xpPercent={xpProgress}
                    xpLabel={xpLabel}
                    quests={quests}
                    claimedQuests={claimedQuests}
                    stickersEarned={stickersEarned}
                    onClaim={handleClaimQuest}
                  />
                </SlideInContainer>
                <div className="space-y-5">
                  {gameState.currentQuestion && (
                    <SlideInContainer key={gameState.currentQuestion.id} delay={0.2}>
                      <div className="bg-white/90 rounded-3xl p-4 shadow-2xl">
                        <VisualMathDisplay question={gameState.currentQuestion} />
                      </div>
                    </SlideInContainer>
                  )}
                  {gameState.currentQuestion && (
                    <SlideInContainer delay={0.3}>
                      <div className="bg-accent/90 rounded-3xl px-8 py-6 shadow-xl">
                        <p className="text-3xl md:text-4xl text-center font-semibold text-foreground">
                          {gameState.currentQuestion.displayText}
                        </p>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Kies het juiste antwoord met de cijfers onderin.
                        </p>
                      </div>
                    </SlideInContainer>
                  )}
                </div>
                <div className="space-y-5">
                  <SlideInContainer delay={0.25}>
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleBackToCategories}
                          className="bg-primary/10 text-primary rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary/20 transition"
                        >
                          ← Terug
                        </button>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">Score</p>
                          <p className="text-2xl font-bold">{gameState.score}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Level {currentLevel}</p>
                        <p>{xpLabel}</p>
                      </div>
                      <div className="relative rounded-full bg-muted h-2 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-accent"
                          style={{ width: `${xpBarPercent}%` }}
                        />
                      </div>
                      <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                        Blijf oefenen voor extra XP!
                      </p>
                    </div>
                  </SlideInContainer>
                  <SlideInContainer delay={0.3}>
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 shadow-xl">
                      <p className="text-sm font-semibold text-foreground mb-3">Bamboe groeimeter</p>
                      <BambooGrowth growth={gameState.bambooGrowth} />
                      <p className="text-xs text-muted-foreground mt-2">
                        Nog {5 - gameState.bambooGrowth} stapjes tot de grote confetti!
                      </p>
                    </div>
                  </SlideInContainer>
                  <SlideInContainer delay={0.4}>
                    <div className="bg-white/90 rounded-3xl p-4 shadow-xl">
                      <FeedbackAnimation
                        isCorrect={feedbackState === 'correct' ? true : feedbackState === 'incorrect' ? false : null}
                        showShake={showShake}
                      >
                        <div className="bg-white rounded-3xl px-10 py-6 shadow-inner relative">
                          <SuccessParticles show={showSuccessParticles} />
                          <div className="text-5xl md:text-6xl text-center font-semibold text-foreground min-h-[80px] flex items-center justify-center">
                            {inputValue || '_'}
                          </div>
                        </div>
                      </FeedbackAnimation>
                      <div className="mt-4">
                        <div className="bg-white/95 rounded-3xl p-2 shadow-inner">
                          <Numpad
                            onNumberClick={handleNumberClick}
                            onBackspace={handleBackspace}
                            onSubmit={handleSubmit}
                            disabled={isBambooComplete}
                          />
                        </div>
                      </div>
                    </div>
                  </SlideInContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
