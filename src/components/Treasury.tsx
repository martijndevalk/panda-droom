import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Sparkles,
  Flame,
  Zap,
  ArrowLeft,
  Star,
  Award,
  Gift,
  Gem,
  Crown,
  Shield,
  Leaf,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Worlds } from '../lib/GameData';
import { CLOCK_WORLDS, CLOCK_BADGES } from '../lib/clockData';
import { useWebHaptics } from 'web-haptics/react';
import { RewardProgressBar } from './RewardProgressBar';
import { ParentRewardsSection } from './ParentRewardsSection';
import {
  RewardItem,
  getMathRewards,
  saveMathRewards,
  resetMathRewards,
  getClockRewards,
  saveClockRewards,
  resetClockRewards,
} from '../lib/rewardsStorage';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext, playSound } from '../lib/audio';
import { getStats } from '../lib/performanceTracker';

interface TreasuryProps {
  playerName: string;
  unlockedWorlds: string[];
  unlockedClockWorlds?: string[];
  initialTab?: 'tables' | 'clock';
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

export const Treasury: React.FC<TreasuryProps> = ({
  playerName,
  unlockedWorlds,
  unlockedClockWorlds = ['clock-world-1'],
  initialTab = 'tables',
  onBack,
  onReset,
}) => {
  const { trigger } = useWebHaptics();
  const [activeTab, setActiveTab] = useState<'tables' | 'clock'>(initialTab);
  const hasSpokenRef = useRef(false);

  // Parent rewards state
  const [mathRewards, setMathRewards] = useState<RewardItem[]>(() => getMathRewards());
  const [clockRewards, setClockRewards] = useState<RewardItem[]>(() => getClockRewards());

  const mathStickers = Worlds.map((world, i) => {
    const config = STICKER_CONFIG[i] || STICKER_CONFIG[0];
    const IconComponent = config.icon;
    return {
      title: config.title,
      tableLabel: `Tafel van ${world.table}`,
      icon: <IconComponent size={36} className={`${config.color} fill-current`} />,
      worldId: world.id,
    };
  });

  const earnedMathCount = mathStickers.filter((s) => unlockedWorlds.includes(s.worldId)).length;
  const earnedClockCount = CLOCK_BADGES.filter((b) => unlockedClockWorlds.includes(b.worldId)).length;

  const handleSpeakStatus = (tab = activeTab) => {
    initAudioContext();
    ensureAudioUnlocked();
    if (tab === 'tables') {
      speak(`Getallenreis! Wauw, je hebt al ${earnedMathCount} van de ${mathStickers.length} rekenstickers verdiend! Tik op een sticker om hem te bekijken!`);
    } else {
      speak(`Tijdreis! Wauw, je hebt al ${earnedClockCount} van de ${CLOCK_BADGES.length} klokdiploma's verdiend! Tik op een diploma om hem te horen!`);
    }
  };

  const speakSticker = (title: string, tableLabel: string, isUnlocked: boolean) => {
    initAudioContext();
    ensureAudioUnlocked();
    trigger('nudge');
    if (isUnlocked) {
      speak(`Super! De rekensticker voor ${tableLabel}: ${title}! Goed verdiend!`);
    } else {
      speak(`Deze sticker voor ${tableLabel} zit nog in de schatkist! Oefen deze tafel op de kaart om hem vrij te spelen!`);
    }
  };

  const speakStats = (leaves: number, sessions: number, streak: number) => {
    initAudioContext();
    ensureAudioUnlocked();
    trigger('nudge');
    speak(`Jouw oefenresultaten! Je hebt al ${leaves} groene blaadjes verzameld, ${sessions} keer geoefend, en jouw record is ${streak} sommen goed op een rij! Geweldig bezig!`);
  };

  const speakBadge = (title: string, subtitle: string, description: string, isUnlocked: boolean) => {
    initAudioContext();
    ensureAudioUnlocked();
    trigger('nudge');
    if (isUnlocked) {
      speak(`${title}! ${subtitle}. ${description}`);
    } else {
      speak(`Deze badge zit nog achter slot en grendel! Speel deze wereld in Tijdreis om hem vrij te spelen!`);
    }
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      playSound('treasure_open');
      const timer = setTimeout(() => handleSpeakStatus(), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handleTabChange = (tab: 'tables' | 'clock') => {
    initAudioContext();
    playSound('pop');
    trigger('nudge');
    setActiveTab(tab);
    handleSpeakStatus(tab);
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col p-2 sm:p-4 md:p-8 bg-amber-100 overflow-y-auto">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 max-w-4xl mx-auto w-full gap-2 mt-2 sm:mt-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              trigger('nudge');
              onBack();
            }}
            className="btn btn-circle bg-white border-2 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-amber-700 hover:bg-amber-50 cursor-pointer"
            aria-label="Terug"
          >
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            className="flex items-center gap-2"
          >
            <h1 className="title-font text-xl sm:text-2xl md:text-4xl font-black text-amber-900 flex items-center gap-2 md:gap-3">
              <Gift className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-600" /> Mijn Schatkist
            </h1>
          </motion.div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-white/95 p-1 rounded-full border-3 border-dark shadow-[2px_2px_0px_theme(colors.dark)]">
          <button
            type="button"
            onClick={() => handleTabChange('tables')}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'bg-emerald-500 text-white border-2 border-dark shadow-xs'
                : 'text-gray-600 hover:text-dark hover:bg-gray-100'
            }`}
          >
            <span>🔢</span>
            <span>Getallenreis ({earnedMathCount}/{mathStickers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('clock')}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'clock'
                ? 'bg-amber-400 text-dark border-2 border-dark shadow-xs'
                : 'text-gray-600 hover:text-dark hover:bg-gray-100'
            }`}
          >
            <span>⏰</span>
            <span>Tijdreis ({earnedClockCount}/{CLOCK_BADGES.length})</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ── GETALLENREIS TAB ── */}
          {activeTab === 'tables' && (
            <motion.div
              key="tables-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Progress display for Math */}
              <RewardProgressBar
                earnedCount={earnedMathCount}
                totalCount={mathStickers.length}
                thresholds={mathRewards}
                itemLabelSingular="sticker"
                itemLabelPlural="stickers"
                headerEmoji="🌟"
                className="mb-4 sm:mb-6"
              />

              {/* Grid of Math stickers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
                {mathStickers.map((s, i) => {
                  const isUnlocked = unlockedWorlds.includes(s.worldId);
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 14, delay: i * 0.04 }}
                      whileHover={isUnlocked ? { scale: 1.05, rotate: i % 2 === 0 ? 3 : -3 } : {}}
                      onClick={() => speakSticker(s.title, s.tableLabel, isUnlocked)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${s.title}, ${s.tableLabel}`}
                      className={`p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] shadow-[4px_4px_0px_theme(colors.dark)] border-4 flex flex-col items-center gap-2 text-center cursor-pointer select-none transition-transform active:scale-95 ${
                        isUnlocked ? 'bg-white border-dark' : 'bg-gray-200 border-gray-400 opacity-70'
                      }`}
                    >
                      <div className="bg-amber-100 p-3 sm:p-4 rounded-full shadow-inner">
                        {isUnlocked ? s.icon : <Star size={36} className="text-gray-400" />}
                      </div>
                      <h3
                        className={`title-font text-sm sm:text-base font-black leading-tight ${
                          isUnlocked ? 'text-amber-800' : 'text-gray-500'
                        }`}
                      >
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
                  <div
                    onClick={() => speakStats(practiceStats.leaves, practiceStats.totalReviewSessions, practiceStats.longestStreak)}
                    role="button"
                    tabIndex={0}
                    aria-label="Luister naar jouw oefenstatistieken"
                    className="bg-white p-4 sm:p-5 md:p-8 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] shadow-[6px_6px_0px_theme(colors.dark)] border-4 border-dark w-full mb-6 sm:mb-8 cursor-pointer hover:border-green-600 transition-colors"
                  >
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

              {/* Speciale Ouders Sectie voor Tafels (Herbruikbaar Component) */}
              <ParentRewardsSection
                title="Ouders Beloningen (Getallenreis)"
                description="Heeft de Panda weer een nieuwe tafel behaald? Dan mag daar natuurlijk een echte beloning tegenover staan! Je kunt deze beloningen zelf naar wens aanpassen:"
                unitPlural="tafels"
                allCompletedLabel="Alle 10 tafels"
                playerName={playerName}
                rewards={mathRewards}
                onSave={(newRewards) => {
                  saveMathRewards(newRewards);
                  setMathRewards(newRewards);
                }}
                onResetToDefaults={() => {
                  const def = resetMathRewards();
                  setMathRewards(def);
                }}
                onResetProgress={onReset}
              />
            </motion.div>
          )}

          {/* ── TIJDREIS TAB ── */}
          {activeTab === 'clock' && (
            <motion.div
              key="clock-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Progress display for Clock */}
              <RewardProgressBar
                earnedCount={earnedClockCount}
                totalCount={CLOCK_BADGES.length}
                thresholds={clockRewards}
                itemLabelSingular="klokdiploma"
                itemLabelPlural="klokdiploma's"
                headerEmoji="⏰"
                className="mb-4 sm:mb-6"
              />

              {/* Grid of Clock Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {CLOCK_BADGES.map((b, i) => {
                  const isUnlocked = unlockedClockWorlds.includes(b.worldId);
                  const matchingWorld = CLOCK_WORLDS.find((w) => w.id === b.worldId);

                  return (
                    <motion.div
                      key={b.worldId}
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 14, delay: i * 0.05 }}
                      whileHover={isUnlocked ? { scale: 1.03, y: -2 } : {}}
                      onClick={() => speakBadge(b.title, b.subtitle, b.description, isUnlocked)}
                      className={`p-4 rounded-[1.5rem] shadow-[4px_4px_0px_theme(colors.dark)] border-4 flex flex-col justify-between text-left relative transition-all cursor-pointer ${
                        isUnlocked
                          ? 'bg-white border-dark hover:border-amber-500'
                          : 'bg-gray-100 border-gray-300 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner">
                            {isUnlocked ? b.emoji : '🔒'}
                          </div>
                          {isUnlocked && (
                            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-300">
                              <CheckCircle2 size={14} className="text-emerald-600" /> Behaald
                            </span>
                          )}
                        </div>

                        <h3 className="title-font text-base sm:text-lg font-black text-amber-950 leading-tight">
                          {isUnlocked ? b.title : 'Vergrendeld Diploma'}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-amber-700 mb-2">
                          {isUnlocked ? b.subtitle : matchingWorld?.name || 'Onbekende wereld'}
                        </p>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed">
                          {isUnlocked ? b.description : 'Voltooi deze wereld in Tijdreis om deze badge te winnen!'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] font-bold text-amber-600">
                        <span>{matchingWorld ? `Wereld ${matchingWorld.stage}` : ''}</span>
                        <span className="flex items-center gap-1">
                          <Volume2 size={14} /> Klik om te horen
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Speciale Ouders Sectie voor Tijdreis (Herbruikbaar Component) */}
              <ParentRewardsSection
                title="Ouders Beloningen (Tijdreis)"
                description="Klokkijken is een geweldige mijlpaal! Motiveer je kind met leuke gezamenlijke beloningen. Je kunt deze beloningen zelf naar wens aanpassen:"
                unitPlural="werelden"
                allCompletedLabel="Alle werelden"
                playerName={playerName}
                rewards={clockRewards}
                onSave={(newRewards) => {
                  saveClockRewards(newRewards);
                  setClockRewards(newRewards);
                }}
                onResetToDefaults={() => {
                  const def = resetClockRewards();
                  setClockRewards(def);
                }}
                onResetProgress={onReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
