import React from 'react';
import { Worlds } from '../lib/GameData';
import { Lock, Star, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';

interface MapProps {
  playerName: string;
  unlockedWorlds: string[];
  onSelectWorld: (id: string) => void;
  onOpenTreasury: () => void;
}

export const Map: React.FC<MapProps> = ({ playerName, unlockedWorlds, onSelectWorld, onOpenTreasury }) => {
  const { trigger } = useWebHaptics();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-sky-200 min-h-screen relative overflow-y-auto w-full">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-dark drop-shadow-md">Welkom {playerName}!</h1>
        <p className="text-lg text-dark/80 mt-2 font-medium">Voltooi de avonturen en verdien stickers!</p>
      </motion.div>

      <div className="flex flex-col gap-6 w-full max-w-lg mb-20 z-10">
        {Worlds.map((w, index) => {
          const isUnlocked = unlockedWorlds.includes(w.id);
          return (
            <motion.button
              key={w.id}
              whileHover={isUnlocked ? { scale: 1.05 } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              onClick={() => {
                if (isUnlocked) {
                  trigger('success');
                  onSelectWorld(w.id);
                } else {
                  trigger('error');
                }
              }}
              className={`p-6 rounded-[2rem] shadow-xl flex items-center justify-between border-4 relative overflow-hidden transition-all ${
                isUnlocked
                  ? 'bg-white border-green-400 cursor-pointer'
                  : 'bg-gray-200 border-gray-300 opacity-80 cursor-not-allowed'
              }`}
            >
              <div className="text-left">
                <h2 className={`text-2xl font-bold ${isUnlocked ? 'text-green-600' : 'text-gray-500'}`}>
                  {w.title}
                </h2>
                <p className="text-gray-600 font-medium text-lg">{w.description}</p>
              </div>

              <div className={`w-14 h-14 rounded-full flex justify-center items-center shadow-inner ${isUnlocked ? 'bg-green-100 text-green-500' : 'bg-gray-300 text-gray-500'}`}>
                {isUnlocked ? <Play size={28} className="ml-1" fill="currentColor" /> : <Lock size={24} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            trigger('success');
            onOpenTreasury();
          }}
          className="bg-yellow-400 border-4 border-yellow-500 text-yellow-900 px-8 py-4 rounded-full font-bold text-2xl shadow-xl flex items-center gap-3"
        >
          <Star size={32} fill="currentColor" />
          Schatkist
        </motion.button>
      </div>

      {/* Decorative BG clouds */}
      <div className="absolute top-10 left-10 cloud w-24 h-12 opacity-50"></div>
      <div className="absolute top-40 right-10 cloud w-32 h-16 opacity-60"></div>
      <div className="absolute bottom-20 left-20 cloud w-20 h-10 opacity-40"></div>
    </div>
  );
};
