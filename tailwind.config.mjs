/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'brand': '#4B9B88',
        'light': '#E9F5F1',
        'dark': '#2B4D46',
        'bamboo': '#75B853'
      },
      fontFamily: {
        bubble: ['"Chewy"', '"Nunito"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
