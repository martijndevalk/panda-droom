import { Heart, Sparkles, LockKeyholeOpen, Flame, Zap, ArrowLeft } from 'lucide-react';
import { Star, Award, Gift, Gem, Crown, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Worlds } from '../lib/GameData';
import { useWebHaptics } from 'web-haptics/react';
import { RewardProgressBar, REWARDS_THRESHOLDS } from './RewardProgressBar';

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

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col p-2 sm:p-4 md:p-8 bg-amber-100 overflow-y-auto">
      <div className="flex items-center mb-4 sm:mb-6 md:mb-8 gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-0">
        <button
          type="button"
          onClick={() => {
            trigger('nudge');
            onBack();
          }}
          className="flex items-center justify-center p-2 sm:p-3 bg-white rounded-full shadow-md text-amber-600 hover:bg-amber-50"
        >
          <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-amber-900 flex items-center gap-2 md:gap-3">
          <Gift className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" /> Mijn Schatkist
        </h1>
      </div>

      {/* Progress display */}
      <RewardProgressBar earnedCount={earnedCount} totalCount={stickers.length} className="mb-4 sm:mb-6" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-12">
        {stickers.map((s, i) => {
          const isUnlocked = unlockedWorlds.includes(s.worldId);
          return (
            <motion.div
              key={i}
              whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
              className={`p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] shadow-xl border-2 sm:border-3 flex flex-col items-center gap-2 text-center ${
                isUnlocked ? 'bg-white border-yellow-400' : 'bg-gray-200 border-gray-300 opacity-60'
              }`}
            >
              <div className="bg-amber-100 p-3 sm:p-4 rounded-full shadow-inner">
                {isUnlocked ? s.icon : <Star size={36} className="text-gray-400" />}
              </div>
              <h3 className={`text-sm sm:text-base font-bold leading-tight ${isUnlocked ? 'text-amber-800' : 'text-gray-500'}`}>
                {isUnlocked ? s.title : '???'}
              </h3>
              <p className={`text-xs sm:text-sm font-medium ${isUnlocked ? 'text-amber-600' : 'text-gray-400'}`}>
                {isUnlocked ? s.tableLabel : 'Verborgen'}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white p-4 sm:p-5 md:p-8 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] shadow-lg border-2 sm:border-4 border-amber-300 max-w-2xl mx-auto w-full mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
            <LockKeyholeOpen /> Speciale Ouders Sectie
          </h2>
          <button
            type="button"
            onClick={() => {
              const pwd = window.prompt(`Voer het ouder wachtwoord in om de voortgang van ${playerName} te resetten:`);
              if (pwd === 'panda') {
                onReset();
              } else if (pwd !== null) {
                alert('Verkeerd wachtwoord!');
              }
            }}
            className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            Reset Voortgang
          </button>
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
