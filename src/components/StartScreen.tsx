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
    <div className="flex flex-col items-center justify-center p-8 bg-sky-200 min-h-screen relative w-full overflow-hidden">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10 z-10 bg-white p-8 rounded-[2rem] shadow-xl max-w-sm w-full border-4 border-sky-300"
      >
        <h1 className="text-3xl font-bold text-dark drop-shadow-sm mb-4">Welkom bij Panda's Getallenreis!</h1>
        <p className="text-lg text-gray-600 mb-6 font-medium">Hoe heet jij?</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Je naam..."
            className="w-full text-2xl p-4 rounded-xl border-2 border-gray-300 focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100 text-center font-bold text-gray-800"
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!name.trim()}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-xl shadow-md transition-colors ${
              name.trim() ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play fill="currentColor" size={24} />
            Starten
          </motion.button>
        </form>
      </motion.div>

      {/* Decorative BG clouds */}
      <div className="absolute top-10 left-10 cloud w-24 h-12 opacity-50"></div>
      <div className="absolute top-40 right-10 cloud w-32 h-16 opacity-60"></div>
      <div className="absolute bottom-20 left-20 cloud w-20 h-10 opacity-40"></div>
    </div>
  );
};
