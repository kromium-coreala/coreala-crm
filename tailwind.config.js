/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#050505',
        obsidian: '#0a0a0a',
        sand: '#c4a882',
        'sand-light': '#dfc9a8',
        'sand-pale': '#f0e4d2',
        gold: '#b8965a',
        'gold-dim': '#8a6e3e',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'serif'],
        raleway: ['Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
