import React, { useEffect, useRef, useMemo } from 'react';
import { Worlds } from '../lib/GameData';
import { Lock, Play, Star, Leaf, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';
import { RewardProgressBar, REWARDS_THRESHOLDS } from './RewardProgressBar';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext, playSound } from '../lib/audio';
import { getLeafCount } from '../lib/performanceTracker';
import { PandaAvatar } from './PandaAvatar';

interface MapProps {
  playerName: string;
  unlockedWorlds: string[];
  onSelectWorld: (id: string) => void;
  onOpenTreasury: () => void;
  onOpenPractice: () => void;
}

// ── Scenery zone definitions ─────────────────────────────────────────
// Each zone covers a range of node indices and defines the visual theme
const ZONES = [
  { name: 'tropical',  bg: 'from-green-200 via-emerald-100 to-emerald-200',    accent: '#4ade80', trees: '🌴', ground: '#86efac' },
  { name: 'jungle',    bg: 'from-emerald-200 via-green-100 to-blue-200',       accent: '#22c55e', trees: '🌿', ground: '#a3e635' },
  { name: 'cave',      bg: 'from-blue-200 via-indigo-100 to-amber-100',        accent: '#818cf8', trees: '💎', ground: '#c4b5fd' },
  { name: 'volcanic',  bg: 'from-amber-100 via-orange-100 to-slate-200',       accent: '#f97316', trees: '🌋', ground: '#fde68a' },
  { name: 'fortress',  bg: 'from-slate-200 via-purple-100 to-rose-200',        accent: '#a855f7', trees: '🏰', ground: '#e9d5ff' },
];

function getZone(nodeIndex: number) {
  const zoneIndex = Math.min(Math.floor(nodeIndex / 2), ZONES.length - 1);
  return ZONES[zoneIndex];
}

// ── Node positions along a winding path ──────────────────────────────
// The path winds left-right as it goes down. Each node has an (x%, y) position.
// We place 10 nodes + 1 practice node in a winding pattern.
function getNodePositions(totalNodes: number) {
  const positions: { x: number; y: number }[] = [];
  const startY = 400; // px from top — fully accounts for fixed header, preventing overlap
  const spacingY = 190; // px between nodes vertically

  for (let i = 0; i < totalNodes; i++) {
    // Zigzag: odd indices go right, even go left
    const xPercent = i % 2 === 0 ? 30 : 70;
    positions.push({ x: xPercent, y: startY + i * spacingY });
  }
  return positions;
}

// ── SVG path between nodes ───────────────────────────────────────────
function buildPathD(positions: { x: number; y: number }[], containerWidth: number): string {
  if (positions.length < 2) return '';

  const points = positions.map(p => ({
    x: (p.x / 100) * containerWidth,
    y: p.y,
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    // Smooth S-curves between nodes
    const cpY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export const Map: React.FC<MapProps> = ({ playerName, unlockedWorlds, onSelectWorld, onOpenTreasury, onOpenPractice }) => {
  const { trigger } = useWebHaptics();
  const hasSpokenRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const earnedCount = Worlds.filter(w => unlockedWorlds.includes(w.id)).length;
  const totalCount = Worlds.length;
  const nodePositions = useMemo(() => getNodePositions(Worlds.length), []);
  const totalHeight = nodePositions.length > 0
    ? nodePositions[nodePositions.length - 1].y + 200
    : 800;

  // Find the current (latest unlocked) node index
  const currentNodeIndex = useMemo(() => {
    let lastUnlocked = 0;
    for (let i = 0; i < Worlds.length; i++) {
      if (unlockedWorlds.includes(Worlds[i].id)) lastUnlocked = i;
    }
    return lastUnlocked;
  }, [unlockedWorlds]);

  // Extend the path to the finish line
  const pathPositions = useMemo(() => {
    if (nodePositions.length === 0) return [];
    const lastPos = nodePositions[nodePositions.length - 1];
    return [...nodePositions, { x: 50, y: lastPos.y + 160 }];
  }, [nodePositions]);

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
    speak(`Welkom ${playerName}! ${rewardText}`);
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

  // Auto-scroll to current node on mount
  useEffect(() => {
    if (scrollRef.current && nodePositions[currentNodeIndex]) {
      // 400px offset accounts for the tall fixed header, so the active node isn't hidden underneath it
      const targetY = nodePositions[currentNodeIndex].y - 400;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }, 600);
    }
  }, [currentNodeIndex, nodePositions]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative">
      {/* Fixed header overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-sky-300/95 via-sky-300/85 to-transparent pb-8 pt-4 px-4 pointer-events-none">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          className="text-center"
        >
          <h1 className="title-font text-2xl sm:text-3xl font-black text-dark drop-shadow-md">
            Panda's Getallenreis
          </h1>
        </motion.div>

        <div className="max-w-md mx-auto mt-2 pointer-events-auto">
          <RewardProgressBar
            earnedCount={earnedCount}
            totalCount={totalCount}
            onOpenTreasury={() => {
              trigger('success');
              onOpenTreasury();
            }}
          />
        </div>
      </div>

      {/* Scrollable landscape */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ minHeight: totalHeight }}
        >
          {/* Gradient background zones */}
          {ZONES.map((zone, zi) => {
            const zoneStartY = zi * (totalHeight / ZONES.length);
            const zoneHeight = totalHeight / ZONES.length;
            return (
              <div
                key={zone.name}
                className={`absolute left-0 right-0 bg-gradient-to-b ${zone.bg}`}
                style={{ top: zoneStartY, height: zoneHeight + 40 }}
              />
            );
          })}

          {/* SVG winding path */}
          <svg
            className="absolute inset-0 w-full pointer-events-none z-10"
            style={{ height: totalHeight }}
            viewBox={`0 0 400 ${totalHeight}`}
            preserveAspectRatio="none"
          >
            {/* Shadow path */}
            <path
              d={buildPathD(pathPositions, 400)}
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="0"
              transform="translate(2, 3)"
            />
            {/* Main path — beige/sandy road */}
            <path
              d={buildPathD(pathPositions, 400)}
              fill="none"
              stroke="#fde68a"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Path dashes for texture */}
            <path
              d={buildPathD(pathPositions, 400)}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="12 20"
              opacity="0.4"
            />
          </svg>

          {/* Scenery decorations */}
          {nodePositions.map((pos, i) => {
            const zone = getZone(i);
            return (
              <React.Fragment key={`scenery-${i}`}>
                {/* Trees/scenery on alternating sides */}
                <div
                  className="absolute text-2xl sm:text-3xl select-none pointer-events-none z-[5] opacity-60"
                  style={{
                    left: pos.x < 50 ? `${pos.x + 20}%` : `${pos.x - 25}%`,
                    top: pos.y - 20,
                  }}
                >
                  {zone.trees}
                </div>
                {i % 3 === 0 && (
                  <div
                    className="absolute text-xl sm:text-2xl select-none pointer-events-none z-[5] opacity-40"
                    style={{
                      left: pos.x < 50 ? `${pos.x + 35}%` : `${pos.x - 40}%`,
                      top: pos.y + 30,
                    }}
                  >
                    {zone.trees}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Clouds */}
          <div className="cloud cloud--lg absolute opacity-50 z-[5]" style={{ top: 40, left: '5%' }} />
          <div className="cloud cloud--md absolute opacity-40 z-[5]" style={{ top: 80, right: '10%' }} />
          <div className="cloud cloud--sm absolute opacity-55 z-[5]" style={{ top: totalHeight * 0.3, left: '15%' }} />
          <div className="cloud cloud--xl absolute opacity-35 z-[5]" style={{ top: totalHeight * 0.5, right: '5%' }} />
          <div className="cloud cloud--md absolute opacity-45 z-[5]" style={{ top: totalHeight * 0.7, left: '8%' }} />
          <div className="cloud cloud--lg absolute opacity-40 z-[5]" style={{ top: totalHeight * 0.85, right: '12%' }} />

          {/* Sun */}
          <div className="sun sun--sm absolute z-[5]" style={{ top: 20, right: '8%' }} />

          {/* (Removed static Oefenplein node) */}

          {/* World nodes */}
          {Worlds.map((w, index) => {
            const pos = nodePositions[index];
            const isUnlocked = unlockedWorlds.includes(w.id);
            const isCompleted = unlockedWorlds.includes(w.id) && index < currentNodeIndex;
            const isCurrent = index === currentNodeIndex;
            const zone = getZone(index);

            return (
              <motion.div
                key={w.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1 + index * 0.06,
                }}
                className="absolute z-20"
                style={{
                  left: `${pos.x}%`,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.button
                  type="button"
                  whileHover={isUnlocked ? { scale: 1.15, y: -4 } : {}}
                  whileTap={isUnlocked ? { scale: 0.9 } : {}}
                  onClick={() => {
                    if (isUnlocked) {
                      trigger('success');
                      playSound('level_complete');
                      onSelectWorld(w.id);
                    } else {
                      trigger('error');
                    }
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  {/* Node circle */}
                  <div
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-[3px_3px_0px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-br from-yellow-300 to-amber-400 border-yellow-500'
                        : isCurrent
                          ? 'bg-gradient-to-br from-green-300 to-green-500 border-green-600 ring-4 ring-green-300/50'
                          : isUnlocked
                            ? 'bg-gradient-to-br from-green-200 to-green-400 border-green-500'
                            : 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 opacity-60'
                    }`}
                  >
                    {isCompleted ? (
                      <Star className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-800" fill="currentColor" />
                    ) : isUnlocked ? (
                      <span className="title-font text-xl sm:text-2xl font-black text-white drop-shadow-sm">
                        {w.table}
                      </span>
                    ) : (
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    )}

                    {/* Pulsing ring on current */}
                    {isCurrent && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-full border-4 border-green-400"
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div
                    className={`flex flex-col items-center px-2.5 py-1 rounded-xl shadow-sm ${
                      isCompleted
                        ? 'text-amber-800 bg-yellow-100/90'
                        : isCurrent
                          ? 'text-green-800 bg-green-100/90'
                          : isUnlocked
                            ? 'text-green-700 bg-white/80'
                            : 'text-gray-500 bg-gray-100/80'
                    }`}
                  >
                    <span className="title-font text-xs sm:text-sm font-black whitespace-nowrap leading-tight">
                      {w.title}
                    </span>
                    <span className="text-[10px] sm:text-xs font-medium opacity-70 whitespace-nowrap">
                      {w.description}
                    </span>
                  </div>
                </motion.button>

                {/* Panda on current node */}
                {isCurrent && (
                  <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.5 }}
                    className="absolute -top-14 sm:-top-16 left-1/2 -translate-x-1/2"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <PandaAvatar className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg" />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Finish flag at the end */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.8 }}
            className="absolute z-20"
            style={{
              left: `${pathPositions[pathPositions.length - 1]?.x ?? 50}%`,
              top: pathPositions[pathPositions.length - 1]?.y ?? 0,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* End of road visual dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-200 border-4 border-amber-300 shadow-sm z-0" />
            
            <div className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity z-10 relative mt-[-20px]">
              <Trophy className="w-12 h-12 text-amber-500 drop-shadow-md" fill="#fde047" />
              <span className="title-font text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full shadow-sm">
                🎉 Klaar!
              </span>
            </div>
          </motion.div>

          {/* Bottom padding */}
          <div style={{ height: 120 }} />
        </div>
      </div>
      
      {/* Floating Oefenplein Button */}
      {unlockedWorlds.length >= 2 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="absolute bottom-6 right-4 sm:bottom-8 sm:right-8 z-40"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              trigger('success');
              playSound('pop');
              onOpenPractice();
            }}
            className="flex items-center gap-3 bg-white/95 backdrop-blur-sm border-4 border-emerald-400 p-2 sm:p-3 rounded-full shadow-xl hover:shadow-2xl transition-shadow"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-inner">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" />
            </div>
            <div className="flex flex-col items-start pr-3">
              <span className="title-font text-sm sm:text-base font-black text-emerald-800 leading-tight">
                Oefenplein
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-600">
                Verdien blaadjes!
              </span>
            </div>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};
