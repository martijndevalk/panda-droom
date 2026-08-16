import React, { useEffect, useRef, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useWebHaptics } from 'web-haptics/react';
import { speak, stopSpeaking, ensureAudioUnlocked } from '../../lib/tts';
import { initAudioContext } from '../../lib/audio';
import { CLOCK_WORLDS } from '../../lib/clockData';
import { getClockRewards } from '../../lib/rewardsStorage';
import { RewardProgressBar } from '../RewardProgressBar';
import { JourneyHeader } from '../shared/JourneyHeader';
import { JourneyNode } from '../shared/JourneyNode';
import { JourneyFinishNode } from '../shared/JourneyFinishNode';
import { JourneyFloatingAction } from '../shared/JourneyFloatingAction';

interface ClockMapProps {
  playerName: string;
  unlockedClockWorlds: string[];
  onSelectWorld: (id: string) => void;
  onOpenTreasury: () => void;
  onOpenFreePlay: () => void;
  onSwitchToTables: () => void;
}

function getNodePositions(totalNodes: number) {
  const positions: { x: number; y: number }[] = [];
  const startY = 190; // px from top of scroll container
  const spacingY = 165;

  for (let i = 0; i < totalNodes; i++) {
    const xPercent = i % 2 === 0 ? 38 : 62;
    positions.push({ x: xPercent, y: startY + i * spacingY });
  }
  return positions;
}

function buildPathD(positions: { x: number; y: number }[], containerWidth: number): string {
  if (positions.length < 2) return '';
  const points = positions.map((p) => ({
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

export const ClockMap: React.FC<ClockMapProps> = ({
  playerName,
  unlockedClockWorlds,
  onSelectWorld,
  onOpenTreasury,
  onOpenFreePlay,
  onSwitchToTables,
}) => {
  const { trigger } = useWebHaptics();
  const hasSpokenRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const earnedCount = CLOCK_WORLDS.filter((w) => unlockedClockWorlds.includes(w.id)).length;
  const totalCount = CLOCK_WORLDS.length;
  const clockRewards = useMemo(() => getClockRewards(), []);

  const nodePositions = useMemo(() => getNodePositions(CLOCK_WORLDS.length), []);
  const totalHeight =
    nodePositions.length > 0 ? nodePositions[nodePositions.length - 1].y + 180 : 800;

  const currentNodeIndex = useMemo(() => {
    let lastUnlocked = 0;
    for (let i = 0; i < CLOCK_WORLDS.length; i++) {
      if (unlockedClockWorlds.includes(CLOCK_WORLDS[i].id)) lastUnlocked = i;
    }
    return lastUnlocked;
  }, [unlockedClockWorlds]);

  const pathPositions = useMemo(() => {
    if (nodePositions.length === 0) return [];
    const lastPos = nodePositions[nodePositions.length - 1];
    return [...nodePositions, { x: 50, y: lastPos.y + 140 }];
  }, [nodePositions]);

  const handleSpeak = () => {
    initAudioContext();
    ensureAudioUnlocked();
    let rewardText = '';
    if (earnedCount < totalCount) {
      const nextReward = clockRewards.find((r) => r.count > earnedCount) || clockRewards[clockRewards.length - 1];
      const itemsNeeded = nextReward.count - earnedCount;
      const word = itemsNeeded === 1 ? 'wereld' : 'werelden';
      rewardText = `Nog ${itemsNeeded} ${word} tot de volgende beloning: ${nextReward.label}.`;
    } else {
      rewardText = 'Gefeliciteerd! Je hebt alle klokkendiploma\'s en beloningen verdiend!';
    }
    speak(`Hoi ${playerName}! Welkom bij Panda's Tijdreis! ${rewardText}`);
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

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current && nodePositions[currentNodeIndex]) {
      const targetY = currentNodeIndex === 0 ? 0 : nodePositions[currentNodeIndex].y - 80;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }, 500);
    }
  }, [currentNodeIndex, nodePositions]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative bg-[#fef3c7]">
      {/* ── Shared Top Bar ── */}
      <JourneyHeader
        mode="clock"
        earnedCount={earnedCount}
        totalCount={totalCount}
        onOpenTreasury={onOpenTreasury}
        onSwitchJourney={onSwitchToTables}
      />

      {/* ── Scrollable Map with seamless continuous gradient ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{
          scrollBehavior: 'smooth',
          background: 'linear-gradient(180deg, #fef3c7 0%, #fed7aa 14%, #a7f3d0 32%, #bae6fd 52%, #c7d2fe 72%, #e9d5ff 88%, #fef08a 100%)',
        }}
      >
        {/* Treasury Card placed at top of scrollable map */}
        <div className="max-w-md mx-auto p-3 pt-4 relative z-20">
          <RewardProgressBar
            earnedCount={earnedCount}
            totalCount={totalCount}
            thresholds={clockRewards}
            itemLabelSingular="klokdiploma"
            itemLabelPlural="klokdiploma's"
            headerEmoji="⏰"
            onOpenTreasury={() => {
              trigger('success');
              onOpenTreasury();
            }}
          />
        </div>

        <div className="relative w-full" style={{ minHeight: totalHeight }}>
          {/* SVG Winding Path */}
          <svg
            className="absolute inset-0 w-full pointer-events-none z-10"
            style={{ height: totalHeight }}
            viewBox={`0 0 400 ${totalHeight}`}
            preserveAspectRatio="none"
          >
            <path
              d={buildPathD(pathPositions, 400)}
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="14"
              strokeLinecap="round"
              transform="translate(2, 3)"
            />
            <path
              d={buildPathD(pathPositions, 400)}
              fill="none"
              stroke="#fed7aa"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d={buildPathD(pathPositions, 400)}
              fill="none"
              stroke="#fb923c"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="10 16"
              opacity="0.4"
            />
          </svg>

          {/* Clouds */}
          <div className="cloud cloud--lg absolute opacity-50 z-[5]" style={{ top: 40, left: '6%' }} />
          <div className="cloud cloud--md absolute opacity-40 z-[5]" style={{ top: 90, right: '8%' }} />
          <div className="cloud cloud--sm absolute opacity-55 z-[5]" style={{ top: totalHeight * 0.35, left: '12%' }} />
          <div className="cloud cloud--xl absolute opacity-35 z-[5]" style={{ top: totalHeight * 0.55, right: '6%' }} />
          <div className="cloud cloud--md absolute opacity-45 z-[5]" style={{ top: totalHeight * 0.75, left: '10%' }} />

          {/* Sun */}
          <div className="sun sun--sm absolute z-[5]" style={{ top: 20, right: '8%' }} />

          {/* World Nodes */}
          {CLOCK_WORLDS.map((w, index) => {
            const pos = nodePositions[index];
            const isUnlocked = unlockedClockWorlds.includes(w.id);
            const isCompleted = unlockedClockWorlds.includes(w.id) && index < currentNodeIndex;
            const isCurrent = index === currentNodeIndex;

            return (
              <JourneyNode
                key={w.id}
                id={w.id}
                index={index}
                title={w.name}
                description={w.description}
                centerContent={
                  <span className="text-2xl sm:text-3xl">{w.emoji}</span>
                }
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                position={pos}
                theme="clock"
                onSelect={onSelectWorld}
              />
            );
          })}

          {/* Finish Trophy */}
          <JourneyFinishNode
            position={pathPositions[pathPositions.length - 1] ?? { x: 50, y: 0 }}
            label="👑 Tijdmeester!"
            theme="clock"
          />

          <div style={{ height: 120 }} />
        </div>
      </div>

      {/* ── Floating Klokkenplein (Free Play) Button ── */}
      <JourneyFloatingAction
        title="Klokkenplein"
        subtitle="Vrij draaien & spelen!"
        icon={<Clock size={18} />}
        theme="clock"
        onClick={onOpenFreePlay}
      />
    </div>
  );
};
