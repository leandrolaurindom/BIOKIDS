import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'BioKids – Descobrindo o Mundo Animal',
            short_name: 'BioKids',
            description: 'Aplicativo educacional para crianças descobrirem o mundo animal com IA.',
            theme_color: '#16a34a',
            background_color: '#f0fdf4',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            scope: '/',
            categories: ['education', 'kids'],
            lang: 'pt-BR',
            icons: [
              { src: 'icons/icon-72.png',   sizes: '72x72',   type: 'image/png', purpose: 'any' },
              { src: 'icons/icon-96.png',   sizes: '96x96',   type: 'image/png', purpose: 'any' },
              { src: 'icons/icon-128.png',  sizes: '128x128', type: 'image/png', purpose: 'any' },
              { src: 'icons/icon-144.png',  sizes: '144x144', type: 'image/png', purpose: 'any' },
              { src: 'icons/icon-152.png',  sizes: '152x152', type: 'image/png', purpose: 'any' },
              { src: 'icons/icon-192.png',  sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
              { src: 'icons/icon-384.png',  sizes: '384x384', type: 'image/png', purpose: 'any' },
              { src: 'icons/icon-512.png',  sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
            ],
            screenshots: [
              { src: 'screenshots/mobile.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'BioKids – Tela principal' }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
