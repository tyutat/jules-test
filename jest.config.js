module.exports = {
  // preset: 'ts-jest', // Remove or comment out ts-jest preset
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { // Keep ts-jest for transformation but with explicit options
      tsconfig: 'tsconfig.json',
      // isolatedModules: true, // This can sometimes help with ts-jest issues
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Adding moduleNameMapper to see if it helps with ts-jest resolution
  moduleNameMapper: {
    '^ts-jest$': require.resolve('ts-jest'),
  },
};
