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
      },
      keyframes: {
        'slide-left': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        'slide-down': {
          '0%': { 
            transform: 'translateY(-20%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'popup': {
          '0%': { 
            transform: 'scale(0.95) translateY(-10px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          }
        },
        'slide-in': {
          '0%': { 
            transform: 'translateX(100%)',
          },
          '100%': { 
            transform: 'translateX(0)',
          }
        },
        'slide-out': {
          '0%': { 
            transform: 'translateX(0)',
          },
          '100%': { 
            transform: 'translateX(100%)',
          }
        },
        'slide-up-in': {
          '0%': { 
            transform: 'translateY(100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'slide-down-out': {
          '0%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100%)',
            opacity: '0'
          }
        }
      },
      animation: {
        'slide-left': 'slide-left 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'popup': 'popup 0.3s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-out',
        'slide-up-in': 'slide-up-in 0.3s ease-out',
        'slide-down-out': 'slide-down-out 0.3s ease-out'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
}