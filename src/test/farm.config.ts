import { defineConfig } from "@farmfe/core";
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import AutoImport from 'unplugin-auto-import/vite';
export default defineConfig({
  compilation: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    },
    sourcemap: true,
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          return id.toString().split('node_modules/')[1].split('/')[0].toString();
        }
      }
    }
  },
  vitePlugins: [react(), AutoImport({
    imports: ['react', 'react-router-dom', 'axios'],
    dts: 'src/auto-imports.d.ts'
  }), viteCompression(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'My React App',
      short_name: 'ReactApp',
      description: 'My awesome React application',
      theme_color: '#ffffff',
      icons: [{
        src: 'icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      }, {
        src: 'icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }]
    }
  })],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
});