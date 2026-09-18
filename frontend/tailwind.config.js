/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#1a3a6b',
          600: '#152f5a',
          700: '#0f2348',
          800: '#0a1836',
          900: '#050d1f',
        },
        corporate: {
          blue: '#1e40af',
          light: '#3b82f6',
          dark: '#1e3a8a',
        }
      },
    },
  },
  plugins: [],
}
