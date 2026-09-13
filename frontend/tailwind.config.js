/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0b',
        panel: '#151517',
        panel2: '#1c1c1f',
        panelHover: '#232327',
        border: '#2a2a2f',
        borderHover: '#3a3a42',
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2f6fe0',
        },
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4)',
        lift: '0 8px 24px -8px rgba(0,0,0,0.55)',
        modal: '0 20px 50px -12px rgba(0,0,0,0.7)',
        glow: '0 0 0 3px rgba(59,130,246,0.25)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'scale-in': 'scaleIn 180ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
