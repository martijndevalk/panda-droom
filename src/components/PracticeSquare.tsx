import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Worlds } from '../lib/GameData';
import { ArrowLeft, Leaf, Shuffle, Zap } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { getLeafCount, getWeakFacts, getStats, recordReviewSession } from '../lib/performanceTracker';
import { selectPracticeSession } from '../lib/reviewSelector';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext, playSound } from '../lib/audio';
import { PandaAvatar } from './PandaAvatar';
import { Level } from './Level';
import type { MathProblem } from '../lib/GameData';

interface PracticeSquareProps {
  unlockedWorlds: string[];
  onBack: () => void;
}

/**
 * Oefenplein — a free practice area where children can review
 * previously learned tables. Doesn't count towards daily limits.
 */
export function PracticeSquare({ unlockedWorlds, onBack }: PracticeSquareProps) {
  const { trigger } = useWebHaptics();
  const [leafCount, setLeafCount] = useState(() => getLeafCount());
  const [activeSession, setActiveSession] = useState<MathProblem[] | null>(null);
  const [activeWorldId, setActiveWorldId] = useState<string>('table-1');
  const hasSpokenRef = useRef(false);

  // Completed tables = all unlocked worlds (they've been played at least once)
  const completedWorlds = Worlds.filter(w => unlockedWorlds.includes(w.id));
  const completedTables = completedWorlds.map(w => w.table);

  const weakFacts = getWeakFacts(completedTables);
  const stats = getStats();

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    const weakText = weakFacts.length > 0
      ? `Er zijn ${weakFacts.length} moeilijke sommen om te oefenen!`
      : 'Kies een tafel om te oefenen!';
    speak(`Welkom op het Oefenplein! ${weakText}`);
  };

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const timer = setTimeout(() => handleSpeak(), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const startPractice = (specificTable?: number) => {
    initAudioContext();
    ensureAudioUnlocked();
    playSound('pop');
    trigger('success');

    const session = selectPracticeSession(unlockedWorlds, specificTable);
    if (session.length === 0) return;

    recordReviewSession();

    // Pick the world ID for the Level component (use first world if mixed)
    const worldId = specificTable
      ? Worlds.find(w => w.table === specificTable)?.id ?? 'table-1'
      : completedWorlds[0]?.id ?? 'table-1';

    setActiveWorldId(worldId);
    setActiveSession(session);
  };

  const handleSessionBack = () => {
    playSound('pop');
    setActiveSession(null);
    setLeafCount(getLeafCount());
  };

  const handleSessionComplete = () => {
    setActiveSession(null);
    setLeafCount(getLeafCount());
  };

  // Show the active practice session
  if (activeSession) {
    return (
      <Level
        key={`practice-${Date.now()}`}
        worldId={activeWorldId}
        unlockedWorlds={unlockedWorlds}
        onBack={handleSessionBack}
        onComplete={() => handleSessionComplete()}
        isReview
        reviewSequence={activeSession}
      />
    );
  }

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col items-center p-4 sm:p-8 pt-6 bg-green-100 relative overflow-y-auto overflow-x-hidden">
      {/* ☀️ Sun */}
      <div className="sun sun--sm absolute top-4 right-6" />

      {/* ☁️ Decorative clouds */}
      <div className="cloud cloud--lg absolute opacity-50" style={{ top: '5%', left: '5%' }} />
      <div className="cloud cloud--md absolute opacity-55" style={{ top: '12%', right: '15%' }} />
      <div className="cloud cloud--sm absolute opacity-45" style={{ top: '8%', left: '35%' }} />

      {/* Header */}
      <div className="w-full max-w-lg flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8 relative z-10">
        <button
          type="button"
          onClick={() => {
            trigger('nudge');
            onBack();
          }}
          className="btn btn-circle bg-white border-2 border-dark shadow-[2px_2px_0px_theme(colors.dark)] text-dark"
        >
          <ArrowLeft size={24} className="sm:w-8 sm:h-8" />
        </button>
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="flex items-center gap-2"
        >
          <h1 className="title-font text-2xl sm:text-3xl md:text-4xl font-black text-green-800 flex items-center gap-2">
            🍃 Oefenplein
          </h1>
        </motion.div>
      </div>

      {/* Blaadjes counter */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
        className="w-full max-w-lg mb-4 sm:mb-6 relative z-10"
      >
        <div className="bg-white rounded-[2rem] p-4 sm:p-5 text-center border-4 border-dark shadow-[6px_6px_0px_theme(colors.dark)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 sm:p-3 rounded-full shadow-inner">
              <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
            <div className="text-left">
              <p className="title-font text-lg sm:text-xl font-black text-green-700">{leafCount} Blaadjes</p>
              <p className="text-xs sm:text-sm text-green-600 font-medium">Verdien blaadjes door te oefenen!</p>
            </div>
          </div>
          {stats.longestStreak > 0 && (
            <div className="bg-amber-100 px-3 py-1.5 rounded-xl border-2 border-amber-300 text-amber-700 font-bold text-sm">
              🔥 Meeste goed op rij: {stats.longestStreak}
            </div>
          )}
        </div>
      </motion.div>

      {/* Panda */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.15 }}
        className="mb-4 sm:mb-6 relative z-10"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PandaAvatar className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md" />
        </motion.div>
      </motion.div>

      {/* Moeilijke sommen button */}
      {weakFacts.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.2 }}
          className="w-full max-w-lg mb-4 sm:mb-6 relative z-10"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, rotate: 0.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startPractice()}
            className="w-full btn h-auto px-4 py-4 sm:px-6 sm:py-5 group rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border-4 border-amber-400 hover:border-amber-500 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transition-all"
          >
            <div className="text-left flex items-center gap-3 sm:gap-4">
              <div className="bg-amber-100 p-2 sm:p-3 rounded-xl shadow-inner">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              </div>
              <div>
                <h2 className="title-font text-lg sm:text-xl font-black text-amber-700">
                  Moeilijke sommen
                </h2>
                <p className="text-amber-600 font-medium text-sm">
                  {weakFacts.length} {weakFacts.length === 1 ? 'som' : 'sommen'} om te oefenen
                </p>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-200 flex justify-center items-center text-amber-700"
            >
              <Zap className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" />
            </motion.div>
          </motion.button>
        </motion.div>
      )}

      {/* Mix button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.25 }}
        className="w-full max-w-lg mb-4 sm:mb-6 relative z-10"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, rotate: -0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => startPractice()}
          className="w-full btn h-auto px-4 py-4 sm:px-6 sm:py-5 group rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-400 hover:border-green-500 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transition-all"
        >
          <div className="text-left flex items-center gap-3 sm:gap-4">
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl shadow-inner">
              <Shuffle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div>
              <h2 className="title-font text-lg sm:text-xl font-black text-green-700">
                Mix! Alle tafels
              </h2>
              <p className="text-green-600 font-medium text-sm">
                Sommen uit al je geleerde tafels
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-200 flex justify-center items-center text-green-700"
          >
            <Shuffle className="w-6 h-6 sm:w-7 sm:h-7" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Individual table buttons */}
      <div className="w-full max-w-lg relative z-10">
        <h3 className="title-font text-lg sm:text-xl font-black text-green-800 mb-3 sm:mb-4 px-1">
          Kies een tafel:
        </h3>
        <div className="flex flex-col gap-3 sm:gap-4 mb-10 sm:mb-20">
          {completedWorlds.map((w, index) => (
            <motion.button
              key={w.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 16,
                delay: 0.3 + index * 0.05,
              }}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startPractice(w.table)}
              className="btn h-auto px-4 py-3 sm:px-6 sm:py-4 group rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-between bg-white border-4 border-green-300 hover:border-green-400 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transition-all"
            >
              <div className="text-left">
                <h2 className="title-font text-base sm:text-lg font-black text-green-700">
                  {w.title}
                </h2>
                <p className="text-green-600 font-medium text-xs sm:text-sm">{w.description}</p>
              </div>
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex justify-center items-center text-green-500">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
