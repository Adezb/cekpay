import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#1E3A8A', // Primary Trust
        canvas: '#F8FAFC', // Background
        surface: '#FFFFFF', // Cards
        success: '#059669', // Emerald-600
        error: '#DC2626', // Red-600
        'text-primary': '#0F172A', // Slate-900
        'text-muted': '#64748B', // Slate-500
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
