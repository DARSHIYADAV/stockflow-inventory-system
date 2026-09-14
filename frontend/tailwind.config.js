/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        panel2: 'rgb(var(--color-panel2) / <alpha-value>)',
        panelHover: 'rgb(var(--color-panel-hover) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        borderHover: 'rgb(var(--color-border-hover) / <alpha-value>)',
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2f6fe0',
        },
        ink: {
          primary: 'rgb(var(--color-ink-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-ink-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
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
