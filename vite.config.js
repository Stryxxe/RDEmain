import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '127.0.0.1',
        port: 5177,
        cors: true,
        hmr: {
            host: '127.0.0.1',
        },
    },
    define: {
        'import.meta.env.VITE_API_ORIGIN': JSON.stringify('http://127.0.0.1:8000'),
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
