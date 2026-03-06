import React from 'react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';

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

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-4 bg-sky-100 h-full">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="bg-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center border-4 border-green-300"
      >
        {/* Gently bobbing panda */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 sm:w-32 sm:h-32 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative"
        >
          <span className="text-6xl sm:text-7xl">🐼</span>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute inset-0 border-4 border-dashed border-green-400 rounded-full z-0 opacity-50"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl font-black text-green-600 mb-4 tracking-tight drop-shadow-sm"
        >
          Super gedaan!
        </motion.h2>

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
          className="w-full py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-2xl font-bold text-xl sm:text-2xl shadow-[0_6px_0_0_#166534] active:shadow-[0_0px_0_0_#166534] active:translate-y-[6px] transition-all"
        >
          Terug naar de kaart 🗺️
        </motion.button>
      </motion.div>
    </div>
  );
}
