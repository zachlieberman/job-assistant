import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const isTracker = mode === 'tracker'
  const appDir = isTracker ? 'tracker' : 'public'

  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'apps', appDir),
    envDir: __dirname,
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
        exclude: ['src/main.public.tsx', 'src/main.tracker.tsx', 'src/index.css'],
      },
    },
  }
})
