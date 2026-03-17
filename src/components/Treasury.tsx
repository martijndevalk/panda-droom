import { Heart, Sparkles, LockKeyholeOpen, Flame, Zap, ArrowLeft } from 'lucide-react';
import { Star, Award, Gift, Gem, Crown, Shield, Leaf } from 'lucide-react';
import { motion } from 'motion/react';
import { Worlds } from '../lib/GameData';
import { useWebHaptics } from 'web-haptics/react';
import { RewardProgressBar, REWARDS_THRESHOLDS } from './RewardProgressBar';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext, playSound } from '../lib/audio';
import React, { useEffect, useRef } from 'react';
import { getStats } from '../lib/performanceTracker';

interface TreasuryProps {
  playerName: string;
  unlockedWorlds: string[];
  onBack: () => void;
  onReset: () => void;
}

/** Sticker icons and names for each table in learning order. */
const STICKER_CONFIG = [
  { title: 'Starter', icon: Star, color: 'text-yellow-500' },
  { title: 'Verkenner', icon: Zap, color: 'text-blue-500' },
  { title: 'Rekenwonder', icon: Award, color: 'text-purple-500' },
  { title: 'Slimmerik', icon: Sparkles, color: 'text-cyan-500' },
  { title: 'Doorzetter', icon: Heart, color: 'text-red-500' },
  { title: 'Doorbreker', icon: Flame, color: 'text-orange-500' },
  { title: 'Ster', icon: Crown, color: 'text-amber-500' },
  { title: 'Held', icon: Shield, color: 'text-green-500' },
  { title: 'Kampioen', icon: Gem, color: 'text-pink-500' },
  { title: 'Meester', icon: Award, color: 'text-indigo-500' },
];

export const Treasury: React.FC<TreasuryProps> = ({ playerName, unlockedWorlds, onBack, onReset }) => {
  const { trigger } = useWebHaptics();
  const hasSpokenRef = useRef(false);


  const stickers = Worlds.map((world, i) => {
    const config = STICKER_CONFIG[i] || STICKER_CONFIG[0];
    const IconComponent = config.icon;
    return {
      title: config.title,
      tableLabel: `Tafel van ${world.table}`,
      icon: <IconComponent size={36} className={`${config.color} fill-current`} />,
      worldId: world.id,
    };
  });

  const earnedCount = stickers.filter(s => unlockedWorlds.includes(s.worldId)).length;

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    speak(`Mijn Schatkist! Je hebt ${earnedCount} van de ${stickers.length} stickers verdiend!`);
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      playSound('treasure_open');
      const timer = setTimeout(() => handleSpeak(), 400);
      return () => clearTimeout(timer);
    }
  }, [earnedCount, stickers.length]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col p-2 sm:p-4 md:p-8 bg-amber-100 overflow-y-auto">
      <div className="flex items-center mb-4 sm:mb-6 md:mb-8 gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-0">
        <button
          type="button"
          onClick={() => {
            trigger('nudge');
            onBack();
          }}
          className="btn btn-circle bg-white border-2 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-amber-600 hover:bg-amber-50"
        >
          <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="flex items-center gap-2"
        >
          <h1 className="title-font text-xl sm:text-2xl md:text-4xl font-black text-amber-900 flex items-center gap-2 md:gap-3">
            <Gift className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" /> Mijn Schatkist
          </h1>
        </motion.div>
      </div>

      {/* Progress display */}
      <RewardProgressBar earnedCount={earnedCount} totalCount={stickers.length} className="mb-4 sm:mb-6" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-12">
        {stickers.map((s, i) => {
          const isUnlocked = unlockedWorlds.includes(s.worldId);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: i * 0.05 }}
              whileHover={isUnlocked ? { scale: 1.05, rotate: (i % 2 === 0 ? 3 : -3) } : {}}
              className={`p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] shadow-[4px_4px_0px_theme(colors.dark)] border-4 flex flex-col items-center gap-2 text-center ${
                isUnlocked ? 'bg-white border-dark' : 'bg-gray-200 border-gray-400 opacity-70'
              }`}
            >
              <div className="bg-amber-100 p-3 sm:p-4 rounded-full shadow-inner">
                {isUnlocked ? s.icon : <Star size={36} className="text-gray-400" />}
              </div>
              <h3 className={`title-font text-sm sm:text-base font-black leading-tight ${isUnlocked ? 'text-amber-800' : 'text-gray-500'}`}>
                {isUnlocked ? s.title : '???'}
              </h3>
              <p className={`text-xs sm:text-sm font-medium ${isUnlocked ? 'text-amber-600' : 'text-gray-400'}`}>
                {isUnlocked ? s.tableLabel : 'Verborgen'}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Oefen-statistieken */}
      {(() => {
        const practiceStats = getStats();
        if (practiceStats.leaves === 0 && practiceStats.totalReviewSessions === 0) return null;
        return (
          <div className="bg-white p-4 sm:p-5 md:p-8 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] shadow-[6px_6px_0px_theme(colors.dark)] border-4 border-dark max-w-2xl mx-auto w-full mb-4 sm:mb-8">
            <h2 className="title-font text-2xl font-black text-green-800 flex items-center gap-2 mb-4">
              <Leaf className="w-6 h-6" /> Hoe goed oefen jij?
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-green-50 p-3 sm:p-4 rounded-xl border-2 border-green-200 text-center">
                <p className="text-2xl sm:text-3xl font-black text-green-600">🍃 {practiceStats.leaves}</p>
                <p className="text-xs sm:text-sm font-medium text-green-700 mt-1">Blaadjes</p>
              </div>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border-2 border-blue-200 text-center">
                <p className="text-2xl sm:text-3xl font-black text-blue-600">📝 {practiceStats.totalReviewSessions}</p>
                <p className="text-xs sm:text-sm font-medium text-blue-700 mt-1">Keer geoefend</p>
              </div>
              <div className="bg-amber-50 p-3 sm:p-4 rounded-xl border-2 border-amber-200 text-center">
                <p className="text-2xl sm:text-3xl font-black text-amber-600">🔥 {practiceStats.longestStreak}</p>
                <p className="text-xs sm:text-sm font-medium text-amber-700 mt-1">Meeste goed op rij</p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="bg-white p-4 sm:p-5 md:p-8 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] shadow-[6px_6px_0px_theme(colors.dark)] border-4 border-dark max-w-2xl mx-auto w-full mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h2 className="title-font text-2xl font-black text-amber-900 flex items-center gap-2">
            <LockKeyholeOpen /> Speciale Ouders Sectie
          </h2>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95, rotate: -1 }}
            type="button"
            onClick={() => {
              const pwd = window.prompt(`Voer het ouder wachtwoord in om de voortgang van ${playerName} te resetten:`);
              if (pwd === 'panda') {
                onReset();
              } else if (pwd !== null) {
                alert('Verkeerd wachtwoord!');
              }
            }}
            style={{ backgroundColor: '#FF5A5F' }}
            className="text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-[1rem] sm:rounded-[1.25rem] border-4 border-dark shadow-[4px_4px_0px_theme(colors.dark)] text-sm sm:text-base whitespace-nowrap transition-colors flex-shrink-0"
          >
            Reset Voortgang
          </motion.button>
        </div>
        <p className="text-lg text-amber-800 mb-4">
          Heeft de Panda weer een nieuwe tafel behaald? Dan mag daar natuurlijk een <em>echte</em> beloning tegenover staan!
        </p>
        <ul className="list-disc pl-6 space-y-2 text-amber-900 text-base sm:text-lg font-medium">
          {REWARDS_THRESHOLDS.map((reward) => (
            <li key={reward.count}>
              {reward.count === 10 ? 'Alle 10 tafels' : `${reward.count} tafels uitgespeeld`} = {reward.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
