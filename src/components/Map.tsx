import React, { useEffect, useRef } from 'react';
import { Worlds } from '../lib/GameData';
import { Lock, Play, Star, Leaf } from 'lucide-react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';
import { RewardProgressBar, REWARDS_THRESHOLDS } from './RewardProgressBar';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext, playSound } from '../lib/audio';
import { getLeafCount, getDueFacts } from '../lib/performanceTracker';

interface MapProps {
  playerName: string;
  unlockedWorlds: string[];
  onSelectWorld: (id: string) => void;
  onOpenTreasury: () => void;
  onOpenPractice: () => void;
}

export const Map: React.FC<MapProps> = ({ playerName, unlockedWorlds, onSelectWorld, onOpenTreasury, onOpenPractice }) => {
  const { trigger } = useWebHaptics();
  const hasSpokenRef = useRef(false);


  const earnedCount = Worlds.filter(w => unlockedWorlds.includes(w.id)).length;
  const totalCount = Worlds.length;

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    let rewardText = '';
    if (earnedCount < totalCount) {
      const nextReward = REWARDS_THRESHOLDS.find((r) => r.count > earnedCount) || REWARDS_THRESHOLDS[REWARDS_THRESHOLDS.length - 1];
      const stickersNeeded = nextReward.count - earnedCount;
      const stickerWord = stickersNeeded === 1 ? 'sticker' : 'stickers';
      rewardText = `Nog ${stickersNeeded} ${stickerWord} tot de volgende beloning: ${nextReward.label}.`;
    } else {
      rewardText = 'Gefeliciteerd! Je hebt alle beloningen verdiend!';
    }
    const fullText = `Welkom ${playerName}! Voltooi de avonturen en verdien stickers! ${rewardText}`;
    speak(fullText);
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 400);
      return () => clearTimeout(timer);
    }
  }, [earnedCount]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 pt-8 bg-sky-200 flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden w-full">
      <motion.div
        initial={{ y: -40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, mass: 0.8 }}
        className="text-center mb-6 sm:mb-10 relative z-10 flex flex-col items-center"
      >
        <div className="flex items-center gap-2 sm:gap-4 relative inline-flex">
          <h1 className="title-font text-3xl md:text-4xl lg:text-5xl font-black text-dark drop-shadow-md">
            Welkom {playerName}!
          </h1>
        </div>
        <p className="text-base md:text-lg text-dark/80 mt-2 font-medium">Voltooi de avonturen en verdien stickers!</p>
      </motion.div>

      <div className="w-full max-w-lg mb-8 relative z-10 px-4 sm:px-0">
        <RewardProgressBar
          earnedCount={earnedCount}
          totalCount={totalCount}
          onOpenTreasury={() => {
            trigger('success');
            onOpenTreasury();
          }}
        />
      </div>

      {/* Oefenplein button — only show when at least 1 table is completed */}
      {unlockedWorlds.length >= 2 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.3 }}
          className="w-full max-w-lg mb-6 sm:mb-8 relative z-10 px-4 sm:px-0"
        >
          <motion.button
            whileHover={{ scale: 1.02, rotate: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              trigger('success');
              playSound('pop');
              onOpenPractice();
            }}
            className="w-full btn h-auto px-4 py-3 sm:px-6 sm:py-4 group rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-400 hover:border-green-500 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transition-all"
          >
            <div className="text-left flex items-center gap-3">
              <div className="bg-green-100 p-2 sm:p-3 rounded-full shadow-inner">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" fill="currentColor" />
              </div>
              <div>
                <h2 className="title-font text-base sm:text-lg font-black text-green-700">
                  Oefenplein
                </h2>
                <p className="text-green-600 font-medium text-xs sm:text-sm">
                  Oefen de tafels die je al kent!
                </p>
              </div>
            </div>
            <div className="bg-green-200 px-3 py-1.5 rounded-xl border-2 border-green-300 text-green-700 font-bold text-sm flex items-center gap-1">
              🍃 {getLeafCount()}
            </div>
          </motion.button>
        </motion.div>
      )}

      <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-lg mb-10 sm:mb-20 relative z-10">
        {Worlds.map((w, index) => {
          const isUnlocked = unlockedWorlds.includes(w.id);
          return (
            <motion.button
              key={w.id}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 16, // Low damping for extra wobbly feel
                mass: 0.8,
                delay: index * 0.05,
              }}
              whileHover={isUnlocked ? { scale: 1.03, y: -5, rotate: (index % 2 === 0 ? 1 : -1) } : {}}
              whileTap={isUnlocked ? { scale: 0.95, rotate: 0 } : {}}
              onClick={() => {
                if (isUnlocked) {
                  trigger('success');
                  playSound('level_complete');
                  onSelectWorld(w.id);
                } else {
                  trigger('error');
                }
              }}
              className={`btn h-auto px-4 py-4 md:px-6 md:py-6 group rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-between relative overflow-hidden transition-all border-4 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] ${
                isUnlocked
                  ? 'bg-white border-green-400 hover:border-green-500 cursor-pointer text-dark'
                  : 'bg-gray-200 border-gray-400 opacity-80 cursor-not-allowed'
              }`}
            >
              <div className="text-left">
                <h2 className={`title-font text-xl md:text-2xl font-black ${isUnlocked ? 'text-green-600' : 'text-gray-500'}`}>
                  {w.title}
                </h2>
                <p className="text-gray-600 font-medium text-sm md:text-lg mt-1">{w.description}</p>
              </div>

              <motion.div
                animate={isUnlocked ? { scale: [1, 1.1, 1], rotate: [0, 4, -4, 0] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
                className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex justify-center items-center shadow-inner ${isUnlocked ? 'bg-green-100 text-green-500' : 'bg-gray-300 text-gray-500'}`}
              >
                {isUnlocked ? <Play className="ml-1 w-6 h-6 md:w-7 md:h-7" size={24} /> : <Lock className="w-5 h-5 md:w-6 md:h-6" size={20} />}
              </motion.div>
            </motion.button>
          );
        })}
      </div>



      {/* ☀️ Sun */}
      <div className="sun absolute top-4 right-8" />

      {/* ☁️ Decorative clouds */}
      <div className="cloud cloud--lg absolute opacity-50" style={{ top: '5%', left: '5%' }} />
      <div className="cloud cloud--xl absolute opacity-40" style={{ top: '12%', right: '15%' }} />
      <div className="cloud cloud--md absolute opacity-55" style={{ top: '25%', left: '60%' }} />
      <div className="cloud cloud--sm absolute opacity-45" style={{ top: '8%', left: '35%' }} />
      <div className="cloud cloud--md absolute opacity-50" style={{ top: '35%', right: '5%' }} />
      <div className="cloud cloud--lg absolute opacity-35" style={{ bottom: '15%', left: '8%' }} />
      <div className="cloud cloud--sm absolute opacity-60" style={{ bottom: '25%', right: '12%' }} />
      <div className="cloud cloud--md absolute opacity-40" style={{ bottom: '8%', left: '40%' }} />
    </div>
  );
};
