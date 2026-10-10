/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paddy: {
          DEFAULT: '#2d6a1e',
          light: '#e8f5e0',
          pale: '#f0f7e8',
          dark: '#1b4332',
          mid: '#4a8c2a',
        },
        turmeric: {
          DEFAULT: '#c17f0e',
          light: '#f9ecc6',
          pale: '#fdf8eb',
        },
        laterite: {
          DEFAULT: '#a0522d',
          light: '#f5ddd0',
        },
        ink: {
          DEFAULT: '#1a2410',
          light: '#5a6b4a',
          muted: '#8a9a7a',
        },
        'rice-paper': '#f4f7f0',
        stone: '#e8e2d6',
      },
      fontFamily: {
        display: ['Bitter', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
