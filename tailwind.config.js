/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        soul: {
          primary: '#7C6FF7',
          secondary: '#F472B6',
          tertiary: '#34D399',
          amber: '#FBBF24',
          coral: '#FB7185',
          bg: '#FDF8FF',
          card: '#FFFFFF',
          text: '#1E1B4B',
          muted: '#6B7280',
          border: '#E8E4FF',
        }
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'float': 'float 12s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(3deg)' },
          '66%': { transform: 'translateY(10px) rotate(-2deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backdropBlur: {
        xl: '20px',
      }
    },
  },
  plugins: [],
}
