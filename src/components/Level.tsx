import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Numpad } from './Numpad';
import { Worlds, MathProblem } from '../lib/GameData';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playSound, initAudioContext } from '../lib/audio';
import { speak, stopSpeaking, isTtsConfigured, ensureAudioUnlocked } from '../lib/tts';
import { VisualHint } from './VisualHint';
import { Lightbulb, Leaf } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { PandaAvatar } from './PandaAvatar';
import { recordAnswer, addLeaves, getLeafCount } from '../lib/performanceTracker';
import { selectReviewForLevel, mixReviewIntoSequence } from '../lib/reviewSelector';
import { getMathRewards } from '../lib/rewardsStorage';
import { LevelHeader } from './shared/LevelHeader';
import { LevelCompleteModal } from './shared/LevelCompleteModal';
import { EncouragementBanner } from './shared/EncouragementBanner';

interface LevelProps {
  worldId: string;
  unlockedWorlds: string[];
  onBack: () => void;
  onComplete: (worldId: string, action: 'map' | 'next') => void;
  /** When true, this is a review/practice session — different rewards, no daily limit */
  isReview?: boolean;
  /** Pre-generated review sequence (used by PracticeSquare) */
  reviewSequence?: MathProblem[];
}

const ENCOURAGEMENTS = [
  { text: 'Bijna! Probeer nog eens 💪', spoken: 'Bijna! Probeer het nog een keertje, je kan het!' },
  { text: 'Oepsie! Panda krabt achter zijn oren 🐼', spoken: 'Oepsie! Panda krabt achter zijn oren. Jij weet het vast wel!' },
  { text: 'Geen paniek, rekenkampioen! 🚀', spoken: 'Geen paniek! Van foutjes maken word je juist superslim!' },
  { text: 'Die som probeert je te foppen! 🎪', spoken: 'Hé, die som probeerde je stiekem te foppen! Nog een keertje proberen!' },
  { text: 'Zelfs de bamboe moest even denken! 🎋', spoken: 'Bijna raak! Even diep ademhalen en probeer maar weer!' },
  { text: 'Kijk eens naar de sprongetjes! 🦘', spoken: 'Geen zorgen! Denk aan de sprongetjes van deze tafel!' },
  { text: 'Oefening baart kunst! ✨', spoken: 'Supergoed dat je het probeert! Doe het nog eens rustig aan!' },
  { text: 'Panda moedigt je aan! 🐾', spoken: 'Panda klapt in zijn pootjes! Je bent er bijna!' },
];

export const Level: React.FC<LevelProps> = ({ worldId, unlockedWorlds, onBack, onComplete, isReview = false, reviewSequence }) => {
  const world = Worlds.find(w => w.id === worldId)!;
  const { trigger } = useWebHaptics();
  const [sequence, setSequence] = useState<MathProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'success' | 'shake'>('none');
  const [pandaState, setPandaState] = useState<'idle' | 'happy' | 'thinking' | 'error'>('idle');
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintJustUnlocked, setHintJustUnlocked] = useState(false);
  const [hasSpokenComplete, setHasSpokenComplete] = useState(false);
  const [reviewLeavesEarned, setReviewLeavesEarned] = useState(0);
  const [reviewStreak, setReviewStreak] = useState(0);
  const [encouragementText, setEncouragementText] = useState('Bijna! Probeer het nog eens 💪');

  const hasTts = isTtsConfigured();
  const hasSpokenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (reviewSequence) {
      setSequence(reviewSequence);
    } else {
      const baseSequence = world.generateSequence();
      const reviewQuestions = selectReviewForLevel(world.table, unlockedWorlds);
      const mixed = mixReviewIntoSequence(baseSequence, reviewQuestions);
      setSequence(mixed);
    }
    hasSpokenRef.current = new Set();
    setHasSpokenComplete(false);
    setReviewLeavesEarned(0);
    setReviewStreak(0);
  }, [world, reviewSequence]);

  const currentProblem = sequence[currentIndex];

  const speakQuestion = useCallback((problem: MathProblem) => {
    if (!hasTts || !problem) return;

    const q = problem.question;
    let spokenText: string;

    if (/Typ het getal/i.test(q)) {
      const num = q.replace(/Typ het getal:\s*/i, '').trim();
      spokenText = `Typ het getal ${num}`;
    } else {
      const rawExpr = q
        .replace(/\s*=\s*\?\s*$/, '')
        .replace(/\s*×\s*/g, ' keer ')
        .replace(/\s*x\s*/g, ' keer ')
        .replace(/\s*\+\s*/g, ' plus ')
        .replace(/\s*-\s*/g, ' min ');

      const questionStyles = [
        `Hoeveel is ${rawExpr}?`,
        `Wat is ${rawExpr}?`,
        `Reken maar uit: hoeveel is ${rawExpr}?`,
        `Weet jij hoeveel ${rawExpr} is?`,
        `Los maar op: ${rawExpr}!`,
      ];

      // If factors are known, sometimes use C-P-A "groepjes van" phrasing
      if (problem.factors && (currentIndex % 3 === 2)) {
        const [groups, items] = problem.factors;
        spokenText = `${groups} groepjes van ${items} is samen...?`;
      } else {
        spokenText = questionStyles[currentIndex % questionStyles.length];
      }
    }

    speak(spokenText);
  }, [hasTts, currentIndex]);

  useEffect(() => {
    if (currentProblem && !hasSpokenRef.current.has(currentIndex)) {
      hasSpokenRef.current.add(currentIndex);
      const timer = setTimeout(() => speakQuestion(currentProblem), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentProblem, speakQuestion]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (isLevelComplete && !hasSpokenComplete) {
      setHasSpokenComplete(true);

      const currentIndexInGame = Worlds.findIndex(w => w.id === worldId);
      const completedCount = unlockedWorlds.filter(id => {
        const idx = Worlds.findIndex(w => w.id === id);
        return idx >= 0 && idx <= currentIndexInGame;
      }).length;

      const mathRewards = getMathRewards();
      const earnedMilestone = mathRewards.filter(m => m.count <= completedCount).pop();
      const justEarnedMilestone = earnedMilestone && earnedMilestone.count === completedCount
        ? earnedMilestone
        : null;

      initAudioContext();
      ensureAudioUnlocked();

      let text = `Geweldig gedaan! Je hebt de tafel van ${world.table} gehaald! Plus 1 verse Bamboetak voor Panda. Nom nom nom!`;
      if (justEarnedMilestone) {
        text += ` Woehoe, beloning verdiend: ${justEarnedMilestone.label}!`;
      }
      setTimeout(() => speak(text), 400);
    }
  }, [isLevelComplete, hasSpokenComplete, world.table, worldId, unlockedWorlds]);

  const handleType = (char: string) => {
    initAudioContext();
    ensureAudioUnlocked();
    playSound('pop');
    if (inputVal.length < 4) {
      setInputVal(prev => prev + char);
      setPandaState('thinking');
    }
  };

  const clearInput = () => {
    initAudioContext();
    ensureAudioUnlocked();
    playSound('pop');
    setInputVal('');
    setPandaState('idle');
  };

  const handleSubmit = () => {
    initAudioContext();
    ensureAudioUnlocked();
    if (!inputVal) return;

    const isCorrect = parseInt(inputVal) === currentProblem.answer;

    if (isCorrect) {
      setFeedback('success');
      setPandaState('happy');
      playSound('success');
      trigger('success');

      if (currentProblem.factKey) {
        recordAnswer(currentProblem.factKey, true);
      }

      if (currentProblem.isReview) {
        const newStreak = reviewStreak + 1;
        setReviewStreak(newStreak);
        const leafBonus = newStreak >= 3 ? 3 : 1;
        addLeaves(leafBonus);
        setReviewLeavesEarned(prev => prev + leafBonus);
      } else {
        setReviewStreak(0);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: currentProblem.isReview ? ['#86efac', '#4ade80', '#22c55e'] : ['#4ade80', '#fbbf24'],
      });

      setTimeout(() => {
        setFeedback('none');
        setInputVal('');
        setPandaState('idle');
        setShowHint(false);
        setWrongAttempts(0);
        setHintJustUnlocked(false);

        if (currentIndex < sequence.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          confetti({
            particleCount: 300,
            spread: 100,
            origin: { y: 0.5 },
          });
          setTimeout(() => {
            playSound('cheer');
            setIsLevelComplete(true);
          }, 1000);
        }
      }, 1000);
    } else {
      setFeedback('shake');
      setPandaState('error');
      trigger('error');
      playSound('fail');

      const randomEnc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      setEncouragementText(randomEnc.text);

      if (currentProblem.factKey) {
        recordAnswer(currentProblem.factKey, false);
      }

      setReviewStreak(0);

      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);

      if (newWrongAttempts === 1) {
        speak('Geen zorgen! Panda heeft een supergoede tip voor je. Tik maar op het lampje!');
        setHintJustUnlocked(true);
        setTimeout(() => setHintJustUnlocked(false), 4000);
      } else {
        speak(randomEnc.spoken);
      }

      setTimeout(() => {
        setFeedback('none');
        setInputVal('');
        setPandaState('idle');
      }, 2000);
    }
  };

  if (!sequence.length) return null;

  // Completion screen
  if (isLevelComplete) {
    if (isReview) {
      return (
        <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center p-4 relative overflow-y-auto bg-sky-200">
          <div className="sun sun--sm absolute top-4 right-6" />
          <div className="cloud cloud--lg absolute opacity-50" style={{ top: '6%', left: '5%' }} />
          <div className="cloud cloud--md absolute opacity-55" style={{ top: '15%', right: '20%' }} />

          <LevelCompleteModal
            title="Klaar met oefenen!"
            subtitle="Goed geoefend op het plein!"
            theme="tables"
            badgeContent={
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow-inner border-3 border-green-300">
                <span className="text-5xl sm:text-6xl">🍃</span>
              </div>
            }
            rewardNote={
              reviewLeavesEarned > 0
                ? `+${reviewLeavesEarned} Blaadjes verdiend! Totaal: ${getLeafCount()} 🍃`
                : `Totaal: ${getLeafCount()} blaadjes 🍃`
            }
            onBackToMap={onBack}
            onNextLevel={() => onComplete(worldId, 'map')}
            nextButtonText="Naar de Kaart"
          />
        </div>
      );
    }

    const currentIndexInGame = Worlds.findIndex(w => w.id === worldId);
    const hasNext = currentIndexInGame >= 0 && currentIndexInGame < Worlds.length - 1;
    const completedCount = unlockedWorlds.filter(id => {
      const idx = Worlds.findIndex(w => w.id === id);
      return idx >= 0 && idx <= currentIndexInGame;
    }).length;

    const mathRewards = getMathRewards();
    const earnedMilestone = mathRewards.filter(m => m.count <= completedCount).pop();
    const justEarnedMilestone = earnedMilestone && earnedMilestone.count === completedCount
      ? earnedMilestone
      : null;

    return (
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center p-4 relative overflow-y-auto bg-sky-200">
        <div className="sun sun--sm absolute top-4 right-6" />
        <div className="cloud cloud--lg absolute opacity-50" style={{ top: '6%', left: '5%' }} />
        <div className="cloud cloud--md absolute opacity-55" style={{ top: '15%', right: '20%' }} />

        <LevelCompleteModal
          title="Geweldig! 🎉"
          subtitle={`Je hebt de tafel van ${world.table} gehaald!`}
          theme="tables"
          badgeContent={
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-yellow-100 rounded-full flex items-center justify-center mb-2 shadow-inner border-3 border-yellow-300">
              <span className="text-5xl sm:text-6xl">🎋</span>
            </div>
          }
          rewardNote="+1 Verse Bamboetak voor Panda! Nom nom nom!"
          milestoneReward={justEarnedMilestone}
          onBackToMap={() => onComplete(worldId, 'map')}
          onNextLevel={hasNext ? () => onComplete(worldId, 'next') : undefined}
          nextButtonText="Volgende Tafel 🚀"
        />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col items-center bg-sky-200 p-2 sm:p-4 relative overflow-y-auto overflow-x-hidden">
      {/* ☀️ Sun */}
      <div className="sun sun--sm absolute top-4 right-6" />

      {/* ☁️ Decorative clouds */}
      <div className="cloud cloud--lg absolute opacity-50" style={{ top: '6%', left: '5%' }} />
      <div className="cloud cloud--md absolute opacity-55" style={{ top: '15%', right: '20%' }} />
      <div className="cloud cloud--sm absolute opacity-45" style={{ top: '10%', left: '40%' }} />
      <div className="cloud cloud--xl absolute opacity-35" style={{ top: '30%', left: '2%' }} />

      {/* ── Shared Level Header ── */}
      <div className="w-full max-w-lg mb-2 relative z-10 pt-1 sm:pt-2">
        <LevelHeader
          title={isReview ? 'Oefenplein' : `Tafel van ${world.table}`}
          emoji={isReview ? '🍃' : '🎋'}
          theme="tables"
          currentIndex={currentIndex}
          totalQuestions={sequence.length}
          showHint={showHint}
          onToggleHint={currentProblem.factors ? () => setShowHint(prev => !prev) : undefined}
          onSpeak={() => speakQuestion(currentProblem)}
          onBack={onBack}
          rightExtra={
            currentProblem.isReview ? (
              <div className="text-xs sm:text-sm font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full border border-green-300 flex items-center gap-1">
                <Leaf size={14} />
                <span>Oefen</span>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Main Play Area */}
      <div className="flex-1 min-h-[min-content] flex flex-col items-center justify-center w-full relative z-10 gap-3 sm:gap-6 overflow-visible py-2 sm:py-0">
        {/* Panda + Balloon */}
        <div className="flex flex-col items-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              className="flex flex-col items-center"
            >
              <div className="bg-white rounded-[1.25rem] sm:rounded-[3rem] p-3 sm:p-5 sm:px-8 shadow-[6px_6px_0px_theme(colors.dark)] border-4 border-dark relative flex items-center gap-2 sm:gap-4 z-20 shrink-0">
                {currentProblem.isReview && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-green-100 text-green-700 text-xs sm:text-sm font-bold px-3 py-0.5 rounded-full border-2 border-green-300 whitespace-nowrap z-30">
                    ⭐ Herhaling!
                  </div>
                )}
                <div className="text-[clamp(1.75rem,5dvh,3.75rem)] font-bold font-bubble flex items-center gap-2 sm:gap-4 text-dark leading-none">
                  <span>{currentProblem.question.replace('?', '').trim()}</span>
                  <motion.div
                    animate={feedback === 'shake' ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`min-w-[clamp(4rem,10dvh,6rem)] h-[clamp(3.5rem,8dvh,5rem)] rounded-xl sm:rounded-2xl border-4 flex items-center justify-center relative shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)] transition-colors px-2 sm:px-4 ${
                      feedback === 'success' ? 'border-toy-green bg-toy-green/10' :
                      feedback === 'shake' ? 'border-toy-orange bg-toy-orange/10' :
                      'border-dark bg-gray-50'
                    }`}
                  >
                    <span className={`font-mono tracking-wider leading-none text-center w-full z-10 ${
                      feedback === 'success' ? 'text-green-600' :
                      feedback === 'shake' ? 'text-orange-600' :
                      'text-sky-600'
                    }`}>
                      {inputVal || '?'}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Balloon tail */}
              <div className="relative -mt-[4px] sm:-mt-[5px] z-30 mb-0 sm:mb-2">
                <svg
                  className="w-[44px] h-[26px] sm:w-[48px] sm:h-[30px] overflow-visible block mx-auto"
                  viewBox="0 0 48 30"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polygon points="6,0 24,28 42,0" fill="white" />
                </svg>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Panda Avatar */}
          <motion.div
            animate={
              pandaState === 'happy'
                ? { y: [0, -20, 0] }
                : pandaState === 'error'
                ? { x: [0, -6, 6, -4, 4, 0] }
                : pandaState === 'thinking'
                ? { rotate: [0, 3, -3, 0] }
                : { y: [0, -4, 0] }
            }
            transition={
              pandaState === 'happy'
                ? { type: 'spring', stiffness: 300, damping: 12 }
                : pandaState === 'error'
                ? { duration: 0.5, ease: 'easeOut' }
                : pandaState === 'thinking'
                ? { duration: 0.4, ease: 'easeInOut' }
                : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            }
            className="relative"
          >
            <PandaAvatar
              className="w-[clamp(5rem,16dvh,8rem)] h-[clamp(5rem,16dvh,8rem)] z-20 drop-shadow-lg shrink-0"
              mood={pandaState === 'error' ? 'error' : 'normal'}
            />

            {/* Gentle Encouragement Banner */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:top-0 sm:mt-0 sm:left-full sm:translate-x-0 sm:ml-6 w-max max-w-[220px] z-30">
              <EncouragementBanner
                show={feedback === 'shake'}
                message={encouragementText}
                theme="tables"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full pb-2 sm:pb-6 relative z-10 flex flex-col items-center shrink-0">
        <Numpad
          onType={handleType}
          onClear={clearInput}
          onSubmit={handleSubmit}
          disabled={feedback !== 'none'}
        />
      </div>

      {/* Visual Hint overlay */}
      {currentProblem.factors && (
        <VisualHint
          factors={currentProblem.factors}
          visible={showHint}
          onClose={() => setShowHint(false)}
        />
      )}
    </div>
  );
};
