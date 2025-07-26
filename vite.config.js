import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

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
    ],
});
