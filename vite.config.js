import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'react-site',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    extensions: ['.mjs', '.jsx', '.js', '.ts', '.tsx', '.json'],
    alias: [
      { find: /^react$/, replacement: path.resolve(__dirname, 'node_modules/react/index.js') },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(__dirname, 'node_modules/react/jsx-runtime.js') },
      { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js') },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-dom/index.js') },
      { find: /^react-dom\/client$/, replacement: path.resolve(__dirname, 'node_modules/react-dom/client.js') },
      { find: 'react-native', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/react-native.js') },
      { find: '@react-navigation/native', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/react-navigation-native.jsx') },
      { find: 'react-native-safe-area-context', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/react-native-safe-area-context.jsx') },
      { find: 'expo-haptics', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/expo-haptics.js') },
      { find: 'expo-image-picker', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/expo-image-picker.js') },
      { find: 'expo-file-system/legacy', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/expo-file-system-legacy.js') },
      { find: '@react-native-community/slider', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/react-native-community-slider.jsx') },
      { find: 'react-native-reanimated', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/react-native-reanimated.js') },
      { find: 'react-native-confetti-cannon', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/react-native-confetti-cannon.jsx') },
      { find: 'react-native-web', replacement: 'C:/AbWork/FitAI/node_modules/react-native-web' },
      { find: 'react-native-svg', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/react-native-svg.jsx') },
      { find: '@expo/vector-icons', replacement: path.resolve(__dirname, 'react-site/src/fitai-preview/shims/expo-vector-icons.jsx') },
    ],
  },
  server: {
    fs: {
      allow: ['..', 'C:/AbWork/FitAI'],
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
