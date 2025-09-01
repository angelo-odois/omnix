/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Omnix Brand Colors - Following Landing Page
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7', 
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#25D366', // Primary green
          600: '#128C7E', // Primary dark
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#075E54', // Secondary green
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#1C1E21', // Main dark color
        },
        light: {
          50: '#F8F9FA', // Main light background
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6C757D', // Main gray
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Legacy support for existing code
        whatsapp: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#25D366',
          600: '#128C7E',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        'hero-gradient': 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
        'security-gradient': 'linear-gradient(135deg, #1C1E21 0%, #075E54 100%)',
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0,0,0,0.1)',
        'md': '0 4px 8px rgba(0,0,0,0.15)',
        'lg': '0 8px 24px rgba(0,0,0,0.2)',
        'primary': '0 4px 14px rgba(37, 211, 102, 0.3)',
        'primary-lg': '0 6px 20px rgba(37, 211, 102, 0.4)',
      }
    },
  },
  plugins: [],
}