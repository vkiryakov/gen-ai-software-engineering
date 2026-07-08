/**
 * Two Jest projects: unit specs colocated in src/, and the e2e/model/
 * integration/performance suites in test/. Coverage is collected once,
 * across both projects, from src/ (main.ts is bootstrap-only).
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
    },
    {
      ...shared,
      displayName: 'e2e',
      rootDir: '.',
      testRegex: 'test/.*\\.(e2e-)?spec\\.ts$',
    },
  ],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: 'coverage',
};
