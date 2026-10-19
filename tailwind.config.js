/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Kulhivaru+ premium sports identity — navy base + turquoise accent (spec §22)
        brand: {
          50: '#e6fffb',
          100: '#c3fff4',
          200: '#8effea',
          300: '#4dffde',
          400: '#18e8d1',
          500: '#00D9C0',
          600: '#00b3a0',
          700: '#008f81',
          800: '#007068',
          900: '#005a54',
          950: '#003b38',
          primary: '#00D9C0',
          primaryHover: '#18E8D1',
          secondary: '#0B1720',
          accent: '#18E8D1',
          gold: '#fbbf24',
          surface: '#101F2A',
          surfaceHover: '#142733',
          border: '#203540',
          borderHover: '#2A4655',
        },
        slate: {
          950: '#050B10',
          900: '#0B1720',
          850: '#101F2A',
          800: '#142733',
          750: '#1A3140',
          700: '#203540',
          600: '#2A4655',
          500: '#5E7686',
          400: '#9BAFBC',
          300: '#C3D2DC',
          200: '#DCE6EC',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        live: {
          DEFAULT: '#FF365A',
          600: '#E11D48',
          400: '#FF6B85',
        },
        rose: {
          600: '#E11D48',
          500: '#FF365A',
          400: '#FF6B85',
        },
        emerald: {
          600: '#059669',
          500: '#10b981',
          400: '#34d399',
        },
        amber: {
          500: '#f59e0b',
          400: '#fbbf24',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        thaana: ['Faruma', 'MV Boli', 'Thaana', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      screens: {
        'xs': '375px',
        'sm-phone': '390px',
        'lg-phone': '430px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 217, 192, 0.15)',
        'glow-strong': '0 0 30px rgba(0, 217, 192, 0.25), 0 0 60px rgba(0, 161, 168, 0.15)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00D9C0 0%, #18E8D1 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #18E8D1 0%, #00B3A0 100%)',
        'gradient-card': 'linear-gradient(145deg, #101F2A 0%, #142733 100%)',
        'gradient-hero': 'radial-gradient(ellipse at top right, rgba(0, 217, 192, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 161, 168, 0.1) 0%, transparent 50%)',
        'gradient-surface': 'linear-gradient(180deg, #101F2A 0%, #0B1720 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      zIndex: {
        'nav': '40',
        'modal': '50',
        'toast': '60',
      },
    },
  },
  plugins: [],
}