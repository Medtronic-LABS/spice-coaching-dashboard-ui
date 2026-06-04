import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
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
      ],
      exclude: [
        'src/**/index.ts',
        'src/**/*.types.ts',
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
});
