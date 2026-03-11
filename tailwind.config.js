/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nvidia: {
          green: '#76B900',
          accent: '#00ff9c',
          bg: '#1a1a1a',
          panel: '#2b2b2b',
          'panel-light': '#353535',
          text: '#e6e6e6',
          muted: '#999999',
          border: '#3a3a3a',
          danger: '#ff4d4d',
          warning: '#ffaa00',
          success: '#76B900',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fan-spin': 'fan-spin 2s linear infinite',
        'fan-spin-reverse': 'fan-spin-reverse 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'fan-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fan-spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px rgba(118, 185, 0, 0.4)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px rgba(118, 185, 0, 0.8)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
