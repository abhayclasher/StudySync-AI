/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**/*", // Exclude node_modules for better performance
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#60a5fa",
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'laptop': '1280px', // New breakpoint for laptop screens
        'xl': '1440px',
        '2xl': '1536px',
        '3xl': '1920px', // New breakpoint for large desktop screens
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.375rem', { lineHeight: '1.75rem' }], // Reduced from 1.5rem
        '3xl': ['1.5rem', { lineHeight: '2rem' }],       // Reduced from 1.875rem
        '4xl': ['1.75rem', { lineHeight: '2rem' }],      // Reduced from 2.25rem
        '5xl': ['2rem', { lineHeight: '2rem' }],         // Reduced from 3rem
        '6xl': ['2.25rem', { lineHeight: '2rem' }],      // Reduced from 3.75rem
        '7xl': ['2.5rem', { lineHeight: '2rem' }],       // Reduced from 4.5rem
        '8xl': ['3rem', { lineHeight: '2rem' }],         // Reduced from 6rem
        '9xl': ['3.5rem', { lineHeight: '2rem' }],       // Reduced from 8rem
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}