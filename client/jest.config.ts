import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    // Style mocks
    '\\.(css|scss)$': '<rootDir>/src/__mocks__/styleMock.ts',
    // Native module mocks with dedicated mock files
    '^react-native-svg$': '<rootDir>/src/__mocks__/react-native-svg.ts',
    '^react-native-purchases$': '<rootDir>/src/__mocks__/react-native-purchases.ts',
  },
  transformIgnorePatterns: [
    // Transform ESM packages that Jest can't handle natively
    'node_modules/(?!(' +
      '(jest-)?react-native|' +
      '@react-native(-community)?|' +
      'expo(nent)?|' +
      '@expo(nent)?/.*|' +
      '@expo-google-fonts/.*|' +
      'react-navigation|' +
      '@react-navigation/.*|' +
      '@sentry/react-native|' +
      'native-base|' +
      'react-native-svg|' +
      'react-native-purchases|' +
      'react-native-keychain|' +
      'react-native-health|' +
      'react-native-google-fit|' +
      'mixpanel-react-native|' +
      'firebase|' +
      '@firebase/.*' +
    '))',
  ],
  // Collect coverage from source files
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
    '!src/**/index.{ts,tsx}',
  ],
  // Clear mocks between tests
  clearMocks: true,
  // Timeout for async tests
  testTimeout: 10000,
};

export default config;
