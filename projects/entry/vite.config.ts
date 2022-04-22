import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

import fg from 'fast-glob'

const entries = fg
  .sync('./**/*.html', {
    cwd: __dirname,
    ignore: ['./node_modules/**', './dist/**'],
  })
  .map((entry) => resolve(__dirname, entry))

// https://vitejs.dev/config/
export default defineConfig({
  base: '/remesh/dist/',
  plugins: [react()],
  build: {
    sourcemap: true,
    outDir: resolve(__dirname, '../../dist'),
    rollupOptions: {
      input: entries,
    },
  },
})
