/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          500: '#3b5bdb',
          600: '#2f49b8',
          700: '#263a95',
        },
      },
    },
  },
  plugins: [],
}
