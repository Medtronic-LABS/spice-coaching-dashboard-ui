import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { normalizeRoutePrefix } from './src/config/normalizeRoutePrefix';

function assertProductionBuildEnv(
  mode: string,
  env: Record<string, string>,
): void {
  if (mode !== 'production') return;

  const required = ['VITE_API_BASE_URL'] as const;

  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Production build is missing required env: ${missing.join(', ')}`,
    );
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  assertProductionBuildEnv(mode, env);

  const routePrefix = normalizeRoutePrefix(env.VITE_ROUTE_PREFIX);

  return {
    base: `${routePrefix}/`,
    server: {
      port: 3000,
    },
    plugins: [
      react(),
      {
        name: 'redirect-route-prefix-trailing-slash',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url ?? '';
            if (url === routePrefix || url.startsWith(`${routePrefix}?`)) {
              const query = url.includes('?')
                ? url.slice(url.indexOf('?'))
                : '';
              res.statusCode = 301;
              res.setHeader('Location', `${routePrefix}/${query}`);
              res.end();
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/setupTests.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: [
          'src/components/**/*.tsx',
          'src/features/**/components/**/*.tsx',
          'src/store/**/*.ts',
          'src/utils/**/*.ts',
          'src/config/**/*.ts',
          'src/observability/**/*.ts',
        ],
        exclude: [
          'src/**/index.ts',
          'src/**/*.types.ts',
          // TipTap / multi-step flows — covered by page tests and manual QA for now
          'src/**/RichTextEditor.tsx',
          'src/**/ModuleReviewPublishView.tsx',
          'src/**/ModuleSourceDocumentPanel.tsx',
          'src/**/ModuleFlowStepper.tsx',
        ],
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  };
});
