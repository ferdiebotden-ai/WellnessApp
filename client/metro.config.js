const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .cjs and .mjs files
config.resolver.sourceExts.push('cjs', 'mjs');

// Ensure web platform extensions are resolved correctly
// Metro automatically resolves .web.ts/.web.tsx files when Platform.OS === 'web'
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

module.exports = config;

