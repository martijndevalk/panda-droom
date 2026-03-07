import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

import { useWebHaptics } from 'web-haptics/react';
import { PandaAvatar } from './PandaAvatar';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext, playSound } from '../lib/audio';

interface DoneForTodayProps {
  playerName: string;
  onBackToMap: () => void;
}

/**
 * A gentle "You're done for today!" celebration screen.
 * Shown after completing a session to prevent over-exercising.
 */
export function DoneForToday({ playerName, onBackToMap }: DoneForTodayProps) {
  const { trigger } = useWebHaptics();
  const hasSpokenRef = useRef(false);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    playSound('cheer');
    speak(`Super gedaan! Goed bezig, ${playerName}! Je bent klaar voor vandaag. Morgen weer een beetje oefenen!`);
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 400);
      return () => clearTimeout(timer);
    }
  }, [playerName]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-4 bg-sky-100 h-full">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="bg-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-[8px_8px_0px_theme(colors.dark)] border-4 border-dark flex flex-col items-center max-w-sm w-full text-center"
      >
        {/* Gently bobbing panda */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 sm:w-32 sm:h-32 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative"
        >
          <PandaAvatar className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm z-10" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute inset-0 border-4 border-dashed border-green-400 rounded-full z-0 opacity-50"
          />
        </motion.div>

        <div className="flex items-center gap-2 mb-4 mt-2">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl font-black text-green-600 tracking-tight drop-shadow-sm"
          >
            Super gedaan!
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-xl sm:text-2xl text-gray-700 mb-2 font-medium"
        >
          Goed bezig, {playerName}! 🌟
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-500 mb-8 font-medium"
        >
          Je bent klaar voor vandaag. Morgen weer een beetje oefenen!
        </motion.p>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            trigger('success');
            onBackToMap();
          }}
          className="btn bg-[#388E3C] hover:bg-[#2e7d32] btn-lg w-full rounded-2xl text-white text-xl border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] transition-all"
        >
          Terug naar de kaart 🗺️
        </motion.button>
      </motion.div>
    </div>
  );
}
