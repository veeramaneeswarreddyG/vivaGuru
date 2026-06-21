/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a73e8',  // Google Blue (Gmail/Workspace Blue)
          dark: '#1557b0',     // Gmail dark hover blue
          light: '#8ab4f8'     // Google AI/Gemini dark mode blue
        },
        secondary: {
          DEFAULT: '#a87ffb',  // Gemini purple
          dark: '#8b5cf6',     // Darker purple
          light: '#c5a3ff'     // Light purple
        },
        success: {
          DEFAULT: '#137333',  // Google Green (Gmail style)
          dark: '#0f9d58',
          light: '#81c995'     // Google AI dark mode green
        },
        warning: {
          DEFAULT: '#b06000',  // Google Amber/Yellow
          dark: '#f9ab00',
          light: '#fdd663'     // Google AI dark mode yellow
        },
        danger: {
          DEFAULT: '#c5221f',  // Google Red
          dark: '#ea4335',
          light: '#f28b82'     // Google AI dark mode red
        },
        darkbg: {
          DEFAULT: '#131314',  // Google AI/Gemini dark background
          card: '#1e1f20',     // Google AI/Gemini card background
          border: '#303134',   // Google AI/Gemini border
          hover: '#2f3032'     // Google AI/Gemini hover state
        }
      },
      borderRadius: {
        'vivaguru': '16px',
      },
      fontFamily: {
        heading: ['Geist', 'Outfit', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'orb-slow-1': 'orb-pulse-1 12s infinite ease-in-out',
        'orb-slow-2': 'orb-pulse-2 15s infinite ease-in-out',
        'orb-slow-3': 'orb-pulse-3 18s infinite ease-in-out',
      },
      keyframes: {
        'orb-pulse-1': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(40px, -60px) scale(1.15)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.9)' }
        },
        'orb-pulse-2': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '40%': { transform: 'translate(-50px, 40px) scale(1.2)' },
          '70%': { transform: 'translate(30px, -30px) scale(0.85)' }
        },
        'orb-pulse-3': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(20px, 50px) scale(1.1)' },
          '80%': { transform: 'translate(-40px, -40px) scale(0.95)' }
        }
      }
    },
  },
  plugins: [],
}
