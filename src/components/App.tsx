import React, { useState, useEffect } from 'react';
import { Map } from './Map';
import { Level } from './Level';
import { StartScreen } from './StartScreen';
import { Treasury } from './Treasury';
import { IntroScreen } from './IntroScreen';
import { DoneForToday } from './DoneForToday';
import { Worlds } from '../lib/GameData';
import { motion, AnimatePresence } from 'motion/react';
import { playSound, initAudioContext } from '../lib/audio';

type View = 'start' | 'map' | 'intro' | 'level' | 'treasury' | 'done';

/** Max levels a child can complete in one day before seeing "done for today". */
const MAX_LEVELS_PER_DAY = 2;

/** Get today's date key for daily limit tracking. */
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-03-06"
}

/** Read how many levels were completed today. */
function getLevelsCompletedToday(): number {
  try {
    const data = JSON.parse(localStorage.getItem('panda-droom-daily') || '{}');
    if (data.date === getTodayKey()) return data.count || 0;
  } catch {}
  return 0;
}

/** Record a level completion for today. */
function recordLevelCompletion(): number {
  const todayKey = getTodayKey();
  const current = getLevelsCompletedToday();
  const newCount = current + 1;
  localStorage.setItem('panda-droom-daily', JSON.stringify({ date: todayKey, count: newCount }));
  return newCount;
}

/** Check if a world's intro has been seen. */
function hasSeenIntro(worldId: string): boolean {
  try {
    const seen = JSON.parse(localStorage.getItem('panda-droom-intros') || '[]');
    return seen.includes(worldId);
  } catch { return false; }
}

/** Mark a world's intro as seen. */
function markIntroSeen(worldId: string): void {
  try {
    const seen = JSON.parse(localStorage.getItem('panda-droom-intros') || '[]');
    if (!seen.includes(worldId)) {
      seen.push(worldId);
      localStorage.setItem('panda-droom-intros', JSON.stringify(seen));
    }
  } catch {}
}

export default function App() {
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('panda-droom-player-name') ? 'map' : 'start';
    }
    return 'start';
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('panda-droom-player-name') || '';
    }
    return '';
  });
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);

  // Starting with first table unlocked
  const [unlockedWorlds, setUnlockedWorlds] = useState<string[]>([Worlds[0].id]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('panda-droom-unlocked');
    if (saved) {
      try {
        setUnlockedWorlds(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = (newUnlocked: string[]) => {
    setUnlockedWorlds(newUnlocked);
    localStorage.setItem('panda-droom-unlocked', JSON.stringify(newUnlocked));
  };

  const handleStart = (name: string) => {
    initAudioContext();
    playSound('pop');
    setPlayerName(name);
    localStorage.setItem('panda-droom-player-name', name);
    setView('map');
  };

  const handleSelectWorld = (id: string) => {
    initAudioContext();
    playSound('pop');
    setCurrentWorldId(id);

    const world = Worlds.find(w => w.id === id);
    // Show intro if this world has one and it hasn't been seen yet
    if (world?.hasIntro && !hasSeenIntro(id)) {
      setView('intro');
    } else {
      setView('level');
    }
  };

  const handleIntroComplete = () => {
    if (currentWorldId) {
      markIntroSeen(currentWorldId);
    }
    initAudioContext();
    playSound('pop');
    setView('level');
  };

  const handleLevelComplete = (id: string, action: 'map' | 'next' = 'map') => {
    // Find next world
    const currentIndex = Worlds.findIndex(w => w.id === id);
    let nextWorldId: string | null = null;

    if (currentIndex >= 0 && currentIndex < Worlds.length - 1) {
      const nextWorld = Worlds[currentIndex + 1];
      nextWorldId = nextWorld.id;
      if (!unlockedWorlds.includes(nextWorld.id)) {
        saveProgress([...unlockedWorlds, nextWorld.id]);
      }
    }

    // Record daily completion and check limit
    const completedToday = recordLevelCompletion();

    if (completedToday >= MAX_LEVELS_PER_DAY) {
      // Show "done for today" screen
      setView('done');
      setCurrentWorldId(null);
      return;
    }

    if (action === 'next' && nextWorldId) {
      setCurrentWorldId(nextWorldId);
      const nextWorld = Worlds.find(w => w.id === nextWorldId);
      if (nextWorld?.hasIntro && !hasSeenIntro(nextWorldId)) {
        setView('intro');
      } else {
        setView('level');
      }
    } else {
      setView('map');
      setCurrentWorldId(null);
    }
  };

  const currentWorld = currentWorldId ? Worlds.find(w => w.id === currentWorldId) : null;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full flex-1 flex flex-col relative"
          >
            <StartScreen onStart={handleStart} />
          </motion.div>
        )}

        {view === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full flex-1 flex flex-col relative"
          >
            <Map
              playerName={playerName}
              unlockedWorlds={unlockedWorlds}
              onSelectWorld={handleSelectWorld}
              onOpenTreasury={() => { initAudioContext(); playSound('pop'); setView('treasury'); }}
            />
          </motion.div>
        )}

        {view === 'intro' && currentWorld && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="w-full flex-1 flex flex-col relative bg-sky-100"
          >
            <IntroScreen
              table={currentWorld.table}
              onComplete={handleIntroComplete}
            />
          </motion.div>
        )}

        {view === 'level' && currentWorldId && (
          <motion.div
            key="level"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="w-full flex-1 flex flex-col relative bg-sky-100"
          >
            <Level
              key={currentWorldId}
              worldId={currentWorldId}
              unlockedWorlds={unlockedWorlds}
              onBack={() => { initAudioContext(); playSound('pop'); setView('map'); }}
              onComplete={handleLevelComplete}
            />
          </motion.div>
        )}

        {view === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="w-full flex-1 flex flex-col relative bg-sky-100"
          >
            <DoneForToday
              playerName={playerName}
              onBackToMap={() => { initAudioContext(); playSound('pop'); setView('map'); }}
            />
          </motion.div>
        )}

        {view === 'treasury' && (
          <motion.div
            key="treasury"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full flex-1 flex flex-col relative"
          >
            <Treasury
              playerName={playerName}
              unlockedWorlds={unlockedWorlds}
              onBack={() => { initAudioContext(); playSound('pop'); setView('map'); }}
              onReset={() => {
                setPlayerName('');
                setUnlockedWorlds([Worlds[0].id]);
                localStorage.removeItem('panda-droom-player-name');
                localStorage.removeItem('panda-droom-unlocked');
                localStorage.removeItem('panda-droom-daily');
                localStorage.removeItem('panda-droom-intros');
                setView('start');
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
