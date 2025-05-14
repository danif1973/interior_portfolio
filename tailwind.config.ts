import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: '#1a1a1a',
        secondary: '#4a4a4a',
      },
      fontFamily: {
        sans: ['var(--font-lato)'],
        heebo: ['var(--font-heebo)'],
        'great-vibes': ['var(--font-great-vibes)'],
      },
    },
  },
  plugins: [typography],
};
export default config; 