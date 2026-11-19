import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' keeps every asset path relative, so the build works on GitHub Pages
// under any repository name, and when opened from a local static server.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
