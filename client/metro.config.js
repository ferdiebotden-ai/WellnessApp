const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .cjs and .mjs files
config.resolver.sourceExts.push('cjs', 'mjs');

// CRITICAL: Disable package exports to fix Firebase Auth in Expo SDK 53+
// Fixes "Component auth has not been registered yet" error
// See: https://github.com/expo/expo/issues/36588
config.resolver.unstable_enablePackageExports = false;

// Ensure web platform extensions are resolved correctly
// Metro automatically resolves .web.ts/.web.tsx files when Platform.OS === 'web'
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config;

