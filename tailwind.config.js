/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        indigoGlow: '0 0 12px rgba(99, 102, 241, 0.7)', 
        purpleGlow: '0 0 10px rgba(168, 85, 247, 0.8)',// Tailwind's indigo-500 with glow
      },
    },
  },
  plugins: [],
}