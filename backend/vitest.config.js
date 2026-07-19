import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      },
      include: [
        'services/**/*.ts',
        'services/**/*.js',
        'tools/**/*.js',
        'controllers/chatController.js'
      ],
      // Atlas persistence and vector-index behaviour require a real MongoDB
      // integration environment; exercise that adapter in integration tests.
      exclude: ['services/ragService.js']
    }
  }
});
