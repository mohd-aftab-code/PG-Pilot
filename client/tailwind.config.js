/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(210, 29%, 95%)',
        foreground: 'hsl(220, 39%, 10%)',
        card: {
          DEFAULT: 'hsl(210, 29%, 98%)',
          foreground: 'hsl(220, 39%, 10%)',
        },
        popover: {
          DEFAULT: 'hsl(210, 29%, 98%)',
          foreground: 'hsl(220, 39%, 10%)',
        },
        primary: {
          DEFAULT: 'hsl(220, 39%, 26%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        secondary: {
          DEFAULT: 'hsl(210, 25%, 90%)',
          foreground: 'hsl(220, 39%, 10%)',
        },
        muted: {
          DEFAULT: 'hsl(210, 25%, 90%)',
          foreground: 'hsl(220, 10%, 40%)',
        },
        accent: {
          DEFAULT: 'hsl(216, 34%, 37%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        border: 'hsl(210, 20%, 88%)',
        input: 'hsl(210, 20%, 88%)',
        ring: 'hsl(220, 39%, 26%)',
        chart: {
          1: 'hsl(220, 70%, 50%)',
          2: 'hsl(160, 60%, 45%)',
          3: 'hsl(30, 80%, 55%)',
          4: 'hsl(280, 65%, 60%)',
          5: 'hsl(340, 75%, 55%)',
        },
        sidebar: {
          background: 'hsl(220, 39%, 15%)',
          foreground: 'hsl(210, 29%, 95%)',
          primary: 'hsl(224.3, 76.3%, 48%)',
          'primary-foreground': 'hsl(0, 0%, 100%)',
          accent: 'hsl(220, 39%, 26%)',
          'accent-foreground': 'hsl(210, 29%, 95%)',
          border: 'hsl(220, 39%, 20%)',
          ring: 'hsl(217.2, 91.2%, 59.8%)',
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

