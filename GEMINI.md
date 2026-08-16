# Panda Droom — AI Agent Rules & Project Guidelines

Welkom bij **Panda Droom**! Dit bestand bevat de overkoepelende projectregels en instructies voor AI-agents (Antigravity) die in deze codebase werken.

---

## 🎯 Doelgroep van het Project
- **Primaire Doelgroep**: Jonge kinderen in het basisonderwijs (groep 3 t/m 6, 6 t/m 10 jaar).
- **Inclusiviteit & Doelgroepkenmerken**:
  - Kinderen met dyscalculie, rekenmoeite of wiskundige faalangst.
  - Kinderen met ADHD of prikkelgevoeligheid (rustige visuals, geen tikkende klokken of stressfactoren).
  - Kinderen met dyslexie of leesmoeite (audio/TTS ondersteuning voor alle sommen en opdrachten).
- **Secundaire Doelgroep**: Ouders, verzorgers en basisschooldocenten die een didactisch verantwoorde, stressvrije leeromgeving willen.

---

## 📚 Project Skills & Specificaties
Voor specifieke details, raadpleeg de skills in `.agents/skills/`:
1. [panda-design](file:///.agents/skills/panda-design/SKILL.md) — UI Tokens, Toy Box aesthetic, Tailwind/DaisyUI theming, touch targets, haptics & animaties.
2. [panda-code](file:///.agents/skills/panda-code/SKILL.md) — Astro 5 + React 18 architectuur, TypeScript types, `panda-droom-*` LocalStorage schemas, herbruikbare componenten (`src/components/shared/`).
3. [panda-copy](file:///.agents/skills/panda-copy/SKILL.md) — Tone of voice (bemoedigend, humoristisch, stressvrij), C-P-A didactische copy en ElevenLabs TTS spraakregels.

---

## 🧱 Kernprincipes voor een Consistente Bouw
1. **Consistente UI Tussen de Reizen**: Zowel *Getallenreis* als *Tijdreis* delen dezelfde header-architectuur (`JourneyHeader`), levelknoppen (`JourneyNode`), afrondingsmodals (`LevelCompleteModal`) en interactiepatronen.
2. **Didactisch C-P-A Model**: Bouw altijd op van Concreet (voorwerpen/bamboe/wijzers) → Pictoraal (blokken/zones) → Abstract (cijfers & tijden).
3. **Geen Negatieve Straffen**: Foutjes krijgen zachte, opbouwende visuele feedback ("Oeps, bijna!"). Nooit harde rode schermen of strafpunten.
4. **Touch & Haptic First**: Knoppen zijn minimaal `48px` groot en geven bij aanraking `pop`-geluid en haptische feedback.
