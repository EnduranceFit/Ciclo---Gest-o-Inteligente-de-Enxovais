import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Note: we need jsdom if testing react components, but we're testing pure logic for now. We can use node.
    globals: true,
  },
});
