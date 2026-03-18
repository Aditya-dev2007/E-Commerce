/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#0F172A', 50: '#f0f4ff', 100: '#dbe4ff' },
        secondary: { DEFAULT: '#6366F1', hover: '#4F46E5' },
        accent:    { DEFAULT: '#22C55E', hover: '#16A34A' },
        danger:    '#EF4444',
        warning:   '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'float':      'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glass':  '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glow':   '0 0 20px rgba(99, 102, 241, 0.4)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.4)',
      },
    },
  },
  plugins: [],
};
