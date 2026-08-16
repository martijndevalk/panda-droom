---
name: panda-design
description: Design system guidelines, UI tokens, aesthetic rules, and UX patterns for Panda Droom (Getallenreis & Tijdreis). Use when styling, designing components, building animations, or maintaining visual consistency.
---

# 🎨 Panda Droom — Design System & UI/UX Skill

Dit document definieert de visuele taal, UI-componenten, ergonomie en interactiepatronen voor **Panda Droom** (zowel *Getallenreis* als *Tijdreis*). Het doel is een warme, speelse, stressvrije en 100% consistente gebruikerservaring voor jonge kinderen.

---

## 🎯 Doelgroep & Toegankelijkheid in Design

- **Primaire Doelgroep**: Kinderen in groep 3 t/m 6 (6 t/m 10 jaar).
- **Inclusiviteit**: Kinderen met faalangst, dyscalculie, concentratieproblemen (ADHD) of prikkelgevoeligheid.
- **Design Pijlers**:
  1. **Geen stress/haast**: Geen rode afteltimers, knipperende alarmkleuren of stressvolle geluiden.
  2. **Grote Touch Targets**: Knoppen zijn minimaal `48px` hoog/breed (ideaal `56px`+) voor kinderhanden op tablets en telefoons.
  3. **Tactiele Feedback**: Elke interactie geeft visuele `scale` animaties (`whileTap={{ scale: 0.95 }}`), geluid (`playSound('pop')`) en haptische trilling (`useWebHaptics`).
  4. **Directe Begrijpelijkheid**: Iconen + tekst + visuele illustraties ondersteunen elkaar.

---

## 🌈 Kleurenpalet & Design Tokens

### 1. Basiskleuren (Tailwind & CSS Variables)
```css
--color-light: #FFF8F0;       /* Warme crème achtergrond (oogvriendelijk) */
--color-dark: #2D3436;        /* Zacht grafietzwart voor tekst & speelse dikke randen */
--color-primary: #388E3C;     /* Panda Bamboe Groen (succes & hoofdkleur) */
--color-secondary: #F57C00;   /* Speels Oranje (accenten & knoppen) */
--color-accent: #7B1FA2;      /* Magisch Paars (speciale beloningen & levels) */
--color-toy-orange: #FF9F1C;  /* Warm zonnegeel/oranje */
--color-toy-green: #2EC4B6;   /* Helder mint/turkoois */
```

### 2. Reis-specifieke Themakleuren
| Reis | Primaire Achtergrond | Header Kleur | Node Accent | Iconografie |
|---|---|---|---|---|
| **Getallenreis (Tafels)** | Luchtblauw verloop (`from-sky-100 to-emerald-100`) | `bg-sky-300/95` | Emerald/Groen (`bg-emerald-500`) | 🌿 🔢 🐼 |
| **Tijdreis (Klokken)** | Zonsopgang verloop (`from-amber-100 to-sky-100`) | `bg-amber-200/95` | Amber/Goud (`bg-amber-400`) | ⏰ 🕒 ⭐ |

### 3. Cartoon / Toy Box Styling Regels
- **Borders**: Altijd `border-2` of `border-3 border-dark` (`#2D3436`).
- **Schaduwen**: Stevige, speelse "harde" schaduwen: `shadow-[3px_3px_0px_theme(colors.dark)]` of `shadow-[2px_2px_0px_#2D3436]`.
- **Rondingen**: Gulle afrondingen: `rounded-2xl`, `rounded-3xl` of `rounded-full`.
- **Hover/Tap effecten**:
  - `whileHover={{ scale: 1.04 }}`
  - `whileTap={{ scale: 0.95, y: 2 }}`

---

## 🔤 Typografie

- **Titels & Cijfers**: `font-bubble` (`Nunito` 800/900 weight) met `title-font`.
- **Body & Instructies**: `Nunito` (600/700 weight), minimaal `18px` basisgrootte voor optimale leesbaarheid voor beginnende lezers.
- **Digitale Klok**: Monospace of zwaar afgerond met duidelijke cijferafstand (tracking).

---

## 🧩 Herbruikbare UI Componenten (`src/components/shared/`)

Gebruik altijd de gedeelde componenten voor nieuwe schermen om 100% consistentie te garanderen:

1. `JourneyHeader`:
   - Bevat de modus-wisselaar (`Getallenreis` ↔ `Tijdreis`).
   - Titel met thema-icoon.
   - Snelle Schatkist-knop met live sterrenteller `(X/Y)`.
2. `JourneyNode`:
   - Speelse ronde levelknoppen met status: *locked*, *available*, *completed*.
   - Stuiteranimatie (`motion.div`) bij actieve levels.
3. `JourneyFinishNode`:
   - De feestelijke eindkist/trofee aan het eind van een reis.
4. `JourneyFloatingAction`:
   - Zwevende actieknoppen linksonder/rechtsonder (bijv. Oefenplein 🎡 of Vrij Klokkijken).
5. `LevelHeader`:
   - Terugknop met haptic feedback + voortgangsindicator + audio toggle knop.
6. `LevelCompleteModal`:
   - Feestelijke modal met confetti, Panda animatie, verdiende ster/munt en vrolijke felicitatie.
7. `EncouragementBanner`:
   - Subtiele, motiverende banner die complimentjes toont zonder de flow te onderbreken.

---

## ✨ Animaties & Feedback

- **Confetti**: Roep `triggerConfetti()` aan bij voltooien van een level of mijlpaal.
- **Panda Reacties** (`PandaAvatar`):
  - `idle`: Vriendelijk knipperen en ademen.
  - `thinking`: Panda denkt mee tijdens invoer.
  - `happy` / `celebrate`: Panda juicht en springt bij een goed antwoord.
  - `encourage`: Vriendelijk geruststellend knikje bij een herstelpoging.
- **Audio & Haptiek**:
  - `playSound('correct')` + `trigger('success')` bij goed antwoord.
  - `playSound('pop')` + `trigger('light')` bij knopdruk / interactie.
  - `playSound('whoosh')` bij schermovergangen.
