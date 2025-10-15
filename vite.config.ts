import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util"],
    }),
    VitePWA({
      registerType: "autoUpdate", // Auto-update in background
      injectRegister: "auto", // Automatically inject SW registration
      includeAssets: [
        "favicon.ico",
        "icons/*.png",
        "images/*.png",
        "images/*.jpg",
      ],
      manifest: {
        name: "Kuri Finance",
        short_name: "Kuri",
        description: "Rotation savings circles",
        theme_color: "#C84E31",
        background_color: "#F9F5F1",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globIgnores: [
          "**/images/*.jpg", // Don't precache large images
          "**/node_modules/**/*",
        ],
        skipWaiting: true, // Activate new SW immediately
        clientsClaim: true, // Take control of all clients immediately
        cleanupOutdatedCaches: true, // Remove old caches
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/kuribackend-production\.up\.railway\.app\/api\/users\/profile/,
            handler: "NetworkOnly",
            options: {
              cacheName: "never-cache-profiles",
            },
          },
          {
            urlPattern:
              /^https:\/\/kuribackend-production\.up\.railway\.app\/api\/auth\/message/,
            handler: "NetworkOnly",
            options: {
              cacheName: "never-cache-auth",
            },
          },
          {
            urlPattern: /^https:\/\/kuribackend-production\.up\.railway\.app\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "kuri-api-general",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
          {
            urlPattern: /^https:\/\/indexer\.dev\.hyperindex\.xyz\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "kuri-graphql",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 2, // 2 minutes
              },
            },
          },
          {
            urlPattern: /\/images\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ["lucide-react", "@getpara/cosmos-wallet-connectors"],
  },
  build: {
    rollupOptions: {
      external: ["@getpara/cosmos-wallet-connectors"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
