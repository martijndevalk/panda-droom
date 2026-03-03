import React, { useState, useEffect } from 'react';
import { Map } from './Map';
import { Level } from './Level';
import { StartScreen } from './StartScreen';
import { Treasury } from './Treasury';
import { Worlds } from '../lib/GameData';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../lib/audio';

type View = 'start' | 'map' | 'level' | 'treasury';

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

  // Starting with world-1 unlocked.
  const [unlockedWorlds, setUnlockedWorlds] = useState<string[]>(['world-1']);

  // Optionally persist progress to localStorage
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
    playSound('pop');
    setPlayerName(name);
    localStorage.setItem('panda-droom-player-name', name);
    setView('map');
  };

  const handleSelectWorld = (id: string) => {
    playSound('pop');
    setCurrentWorldId(id);
    setView('level');
  };

  const handleLevelComplete = (id: string) => {
    // Find next world
    const currentIndex = Worlds.findIndex(w => w.id === id);
    if (currentIndex >= 0 && currentIndex < Worlds.length - 1) {
      const nextWorld = Worlds[currentIndex + 1];
      if (!unlockedWorlds.includes(nextWorld.id)) {
        saveProgress([...unlockedWorlds, nextWorld.id]);
      }
    }
    setView('map');
    setCurrentWorldId(null);
  };

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {view === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full h-full absolute inset-0"
          >
            <StartScreen onStart={handleStart} />
          </motion.div>
        )}

        {view === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="w-full h-full absolute inset-0"
          >
            <Map
              playerName={playerName}
              unlockedWorlds={unlockedWorlds}
              onSelectWorld={handleSelectWorld}
              onOpenTreasury={() => { playSound('pop'); setView('treasury'); }}
            />
          </motion.div>
        )}

        {view === 'level' && currentWorldId && (
          <motion.div
            key="level"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full h-full absolute inset-0 bg-sky-100" // To prevent white flash
          >
            <Level
              worldId={currentWorldId}
              onBack={() => { playSound('pop'); setView('map'); }}
              onComplete={handleLevelComplete}
            />
          </motion.div>
        )}

        {view === 'treasury' && (
          <motion.div
            key="treasury"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="w-full h-full absolute inset-0"
          >
            <Treasury
              playerName={playerName}
              unlockedWorlds={unlockedWorlds}
              onBack={() => { playSound('pop'); setView('map'); }}
              onReset={() => {
                setPlayerName('');
                setUnlockedWorlds(['world-1']);
                localStorage.removeItem('panda-droom-player-name');
                localStorage.removeItem('panda-droom-unlocked');
                setView('start');
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
