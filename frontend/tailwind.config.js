/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0a0c',
          card: '#121216',
          red: '#ff003c',
          redGlow: '#ff003c44',
          accent: '#ff003c',
          text: '#e0e0e0',
          muted: '#80808a'
        }
      },
      boxShadow: {
        'red-glow': '0 0 15px rgba(255, 0, 60, 0.3)',
        'red-glow-lg': '0 0 25px rgba(255, 0, 60, 0.5)',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a0c 0%, #1a1a20 100%)',
        'red-gradient': 'linear-gradient(90deg, #ff003c 0%, #ff4b2b 100%)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
