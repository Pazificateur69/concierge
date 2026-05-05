module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@concierge/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@concierge/nest-common$': '<rootDir>/../../packages/nest-common/src/index.ts',
  },
};
