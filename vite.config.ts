import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',

        devOptions: {
          enabled: false,
        },

        workbox: {
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,woff2,webmanifest}',
          ],
          cleanupOutdatedCaches: true,

          runtimeCaching: [
            {
              urlPattern:
                /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },

        manifest: {
          name: 'TeleHealth Connect',
          short_name: 'TH Connect',
          description:
            'AI-powered telemedicine platform for secure patient and clinician consultations.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#2563EB',
          background_color: '#FFFFFF',

          icons: [
            {
              src: '/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
            },
            {
              src: '/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
            },
            {
              src: '/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
            },
            {
              src: '/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: '/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
            },
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/maskable-icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
      }),
    ],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
