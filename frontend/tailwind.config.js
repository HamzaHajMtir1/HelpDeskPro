/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sindibad: {
          red:        '#E31E24',
          'red-dark': '#b81519',
          'red-light':'#fef2f2',
          black:      '#1a1a1a',
          'gray-dark':'#2a2a2a',
          gray:       '#4a4a4a',
          'gray-mid': '#6b6b6b',
          'gray-light':'#e5e5e5',
          white:      '#f9f9f9',
        }
      }
    },
  },
  plugins: [],
}