export type ClockProblemType = 'read' | 'set' | 'digital';

export interface ClockProblem {
  id: string;
  type: ClockProblemType;
  hours: number; // 1-12 (or 0-23 for digital)
  minutes: number; // 0-59
  display24Hour?: number; // 0-23 for digital mode
  questionText: string;
  spokenText: string;
  correctAnswer: string; // The canonical Dutch phrase e.g. "half 4" or "14:30"
  options?: string[]; // Multiple choice options (for 'read' / 'digital' mode)
  hintText: string;
  targetHours: number; // The target answer hours (1-12)
  targetMinutes: number; // The target answer minutes (0-59)
}

export interface ClockWorld {
  id: string;
  stage: number;
  emoji: string;
  name: string;
  title: string;
  description: string;
  conceptIntro: {
    title: string;
    subtitle: string;
    explanation: string;
    visualType: 'whole' | 'half' | 'quarter' | 'five-ten' | 'half-minutes' | 'digital';
  };
  generateSequence: (count?: number) => ClockProblem[];
  requiredScore: number;
}

const DUTCH_NUMBER_WORDS: Record<number, string> = {
  1: 'één',
  2: 'twee',
  3: 'drie',
  4: 'vier',
  5: 'vijf',
  6: 'zes',
  7: 'zeven',
  8: 'acht',
  9: 'negen',
  10: 'tien',
  11: 'elf',
  12: 'twaalf',
};

/**
 * Returns canonical next hour (12 -> 1, 1 -> 2, etc.)
 */
export function getNextHour(hour: number): number {
  const norm = ((hour - 1) % 12) + 1;
  return norm === 12 ? 1 : norm + 1;
}

/**
 * Returns Dutch time text (e.g. "half 4", "kwart over 3", "5 voor half 6")
 */
export function getDutchTimeText(hours: number, minutes: number): string {
  const h = ((hours - 1) % 12) + 1;
  const nextH = getNextHour(h);

  switch (minutes) {
    case 0:
      return `${h} uur`;
    case 5:
      return `5 over ${h}`;
    case 10:
      return `10 over ${h}`;
    case 15:
      return `kwart over ${h}`;
    case 20:
      return `10 voor half ${nextH}`;
    case 25:
      return `5 voor half ${nextH}`;
    case 30:
      return `half ${nextH}`;
    case 35:
      return `5 over half ${nextH}`;
    case 40:
      return `10 over half ${nextH}`;
    case 45:
      return `kwart voor ${nextH}`;
    case 50:
      return `10 voor ${nextH}`;
    case 55:
      return `5 voor ${nextH}`;
    default:
      if (minutes < 30) {
        return `${minutes} over ${h}`;
      } else {
        return `${60 - minutes} voor ${nextH}`;
      }
  }
}

/**
 * Returns full Dutch spoken text with written number words for TTS
 */
export function getDutchTimeSpoken(hours: number, minutes: number): string {
  const h = ((hours - 1) % 12) + 1;
  const nextH = getNextHour(h);
  const hWord = DUTCH_NUMBER_WORDS[h] || `${h}`;
  const nextHWord = DUTCH_NUMBER_WORDS[nextH] || `${nextH}`;

  switch (minutes) {
    case 0:
      return `${hWord} uur`;
    case 5:
      return `vijf over ${hWord}`;
    case 10:
      return `tien over ${hWord}`;
    case 15:
      return `kwart over ${hWord}`;
    case 20:
      return `tien voor half ${nextHWord}`;
    case 25:
      return `vijf voor half ${nextHWord}`;
    case 30:
      return `half ${nextHWord}`;
    case 35:
      return `vijf over half ${nextHWord}`;
    case 40:
      return `tien over half ${nextHWord}`;
    case 45:
      return `kwart voor ${nextHWord}`;
    case 50:
      return `tien voor ${nextHWord}`;
    case 55:
      return `vijf voor ${nextHWord}`;
    default:
      if (minutes < 30) {
        return `${minutes} over ${hWord}`;
      } else {
        return `${60 - minutes} voor ${nextHWord}`;
      }
  }
}

/**
 * Formats time as digital 24h string (e.g. "14:30")
 */
export function formatDigitalTime(hours: number, minutes: number): string {
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hStr}:${mStr}`;
}

/**
 * Helper to generate unique wrong options for multiple choice
 */
function generateWrongOptions(correctH: number, correctM: number, allowedMinutes: number[]): string[] {
  const correctText = getDutchTimeText(correctH, correctM);
  const optionsSet = new Set<string>([correctText]);
  const candidates: { h: number; m: number }[] = [];

  // Common confusions in Dutch clock reading:
  // 1. For "half 4", children often pick "half 3"
  if (correctM === 30) {
    const prevH = correctH === 1 ? 12 : correctH - 1;
    candidates.push({ h: prevH, m: 30 }); // "half (correctH)"
  }
  // 2. Kwart over vs Kwart voor
  if (correctM === 15) {
    candidates.push({ h: correctH, m: 45 });
  } else if (correctM === 45) {
    candidates.push({ h: correctH, m: 15 });
  }
  // 3. Different hour with same minute
  for (let delta = -2; delta <= 2; delta++) {
    if (delta !== 0) {
      let candidateH = correctH + delta;
      if (candidateH < 1) candidateH += 12;
      if (candidateH > 12) candidateH -= 12;
      candidates.push({ h: candidateH, m: correctM });
    }
  }
  // 4. Different minute with same hour
  for (const m of allowedMinutes) {
    if (m !== correctM) {
      candidates.push({ h: correctH, m });
    }
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const cand of candidates) {
    const text = getDutchTimeText(cand.h, cand.m);
    if (!optionsSet.has(text)) {
      optionsSet.add(text);
      if (optionsSet.size >= 4) break;
    }
  }

  // Fallback if needed
  while (optionsSet.size < 4) {
    const randH = Math.floor(Math.random() * 12) + 1;
    const randM = allowedMinutes[Math.floor(Math.random() * allowedMinutes.length)];
    optionsSet.add(getDutchTimeText(randH, randM));
  }

  // Convert to array and shuffle
  const result = Array.from(optionsSet);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generate problem list for a world
 */
const READ_QUESTION_TEMPLATES = [
  { text: 'Hoe laat is het op de klok?', spoken: 'Hoe laat is het op de klok?' },
  { text: 'Kijk naar de klok: hoe laat is het?', spoken: 'Kijk goed naar de klok! Hoe laat is het?' },
  { text: 'Welke tijd wijzen de wijzers aan?', spoken: 'Welke tijd wijzen de wijzers aan?' },
  { text: 'Hoe laat tikt de klok nu?', spoken: 'Hoe laat tikt de klok nu?' },
  { text: 'Weet jij hoe laat het hier is?', spoken: 'Weet jij hoe laat het hier is?' },
  { text: 'Wat zegt de klok?', spoken: 'Wat zegt de klok?' },
];

function getSetQuestionTemplate(timeText: string, timeSpoken: string) {
  const templates = [
    { text: `Zet de klok op ${timeText}!`, spoken: `Zet de klok op ${timeSpoken}!` },
    { text: `Draai de wijzers naar ${timeText}!`, spoken: `Draai de wijzers naar ${timeSpoken}!` },
    { text: `Kun jij de klok op ${timeText} zetten?`, spoken: `Kun jij de klok op ${timeSpoken} zetten?` },
    { text: `Help Panda! Maak de tijd: ${timeText}.`, spoken: `Help Panda! Maak de tijd: ${timeSpoken}!` },
    { text: `Zet de grote en kleine wijzer op ${timeText}!`, spoken: `Zet de grote en kleine wijzer op ${timeSpoken}!` },
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function createProblemsForMinutes(
  allowedMinutes: number[],
  includeSetMode: boolean = true,
  count: number = 8,
  worldHintTemplate: (h: number, m: number) => string
): ClockProblem[] {
  const problems: ClockProblem[] = [];
  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (let i = 0; i < count; i++) {
    const randH = hoursList[Math.floor(Math.random() * hoursList.length)];
    const randM = allowedMinutes[Math.floor(Math.random() * allowedMinutes.length)];
    const correctDutch = getDutchTimeText(randH, randM);
    const spoken = getDutchTimeSpoken(randH, randM);

    // Alternate between 'read' and 'set' if enabled
    const type: ClockProblemType = includeSetMode && i % 2 === 1 ? 'set' : 'read';

    if (type === 'set') {
      const setPrompt = getSetQuestionTemplate(correctDutch, spoken);
      problems.push({
        id: `prob-${i}-${randH}-${randM}-set`,
        type: 'set',
        hours: (randH + 3) % 12 + 1, // Start hands in different position
        minutes: 0,
        questionText: setPrompt.text,
        spokenText: setPrompt.spoken,
        correctAnswer: correctDutch,
        hintText: worldHintTemplate(randH, randM),
        targetHours: randH,
        targetMinutes: randM,
      });
    } else {
      const options = generateWrongOptions(randH, randM, allowedMinutes);
      const readPrompt = READ_QUESTION_TEMPLATES[i % READ_QUESTION_TEMPLATES.length];
      problems.push({
        id: `prob-${i}-${randH}-${randM}-read`,
        type: 'read',
        hours: randH,
        minutes: randM,
        questionText: readPrompt.text,
        spokenText: readPrompt.spoken,
        correctAnswer: correctDutch,
        options,
        hintText: worldHintTemplate(randH, randM),
        targetHours: randH,
        targetMinutes: randM,
      });
    }
  }

  // Shuffle sequence
  for (let i = problems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [problems[i], problems[j]] = [problems[j], problems[i]];
  }

  return problems;
}

export const CLOCK_WORLDS: ClockWorld[] = [
  {
    id: 'clock-world-1',
    stage: 1,
    emoji: '⏰',
    name: 'Uurwijzer Baai',
    title: '⏰ Uurwijzer Baai',
    description: 'Hele uren leren',
    conceptIntro: {
      title: 'Hele Uren',
      subtitle: 'De grote blauwe wijzer staat recht omhoog op de 12!',
      explanation: 'Als de grote blauwe wijzer recht omhoog naar de 12 wijst, is het een heel uur. Alsof de klok roept: BAM, heel uur! Kijk naar de kleine rode wijzer om te zien welk uur het precies is!',
      visualType: 'whole',
    },
    requiredScore: 8,
    generateSequence: (count = 8) =>
      createProblemsForMinutes([0], true, count, (h, _m) =>
        `De grote blauwe wijzer staat op de 12. De kleine rode wijzer wijst naar de ${h}. Het is dus precies ${h} uur!`
      ),
  },
  {
    id: 'clock-world-2',
    stage: 2,
    emoji: '🌓',
    name: 'Het Halve Uur Bos',
    title: '🌓 Het Halve Uur Bos',
    description: 'Halve uren leren (zoals half 4)',
    conceptIntro: {
      title: 'Halve Uren',
      subtitle: 'De grote wijzer hangt onderaan op de 6!',
      explanation: 'Als de grote wijzer onderaan op de 6 staat, hangt hij even uit te rusten: het is een half uur! In Nederland zeggen we altijd naar welk uur we al onderweg zijn. Wandelt de kleine wijzer naar de 4? Dan is het dus al half 4!',
      visualType: 'half',
    },
    requiredScore: 8,
    generateSequence: (count = 8) =>
      createProblemsForMinutes([0, 30], true, count, (h, m) => {
        if (m === 0) return `De grote wijzer staat op 12: het is ${h} uur.`;
        const nextH = getNextHour(h);
        return `De grote wijzer staat op de 6. De kleine wijzer is al over de helft, op weg naar de ${nextH}. Het is dus half ${nextH}!`;
      }),
  },
  {
    id: 'clock-world-3',
    stage: 3,
    emoji: '🍰',
    name: 'Kwartier Vallei',
    title: '🍰 Kwartier Vallei',
    description: 'Kwart over en kwart voor',
    conceptIntro: {
      title: 'Kwartieren',
      subtitle: 'Tijd voor een puntje taart!',
      explanation: 'Zie de klok als een grote ronde verjaardagstaart! Staat de grote wijzer op de 3? Dan is er al een lekker kwartje voorbij: kwart over! Staat hij op de 9? Dan duurt het nog maar één puntje tot het volgende uur: kwart voor!',
      visualType: 'quarter',
    },
    requiredScore: 8,
    generateSequence: (count = 8) =>
      createProblemsForMinutes([0, 15, 30, 45], true, count, (h, m) => {
        const nextH = getNextHour(h);
        if (m === 15) return `De grote wijzer staat op de 3: dat is een kwartier voorbij, dus kwart over ${h}.`;
        if (m === 45) return `De grote wijzer staat op de 9: nog één kwartiertje tot het volgende uur, dus kwart voor ${nextH}.`;
        if (m === 30) return `De grote wijzer staat op de 6: dat is precies half ${nextH}.`;
        return `De grote wijzer staat op 12: het is ${h} uur.`;
      }),
  },
  {
    id: 'clock-world-4',
    stage: 4,
    emoji: '🌿',
    name: 'Minuten Jungle',
    title: '🌿 Minuten Jungle',
    description: '5 & 10 minuten over en voor heel',
    conceptIntro: {
      title: '5 & 10 Minuten',
      subtitle: 'Huppelen met sprongen van 5!',
      explanation: 'Elk cijfer op de klok is een geheim sprongetje van 5 minuten! Staat de wijzer op de 1? 5 over! Op de 2? 10 over! Aan de overkant bij de 10 is het 10 voor, en bij de 11 is het 5 voor het hele uur!',
      visualType: 'five-ten',
    },
    requiredScore: 8,
    generateSequence: (count = 8) =>
      createProblemsForMinutes([0, 5, 10, 15, 30, 45, 50, 55], true, count, (h, m) => {
        const nextH = getNextHour(h);
        if (m === 0) return `De grote wijzer staat recht omhoog op de 12: het is ${h} uur.`;
        if (m === 5) return `De grote wijzer staat op de 1: 5 minuten over ${h}.`;
        if (m === 10) return `De grote wijzer staat op de 2: 10 minuten over ${h}.`;
        if (m === 15) return `De grote wijzer staat op de 3: kwart over ${h}.`;
        if (m === 30) return `De grote wijzer staat op de 6: half ${nextH}.`;
        if (m === 45) return `De grote wijzer staat op de 9: kwart voor ${nextH}.`;
        if (m === 50) return `De grote wijzer staat op de 10: 10 minuten voor ${nextH}.`;
        if (m === 55) return `De grote wijzer staat op de 11: nog maar 5 minuutjes voor ${nextH}.`;
        return `Kijk goed naar de grote blauwe minutenwijzer!`;
      }),
  },
  {
    id: 'clock-world-5',
    stage: 5,
    emoji: '🌋',
    name: 'Magische Wijzerberg',
    title: '🌋 Magische Wijzerberg',
    description: '5 & 10 voor en over het halve uur',
    conceptIntro: {
      title: 'Rondom het Halve Uur',
      subtitle: 'Kriebelen rondom de 6!',
      explanation: 'Nu wordt het een feestje rondom de 6! Staat de wijzer op de 4? Dan is het 10 voor half. Op de 5 is het 5 voor half. Voorbij de 6 op de 7 is het 5 over half, en op de 8 is het 10 over half!',
      visualType: 'half-minutes',
    },
    requiredScore: 8,
    generateSequence: (count = 8) =>
      createProblemsForMinutes([20, 25, 30, 35, 40], true, count, (h, m) => {
        const nextH = getNextHour(h);
        if (m === 20) return `De grote wijzer staat op de 4: nog 10 minuutjes tot half ${nextH}. Dus 10 voor half ${nextH}.`;
        if (m === 25) return `De grote wijzer staat op de 5: nog 5 minuutjes tot half ${nextH}. Dus 5 voor half ${nextH}.`;
        if (m === 30) return `De grote wijzer staat precies op de 6: half ${nextH}.`;
        if (m === 35) return `De grote wijzer staat op de 7: 5 minuten voorbij half ${nextH}. Dus 5 over half ${nextH}.`;
        if (m === 40) return `De grote wijzer staat op de 8: 10 minuten voorbij half ${nextH}. Dus 10 over half ${nextH}.`;
        return `De wijzer staat vlakbij de 6 (het halve uur).`;
      }),
  },
  {
    id: 'clock-world-6',
    stage: 6,
    emoji: '👑',
    name: 'Het Grote Tijd Kasteel',
    title: '👑 Het Grote Tijd Kasteel',
    description: 'Analoge + Digitale Klok Meester',
    conceptIntro: {
      title: 'De Digitale Klok',
      subtitle: 'Klokkijken in geheime cijfers!',
      explanation: 'Op een digitale klok zie je geen wijzers maar getallen! Links staan de uren en rechts de minuten. 03:30 is half 4 in de nacht (snurk!), en 15:30 is half 4 in de middag (koekjestijd)!',
      visualType: 'digital',
    },
    requiredScore: 10,
    generateSequence: (count = 10) => {
      const allMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const baseProblems = createProblemsForMinutes(allMinutes, true, count, (h, m) =>
        `Analoge en digitale tijd horen bij elkaar: ${getDutchTimeText(h, m)} is hetzelfde als ${formatDigitalTime(h, m)} op een cijferklok.`
      );

      // Convert some problems into digital matching
      return baseProblems.map((p, idx) => {
        if (idx % 2 === 0) {
          const isAfternoon = idx % 4 === 0;
          // In 24h clock: 12 in the afternoon is 12:00, 1pm is 13:00. Morning 12 is 00:00 (or 12:00 for mid-day)
          const displayH = isAfternoon
            ? (p.targetHours % 12) + 12
            : p.targetHours;
          const digitalStr = formatDigitalTime(displayH, p.targetMinutes);
          const spokenDutchTime = getDutchTimeSpoken(p.targetHours, p.targetMinutes);
          const dutchTimeLabel = getDutchTimeText(p.targetHours, p.targetMinutes);

          // Generate unique digital options
          const digitalOptionsSet = new Set<string>([digitalStr]);
          const candidateHours = [
            (displayH + 1) % 24,
            (displayH + 12) % 24,
            (displayH + 23) % 24,
            (displayH + 2) % 24,
          ];
          const candidateMinutes = [
            (p.targetMinutes + 30) % 60,
            (p.targetMinutes + 15) % 60,
            (p.targetMinutes + 45) % 60,
          ];

          for (const candH of candidateHours) {
            digitalOptionsSet.add(formatDigitalTime(candH, p.targetMinutes));
            if (digitalOptionsSet.size >= 4) break;
          }
          for (const candM of candidateMinutes) {
            if (digitalOptionsSet.size >= 4) break;
            digitalOptionsSet.add(formatDigitalTime(displayH, candM));
          }

          const optionsList = Array.from(digitalOptionsSet).slice(0, 4);
          for (let i = optionsList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsList[i], optionsList[j]] = [optionsList[j], optionsList[i]];
          }

          const digitalTemplates = [
            { text: `Welke digitale tijd hoort bij ${dutchTimeLabel}?`, spoken: `Welke digitale tijd hoort bij ${spokenDutchTime}?` },
            { text: `Zoek de cijferklok voor ${dutchTimeLabel}!`, spoken: `Zoek de cijferklok voor ${spokenDutchTime}!` },
            { text: `Hoe ziet ${dutchTimeLabel} eruit in cijfers?`, spoken: `Hoe ziet ${spokenDutchTime} eruit in digitale cijfers?` },
            { text: `Welke getallenklok wijst ${dutchTimeLabel} aan?`, spoken: `Welke getallenklok wijst ${spokenDutchTime} aan?` },
          ];
          const digiPrompt = digitalTemplates[idx % digitalTemplates.length];

          return {
            ...p,
            type: 'digital' as ClockProblemType,
            display24Hour: displayH,
            questionText: digiPrompt.text,
            spokenText: digiPrompt.spoken,
            correctAnswer: digitalStr,
            options: optionsList,
          };
        }
        return p;
      });
    },
  },
];

export interface ClockBadge {
  worldId: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  description: string;
}

export const CLOCK_BADGES: ClockBadge[] = [
  {
    worldId: 'clock-world-1',
    title: 'Uurmeester',
    subtitle: 'Hele Uren Diploma',
    emoji: '⏰',
    color: 'text-amber-500',
    description: 'Weet precies wanneer de grote wijzer rechtop staat als een soldaatje!',
  },
  {
    worldId: 'clock-world-2',
    title: 'Half-Uur Speurneus',
    subtitle: 'Halve Uren Diploma',
    emoji: '🌓',
    color: 'text-teal-500',
    description: 'Snapt dat de wijzer op de 6 al lekker onderweg is naar het volgende uur!',
  },
  {
    worldId: 'clock-world-3',
    title: 'Kwartier Kampioen',
    subtitle: 'Kwartieren Diploma',
    emoji: '🍰',
    color: 'text-blue-500',
    description: 'Kwart over en kwart voor smaken voor jou net zo lekker als taart!',
  },
  {
    worldId: 'clock-world-4',
    title: 'Minuten Verkenner',
    subtitle: '5 & 10 Minuten Diploma',
    emoji: '🌿',
    color: 'text-emerald-500',
    description: 'Hopt razendsnel met sprongen van 5 minuten door de klokkenjungle!',
  },
  {
    worldId: 'clock-world-5',
    title: 'Tijd Tovenaar',
    subtitle: 'Voor & Over Half Diploma',
    emoji: '🌋',
    color: 'text-purple-500',
    description: 'Hocus pocus! 10 voor half en 5 over half tover jij zo uit je mouw!',
  },
  {
    worldId: 'clock-world-6',
    title: 'Grootmeester van de Tijd',
    subtitle: 'Klokken Koning(in)',
    emoji: '👑',
    color: 'text-rose-500',
    description: 'Leest zowel wijzers als cijferklokken alsof het niks is! Panda buigt voor jou!',
  },
];

export interface ClockRewardThreshold {
  count: number;
  label: string;
  emoji: string;
  text: string;
}

export const CLOCK_REWARDS_THRESHOLDS: ClockRewardThreshold[] = [
  { count: 2, label: '15 minuten extra voorlezen voor het slapengaan 📖', emoji: '📖', text: '15 min extra voorlezen' },
  { count: 4, label: 'Samen iets lekkers kiezen of bakken 🧁', emoji: '🧁', text: 'Zelf iets lekkers kiezen' },
  { count: 6, label: 'Het Grote Klokkendiploma & een speciaal feestcadeau! 🎁', emoji: '🎁', text: 'Groot Klokkendiploma & Cadeau!' },
];

