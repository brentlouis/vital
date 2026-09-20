import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /* Cloudflare quick tunnels get a new random name each run, so allow the whole domain
       (the leading dot matches any subdomain) rather than every host on the internet. */
    allowedHosts: ['.trycloudflare.com'],
  },
})

