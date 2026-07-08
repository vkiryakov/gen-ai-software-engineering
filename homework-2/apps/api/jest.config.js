/**
 * Two Jest projects: unit specs colocated in src/, and the e2e/model/
 * integration/performance suites in test/. Coverage is collected across
 * both projects from src/ production files (main.ts is bootstrap-only,
 * spec files are not production code). collectCoverageFrom globs resolve
 * against each project's own rootDir, so each project declares its own.
 */
const shared = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
};

module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      rootDir: 'src',
      testRegex: '.*\\.spec\\.ts$',
      collectCoverageFrom: ['**/*.ts', '!main.ts', '!**/*.spec.ts'],
    },
    {
      ...shared,
      displayName: 'e2e',
      rootDir: '.',
      testRegex: 'test/.*\\.(e2e-)?spec\\.ts$',
      collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.spec.ts'],
    },
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { lines: 85, statements: 85, functions: 85, branches: 80 },
  },
};
