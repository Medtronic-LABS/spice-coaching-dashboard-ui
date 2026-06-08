import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

function assertProductionBuildEnv(mode: string): void {
  if (mode !== 'production') return;

  const required = ['VITE_API_BASE_URL'] as const;

  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Production build is missing required env: ${missing.join(', ')}`,
    );
  }

  if (process.env.VITE_USE_MOCK_API !== 'false') {
    throw new Error('Production build requires VITE_USE_MOCK_API=false');
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  assertProductionBuildEnv(mode);

  return {
    base: '/medtronics-ui/',
    plugins: [react()],
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
          'src/store/apis/mockData.ts',
          'src/store/apis/mockBaseQuery.ts',
          // TipTap / multi-step flows — covered by page tests and manual QA for now
          'src/**/RichTextEditor.tsx',
          'src/**/ModuleReviewPublishView.tsx',
          'src/**/ModuleSourceDocumentPanel.tsx',
          'src/**/CourseFlowStepper.tsx',
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
