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
      outDir: path.resolve(__dirname, isTracker ? 'dist-tracker' : 'dist-public'),
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
        exclude: ['src/main.tsx', 'src/index.css'],
      },
    },
  }
})
