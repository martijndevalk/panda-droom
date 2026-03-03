import React, { useState, useEffect } from 'react';
import { Numpad } from './Numpad';
import { Worlds, MathProblem } from '../lib/GameData';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { playSound } from '../lib/audio';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';

interface LevelProps {
  worldId: string;
  onBack: () => void;
  onComplete: (worldId: string) => void;
}

export const Level: React.FC<LevelProps> = ({ worldId, onBack, onComplete }) => {
  const world = Worlds.find(w => w.id === worldId)!;
  const { trigger } = useWebHaptics();
  const [sequence, setSequence] = useState<MathProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'success' | 'fail'>('none');
  const [pandaState, setPandaState] = useState<'idle' | 'happy' | 'thinking'>('idle');

  useEffect(() => {
    setSequence(world.generateSequence());
  }, [world]);

  const currentProblem = sequence[currentIndex];

  const handleType = (char: string) => {
    playSound('pop');
    if (inputVal.length < 4) {
      setInputVal(prev => prev + char);
      setPandaState('thinking');
    }
  };

  const clearInput = () => {
    playSound('pop');
    setInputVal('');
    setPandaState('idle');
  };

  const handleSubmit = () => {
    if (!inputVal) return;

    // allow visual checking
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
        colors: ['#4ade80', '#fbbf24']
      });

      setTimeout(() => {
        setFeedback('none');
        setInputVal('');
        setPandaState('idle');

        if (currentIndex < sequence.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished level
          confetti({
            particleCount: 300,
            spread: 100,
            origin: { y: 0.5 }
          });
          setTimeout(() => {
            onComplete(worldId);
          }, 2000);
        }
      }, 1000);
    } else {
      setFeedback('fail');
      playSound('fail');
      trigger('error');

      // Reset after brief wait
      setTimeout(() => {
        setFeedback('none');
        setInputVal('');
        setPandaState('idle');

        // Soft failure: Instead of restarting the whole level, maybe let them try this one again?
        // the requirements state: "Bij één foutje moet de Panda even rusten en begint de reeks opnieuw (of krijgt ze een herkansing)."
        // Let's give them a chance but keep them in the flow.
      }, 2000);
    }
  };

  if (!sequence.length) return null;

  const progress = ((currentIndex) / sequence.length) * 100;

  return (
    <div className="w-full h-full flex flex-col items-center bg-sky-100 p-4 relative">
      {/* Header / Nav */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 z-10 pt-4">
        <button
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
      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 gap-8">

        {/* Panda + Balloon */}
        <div className="flex flex-col items-center relative">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -50 }}
              className="bg-white border-4 border-sky-300 rounded-[3rem] p-8 shadow-2xl relative mb-12 flex items-center gap-4"
            >
              <span className="text-6xl font-bold text-dark">{currentProblem.question}</span>

              {/* Add a little tail to the balloon */}
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
            {/* Visual representation of a Panda */}
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
              <div className={`absolute left-1/2 -translate-x-1/2 w-8 h-4 border-b-4 border-gray-800 rounded-b-full transition-all ${feedback === 'fail' ? 'rotate-180 top-20' : 'top-18'}`} />
            </div>

            {feedback === 'fail' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-0 -right-48 bg-orange-100 border-2 border-orange-400 text-orange-800 p-4 rounded-3xl shadow-xl w-40 z-30 font-bold"
              >
                Oeps! Bijna goed. Nog een keertje proberen!
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Input Box */}
        <div className={`h-24 w-64 bg-white rounded-3xl border-4 shadow-inner flex items-center justify-center relative overflow-hidden transition-colors ${
          feedback === 'success' ? 'border-green-400 bg-green-50' :
          feedback === 'fail' ? 'border-red-400 bg-red-50' :
          'border-sky-300'
        }`}>
          <AnimatePresence>
            {feedback === 'success' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-4 text-green-500">
                <CheckCircle2 size={40} />
              </motion.div>
            )}
            {feedback === 'fail' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-4 text-red-500">
                <XCircle size={40} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className={`text-6xl font-bold font-mono tracking-wider ${
            feedback === 'success' ? 'text-green-600' :
            feedback === 'fail' ? 'text-red-600' :
            'text-dark'
          }`}>
            {inputVal || '?'}
          </span>
        </div>
      </div>

      <div className="w-full pb-8 z-10 flex flex-col items-center">
        <Numpad
          onType={handleType}
          onClear={clearInput}
          onSubmit={handleSubmit}
          disabled={feedback !== 'none'}
        />
      </div>

    </div>
  );
};
