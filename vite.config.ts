import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': './',
        }
      },
      build: {
        // Enable code splitting and chunk optimization
        rollupOptions: {
          output: {
            manualChunks: {
              // Separate vendor chunks for better caching
              'react-vendor': ['react', 'react-dom'],
              'performance': [
                './services/performanceUtils.ts',
                './hooks/usePerformance.ts',
                './components/PerformanceDebugger.tsx'
              ],
              'services': [
                './services/rssParser.ts',
                './services/weatherService.ts',
                './services/articleCache.ts',
                './services/themeUtils.ts',
                './services/searchUtils.ts'
              ]
            }
          }
        },
        // Optimize chunk size warnings
        chunkSizeWarningLimit: 1000,
        // Enable source maps for production debugging
        sourcemap: mode === 'development',
        // Minify for production
        minify: mode === 'production' ? 'esbuild' : false,
        // Target modern browsers for better optimization
        target: 'es2020'
      },
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: []
      },
      // Performance optimizations
      server: {
        hmr: {
          overlay: false
        }
      }
    };
});
