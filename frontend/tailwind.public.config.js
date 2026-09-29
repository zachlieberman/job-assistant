import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = (glob) => path.join(here, glob)

/** @type {import('tailwindcss').Config} */
export default {
  // Scoped to public-app sources so tracker-only classes never reach this CSS.
  content: [
    src('apps/public/index.html'),
    src('src/App.public.tsx'),
    src('src/main.public.tsx'),
    src('src/pages/{Home,Projects,Experience,Contact}.tsx'),
    src('src/components/PublicNavbar.tsx'),
    src('src/components/ApplicationJourneySankey.tsx'),
    src('src/components/public/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF8',
        ink: '#0A0C10',
        body: '#5A5F68',
        card: '#EFEFEC',
        pine: '#1F5C45',
        // Large display type only (3:1); never for body text.
        mist: '#8E929A',
      },
      fontFamily: {
        sans: ['"Familjen Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: { page: '84rem', prose: '62ch' },
    },
  },
  plugins: [],
}
