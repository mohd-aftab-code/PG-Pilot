/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(215, 20%, 31%)',
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(215, 20%, 31%)',
        },
        popover: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(215, 20%, 31%)',
        },
        primary: {
          DEFAULT: 'hsl(200, 100%, 20%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        secondary: {
          DEFAULT: 'hsl(210, 25%, 90%)',
          foreground: 'hsl(215, 20%, 31%)',
        },
        muted: {
          DEFAULT: 'hsl(210, 25%, 90%)',
          foreground: 'hsl(215, 10%, 50%)',
        },
        accent: {
          DEFAULT: 'hsl(184, 97%, 40%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        border: 'hsl(210, 20%, 88%)',
        input: 'hsl(210, 20%, 88%)',
        ring: 'hsl(200, 100%, 20%)',
        chart: {
          1: 'hsl(220, 70%, 50%)',
          2: 'hsl(160, 60%, 45%)',
          3: 'hsl(30, 80%, 55%)',
          4: 'hsl(280, 65%, 60%)',
          5: 'hsl(340, 75%, 55%)',
        },
        sidebar: {
          background: 'hsl(200, 100%, 20%)',
          foreground: 'hsl(0, 0%, 100%)',
          primary: 'hsl(184, 97%, 40%)',
          'primary-foreground': 'hsl(0, 0%, 100%)',
          accent: 'hsl(200, 100%, 25%)',
          'accent-foreground': 'hsl(0, 0%, 100%)',
          border: 'hsl(200, 100%, 25%)',
          ring: 'hsl(184, 97%, 40%)',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
    },
  },
  plugins: [],
}

