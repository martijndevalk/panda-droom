import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

interface StartScreenProps {
  onStart: (name: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-sky-200 h-full relative w-full overflow-hidden">
      {/* Floating panda emoji */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        className="text-6xl sm:text-7xl mb-4 z-10"
      >
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block"
        >
          🐼
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="text-center mb-6 sm:mb-10 z-10 bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl max-w-sm w-full border-4 border-sky-300"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-dark drop-shadow-sm mb-4">
          Welkom bij Panda's Getallenreis!
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-6 font-medium">
          Hoe heet jij?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Je naam..."
            className="w-full text-xl sm:text-2xl p-3 sm:p-4 rounded-xl border-2 border-gray-300 focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100 text-center font-bold text-gray-800"
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={!name.trim()}
            className={`flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl font-bold text-lg sm:text-xl shadow-md transition-colors ${
              name.trim() ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play size={24} className="text-white" />
            Starten
          </motion.button>
        </form>
      </motion.div>

      {/* Decorative BG clouds */}
      <div className="absolute top-10 left-10 cloud w-24 h-12 opacity-50" />
      <div className="absolute top-40 right-10 cloud w-32 h-16 opacity-60" />
      <div className="absolute bottom-20 left-20 cloud w-20 h-10 opacity-40" />
    </div>
  );
};
