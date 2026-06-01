/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: { 
        cinzel: ['"Cinzel"', 'serif'], 
        geologica: ['"Geologica"', 'sans-serif'] 
      }
    },
  },
  plugins: [],
}