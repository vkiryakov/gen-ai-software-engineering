import globals from 'globals';
import { baseConfig } from './base.js';

/**
 * NestJS (Node) flat config: base + Node globals. Decorator-heavy code means
 * a couple of the stricter TS rules are relaxed.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const nestConfig = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
    },
  },
];

export default nestConfig;
