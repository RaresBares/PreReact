import { defineConfig } from 'vite'

export default defineConfig({
    base: '/storemate/',
    server: {
        host: true,
        port: 5173,
        hmr: {
            path: '/storemate',
            clientPort: 80,
            protocol: 'ws'
        }
    }
})