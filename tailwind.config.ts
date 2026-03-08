import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        storm: '#0a0f1e',
        deep: '#111827',
        slate: {
          dark: '#1e2d45',
          DEFAULT: '#2e4060',
        },
        gold: {
          light: '#e8b04a',
          DEFAULT: '#c9933a',
          dark: '#a87530',
        },
        mist: '#8fa3b8',
        pale: '#f5f0e8',
        risk: {
          extreme: '#c0392b',
          high: '#e67e22',
          moderate: '#f1c40f',
          low: '#27ae60',
          minimal: '#2e4060',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
