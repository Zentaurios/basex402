import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Base.org Brand Colors - Updated
        'base-blue': '#0000ff',
        'base-blue-dark': '#0046e6',
        'base-cerulean': '#3c8aff',
        'base-black': '#0a0b0d',
        'base-white': '#ffffff',
        'base-gray': {
          0: '#ffffff',   // Gray 0
          10: '#eef0f3',  // Gray 10
          15: '#dee1e7',  // Gray 15
          30: '#b1b7c3',  // Gray 30
          50: '#717886',  // Gray 50
          60: '#5b616e',  // Gray 60
          80: '#32353d',  // Gray 80
          100: '#0a0b0d', // Gray 100
          // Legacy support for existing classes
          25: '#ffffff',
          150: '#b1b7c3',
          200: '#5b616e',
          300: '#32353d',
        },
        // Official Base brand colors
        'base-tan': '#b8a581',
        'base-yellow': '#ffd12f',
        'base-green': '#66c800',
        'base-lime-green': '#b6f569',
        'base-red': '#fc401f',
        'base-pink': '#fea8cd',
        
        // Semantic colors using official Base colors
        'positive': '#66c800',  // Official Base Green
        'negative': '#fc401f',  // Official Base Red
        'warning': '#ffd12f',   // Official Base Yellow
        
        // State colors
        'state': {
          'bA': {
            'hovered': '#3c8aff',  // Base Cerulean for hover
            'pressed': '#0046e6',  // Darker blue for pressed
          }
        },
      },
      fontFamily: {
        'sans': [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        'mono': [
          '"JetBrains Mono"',
          'monospace'
        ]
      },
      fontSize: {
        'base': '16px',
      },
      borderRadius: {
        'sm': '2px', 
        'md': '8px',
        'lg': '8px',
      },
    },
  },
  plugins: [],
};

export default config;
