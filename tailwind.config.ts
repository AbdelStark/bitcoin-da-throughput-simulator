/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pressstart: ["'Press Start 2P'", "monospace"],
      },
      colors: {
        accent: "#f7931a",
      },
    },
  },
  plugins: [],
};
