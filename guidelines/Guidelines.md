# 🐼 Panda Droom — Project Guidelines & Standard Operating Procedures

Deze gids bevat de standaarden en richtlijnen voor ontwikkelaars, ontwerpers en content creators die werken aan **Panda Droom**.

---

## 🎯 1. Doelgroep & Didactische Uitgangspunten

### 👥 Voor wie maken we Panda Droom?
1. **Basisschoolkinderen (Groep 3 t/m 6, leeftijd 6 - 10 jaar)**:
   - Kinderen die kennismaken met tafels en vermenigvuldiging (Getallenreis).
   - Kinderen die analoog en digitaal leren klokkijken (Tijdreis / Klokkenreis).
2. **Kinderen met speciale leerbehoeften**:
   - **Dyscalculie / Rekenangst**: Geen tijdsdruk, geen strafpunten, stapsgewijze visuele hulpmiddelen.
   - **ADHD / Concentratie-uitdagingen**: Heldere, afleidingsvrije schermen, korte leersessies (daglimiet van 2 levels), directe beloning.
   - **Dyslexie / Leesmoeite**: Volledige spraakondersteuning (TTS) van alle sommen, vragen en instructies.
3. **Ouders & Leerkrachten**:
   - Transparant inzicht in voortgang en beheersing.
   - Mogelijkheid tot het instellen van reële, motiverende beloningen (bijv. samen pannenkoeken eten).

---

## 🎨 2. Design Standaarden (Zie ook `.agents/skills/panda-design/`)

- **Visuele Stijl**: Vriendelijke "Toy Box" cartoonstijl.
- **Randen & Schaduwen**: Dikke randen (`border-2` of `border-3 border-dark`), speelse harde drop-shadows (`shadow-[3px_3px_0px_theme(colors.dark)]`).
- **Ergonomie**: Touch-targets minimaal 48x48px (optimaal 56px).
- **Consistente Componenten**: Gebruik altijd de componenten uit `src/components/shared/` (`JourneyHeader`, `JourneyNode`, `JourneyFinishNode`, `LevelHeader`, `LevelCompleteModal`, `EncouragementBanner`).

---

## 💻 3. Code & Architectuur (Zie ook `.agents/skills/panda-code/`)

- **Tech Stack**: Astro 5 + React 18 + Tailwind CSS v4 + Motion (`motion/react`) + TypeScript.
- **State & Storage**: Alle LocalStorage sleutels starten met `panda-droom-*`.
- **Audio & Haptics**: Iedere interactieve knop roept `initAudioContext()`, `playSound()` en `useWebHaptics` trigger aan.
- **Type Safety**: Geen `any` types; documenteer complexe interfaces in `GameData.ts` of `clockData.ts`.

---

## ✍️ 4. Copy & Tone of Voice (Zie ook `.agents/skills/panda-copy/`)

- **Karakter van Panda**: Een vrolijk, warm, geduldig en speels leervriendje.
- **Bemoedigend & Positief**: Nooit "Fout!" of "Verkeerd!". Gebruik altijd opbouwende taal zoals "Oeps, bijna!", "Probeer het nog eens rustig!".
- **TTS Vriendelijk**: Schrijf zinnen bondig en phonetisch helder zonder onnodige leestekens of afkortingen.
