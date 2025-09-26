import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        // Bind to all interfaces so LAN devices can reach Vite
        host: true,
        port: 5173,
        // Make Vite serve assets with the LAN IP to avoid [::1] URLs
        origin: 'http://192.168.23.103:5173',
        cors: true,
        hmr: {
            host: '192.168.23.103',
            port: 5173,
            protocol: 'ws',
            clientPort: 5173,
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
