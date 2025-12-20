
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Server configuration
  server: {
    port: 3000,
    host: '0.0.0.0', // Explicitly bind to all interfaces
    allowedHosts: true
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'build',
    target: ['es2020', 'chrome80', 'firefox78', 'safari14', 'edge79'], // Modern browsers supporting ES6+
    rollupOptions: {
      output: {
        // Add timestamp to force cache invalidation
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
      },
    },
  },
  define: {
    // Force cache busting with build timestamp
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now()),
    // Polyfill process.env for browser compatibility
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.REACT_APP_BACKEND_URL': JSON.stringify(process.env.REACT_APP_BACKEND_URL || ''),
    'process.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || ''),
  },
  envPrefix: "VITE_",
}));
