import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { playSound, initAudioContext } from '../lib/audio';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import confetti from 'canvas-confetti';
import { useWebHaptics } from 'web-haptics/react';
import { PandaAvatar } from './PandaAvatar';

interface IntroScreenProps {
  table: number;
  onComplete: () => void;
}

/**
 * C-P-A (Concrete → Pictorial → Abstract) introduction screen for multiplication tables.
 */
export function IntroScreen({ table, onComplete }: IntroScreenProps) {
  const { trigger } = useWebHaptics();

  const groupCount = 3;
  const [placedGroups, setPlacedGroups] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const hasSpokenRef = useRef(false);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    speak(`Tafel van ${table}! Tik op de groepjes om ze in het vak te zetten. Help Panda met tellen!`);
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 300);
      return () => clearTimeout(timer);
    }
  }, [table]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

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
        speak(`Hieperdepiep! ${groupCount} keer ${table} is ${total}! Panda springt een gat in de lucht!`);
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
    <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-between bg-gradient-to-b from-sky-100 via-sky-200 to-emerald-100 p-4 sm:p-6 relative overflow-y-auto">
      {/* ── Top Header ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="text-center max-w-lg mt-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/95 rounded-full border-2 border-dark shadow-sm mb-2">
          <span className="text-xl">🎋</span>
          <span className="title-font text-sm font-black text-dark">Getallenreis</span>
        </div>
        <h2 className="title-font text-2xl sm:text-3xl font-black text-sky-800 drop-shadow-sm flex items-center justify-center gap-2">
          <span>Tafel van {table}</span>
          <button
            type="button"
            onClick={handleSpeak}
            className="p-1.5 rounded-full bg-white hover:bg-sky-50 border-2 border-sky-300 text-sky-700 transition-colors shadow-sm cursor-pointer"
            aria-label="Lees uitleg voor"
          >
            <Volume2 size={20} />
          </button>
        </h2>
        <p className="text-sm sm:text-base font-bold text-sky-700 mt-1">
          Tik op de groepjes om ze in het vak te plaatsen!
        </p>
      </motion.div>

      {/* ── Main Demonstration Card ── */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
        className="bg-white rounded-[2.5rem] border-4 border-dark shadow-[6px_6px_0px_theme(colors.dark)] p-5 sm:p-6 max-w-md w-full my-3 flex flex-col items-center relative"
      >
        {/* Panda peek */}
        <div className="absolute -top-10 left-6">
          <PandaAvatar className="w-16 h-16 drop-shadow-md" />
        </div>

        {/* Sum Badge */}
        <div className="bg-emerald-50 rounded-2xl px-5 py-2 border-2 border-emerald-200 text-center w-full mt-2 mb-4">
          <span className="title-font text-2xl sm:text-3xl font-black text-emerald-900">
            {groupCount} × {table} = {allPlaced ? total : '?'}
          </span>
        </div>

        {/* Available dot groups */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-4">
          {Array.from({ length: groupCount }, (_, groupIndex) => {
            const isPlaced = placedGroups.includes(groupIndex);
            return (
              <motion.button
                key={groupIndex}
                type="button"
                onClick={() => handlePlaceGroup(groupIndex)}
                disabled={isPlaced}
                whileHover={!isPlaced ? { scale: 1.05, rotate: (groupIndex % 2 === 0 ? 2 : -2) } : {}}
                whileTap={!isPlaced ? { scale: 0.9 } : {}}
                animate={isPlaced ? { opacity: 0.3, scale: 0.85, rotate: 0 } : { opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className={`bg-white border-3 rounded-2xl p-2.5 sm:p-3 shadow-sm flex flex-wrap justify-center gap-1.5 transition-all ${
                  isPlaced
                    ? 'border-gray-300 cursor-default shadow-none'
                    : 'border-emerald-500 hover:border-emerald-600 cursor-pointer shadow-md'
                }`}
                style={{
                  width: table <= 5 ? 'auto' : `${Math.ceil(table / 2) * 26 + 28}px`,
                  minWidth: '60px',
                }}
                aria-label={`Groepje ${groupIndex + 1}: ${table} bolletjes`}
              >
                {Array.from({ length: table }, (_, dotIndex) => (
                  <div
                    key={dotIndex}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-xs ${
                      isPlaced
                        ? 'bg-gray-300 border border-gray-400'
                        : 'bg-emerald-500 border border-emerald-600'
                    }`}
                  />
                ))}
              </motion.button>
            );
          })}
        </div>

        {/* Target collection area */}
        <motion.div
          ref={targetRef}
          animate={{
            borderColor: allPlaced ? '#22c55e' : '#93c5fd',
            backgroundColor: allPlaced ? '#f0fdf4' : '#eff6ff',
          }}
          className="w-full min-h-[90px] sm:min-h-[110px] rounded-2xl border-3 border-dashed border-dark flex flex-wrap justify-center items-center gap-2 p-3 transition-all"
        >
          <AnimatePresence>
            {placedGroups.length === 0 && (
              <motion.p
                exit={{ opacity: 0 }}
                className="text-sky-500 text-sm sm:text-base font-bold text-center"
              >
                ⬆️ Tik op een groepje!
              </motion.p>
            )}

            {placedGroups.map((groupIndex) => (
              <motion.div
                key={groupIndex}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12, mass: 0.8 }}
                className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-2 flex flex-wrap justify-center gap-1"
                style={{
                  width: table <= 5 ? 'auto' : `${Math.ceil(table / 2) * 22 + 20}px`,
                  minWidth: '45px',
                }}
              >
                {Array.from({ length: table }, (_, dotIndex) => (
                  <div
                    key={dotIndex}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border border-emerald-600"
                  />
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Running count step chips */}
        <div className="mt-3 flex gap-1.5 justify-center flex-wrap">
          {placedGroups.map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs sm:text-sm font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 inline-block"
              transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            >
              {(i + 1) * table}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* ── Start Button ── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs mb-2"
      >
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          className="w-full py-4 bg-[#388E3C] hover:bg-[#2e7d32] text-white rounded-full border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] text-lg font-black flex items-center justify-center gap-2 cursor-pointer transition-transform"
        >
          <span>Door naar de sommen!</span>
          <ArrowRight size={22} />
        </motion.button>
      </motion.div>
    </div>
  );
}
