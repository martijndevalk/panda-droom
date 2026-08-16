import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWebHaptics } from 'web-haptics/react';
import { playSound, initAudioContext } from '../../lib/audio';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../../lib/tts';
import { ClockFace } from './ClockFace';
import { PandaAvatar } from '../PandaAvatar';
import { CLOCK_WORLDS, ClockWorld } from '../../lib/clockData';

interface ClockIntroScreenProps {
  worldId: string;
  onComplete: () => void;
}

export const ClockIntroScreen: React.FC<ClockIntroScreenProps> = ({ worldId, onComplete }) => {
  const { trigger } = useWebHaptics();
  const world = CLOCK_WORLDS.find((w) => w.id === worldId) || CLOCK_WORLDS[0];
  const { conceptIntro } = world;

  // Mini interactive state to let child practice the concept
  const [testHour, setTestHour] = useState(conceptIntro.visualType === 'quarter' ? 2 : 3);
  const [testMinute, setTestMinute] = useState(
    conceptIntro.visualType === 'whole'
      ? 0
      : conceptIntro.visualType === 'half'
        ? 30
        : conceptIntro.visualType === 'quarter'
          ? 15
          : 0
  );
  const [hasInteracted, setHasInteracted] = useState(false);

  const hasSpokenRef = useRef(false);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    speak(`${conceptIntro.title}! ${conceptIntro.explanation}`);
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 300);
      return () => clearTimeout(timer);
    }
  }, [worldId]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handleClockChange = (h: number, m: number) => {
    setTestHour(h);
    setTestMinute(m);
    if (!hasInteracted) {
      setHasInteracted(true);
      trigger('success');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#fbbf24', '#38bdf8'],
      });
    }
  };

  const handleStartLevel = () => {
    initAudioContext();
    ensureAudioUnlocked();
    playSound('pop');
    trigger('success');
    onComplete();
  };

  // Visual highlight sector
  let sector: 'none' | 'quarter-over' | 'quarter-before' | 'half' = 'none';
  if (conceptIntro.visualType === 'half') sector = 'half';
  if (conceptIntro.visualType === 'quarter') sector = 'quarter-over';

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-between bg-gradient-to-b from-sky-100 via-sky-200 to-emerald-100 p-4 sm:p-6 relative overflow-y-auto">
      {/* Top Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="text-center max-w-lg mt-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/95 rounded-full border-2 border-dark shadow-sm mb-2">
          <span className="text-xl">{world.emoji}</span>
          <span className="title-font text-sm font-black text-dark">{world.name}</span>
        </div>
        <h2 className="title-font text-2xl sm:text-3xl font-black text-sky-800 drop-shadow-sm flex items-center justify-center gap-2">
          <span>{conceptIntro.title}</span>
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
          {conceptIntro.subtitle}
        </p>
      </motion.div>

      {/* Main visual demonstration card */}
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

        {/* Interactive / Demo Clock */}
        <div className="w-52 h-52 sm:w-60 sm:h-60 mb-4 mt-2">
          <ClockFace
            hours={testHour}
            minutes={testMinute}
            interactive={true}
            onChange={handleClockChange}
            highlightSector={sector}
            showHelperZones={true}
          />
        </div>

        {/* Text Explanation */}
        <div className="bg-sky-50 rounded-2xl p-3.5 sm:p-4 border-2 border-sky-200 text-center w-full">
          <p className="text-sm sm:text-base text-gray-700 font-bold leading-relaxed">
            {conceptIntro.explanation}
          </p>
        </div>

        {/* Quick hint badge */}
        <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-300">
          <Sparkles size={14} />
          <span>Probeer de wijzers zelf te draaien!</span>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-xs mb-2"
      >
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartLevel}
          className="w-full py-4 bg-[#388E3C] hover:bg-[#2e7d32] text-white rounded-full border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] text-lg font-black flex items-center justify-center gap-2 cursor-pointer transition-transform"
        >
          <span>Nu Oefenen!</span>
          <ArrowRight size={22} />
        </motion.button>
      </motion.div>
    </div>
  );
};
