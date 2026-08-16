import React, { useEffect, useRef, useMemo } from 'react';
import { Worlds } from '../lib/GameData';
import { Leaf } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { RewardProgressBar } from './RewardProgressBar';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../lib/tts';
import { initAudioContext } from '../lib/audio';
import { getMathRewards } from '../lib/rewardsStorage';
import { JourneyHeader } from './shared/JourneyHeader';
import { JourneyNode } from './shared/JourneyNode';
import { JourneyFinishNode } from './shared/JourneyFinishNode';
import { JourneyFloatingAction } from './shared/JourneyFloatingAction';

interface MapProps {
  playerName: string;
  unlockedWorlds: string[];
  onSelectWorld: (id: string) => void;
  onOpenTreasury: () => void;
  onOpenPractice: () => void;
  onSwitchToClock?: () => void;
}

// ── Scenery zone definitions (for thematic trees / scenery emoji) ─────
const ZONES = [
  { name: 'tropical',  trees: '🌴' },
  { name: 'jungle',    trees: '🌿' },
  { name: 'cave',      trees: '💎' },
  { name: 'volcanic',  trees: '🌋' },
  { name: 'fortress',  trees: '🏰' },
];

function getZone(nodeIndex: number) {
  const zoneIndex = Math.min(Math.floor(nodeIndex / 2), ZONES.length - 1);
  return ZONES[zoneIndex];
}

// ── Node positions along a winding path ──────────────────────────────
function getNodePositions(totalNodes: number) {
  const positions: { x: number; y: number }[] = [];
  const startY = 200; // px from top of container
  const spacingY = 175; // px between nodes vertically

  for (let i = 0; i < totalNodes; i++) {
    const xPercent = i % 2 === 0 ? 38 : 62;
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
    const cpY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export const Map: React.FC<MapProps> = ({ 
  playerName, 
  unlockedWorlds, 
  onSelectWorld, 
  onOpenTreasury, 
  onOpenPractice, 
  onSwitchToClock 
}) => {
  const { trigger } = useWebHaptics();
  const hasSpokenRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const earnedCount = unlockedWorlds.length;
  const totalCount = Worlds.length;
  const mathRewards = useMemo(() => getMathRewards(), []);

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
      const nextReward = mathRewards.find((r) => r.count > earnedCount) || mathRewards[mathRewards.length - 1];
      const stickersNeeded = nextReward.count - earnedCount;
      const stickerWord = stickersNeeded === 1 ? 'sticker' : 'stickers';
      rewardText = `Nog ${stickersNeeded} ${stickerWord} tot de volgende beloning: ${nextReward.label}.`;
    } else {
      rewardText = 'Gefeliciteerd! Je hebt alle beloningen verdiend!';
    }
    speak(`Hoi ${playerName}! Welkom op de schatkaart! ${rewardText}`);
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
      const targetY = currentNodeIndex === 0 ? 0 : nodePositions[currentNodeIndex].y - 80;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }, 600);
    }
  }, [currentNodeIndex, nodePositions]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative bg-[#bae6fd]">
      {/* ── Shared Top Bar ── */}
      <JourneyHeader
        mode="tables"
        earnedCount={earnedCount}
        totalCount={totalCount}
        onOpenTreasury={onOpenTreasury}
        onSwitchJourney={onSwitchToClock}
      />

      {/* ── Scrollable landscape with seamless continuous gradient ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{
          scrollBehavior: 'smooth',
          background: 'linear-gradient(180deg, #bae6fd 0%, #c7f9cc 10%, #86efac 24%, #6ee7b7 40%, #93c5fd 56%, #fed7aa 72%, #fde68a 86%, #e9d5ff 100%)',
        }}
      >
        {/* Treasury Card placed inside the scrollable stream at the top */}
        <div className="max-w-md mx-auto p-3 pt-4 relative z-20">
          <RewardProgressBar
            earnedCount={earnedCount}
            totalCount={totalCount}
            thresholds={mathRewards}
            onOpenTreasury={() => {
              trigger('success');
              onOpenTreasury();
            }}
          />
        </div>
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ minHeight: totalHeight }}
        >
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

          {/* World nodes */}
          {Worlds.map((w, index) => {
            const pos = nodePositions[index];
            const isUnlocked = unlockedWorlds.includes(w.id);
            const isCompleted = unlockedWorlds.includes(w.id) && index < currentNodeIndex;
            const isCurrent = index === currentNodeIndex;

            return (
              <JourneyNode
                key={w.id}
                id={w.id}
                index={index}
                title={w.title}
                description={w.description}
                centerContent={
                  <span className="title-font text-xl sm:text-2xl font-black text-white drop-shadow-sm">
                    {w.table}
                  </span>
                }
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                position={pos}
                theme="tables"
                onSelect={onSelectWorld}
              />
            );
          })}

          {/* Finish flag at the end */}
          <JourneyFinishNode
            position={pathPositions[pathPositions.length - 1] ?? { x: 50, y: 0 }}
            label="🎉 Klaar!"
            theme="tables"
          />

          {/* Bottom padding */}
          <div style={{ height: 120 }} />
        </div>
      </div>
      
      {/* Floating Oefenplein Button */}
      {unlockedWorlds.length >= 2 && (
        <JourneyFloatingAction
          title="Oefenplein"
          subtitle="Verdien blaadjes!"
          icon={<Leaf className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />}
          theme="tables"
          onClick={onOpenPractice}
        />
      )}
    </div>
  );
};
