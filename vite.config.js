import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: [
                'resources/js/**/*.{js,jsx,ts,tsx}',   // watch React files
                'resources/views/**/*.blade.php',      // watch Blade views
                'routes/**/*.php',                     // optional: watch routes
            ],
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            includeAssets: [
                'favicon.ico',
                'logo.svg',
                'offline.html',
                'icons/icon-192x192v2.png',
                'icons/icon-512x512v2.png',
                'icons/maskable-192x192v2.png',
                'icons/maskable-512x512v2.png',
            ],
            manifest: {
                name: 'WevieApp',
                short_name: 'Wevie',
                description: 'WevieApp',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                theme_color: '#6FD9D3',
                background_color: '#F7FAFA',
                icons: [
                    {
                        src: '/icons/icon-192x192v2.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512x512v2.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/maskable-192x192v2.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: '/icons/maskable-512x512v2.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                cleanupOutdatedCaches: true,
                navigateFallback: '/offline.html',
                navigateFallbackDenylist: [
                    /^\/api\//,
                    /^\/admin\//,
                    /^\/weviewallet\/api\//,
                    /^\/build\//,
                ],
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'font',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                ],
            },
        }),
    ],
});
