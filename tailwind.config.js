/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Chifa.ai brand colors
        'chifa': {
          50: 'hsl(var(--chifa-green-50))',
          100: 'hsl(var(--chifa-green-100))',
          200: 'hsl(var(--chifa-green-200))',
          300: 'hsl(var(--chifa-green-300))',
          400: 'hsl(var(--chifa-green-400))',
          500: 'hsl(var(--chifa-green-500))',
          600: 'hsl(var(--chifa-green-600))',
          700: 'hsl(var(--chifa-green-700))',
          800: 'hsl(var(--chifa-green-800))',
          900: 'hsl(var(--chifa-green-900))',
        },
        // ChatGPT-like dark theme colors (kept for compatibility)
        'chatgpt': {
          'darker': '#0d1117',      // Fond principal très sombre
          'dark': '#161b22',        // Sidebar et zones secondaires
          'medium': '#21262d',      // Éléments interactifs
          'light': '#30363d',       // Hover states
          'primary': '#f0f6fc',     // Texte principal blanc
          'secondary': '#8b949e',   // Texte secondaire gris
          'muted': '#6e7681',       // Texte très discret
          'accent': '#238636',      // Vert pour les accents
          'accent-hover': '#2ea043', // Vert hover
        },
        'gray': {
          750: '#374151',
          850: '#1f2937',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}