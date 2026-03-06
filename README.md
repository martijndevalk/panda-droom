# 🐼 Panda's Getallenreis

Een vriendelijke, stressvrije reken-app waarmee kinderen de tafels van vermenigvuldiging leren. Speciaal ontworpen voor kinderen met leerproblemen: geen timers, geen harde feedback, en een visueel hint-systeem dat stap voor stap helpt.

**[▶ Live demo](https://martijndevalk.github.io/panda-droom/)**

---

## ✨ Kenmerken

- **Stressvrij leren** — geen countdown-timers of negatieve scores. Kinderen leren op hun eigen tempo.
- **Visuele hints (Concreet → Pictoraal → Abstract)** — bij een fout antwoord verschijnt een visuele ondersteuning die helpt om de som te begrijpen.
- **Slimme tafelvolgorde** — start met de makkelijkste tafels (1, 10, 2, 5) en bouwt op naar moeilijkere (7, 8, 9).
- **Dagelijkse sessielimiet** — maximaal 2 levels per dag om overbelasting te voorkomen.
- **Intro-systeem** — elk nieuw wereld krijgt een introductie.
- **Text-to-Speech** — sommen worden voorgelezen via [ElevenLabs](https://elevenlabs.io/) (optioneel).
- **Geluidseffecten** — subtiele audio-feedback via de Web Audio API (geen externe bestanden nodig).
- **PWA-ondersteuning** — installeerbaar op telefoon en tablet, werkt offline via een Service Worker.
- **Confetti & animaties** — visuele beloningen met `canvas-confetti` en `motion` (Framer Motion).

---

## 🛠 Tech stack

| Tool | Doel |
|---|---|
| [Astro](https://astro.build/) 5 | Statische site-generator, hosting via GitHub Pages |
| [React](https://react.dev/) 18 | UI-componenten (client-side rendering) |
| [Tailwind CSS](https://tailwindcss.com/) 3 | Utility-first styling |
| [Motion](https://motion.dev/) (Framer Motion) | Animaties en page-transitions |
| [Howler.js](https://howlerjs.com/) | Audio playback |
| [Lucide React](https://lucide.dev/) | Iconen |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Confetti-effecten |
| [ElevenLabs API](https://elevenlabs.io/) | Text-to-Speech (optioneel) |
| TypeScript | Type-veiligheid |

---

## 🚀 Aan de slag

### Vereisten

- [Node.js](https://nodejs.org/) 20+
- npm

### Installatie

```bash
npm install
```

### Development server

```bash
npm run dev
```

De app draait standaard op `http://localhost:4321/panda-droom/`.

### Productie-build

```bash
npm run build
```

De statische bestanden verschijnen in de `dist/` map.

### Preview (productie lokaal testen)

```bash
npm run preview
```

---

## 🔑 Omgevingsvariabelen

Kopieer `.env.example` naar `.env` en vul je keys in:

```bash
cp .env.example .env
```

| Variabele | Verplicht | Omschrijving |
|---|---|---|
| `PUBLIC_ELEVENLABS_API_KEY` | Nee | API-key voor ElevenLabs TTS. Zonder key werkt de app gewoon, maar worden sommen niet voorgelezen. Verkrijgbaar via [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys). |

---

## 📁 Projectstructuur

```
panda-droom/
├── public/                  # Statische assets (favicon, PWA manifest, service worker)
├── src/
│   ├── components/          # React-componenten
│   │   ├── App.tsx          # Hoofd-app met routing en state management
│   │   ├── StartScreen.tsx  # Naamkeuze bij eerste bezoek
│   │   ├── Map.tsx          # Wereldkaart met tafels
│   │   ├── IntroScreen.tsx  # CPA-introductie per wereld
│   │   ├── Level.tsx        # De kernspel-loop (sommen beantwoorden)
│   │   ├── Numpad.tsx       # On-screen numpad
│   │   ├── VisualHint.tsx   # Visuele hints bij fouten
│   │   ├── Treasury.tsx     # Schatkamer / overzicht
│   │   └── DoneForToday.tsx # Dagelijkse limiet bereikt
│   ├── layouts/
│   │   └── Layout.astro     # HTML-layout met meta tags en PWA-registratie
│   ├── lib/
│   │   ├── GameData.ts      # Wereld- en somdefinities
│   │   ├── audio.ts         # Geluidseffecten (Web Audio API)
│   │   └── tts.ts           # ElevenLabs Text-to-Speech
│   ├── pages/
│   │   └── index.astro      # Entrypoint
│   └── styles/              # CSS (Tailwind, thema, fonts)
├── astro.config.mjs         # Astro configuratie
├── tailwind.config.mjs      # Tailwind configuratie
├── vite.config.ts           # Vite configuratie
└── package.json
```

---

## 🚢 Deployment

De app wordt automatisch gedeployed naar **GitHub Pages** bij elke push naar `main`. De workflow staat in `.github/workflows/deploy.yml`.

Handmatig deployen:

```bash
npm run build
# Upload de inhoud van dist/ naar je hosting
```

---

## 📄 Licentie

Zie [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) voor gebruikte assets en licenties.
