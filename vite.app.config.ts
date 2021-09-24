import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/vacation-biz-ui/',
  plugins: [reactRefresh(), vanillaExtractPlugin()],
});
