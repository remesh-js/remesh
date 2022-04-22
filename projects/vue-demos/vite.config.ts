import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
  plugins: [vue()],
  base: '/remesh/dist/vue',
  resolve: {
    alias: {
      remesh: resolve(__dirname, '../../packages/remesh/src'),
      'remesh-vue': resolve(__dirname, '../../packages/remesh-vue/src'),
      'remesh-debugger-helper': resolve(__dirname, '../../packages/remesh-debugger-helper/src'),
      'remesh-redux-devtools': resolve(__dirname, '../../packages/remesh-redux-devtools/src'),
      'remesh-logger': resolve(__dirname, '../../packages/remesh-logger/src'),
    },
  },
  build: {
    sourcemap: true,
    outDir: resolve(__dirname, '../../dist/vue'),
    rollupOptions: {
      input: entries,
    },
  },
})
