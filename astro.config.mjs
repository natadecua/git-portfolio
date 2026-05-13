import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://natadecua.dev',
  output: 'static',
  integrations: [react()],
  vite: {
    ssr: { noExternal: ['three', '@react-three/fiber', '@react-three/drei'] },
  },
  build: { inlineStylesheets: 'auto' },
});
