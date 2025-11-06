import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/src/__mocks__/styleMock.ts',
    '^react-native-svg$': '<rootDir>/src/__mocks__/react-native-svg.ts'
  },
};

export default config;
