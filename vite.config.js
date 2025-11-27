import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5177,
        cors: true,
        hmr: {
<<<<<<< HEAD
            host: '192.168.23.172',
=======
            host: '192.168.1.38',
>>>>>>> d78a32ffbca18370286addd4c6d01cbabcf55ba3
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
