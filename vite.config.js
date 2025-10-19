import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 4200,
        open: true, // This will automatically open the browser
        host: true // This makes the server accessible over the local network
    }
})