import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // BPS-inspired colors
        bps: {
          blue: {
            50: "hsl(var(--bps-blue-50))",
            100: "hsl(var(--bps-blue-100))",
            200: "hsl(var(--bps-blue-200))",
            300: "hsl(var(--bps-blue-300))",
            400: "hsl(var(--bps-blue-400))",
            500: "hsl(var(--bps-blue-500))",
            600: "hsl(var(--bps-blue-600))",
            700: "hsl(var(--bps-blue-700))",
            800: "hsl(var(--bps-blue-800))",
            900: "hsl(var(--bps-blue-900))",
          },
          green: {
            50: "hsl(var(--bps-green-50))",
            100: "hsl(var(--bps-green-100))",
            200: "hsl(var(--bps-green-200))",
            300: "hsl(var(--bps-green-300))",
            400: "hsl(var(--bps-green-400))",
            500: "hsl(var(--bps-green-500))",
            600: "hsl(var(--bps-green-600))",
            700: "hsl(var(--bps-green-700))",
            800: "hsl(var(--bps-green-800))",
            900: "hsl(var(--bps-green-900))",
          },
          orange: {
            50: "hsl(var(--bps-orange-50))",
            100: "hsl(var(--bps-orange-100))",
            200: "hsl(var(--bps-orange-200))",
            300: "hsl(var(--bps-orange-300))",
            400: "hsl(var(--bps-orange-400))",
            500: "hsl(var(--bps-orange-500))",
            600: "hsl(var(--bps-orange-600))",
            700: "hsl(var(--bps-orange-700))",
            800: "hsl(var(--bps-orange-800))",
            900: "hsl(var(--bps-orange-900))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
