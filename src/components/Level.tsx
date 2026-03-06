import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Numpad } from './Numpad';
import { Worlds, MathProblem } from '../lib/GameData';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playSound, initAudioContext } from '../lib/audio';
import { speak, stopSpeaking, isTtsConfigured, ensureAudioUnlocked } from '../lib/tts';
import { VisualHint } from './VisualHint';
import { ArrowLeftIcon } from 'lucide-animated';
import { CheckCircle2, Lightbulb, Volume2, Gift } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';

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
  const [pandaState, setPandaState] = useState<'idle' | 'happy' | 'thinking'>('idle');
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const hasTts = isTtsConfigured();
  const hasSpokenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setSequence(world.generateSequence());
    hasSpokenRef.current = new Set();
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
            playSound('success');
            setIsLevelComplete(true);
          }, 1000);
        }
      }, 1000);
    } else {
      // Gentle error: shake the input, then clear it so they can try again
      setFeedback('shake');
      trigger('error');
      // No negative sound — just a gentle shake

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
      <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        <motion.div
           initial={{ scale: 0.5, opacity: 0, y: 50 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center border-4 border-sky-300"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-inner relative">
            <span className="text-6xl sm:text-8xl">🎋</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-yellow-400 rounded-full z-0 opacity-50"
            />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-sky-600 mb-3 sm:mb-4 tracking-tight drop-shadow-sm">Geweldig!</h2>
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
                className="w-full py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-2xl font-bold text-xl sm:text-2xl shadow-[0_6px_0_0_#166534] active:shadow-[0_0px_0_0_#166534] active:translate-y-[6px] transition-all"
              >
                Volgend Level
              </button>
            )}
            <button
              type="button"
              onClick={() => { trigger('nudge'); onComplete(worldId, 'map'); }}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-2xl font-bold text-xl sm:text-2xl shadow-[0_6px_0_0_#075985] active:shadow-[0_0px_0_0_#075985] active:translate-y-[6px] transition-all"
            >
              Terug naar Map
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col items-center bg-sky-100 p-2 sm:p-4 relative">
      {/* Header / Nav */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-2 sm:mb-8 z-10 pt-1 sm:pt-4">
        <button
          type="button"
          onClick={() => {
            trigger('nudge');
            onBack();
          }}
          className="p-2 sm:p-3 bg-white rounded-full shadow-md text-sky-500 hover:bg-sky-50 transition"
        >
          <ArrowLeftIcon size={24} className="sm:w-8 sm:h-8" />
        </button>
        <div className="flex-1 mx-4 sm:mx-8 relative h-3 sm:h-4 bg-sky-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-400"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />
        </div>
        <div className="text-sm sm:text-xl font-bold bg-white px-3 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg text-sky-600">
          {currentIndex + 1} / {sequence.length}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center w-full z-10 gap-2 sm:gap-8 overflow-hidden">

        {/* Panda + Balloon */}
        <div className="flex flex-col items-center relative">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              className="bg-white border-3 sm:border-4 border-sky-300 rounded-[1.25rem] sm:rounded-[3rem] p-2 sm:p-8 shadow-2xl relative flex items-center gap-1.5 sm:gap-4"
            >
              <span className="text-xl sm:text-4xl md:text-6xl font-bold text-dark">
                {currentProblem.question}
              </span>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                {/* Hint button */}
                {currentProblem.factors && (
                  <motion.button
                    type="button"
                    onClick={() => setShowHint(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 transition-colors text-yellow-600 flex-shrink-0"
                    aria-label="Toon een hint"
                  >
                    <Lightbulb size={20} className="sm:w-6 sm:h-6" />
                  </motion.button>
                )}

                {/* TTS button */}
                {hasTts && (
                  <motion.button
                    type="button"
                    onClick={() => { initAudioContext(); ensureAudioUnlocked(); speakQuestion(currentProblem); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-sky-100 hover:bg-sky-200 active:bg-sky-300 transition-colors text-sky-600 flex-shrink-0"
                    aria-label="Lees de vraag voor"
                  >
                    <Volume2 size={20} className="sm:w-6 sm:h-6" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Balloon tail — sibling of balloon so it can overlap the border */}
          <div className="relative -mt-[4px] sm:-mt-[5px] z-30 mb-0 sm:mb-4">
            <svg
              className="w-[36px] h-[22px] sm:w-[48px] sm:h-[30px] overflow-visible block mx-auto"
              viewBox="0 0 48 30"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* White rect to cover the balloon border at the connection — drawn first */}
              <rect x="2" y="-8" width="44" height="12" fill="white" />
              {/* The actual tail triangle with matching border */}
              <polygon
                points="6,0 24,28 42,0"
                fill="white"
                stroke="#7dd3fc"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* White rect on top to cover the triangle's top stroke */}
              <rect x="2" y="-8" width="44" height="10" fill="white" />
            </svg>
          </div>

          <motion.div
            animate={
              pandaState === 'happy'
                ? { y: [0, -20, 0] }
                : pandaState === 'thinking'
                ? { rotate: [0, 3, -3, 0] }
                : { y: [0, -4, 0] }
            }
            transition={
              pandaState === 'happy'
                ? { type: 'spring', stiffness: 300, damping: 12 }
                : pandaState === 'thinking'
                ? { duration: 0.4, ease: 'easeInOut' }
                : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            }
            className="relative"
          >
            {/* Panda face — exact favicon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              className="w-16 h-16 sm:w-36 sm:h-36 z-20 drop-shadow-lg"
            >
              {/* Left ear */}
              <circle cx="14" cy="14" r="12" fill="#1a1a2e" />
              {/* Right ear */}
              <circle cx="50" cy="14" r="12" fill="#1a1a2e" />
              {/* Head */}
              <circle cx="32" cy="34" r="26" fill="#ffffff" stroke="#1a1a2e" strokeWidth="2" />
              {/* Left eye patch */}
              <ellipse cx="20" cy="28" rx="9" ry="10" fill="#1a1a2e" transform="rotate(10 20 28)" />
              {/* Right eye patch */}
              <ellipse cx="44" cy="28" rx="9" ry="10" fill="#1a1a2e" transform="rotate(-10 44 28)" />
              {/* Left eye */}
              <circle cx="20" cy="27" r="3" fill="#ffffff" />
              <circle cx="21" cy="26" r="1.2" fill="#ffffff" opacity="0.8" />
              {/* Right eye */}
              <circle cx="44" cy="27" r="3" fill="#ffffff" />
              <circle cx="45" cy="26" r="1.2" fill="#ffffff" opacity="0.8" />
              {/* Nose */}
              <ellipse cx="32" cy="38" rx="4" ry="3" fill="#1a1a2e" />
              {/* Mouth */}
              <path d="M28 42 Q32 47 36 42" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* Cheek blush */}
              <circle cx="14" cy="36" r="4" fill="#ffb3b3" opacity="0.5" />
              <circle cx="50" cy="36" r="4" fill="#ffb3b3" opacity="0.5" />
            </svg>

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

        {/* Input Box — shakes gently on wrong answer */}
        <motion.div
          animate={feedback === 'shake' ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-12 w-44 sm:h-24 sm:w-64 bg-white rounded-2xl sm:rounded-3xl border-4 shadow-inner flex items-center justify-center relative overflow-hidden transition-colors ${
            feedback === 'success' ? 'border-green-400 bg-green-50' :
            feedback === 'shake' ? 'border-orange-300 bg-orange-50' :
            'border-sky-300'
          }`}
        >
          <AnimatePresence>
            {feedback === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="absolute left-4 text-green-500"
              >
                <CheckCircle2 size={40} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className={`text-3xl sm:text-4xl md:text-6xl font-bold font-mono tracking-wider ${
            feedback === 'success' ? 'text-green-600' :
            feedback === 'shake' ? 'text-orange-600' :
            'text-dark'
          }`}>
            {inputVal || '?'}
          </span>
        </motion.div>
      </div>

      <div className="w-full pb-2 sm:pb-8 z-10 flex flex-col items-center">
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
