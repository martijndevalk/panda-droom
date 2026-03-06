import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Numpad } from './Numpad';
import { Worlds, MathProblem } from '../lib/GameData';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playSound } from '../lib/audio';
import { speak, stopSpeaking, isTtsConfigured, ensureAudioUnlocked } from '../lib/tts';
import { VisualHint } from './VisualHint';
import { ArrowLeft, CheckCircle2, Lightbulb, Volume2 } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';

interface LevelProps {
  worldId: string;
  onBack: () => void;
  onComplete: (worldId: string, action: 'map' | 'next') => void;
}

export const Level: React.FC<LevelProps> = ({ worldId, onBack, onComplete }) => {
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
    ensureAudioUnlocked();
    playSound('pop');
    if (inputVal.length < 4) {
      setInputVal(prev => prev + char);
      setPandaState('thinking');
    }
  };

  const clearInput = () => {
    ensureAudioUnlocked();
    playSound('pop');
    setInputVal('');
    setPandaState('idle');
  };

  const handleSubmit = () => {
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
        // Let them try again immediately — no punishment
      }, 600);
    }
  };

  if (!sequence.length) return null;

  const progress = ((currentIndex) / sequence.length) * 100;

  if (isLevelComplete) {
    const currentIndexInGame = Worlds.findIndex(w => w.id === worldId);
    const hasNext = currentIndexInGame >= 0 && currentIndexInGame < Worlds.length - 1;

    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-4 relative min-h-[100dvh]">
        <motion.div
           initial={{ scale: 0.5, opacity: 0, y: 50 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           className="bg-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center border-4 border-sky-300"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
            <span className="text-6xl sm:text-8xl">🎋</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-yellow-400 rounded-full z-0 opacity-50"
            />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-sky-600 mb-4 tracking-tight drop-shadow-sm">Geweldig!</h2>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 font-medium">
            Je hebt de tafel van {world.table} gehaald! <br/>
            <strong className="text-green-500 font-extrabold text-2xl sm:text-3xl mt-2 block drop-shadow-sm">+ 1 Bamboetak!</strong>
          </p>

          <div className="flex flex-col gap-4 w-full">
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
    <div className="w-full flex-1 flex flex-col items-center bg-sky-100 p-2 sm:p-4 relative min-h-[100dvh]">
      {/* Header / Nav */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4 sm:mb-8 z-10 pt-2 sm:pt-4">
        <button
          type="button"
          onClick={() => {
            trigger('nudge');
            onBack();
          }}
          className="p-3 bg-white rounded-full shadow-md text-sky-500 hover:bg-sky-50 transition"
        >
          <ArrowLeft size={32} />
        </button>
        <div className="flex-1 mx-8 relative h-4 bg-sky-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-400"
            animate={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xl font-bold bg-white px-4 py-2 rounded-full shadow-lg text-sky-600">
          {currentIndex + 1} / {sequence.length}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 gap-2 sm:gap-8">

        {/* Panda + Balloon */}
        <div className="flex flex-col items-center relative">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              className="bg-white border-4 border-sky-300 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-8 shadow-2xl relative mb-8 sm:mb-12 flex items-center gap-2 sm:gap-4"
            >
              <span className="text-3xl sm:text-4xl md:text-6xl font-bold text-dark">{currentProblem.question}</span>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                {/* Hint button */}
                {currentProblem.factors && (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 transition-colors text-yellow-600 flex-shrink-0"
                    aria-label="Toon een hint"
                  >
                    <Lightbulb size={24} />
                  </button>
                )}

                {/* TTS button */}
                {hasTts && (
                  <button
                    type="button"
                    onClick={() => { ensureAudioUnlocked(); speakQuestion(currentProblem); }}
                    className="p-2 rounded-full bg-sky-100 hover:bg-sky-200 active:bg-sky-300 transition-colors text-sky-600 flex-shrink-0"
                    aria-label="Lees de vraag voor"
                  >
                    <Volume2 size={24} />
                  </button>
                )}
              </div>

              {/* Balloon tail */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-white border-r-[20px] border-r-transparent filter drop-shadow z-20"></div>
              <div className="absolute -bottom-[28px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[24px] border-l-transparent border-t-[24px] border-t-sky-300 border-r-[24px] border-r-transparent z-10"></div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            animate={
              pandaState === 'happy' ? { y: [0, -40, 0] } :
              pandaState === 'thinking' ? { rotate: [0, 5, -5, 0] } :
              { y: 0 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="relative"
          >
            {/* Panda face */}
            <div className="w-32 h-32 bg-white rounded-full border-4 border-gray-800 relative z-20 shadow-lg flex items-center justify-center">
              {/* Ears */}
              <div className="absolute -top-4 -left-2 w-12 h-12 bg-gray-800 rounded-full -z-10" />
              <div className="absolute -top-4 -right-2 w-12 h-12 bg-gray-800 rounded-full -z-10" />

              {/* Eyes */}
              <div className="absolute top-8 left-4 w-10 h-12 bg-gray-800 rounded-[50%_50%_40%_40%] rotate-12 flex justify-center items-center">
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${pandaState === 'happy' ? 'translate-y-[-4px]' : ''}`} />
              </div>
              <div className="absolute top-8 right-4 w-10 h-12 bg-gray-800 rounded-[50%_50%_40%_40%] -rotate-12 flex justify-center items-center">
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${pandaState === 'happy' ? 'translate-y-[-4px]' : ''}`} />
              </div>

              {/* Nose */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-4 h-3 bg-gray-800 rounded-[50%_50%_100%_100%]" />

              {/* Mouth */}
              <div className={`absolute left-1/2 -translate-x-1/2 w-8 h-4 border-b-4 border-gray-800 rounded-b-full transition-all top-18`} />
            </div>

            {/* Gentle encouragement on wrong answer — NO red X or harsh feedback */}
            {feedback === 'shake' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-0 -right-48 bg-sky-100 border-2 border-sky-300 text-sky-700 p-4 rounded-3xl shadow-xl w-40 z-30 font-bold"
              >
                Bijna! Probeer het nog eens 💪
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Input Box — shakes gently on wrong answer */}
        <motion.div
          animate={feedback === 'shake' ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className={`h-16 w-48 sm:h-24 sm:w-64 bg-white rounded-2xl sm:rounded-3xl border-4 shadow-inner flex items-center justify-center relative overflow-hidden transition-colors ${
            feedback === 'success' ? 'border-green-400 bg-green-50' :
            feedback === 'shake' ? 'border-orange-300 bg-orange-50' :
            'border-sky-300'
          }`}
        >
          <AnimatePresence>
            {feedback === 'success' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-4 text-green-500">
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
