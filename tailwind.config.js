/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFB800', // Bright yellow from "EASY"
          dark: '#F0A500',    // Darker yellow for hover states
          light: '#FFD54F',   // Lighter yellow for backgrounds
        },
        secondary: {
          DEFAULT: '#1E1E2D', // Dark navy background
          dark: '#15151F',    // Darker navy for hover states
          light: '#2A2A3C',   // Lighter navy for accents
        },
        chrome: {
          DEFAULT: '#E8E8E8', // Chrome/silver color from "CASSE"
          dark: '#C0C0C0',    // Darker chrome for hover states
          light: '#F5F5F5',   // Lighter chrome for backgrounds
        },
        accent: {
          DEFAULT: '#FF4B26', // Orange for important CTAs
          dark: '#E03A1C',    // Darker orange for hover states
          light: '#FF6B4A',   // Lighter orange for backgrounds
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}