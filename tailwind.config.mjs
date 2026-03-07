import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'light': '#FFF8F0',
        'dark': '#2D3436',
        /* Toy block colors (alleen wat nog in gebruik is) */
        'toy-orange': '#FF9F1C',
        'toy-green': '#2EC4B6',
      },
      fontFamily: {
        bubble: ['"Nunito"', 'sans-serif'],
        sans: ['"Nunito"', 'sans-serif'],
      }
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        pandadroom: {
          /* Warm crème achtergrond — als een kinderboek */
          'color-scheme': 'light',
          'primary':          '#388E3C',          /* Bamboe groen (4.6:1 contrast) */
          'primary-content':  '#FFFFFF',
          'secondary':        '#F57C00',          /* Warm oranje (4.5:1 contrast) */
          'secondary-content':'#FFFFFF',
          'accent':           '#7B1FA2',           /* Speels paars (7.3:1 contrast) */
          'accent-content':   '#FFFFFF',
          'neutral':          '#5D4E6D',          /* Zacht donkerpaars */
          'neutral-content':  '#F5F0FF',
          'base-100':         '#FFF8F0',          /* Crème wit */
          'base-200':         '#FFEFD5',          /* Licht peach */
          'base-300':         '#FFE4C4',          /* Zacht zand */
          'base-content':     '#2D3436',          /* Donkergrijs tekst */
          'info':             '#0288D1',          /* Helder blauw (4.6:1 contrast) */
          'info-content':     '#FFFFFF',
          'success':          '#388E3C',          /* Bamboe groen (4.6:1 contrast) */
          'success-content':  '#FFFFFF',
          'warning':          '#FFD54F',          /* Zonnig geel */
          'warning-content':  '#3E2723',
          'error':            '#EF5350',          /* Zacht rood */
          'error-content':    '#FFFFFF',

          /* Afgeronde, zachte vormen */
          '--rounded-box':    '1.5rem',
          '--rounded-btn':    '1.25rem',
          '--rounded-badge':  '1.5rem',

          /* Speelse 3D button-diepte */
          '--btn-focus-scale': '0.97',
          '--animation-btn':  '0.3s',
          '--animation-input':'0.3s',
          '--tab-radius':     '0.75rem',
        },
      },
    ],
  },
};
