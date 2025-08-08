import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'images/*.png', 'images/*.jpg'],
      manifest: {
        name: 'Kuri Finance',
        short_name: 'Kuri',
        description: 'Decentralized rotating savings circles',
        theme_color: '#C84E31',
        background_color: '#F9F5F1',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globIgnores: [
          '**/images/*.jpg', // Don't precache large images
          '**/node_modules/**/*'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/kuribackend-production\.up\.railway\.app\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kuri-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          },
          {
            urlPattern: /^https:\/\/indexer\.dev\.hyperindex\.xyz\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kuri-graphql',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 2 // 2 minutes
              }
            }
          },
          {
            urlPattern: /\/images\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
