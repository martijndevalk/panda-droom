import React, { useState, useEffect } from 'react';
import { Map } from './Map';
import { Level } from './Level';
import { StartScreen } from './StartScreen';
import { Treasury } from './Treasury';
import { IntroScreen } from './IntroScreen';
import { DoneForToday } from './DoneForToday';
import { PracticeSquare } from './PracticeSquare';
import { ClockMap } from './clock/ClockMap';
import { ClockLevel } from './clock/ClockLevel';
import { ClockIntroScreen } from './clock/ClockIntroScreen';
import { ClockFreePlay } from './clock/ClockFreePlay';
import { Worlds } from '../lib/GameData';
import { CLOCK_WORLDS } from '../lib/clockData';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { playSound, initAudioContext, toggleBGM, isBGMEnabled, onBGMChange, offBGMChange } from '../lib/audio';
import { resetPerformanceData } from '../lib/performanceTracker';

type View =
  | 'start'
  | 'map'
  | 'intro'
  | 'level'
  | 'treasury'
  | 'done'
  | 'practice'
  | 'clock-map'
  | 'clock-intro'
  | 'clock-level'
  | 'clock-freeplay';

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

/** Check if a clock world intro has been seen. */
function hasSeenClockIntro(worldId: string): boolean {
  try {
    const seen = JSON.parse(localStorage.getItem('panda-droom-clock-intros') || '[]');
    return seen.includes(worldId);
  } catch { return false; }
}

/** Mark a clock world intro as seen. */
function markClockIntroSeen(worldId: string): void {
  try {
    const seen = JSON.parse(localStorage.getItem('panda-droom-clock-intros') || '[]');
    if (!seen.includes(worldId)) {
      seen.push(worldId);
      localStorage.setItem('panda-droom-clock-intros', JSON.stringify(seen));
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

  // Table Worlds state
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [unlockedWorlds, setUnlockedWorlds] = useState<string[]>([Worlds[0].id]);

  // Clock Worlds state
  const [currentClockWorldId, setCurrentClockWorldId] = useState<string | null>(null);
  const [unlockedClockWorlds, setUnlockedClockWorlds] = useState<string[]>([CLOCK_WORLDS[0].id]);

  // Last active journey mode for Treasury navigation
  const [lastJourney, setLastJourney] = useState<'tables' | 'clock'>('tables');

  // BGM toggle state — synced with the audio module
  const [bgmOn, setBgmOn] = useState(() => isBGMEnabled());

  useEffect(() => {
    const handler = (enabled: boolean) => setBgmOn(enabled);
    onBGMChange(handler);
    return () => offBGMChange(handler);
  }, []);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('panda-droom-unlocked');
    if (saved) {
      try {
        setUnlockedWorlds(JSON.parse(saved));
      } catch (e) {}
    }

    const savedClock = localStorage.getItem('panda-droom-clock-unlocked');
    if (savedClock) {
      try {
        setUnlockedClockWorlds(JSON.parse(savedClock));
      } catch (e) {}
    }
  }, []);

  const saveProgress = (newUnlocked: string[]) => {
    setUnlockedWorlds(newUnlocked);
    localStorage.setItem('panda-droom-unlocked', JSON.stringify(newUnlocked));
  };

  const saveClockProgress = (newUnlocked: string[]) => {
    setUnlockedClockWorlds(newUnlocked);
    localStorage.setItem('panda-droom-clock-unlocked', JSON.stringify(newUnlocked));
  };

  const handleStart = (name: string) => {
    initAudioContext();
    playSound('pop');
    setPlayerName(name);
    localStorage.setItem('panda-droom-player-name', name);
    setView('map');
  };

  // ── TABLES FLOW ──
  const handleSelectWorld = (id: string) => {
    initAudioContext();
    playSound('pop');
    setCurrentWorldId(id);
    setLastJourney('tables');

    const world = Worlds.find(w => w.id === id);
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
    const currentIndex = Worlds.findIndex(w => w.id === id);
    let nextWorldId: string | null = null;

    if (currentIndex >= 0 && currentIndex < Worlds.length - 1) {
      const nextWorld = Worlds[currentIndex + 1];
      nextWorldId = nextWorld.id;
      if (!unlockedWorlds.includes(nextWorld.id)) {
        saveProgress([...unlockedWorlds, nextWorld.id]);
      }
    }

    const completedToday = recordLevelCompletion();

    if (completedToday >= MAX_LEVELS_PER_DAY) {
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

  // ── CLOCK FLOW ──
  const handleSelectClockWorld = (id: string) => {
    initAudioContext();
    playSound('pop');
    setCurrentClockWorldId(id);
    setLastJourney('clock');

    if (!hasSeenClockIntro(id)) {
      setView('clock-intro');
    } else {
      setView('clock-level');
    }
  };

  const handleClockIntroComplete = () => {
    if (currentClockWorldId) {
      markClockIntroSeen(currentClockWorldId);
    }
    initAudioContext();
    playSound('pop');
    setView('clock-level');
  };

  const handleClockLevelComplete = (id: string, action: 'map' | 'next' = 'map') => {
    const currentIndex = CLOCK_WORLDS.findIndex(w => w.id === id);
    let nextWorldId: string | null = null;

    if (currentIndex >= 0 && currentIndex < CLOCK_WORLDS.length - 1) {
      const nextWorld = CLOCK_WORLDS[currentIndex + 1];
      nextWorldId = nextWorld.id;
      if (!unlockedClockWorlds.includes(nextWorld.id)) {
        saveClockProgress([...unlockedClockWorlds, nextWorld.id]);
      }
    }

    const completedToday = recordLevelCompletion();

    if (completedToday >= MAX_LEVELS_PER_DAY) {
      setView('done');
      setCurrentClockWorldId(null);
      return;
    }

    if (action === 'next' && nextWorldId) {
      setCurrentClockWorldId(nextWorldId);
      if (!hasSeenClockIntro(nextWorldId)) {
        setView('clock-intro');
      } else {
        setView('clock-level');
      }
    } else {
      setView('clock-map');
      setCurrentClockWorldId(null);
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
            className="w-full flex-1 flex flex-col relative min-h-0"
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
            className="w-full flex-1 flex flex-col relative min-h-0"
          >
            <Map
              playerName={playerName}
              unlockedWorlds={unlockedWorlds}
              onSelectWorld={handleSelectWorld}
              onOpenTreasury={() => {
                initAudioContext();
                playSound('pop');
                setLastJourney('tables');
                setView('treasury');
              }}
              onOpenPractice={() => { initAudioContext(); playSound('pop'); setView('practice'); }}
              onSwitchToClock={() => {
                initAudioContext();
                playSound('pop');
                setLastJourney('clock');
                setView('clock-map');
              }}
            />
          </motion.div>
        )}

        {view === 'clock-map' && (
          <motion.div
            key="clock-map"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full flex-1 flex flex-col relative min-h-0"
          >
            <ClockMap
              playerName={playerName}
              unlockedClockWorlds={unlockedClockWorlds}
              onSelectWorld={handleSelectClockWorld}
              onOpenTreasury={() => {
                initAudioContext();
                playSound('pop');
                setLastJourney('clock');
                setView('treasury');
              }}
              onOpenFreePlay={() => { initAudioContext(); playSound('pop'); setView('clock-freeplay'); }}
              onSwitchToTables={() => {
                initAudioContext();
                playSound('pop');
                setLastJourney('tables');
                setView('map');
              }}
            />
          </motion.div>
        )}

        {view === 'clock-intro' && currentClockWorldId && (
          <motion.div
            key="clock-intro"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="w-full flex-1 flex flex-col relative bg-sky-100 min-h-0"
          >
            <ClockIntroScreen
              worldId={currentClockWorldId}
              onComplete={handleClockIntroComplete}
            />
          </motion.div>
        )}

        {view === 'clock-level' && currentClockWorldId && (
          <motion.div
            key="clock-level"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="w-full flex-1 flex flex-col relative bg-sky-100 min-h-0"
          >
            <ClockLevel
              key={currentClockWorldId}
              worldId={currentClockWorldId}
              unlockedClockWorlds={unlockedClockWorlds}
              onBack={() => { initAudioContext(); playSound('pop'); setView('clock-map'); }}
              onComplete={handleClockLevelComplete}
            />
          </motion.div>
        )}

        {view === 'clock-freeplay' && (
          <motion.div
            key="clock-freeplay"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full flex-1 flex flex-col relative min-h-0"
          >
            <ClockFreePlay
              onBack={() => { initAudioContext(); playSound('pop'); setView('clock-map'); }}
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
            className="w-full flex-1 flex flex-col relative bg-sky-100 min-h-0"
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
            className="w-full flex-1 flex flex-col relative bg-sky-100 min-h-0"
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
            className="w-full flex-1 flex flex-col relative bg-sky-100 min-h-0"
          >
            <DoneForToday
              playerName={playerName}
              onBackToMap={() => { initAudioContext(); playSound('pop'); setView('map'); }}
            />
          </motion.div>
        )}

        {view === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full flex-1 flex flex-col relative min-h-0"
          >
            <PracticeSquare
              unlockedWorlds={unlockedWorlds}
              onBack={() => { initAudioContext(); playSound('pop'); setView('map'); }}
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
            className="w-full flex-1 flex flex-col relative min-h-0"
          >
            <Treasury
              playerName={playerName}
              unlockedWorlds={unlockedWorlds}
              unlockedClockWorlds={unlockedClockWorlds}
              initialTab={lastJourney}
              onBack={() => {
                initAudioContext();
                playSound('pop');
                setView(lastJourney === 'clock' ? 'clock-map' : 'map');
              }}
              onReset={() => {
                setPlayerName('');
                setUnlockedWorlds([Worlds[0].id]);
                setUnlockedClockWorlds([CLOCK_WORLDS[0].id]);
                resetPerformanceData();
                localStorage.removeItem('panda-droom-player-name');
                localStorage.removeItem('panda-droom-unlocked');
                localStorage.removeItem('panda-droom-clock-unlocked');
                localStorage.removeItem('panda-droom-daily');
                localStorage.removeItem('panda-droom-intros');
                localStorage.removeItem('panda-droom-clock-intros');
                setView('start');
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* 🔊 Floating BGM toggle (bottom-left to never overlap with bottom-right action buttons) */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={() => { initAudioContext(); toggleBGM(); }}
        aria-label={bgmOn ? 'Achtergrondmuziek uitschakelen' : 'Achtergrondmuziek inschakelen'}
        className={`fixed bottom-4 left-4 z-50 w-11 h-11 rounded-full border-3 border-dark/20 shadow-md backdrop-blur-md flex items-center justify-center cursor-pointer transition-all ${
          bgmOn ? 'bg-white/90 text-dark' : 'bg-black/20 text-gray-700'
        }`}
      >
        {bgmOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </motion.button>
    </div>
  );
}
