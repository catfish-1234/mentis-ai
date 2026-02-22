/**
 * @module vite.config
 *
 * Vite build configuration for MentisAI.
 * Configures the React plugin, dev-server settings, path aliases, and
 * injects the Gemini API key into `process.env` for the legacy
 * `geminiService.ts` module.
 *
 * Environment variables are loaded from `.env.local` via `loadEnv`.
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
