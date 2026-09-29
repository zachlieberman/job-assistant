/** Tailwind config for the private job tracker build only (see vite.config.ts). */
const brand = { DEFAULT: '#2F6BFF', hover: '#2559D9', text: '#5B8DFF' }

/**
 * The tracker is monochrome plus one blue. Red/green/amber/violet are
 * deliberately not defined, so a stray `text-red-400` compiles to nothing
 * instead of reintroducing a second hue. `gray` and `indigo` are aliased to
 * the tracker tokens so shared markup keeps working.
 */
const gray = {
  950: '#0A0B0D',
  900: '#12141A',
  800: '#22252E',
  700: '#5F6577',
  600: '#6E7688',
  500: '#7B8190',
  400: '#A0A6B4',
  300: '#C3C8D2',
  200: '#E6E8EE',
  100: '#E6E8EE',
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './apps/tracker/index.html',
    './src/**/*.{ts,tsx}',
    '!./src/**/{Home,Projects,Experience,Contact,PublicNavbar,App.public,main.public}.tsx',
    '!./src/test/**',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',
      ink: '#0A0B0D',
      surface: '#12141A',
      raised: '#181B23',
      line: '#22252E',
      field: '#5F6577',
      fg: '#E6E8EE',
      muted: '#7B8190',
      brand,
      indigo: { 400: brand.text, 500: brand.DEFAULT, 600: brand.DEFAULT },
      gray,
      // Status ramp: saturation rises as an application moves through the pipeline.
      stage: {
        applied: { fg: '#A3B1CC', bg: '#181C27', edge: '#2B3244', mark: '#6B7FA8' },
        phone_screen: { fg: '#8FAAF0', bg: '#172040', edge: '#26366B', mark: '#5A83E6' },
        technical: { fg: '#7FA3FF', bg: '#142755', edge: '#2B4A99', mark: '#4F7DFF' },
        offer: { fg: '#FFFFFF', bg: '#2F6BFF', edge: '#2F6BFF', mark: '#2F6BFF' },
        rejected: { fg: '#9299A8', bg: '#1A1C22', edge: '#2A2D36', mark: '#6E7688' },
      },
    },
    fontFamily: {
      sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    extend: {
      borderRadius: { panel: '16px', strip: '14px', control: '8px', row: '6px' },
      screens: { xs: '420px' },
    },
  },
  plugins: [],
}
