import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound, initAudioContext } from '../lib/audio';
import { ensureAudioUnlocked } from '../lib/tts';
import confetti from 'canvas-confetti';
import { useWebHaptics } from 'web-haptics/react';

interface IntroScreenProps {
  table: number;
  onComplete: () => void;
}

/**
 * C-P-A (Concrete → Pictorial → Abstract) introduction screen.
 *
 * The child drags groups of dots into a target area to visually
 * build a multiplication fact before moving on to abstract sums.
 *
 * Shows an example like "Maak 3 groepjes van {table}" and lets
 * the child tap/drag each group into position.
 */
export function IntroScreen({ table, onComplete }: IntroScreenProps) {
  const { trigger } = useWebHaptics();

  // How many groups to place (keep it simple: 3 groups)
  const groupCount = 3;
  const [placedGroups, setPlacedGroups] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const allPlaced = placedGroups.length >= groupCount;
  const total = groupCount * table;

  const handlePlaceGroup = (groupIndex: number) => {
    if (placedGroups.includes(groupIndex)) return;

    initAudioContext();
    ensureAudioUnlocked();
    playSound('pop');
    trigger('nudge');

    const newPlaced = [...placedGroups, groupIndex];
    setPlacedGroups(newPlaced);

    if (newPlaced.length >= groupCount) {
      // All placed — show the result
      setTimeout(() => {
        playSound('success');
        trigger('success');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4ade80', '#fbbf24', '#60a5fa'],
        });
        setShowResult(true);
      }, 400);
    }
  };

  const handleContinue = () => {
    initAudioContext();
    ensureAudioUnlocked();
    playSound('pop');
    trigger('success');
    onComplete();
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center bg-sky-100 p-4 relative h-full">
      {/* Title */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6 sm:mb-8"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-sky-700 mb-2">
          Tafel van {table}
        </h2>
        <p className="text-lg sm:text-xl text-sky-600 font-medium">
          Tik op de groepjes om ze in het vak te plaatsen!
        </p>
      </motion.div>

      {/* Instruction balloon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-4 border-sky-300 rounded-[2rem] p-4 sm:p-6 shadow-xl mb-6 sm:mb-8 text-center"
      >
        <span className="text-2xl sm:text-3xl font-bold text-dark">
          {groupCount} × {table} = ?
        </span>
      </motion.div>

      {/* Available groups (source) */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        {Array.from({ length: groupCount }, (_, groupIndex) => {
          const isPlaced = placedGroups.includes(groupIndex);
          return (
            <motion.button
              key={groupIndex}
              type="button"
              onClick={() => handlePlaceGroup(groupIndex)}
              disabled={isPlaced}
              whileTap={!isPlaced ? { scale: 0.9 } : {}}
              animate={isPlaced ? { opacity: 0.3, scale: 0.8 } : { opacity: 1, scale: 1 }}
              className={`bg-white border-3 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap justify-center gap-1.5 transition-all ${
                isPlaced
                  ? 'border-gray-200 cursor-default'
                  : 'border-green-400 cursor-pointer hover:border-green-500 hover:shadow-xl active:shadow-md'
              }`}
              style={{
                width: table <= 5 ? 'auto' : `${Math.ceil(table / 2) * 28 + 32}px`,
                minWidth: '70px',
              }}
              aria-label={`Groepje ${groupIndex + 1}: ${table} bolletjes`}
            >
              {Array.from({ length: table }, (_, dotIndex) => (
                <div
                  key={dotIndex}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-sm ${
                    isPlaced
                      ? 'bg-gray-300 border-2 border-gray-400'
                      : 'bg-green-400 border-2 border-green-500'
                  }`}
                />
              ))}
            </motion.button>
          );
        })}
      </div>

      {/* Target area */}
      <motion.div
        ref={targetRef}
        animate={{
          borderColor: allPlaced ? '#4ade80' : '#93c5fd',
          backgroundColor: allPlaced ? '#f0fdf4' : '#eff6ff',
        }}
        className="w-full max-w-sm min-h-[100px] sm:min-h-[140px] rounded-[2rem] border-4 border-dashed flex flex-wrap justify-center items-center gap-3 p-4 sm:p-6 transition-all"
      >
        <AnimatePresence>
          {placedGroups.length === 0 && (
            <motion.p
              exit={{ opacity: 0 }}
              className="text-sky-400 text-lg font-medium text-center"
            >
              ⬆️ Tik op een groepje!
            </motion.p>
          )}

          {placedGroups.map((groupIndex) => (
            <motion.div
              key={groupIndex}
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-green-50 border-2 border-green-300 rounded-xl p-2 sm:p-3 flex flex-wrap justify-center gap-1"
              style={{
                width: table <= 5 ? 'auto' : `${Math.ceil(table / 2) * 24 + 24}px`,
                minWidth: '50px',
              }}
            >
              {Array.from({ length: table }, (_, dotIndex) => (
                <div
                  key={dotIndex}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-400 border-2 border-green-500"
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Running count */}
      <div className="mt-4 flex gap-2 justify-center">
        {placedGroups.map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-lg sm:text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full"
          >
            {(i + 1) * table}
          </motion.span>
        ))}
      </div>

      {/* Result + Continue */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 sm:mt-8 text-center"
          >
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">
              🎉 {groupCount} × {table} = {total}
            </p>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className="py-4 px-8 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-2xl font-bold text-xl sm:text-2xl shadow-[0_6px_0_0_#166534] active:shadow-[0_0px_0_0_#166534] active:translate-y-[6px] transition-all"
            >
              Door naar de sommen! 🚀
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
