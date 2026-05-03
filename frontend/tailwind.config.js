/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          cyan:   '#22d3ee',
          purple: '#a855f7',
          bg:     '#050a14',
          card:   '#0a1628',
        },
      },
    },
  },
  plugins: [],
}