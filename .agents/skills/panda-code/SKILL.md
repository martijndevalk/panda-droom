---
name: panda-code
description: Architecture, TypeScript standards, state management, storage keys, and code conventions for Panda Droom. Use when writing, modifying, or refactoring code in the repository.
---

# 💻 Panda Droom — Code & Architecture Skill

Dit document definieert de technische architectuur, coding standards, state management en uitbreidingspatronen van **Panda Droom**.

---

## 🏗️ Tech Stack & Overzicht

- **Meta Framework**: [Astro 5](https://astro.build/) (Static Site Generation met View Transitions)
- **UI & State**: [React 18](https://react.dev/) (Client-side interactive islands)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + DaisyUI 5
- **Animaties**: [Motion / Framer Motion](https://motion.dev/) (`motion/react`)
- **Audio & Haptics**: [Howler.js](https://howlerjs.com/) & [Web-Haptics](https://github.com/vlad-stoenescu/web-haptics)
- **Text-to-Speech**: ElevenLabs API + Web Speech API fallback
- **Taal**: TypeScript (strict mode)

---

## 📂 Mappenstructuur & Verantwoordelijkheden

```
src/
├── components/
│   ├── shared/              # Herbruikbare componenten tussen Getallen- en Tijdreis
│   │   ├── JourneyHeader.tsx          # Universele sticky header & modusschakelaar
│   │   ├── JourneyNode.tsx            # Interactieve levelnode op de kaart
│   │   ├── JourneyFinishNode.tsx      # Eindbestemming / Schatkistknoop
│   │   ├── JourneyFloatingAction.tsx  # Zwevende actieknoppen (Oefenplein/Klokkenplein)
│   │   ├── LevelHeader.tsx            # Header tijdens actieve speelsessies
│   │   ├── LevelCompleteModal.tsx     # Feestelijke afronding van een level
│   │   └── EncouragementBanner.tsx    # Vrolijke feedbackstrook
│   ├── clock/               # Klokkenreis / Tijdreis specifieke componenten
│   │   ├── ClockFace.tsx              # Roterende analoge klok (touch/drag interactief)
│   │   ├── ClockLevel.tsx             # Klokvragen spel-loop
│   │   ├── ClockMap.tsx               # Tijdreis wereldkaart
│   │   ├── ClockIntroScreen.tsx       # Didactische introducties per tijdconcept
│   │   ├── ClockFreePlay.tsx          # Klokkenplein interactieve zandbak
│   │   └── ClockVisualHint.tsx        # C-P-A tijdhints (sectoren & zones)
│   ├── App.tsx              # Routering tussen views & centrale state orchestrator
│   ├── Level.tsx            # Getallenreis tafelvragen spel-loop
│   ├── Map.tsx              # Getallenreis wereldkaart
│   ├── Numpad.tsx           # Groot kindvriendelijk invoertetsenbord
│   ├── PandaAvatar.tsx      # Geanimeerde SVG panda met gemoedstoestanden
│   ├── PracticeSquare.tsx   # Tafels Oefenplein
│   ├── Treasury.tsx         # Schatkist, beloningen & ouderportaal
│   └── VisualHint.tsx       # C-P-A tafels hints (tegels & sprongen)
├── lib/
│   ├── GameData.ts          # Definities van werelden & sommen (Getallenreis)
│   ├── clockData.ts         # Definities van werelden, levels & kloktijden (Tijdreis)
│   ├── audio.ts             # Sound manager (Howler.js effecten & BGM)
│   ├── tts.ts               # Text-To-Speech integratie (ElevenLabs & fallback)
│   ├── rewardsStorage.ts    # Beloningen, sterren, munten en ouder-instellingen
│   ├── performanceTracker.ts # Voortgang & leerstatistieken
│   └── reviewSelector.ts    # Spaced repetition sommen-kiezer
└── styles/
    ├── global.css           # Global imports, Tailwind & DaisyUI configuratie
    └── theme.css            # Custom CSS variables en design tokens
```

---

## 💾 LocalStorage Naming & Data Schemas

Alle persistente gegevens gebruiken de `panda-droom-*` namespace:

| Key | Type / Doel | Schema Voorbeeld |
|---|---|---|
| `panda-droom-player-name` | `string` | `"Lars"` |
| `panda-droom-completed-levels` | `string[]` | `["world-1-sub-1", "world-1-sub-2"]` |
| `panda-droom-clock-completed` | `string[]` | `["clock-w1-1", "clock-w1-2"]` |
| `panda-droom-intros` | `string[]` | `["world-1", "world-2"]` (geziene intro's) |
| `panda-droom-clock-intros` | `string[]` | `["clock-w1", "clock-w2"]` |
| `panda-droom-rewards` | `RewardsData` | `{ stars: 12, coins: 50, unlockedBadges: [...] }` |
| `panda-droom-parent-rewards` | `ParentReward[]` | `[{ id: '1', title: 'Pannenkoeken eten', starsNeeded: 20, isClaimed: false }]` |
| `panda-droom-daily` | `{ date: string, count: number }` | `{ "date": "2026-08-16", "count": 2 }` |

### Belangrijke regels voor storage:
- Vang altijd `JSON.parse` af met `try { ... } catch { return defaultValue; }`.
- Mutaties moeten functioneel en deterministisch zijn.
- Breek nooit bestaande LocalStorage data bij nieuwe features (zorg voor backward compatibility).

---

## ⚡ React & TypeScript Conventies

1. **Strict Types**: Definieer expliciete `interface` of `type` definities voor alle component props en data structures.
2. **Audio & Haptics Inwijding**:
   - Roep bij gebruikersacties altijd `initAudioContext()` aan om browser autoplay restricties te ontgrendelen.
   - Combineer `playSound()` met haptics:
   ```tsx
   const handleTap = () => {
     trigger('light');
     initAudioContext();
     playSound('pop');
     onAction();
   };
   ```
3. **Motion Animaties**:
   - Gebruik `motion/react` (niet het verouderde `framer-motion` pakket direct importeren).
   - Animate presence bij modals en paginawissels (`<AnimatePresence mode="wait">`).
4. **Geheugenbeheer & Cleanup**:
   - `useEffect` hooks met event listeners, audio callbacks of timeouts moeten altijd een opruimfunctie retourneren (`return () => { ... }`).
5. **No Direct DOM Mutation**: Bewaak state in React state of refs; manipuleer de DOM niet direct.

---

## 🧪 Validatie & Build Commando's

- **Typecheck & Astro check**: `npx astro check`
- **Productie Build**: `npm run build`
- **Ontwikkelserver**: `npm run dev`
