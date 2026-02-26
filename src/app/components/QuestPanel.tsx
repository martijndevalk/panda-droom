import { motion } from 'motion/react';

export interface QuestProgress {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  reward: string;
  emoji?: string;
  currentLabel?: string;
  goalLabel?: string;
}

interface QuestPanelProps {
  quests: QuestProgress[];
  level: number;
  xpPercent: number; // 0-1
  xpLabel: string;
  claimedQuests: string[];
  stickersEarned: number;
  onClaim: (questId: string) => void;
}

export function QuestPanel({
  quests,
  level,
  xpPercent,
  xpLabel,
  claimedQuests,
  stickersEarned,
  onClaim,
}: QuestPanelProps) {
  const stickerLabel = stickersEarned === 1 ? 'sticker' : 'stickers';
  return (
    <div className="relative w-full rounded-[26px] border border-white/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(255,255,255,0.8))] shadow-[0_20px_40px_rgba(15,23,42,0.12)] p-6 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-b from-primary/50 to-secondary/40 opacity-70 blur-3xl pointer-events-none" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Huidige missie</p>
            <p className="text-lg font-semibold text-foreground">Level {level}</p>
          </div>
          <span className="text-xs font-medium text-foreground/60">{xpLabel}</span>
        </div>

        <div className="relative rounded-full bg-muted h-3 mt-2 overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, xpPercent * 100))}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-accent"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {Math.round(Math.min(100, Math.max(0, xpPercent * 100)))}% richting level {level + 1}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {quests.map((quest) => {
          const isCompleted = quest.current >= quest.goal;
          const displayCurrent =
            quest.currentLabel ?? (quest.id === 'precision' ? `${quest.current}%` : quest.current);
          const displayGoal = quest.goalLabel ?? quest.goal;
          const progressPercent =
            quest.goal === 0 ? 0 : Math.min(100, Math.round((quest.current / quest.goal) * 100));

          return (
            <div
              key={quest.id}
              className="bg-slate-50/90 rounded-2xl p-3 border border-white/60 shadow-inner flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{quest.emoji ?? '🏅'}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{quest.title}</p>
                    <p className="text-xs text-muted-foreground">{quest.description}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isCompleted ? 'text-emerald-600' : 'text-foreground/60'
                  }`}
                >
                  {isCompleted ? 'Voltooid' : `${displayCurrent} / ${displayGoal}`}
                </span>
              </div>

              <div className="relative bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Beloning: {quest.reward}</span>
                <button
                  onClick={() => onClaim(quest.id)}
                  disabled={!isCompleted || claimedQuests.includes(quest.id)}
                  className="px-3 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-wide transition-colors disabled:bg-slate-200 disabled:text-muted-foreground bg-primary text-primary-foreground shadow-sm disabled:shadow-none"
                >
                  {claimedQuests.includes(quest.id) ? 'Ontvangen' : 'Claim'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-r from-secondary to-accent text-primary-foreground px-4 py-3 shadow-lg flex items-center justify-between relative overflow-hidden">
        <div>
          <p className="text-sm font-semibold">Stickers verzameld</p>
          <p className="text-xs">{stickersEarned} {stickerLabel}</p>
        </div>
        <span className="text-2xl">📚</span>
      </div>
    </div>
  );
}
