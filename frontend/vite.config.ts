import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig(({ mode }) => {
  const isTracker = mode === 'tracker'
  const appDir = isTracker ? 'tracker' : 'public'

  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'apps', appDir),
    envDir: __dirname,
    // Each app's index.html lives under apps/, so map root-relative /src/ URLs
    // (used by the dev server) back to the shared src directory.
    resolve: {
      alias: [{ find: /^\/src\//, replacement: `${path.resolve(__dirname, 'src')}/` }],
    },
    // Each app gets its own Tailwind config (and CSS entry) so the two designs
    // never share generated styles. Inline config replaces postcss.config.js.
    css: {
      postcss: {
        plugins: [
          tailwindcss(
            path.resolve(
              __dirname,
              isTracker ? 'tailwind.tracker.config.js' : 'tailwind.public.config.js',
            ),
          ),
          autoprefixer(),
        ],
      },
    },
    build: {
      // The public build keeps the default "dist" name so the existing,
      // already-configured Vercel project needs no dashboard changes.
      outDir: path.resolve(__dirname, isTracker ? 'dist-tracker' : 'dist'),
      emptyOutDir: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      root: __dirname,
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: [
          'src/main.public.tsx',
          'src/main.tracker.tsx',
          'src/index.css',
          'src/public.css',
          'src/tracker.css',
        ],
      },
    },
  }
})
