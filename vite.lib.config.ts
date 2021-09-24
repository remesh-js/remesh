import path from 'path';
import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import {
  dependencies,
  peerDependencies,
  devDependencies,
} from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), vanillaExtractPlugin()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'components/index.tsx'),
      name: 'VacationBusinessUI',
    },
    sourcemap: 'hidden',
    outDir: path.resolve(__dirname, 'lib'),
    rollupOptions: {
      external: (source) => {
        var isExternal = []
          .concat(
            Object.keys(peerDependencies),
            Object.keys(dependencies),
            Object.keys(devDependencies)
          )
          .some((dep) => source.startsWith(dep));

        return isExternal;
      },
    },
  },
});
