export interface RewardItem {
  count: number;
  label: string;
  emoji?: string;
}

export const DEFAULT_MATH_REWARDS: RewardItem[] = [
  { count: 2, label: '15 minuten extra digitale speeltijd', emoji: '🎮' },
  { count: 4, label: 'Samen een spelletje kiezen', emoji: '🎲' },
  { count: 6, label: 'Pannenkoeken eten!', emoji: '🥞' },
  { count: 8, label: 'Samen naar de speeltuin', emoji: '🛝' },
  { count: 10, label: 'Een heel speciaal cadeau! 🎁', emoji: '🎁' },
];

export const DEFAULT_CLOCK_REWARDS: RewardItem[] = [
  { count: 2, label: '15 minuten extra voorlezen voor het slapengaan', emoji: '📖' },
  { count: 4, label: 'Samen iets lekkers kiezen of bakken', emoji: '🧁' },
  { count: 6, label: 'Het Grote Klokkendiploma & een speciaal feestcadeau!', emoji: '🎁' },
];

const MATH_REWARDS_KEY = 'panda-droom-rewards-math';
const CLOCK_REWARDS_KEY = 'panda-droom-rewards-clock';

/** Haal de huidige rekenbeloningen op uit localStorage of standaardlijst */
export function getMathRewards(): RewardItem[] {
  if (typeof window === 'undefined') return DEFAULT_MATH_REWARDS;
  try {
    const stored = localStorage.getItem(MATH_REWARDS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Fout bij laden rekenbeloningen:', e);
  }
  return DEFAULT_MATH_REWARDS;
}

/** Sla aangepaste rekenbeloningen op */
export function saveMathRewards(rewards: RewardItem[]): void {
  try {
    localStorage.setItem(MATH_REWARDS_KEY, JSON.stringify(rewards));
    window.dispatchEvent(new CustomEvent('panda-rewards-updated', { detail: { type: 'math' } }));
  } catch (e) {
    console.error('Fout bij opslaan rekenbeloningen:', e);
  }
}

/** Herstel rekenbeloningen naar de standaarden */
export function resetMathRewards(): RewardItem[] {
  try {
    localStorage.removeItem(MATH_REWARDS_KEY);
    window.dispatchEvent(new CustomEvent('panda-rewards-updated', { detail: { type: 'math' } }));
  } catch (e) {}
  return DEFAULT_MATH_REWARDS;
}

/** Haal de huidige klokbeloningen op uit localStorage of standaardlijst */
export function getClockRewards(): RewardItem[] {
  if (typeof window === 'undefined') return DEFAULT_CLOCK_REWARDS;
  try {
    const stored = localStorage.getItem(CLOCK_REWARDS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Fout bij laden klokbeloningen:', e);
  }
  return DEFAULT_CLOCK_REWARDS;
}

/** Sla aangepaste klokbeloningen op */
export function saveClockRewards(rewards: RewardItem[]): void {
  try {
    localStorage.setItem(CLOCK_REWARDS_KEY, JSON.stringify(rewards));
    window.dispatchEvent(new CustomEvent('panda-rewards-updated', { detail: { type: 'clock' } }));
  } catch (e) {
    console.error('Fout bij opslaan klokbeloningen:', e);
  }
}

/** Herstel klokbeloningen naar de standaarden */
export function resetClockRewards(): RewardItem[] {
  try {
    localStorage.removeItem(CLOCK_REWARDS_KEY);
    window.dispatchEvent(new CustomEvent('panda-rewards-updated', { detail: { type: 'clock' } }));
  } catch (e) {}
  return DEFAULT_CLOCK_REWARDS;
}
