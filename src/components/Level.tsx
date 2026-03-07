import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Numpad } from './Numpad';
import { Worlds, MathProblem } from '../lib/GameData';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playSound, initAudioContext } from '../lib/audio';
import { speak, stopSpeaking, isTtsConfigured, ensureAudioUnlocked } from '../lib/tts';
import { VisualHint } from './VisualHint';
import { CheckCircle2, Lightbulb, Gift, ArrowLeft } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { PandaAvatar } from './PandaAvatar';

/** Reward milestones: number of completed tables → reward text. */
const REWARD_MILESTONES: { threshold: number; emoji: string; text: string }[] = [
  { threshold: 2, emoji: '🎮', text: '15 minuten extra digitale speeltijd' },
  { threshold: 4, emoji: '🎲', text: 'Samen een spelletje kiezen' },
  { threshold: 6, emoji: '🥞', text: 'Pannenkoeken eten!' },
  { threshold: 8, emoji: '🛝', text: 'Samen naar de speeltuin' },
  { threshold: 10, emoji: '🎁', text: 'Een heel speciaal cadeau!' },
];

interface LevelProps {
  worldId: string;
  unlockedWorlds: string[];
  onBack: () => void;
  onComplete: (worldId: string, action: 'map' | 'next') => void;
}

export const Level: React.FC<LevelProps> = ({ worldId, unlockedWorlds, onBack, onComplete }) => {
  const world = Worlds.find(w => w.id === worldId)!;
  const { trigger } = useWebHaptics();
  const [sequence, setSequence] = useState<MathProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'success' | 'shake'>('none');
  const [pandaState, setPandaState] = useState<'idle' | 'happy' | 'thinking' | 'error'>('idle');
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hasSpokenComplete, setHasSpokenComplete] = useState(false);

  const hasTts = isTtsConfigured();
  const hasSpokenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setSequence(world.generateSequence());
    hasSpokenRef.current = new Set();
    setHasSpokenComplete(false);
  }, [world]);

  const currentProblem = sequence[currentIndex];

  // Speak the question when a new problem appears
  const speakQuestion = useCallback((problem: MathProblem) => {
    if (!hasTts || !problem) return;

    const q = problem.question;
    let spokenText: string;

    if (/Typ het getal/i.test(q)) {
      const num = q.replace(/Typ het getal:\s*/i, '').trim();
      spokenText = `Typ het getal ${num}`;
    } else {
      spokenText = q
        .replace(/\s*=\s*\?\s*$/, '')
        .replace(/\s*×\s*/g, ' keer ')
        .replace(/\s*x\s*/g, ' keer ')
        .replace(/\s*\+\s*/g, ' plus ')
        .replace(/\s*-\s*/g, ' min ');
      spokenText = `Hoeveel is ${spokenText}?`;
    }

    speak(spokenText);
  }, [hasTts]);

  useEffect(() => {
    if (currentProblem && !hasSpokenRef.current.has(currentIndex)) {
      hasSpokenRef.current.add(currentIndex);
      const timer = setTimeout(() => speakQuestion(currentProblem), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentProblem, speakQuestion]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  // Speak completion text when isLevelComplete becomes true
  useEffect(() => {
    if (isLevelComplete && !hasSpokenComplete) {
      setHasSpokenComplete(true);

      const currentIndexInGame = Worlds.findIndex(w => w.id === worldId);
      const completedCount = unlockedWorlds.filter(id => {
        const idx = Worlds.findIndex(w => w.id === id);
        return idx >= 0 && idx <= currentIndexInGame;
      }).length;

      const earnedMilestone = REWARD_MILESTONES.filter(m => m.threshold <= completedCount).pop();
      const justEarnedMilestone = earnedMilestone && earnedMilestone.threshold === completedCount
        ? earnedMilestone
        : null;

      initAudioContext();
      ensureAudioUnlocked();

      let text = `Geweldig! Je hebt de tafel van ${world.table} gehaald! Plus 1 Bamboetak.`;
      if (justEarnedMilestone) {
        text += ` Beloning verdiend! ${justEarnedMilestone.text}.`;
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

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4ade80', '#fbbf24'],
      });

      setTimeout(() => {
        setFeedback('none');
        setInputVal('');
        setPandaState('idle');
        setShowHint(false);

        if (currentIndex < sequence.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished level
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
      // Gentle error: shake the input, X eyes, then clear so they can try again
      setFeedback('shake');
      setPandaState('error');
      trigger('error');
      playSound('fail');
      speak('Probeer het nog eens, je kan het!');

      setTimeout(() => {
        setFeedback('none');
        setInputVal('');
        setPandaState('idle');
        // Let them try again — give enough time to read the encouragement
      }, 2000);
    }
  };

  if (!sequence.length) return null;

  const progress = ((currentIndex) / sequence.length) * 100;

  if (isLevelComplete) {
    const currentIndexInGame = Worlds.findIndex(w => w.id === worldId);
    const hasNext = currentIndexInGame >= 0 && currentIndexInGame < Worlds.length - 1;

    // Count completed tables (unlocked includes current + the next one that just got unlocked)
    // The current world is being completed now, so count unlocked worlds
    // unlockedWorlds already includes the *next* world by the time Level renders complete,
    // but the current world was already in the list. We count how many worlds
    // the player has actually *finished* — that's all unlocked minus 1 (the one they haven't played yet),
    // but since this level was just completed, we count all unlocked that are <= current index.
    const completedCount = unlockedWorlds.filter(id => {
      const idx = Worlds.findIndex(w => w.id === id);
      return idx >= 0 && idx <= currentIndexInGame;
    }).length;

    // Find the highest milestone they just reached
    const earnedMilestone = REWARD_MILESTONES.filter(m => m.threshold <= completedCount).pop();
    // Check if they *just* crossed this milestone threshold (i.e. completedCount exactly equals threshold)
    const justEarnedMilestone = earnedMilestone && earnedMilestone.threshold === completedCount
      ? earnedMilestone
      : null;

    return (
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center p-4 relative overflow-y-auto bg-sky-200">
        {/* ☀️ Sun */}
        <div className="sun sun--sm absolute top-4 right-6" />

        {/* ☁️ Decorative clouds */}
        <div className="cloud cloud--lg absolute opacity-50" style={{ top: '6%', left: '5%' }} />
        <div className="cloud cloud--md absolute opacity-55" style={{ top: '15%', right: '20%' }} />
        <div className="cloud cloud--sm absolute opacity-45" style={{ top: '10%', left: '40%' }} />
        <div className="cloud cloud--xl absolute opacity-35" style={{ top: '30%', left: '2%' }} />
        <div className="cloud cloud--md absolute opacity-50" style={{ top: '22%', right: '5%' }} />
        <div className="cloud cloud--sm absolute opacity-60" style={{ bottom: '20%', right: '10%' }} />
        <div className="cloud cloud--lg absolute opacity-40" style={{ bottom: '10%', left: '15%' }} />
        <div className="cloud cloud--md absolute opacity-45" style={{ bottom: '30%', left: '50%' }} />

        <motion.div
           initial={{ scale: 0.5, opacity: 0, y: 50 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] max-w-sm w-full text-center border-4 border-dark shadow-[8px_8px_0px_theme(colors.dark)] flex flex-col items-center relative z-10"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-inner relative">
            <span className="text-6xl sm:text-8xl">🎋</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-yellow-400 rounded-full z-0 opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <h2 className="title-font text-4xl sm:text-5xl font-black text-sky-600 tracking-tight drop-shadow-sm">Geweldig!</h2>
          </div>
          <p className="text-xl sm:text-2xl text-gray-700 mb-4 sm:mb-6 font-medium">
            Je hebt de tafel van {world.table} gehaald! <br/>
            <strong className="text-green-500 font-extrabold text-2xl sm:text-3xl mt-2 block drop-shadow-sm">+ 1 Bamboetak!</strong>
          </p>

          {/* Reward milestone banner */}
          {justEarnedMilestone && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
              className="w-full bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border-2 border-amber-300 rounded-2xl p-4 mb-4 sm:mb-6 shadow-lg relative overflow-hidden"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 -right-2 text-4xl"
              >
                🎉
              </motion.div>
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-6 h-6 text-amber-600 shrink-0" />
                <span className="text-base sm:text-lg font-bold text-amber-800">Beloning verdiend!</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-amber-900">
                <span className="text-2xl mr-1">{justEarnedMilestone.emoji}</span>
                {justEarnedMilestone.text}
              </p>
              <p className="text-xs sm:text-sm text-amber-600 mt-1">
                {completedCount} van {Worlds.length} tafels voltooid
              </p>
            </motion.div>
          )}

          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            {hasNext && (
              <button
                type="button"
                onClick={() => { trigger('success'); onComplete(worldId, 'next'); }}
                className="btn btn-success btn-lg w-full rounded-2xl text-white text-xl border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)]"
              >
                Volgend Level
              </button>
            )}
            <button
              type="button"
              onClick={() => { trigger('nudge'); onComplete(worldId, 'map'); }}
              className="btn btn-info btn-lg w-full rounded-2xl text-white text-xl border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] mt-2"
            >
              Terug naar Map
            </button>
          </div>
        </motion.div>
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
      <div className="cloud cloud--md absolute opacity-50" style={{ top: '22%', right: '5%' }} />
      <div className="cloud cloud--sm absolute opacity-60" style={{ bottom: '20%', right: '10%' }} />
      <div className="cloud cloud--lg absolute opacity-40" style={{ bottom: '10%', left: '15%' }} />
      <div className="cloud cloud--md absolute opacity-45" style={{ bottom: '30%', left: '50%' }} />

      {/* Header / Nav */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-2 sm:mb-8 z-10 pt-1 sm:pt-4">
        <button
          type="button"
          onClick={() => {
            trigger('nudge');
            onBack();
          }}
          className="btn btn-circle btn-active bg-white border-2 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-dark disabled:opacity-50"
        >
          <ArrowLeft size={24} className="sm:w-8 sm:h-8" />
        </button>
        <div className="flex-1 mx-4 sm:mx-8 relative h-4 sm:h-5 bg-white rounded-full overflow-hidden border-2 border-dark shadow-[2px_2px_0px_theme(colors.dark)]">
          <motion.div
            className="h-full bg-toy-green"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />
        </div>
        <div className="text-sm sm:text-xl font-bold bg-white px-3 py-1 sm:px-4 sm:py-2 rounded-full border-4 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-dark">
          {currentIndex + 1} / {sequence.length}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 min-h-[min-content] flex flex-col items-center justify-center w-full z-10 gap-[clamp(0.5rem,3dvh,2rem)] sm:gap-8 overflow-visible py-2 sm:py-0">

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

                {/* Action buttons */}
                <div className="flex flex-col gap-2 ml-2 sm:ml-4 border-l-2 border-slate-100 pl-2 sm:pl-4">
                  {/* Hint button */}
                  {currentProblem.factors && (
                    <motion.button
                      type="button"
                      onClick={() => setShowHint(true)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 sm:p-3 rounded-full bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 transition-colors text-yellow-600 flex-shrink-0"
                      aria-label="Toon een hint"
                    >
                      <Lightbulb size={24} className="sm:w-8 sm:h-8" />
                    </motion.button>
                  )}


                </div>
              </div>

              {/* Balloon tail — sibling of balloon so it can connect visually */}
              <div className="relative -mt-[4px] sm:-mt-[5px] z-30 mb-0 sm:mb-4">
                <svg
                  className="w-[44px] h-[26px] sm:w-[48px] sm:h-[30px] overflow-visible block mx-auto"
                  viewBox="0 0 48 30"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* The actual tail triangle */}
                  <polygon
                    points="6,0 24,28 42,0"
                    fill="white"
                  />
                </svg>
              </div>
            </motion.div>
          </AnimatePresence>

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
            {/* Panda face — exact favicon SVG */}
            <PandaAvatar
              className="w-[clamp(5rem,18dvh,9rem)] h-[clamp(5rem,18dvh,9rem)] z-20 drop-shadow-lg shrink-0"
              mood={pandaState === 'error' ? 'error' : 'normal'}
            />

            {/* Gentle encouragement on wrong answer — NO red X or harsh feedback */}
            <AnimatePresence>
              {feedback === 'shake' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="absolute top-0 -right-48 bg-sky-100 border-2 border-sky-300 text-sky-700 p-4 rounded-3xl shadow-xl w-40 z-30 font-bold"
                >
                  Bijna! Probeer het nog eens 💪
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <div className="w-full pb-2 sm:pb-8 z-10 flex flex-col items-center shrink-0">
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
