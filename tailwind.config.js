/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        bg: {
          DEFAULT: '#0f1117',
          elevated: '#161922',
          card: '#1a1d28',
          hover: '#21242f'
        },
        border: {
          subtle: '#23262f',
          DEFAULT: '#2a2e3a'
        },
        accent: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
          soft: 'rgba(34, 197, 94, 0.12)'
        },
        text: {
          primary: '#f4f4f5',
          secondary: '#a1a1aa',
          muted: '#71717a'
        }
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(34, 197, 94, 0.25)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.3)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
