import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5177,
        cors: true,
        hmr: {
            host: '192.168.23.104',
        },
    },
    define: {
        'import.meta.env.VITE_API_ORIGIN': JSON.stringify('http://192.168.23.104:8000'),
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
