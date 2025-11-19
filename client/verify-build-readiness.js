#!/usr/bin/env node

/**
 * Pre-Build Verification Script
 * Checks if the project is ready for iOS development build
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];
const checks = [];

function checkFileExists(filePath, name) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    checks.push(`✅ ${name} exists`);
    return true;
  } else {
    errors.push(`❌ ${name} not found at ${filePath}`);
    return false;
  }
}

function checkJsonFile(filePath, name, validator) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ ${name} not found at ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const json = JSON.parse(content);
    
    if (validator) {
      const result = validator(json);
      if (result !== true) {
        errors.push(`❌ ${name}: ${result}`);
        return false;
      }
    }
    
    checks.push(`✅ ${name} is valid`);
    return true;
  } catch (error) {
    errors.push(`❌ ${name} is invalid JSON: ${error.message}`);
    return false;
  }
}

// Check app.json
checkJsonFile('app.json', 'app.json', (json) => {
  if (!json.expo) {
    return 'Missing expo configuration';
  }
  
  if (!json.expo.ios || !json.expo.ios.bundleIdentifier) {
    return 'Missing iOS bundle identifier';
  }
  
  if (json.expo.ios.bundleIdentifier !== 'com.wellnessos.app') {
    warnings.push(`⚠️  Bundle identifier is ${json.expo.ios.bundleIdentifier}, expected com.wellnessos.app`);
  }
  
  if (!json.expo.plugins || !Array.isArray(json.expo.plugins)) {
    return 'Missing plugins array';
  }
  
  const requiredPlugins = [
    'expo-build-properties',
    'react-native-health',
    'expo-health-connect',
    'expo-secure-store',
    'expo-local-authentication'
  ];
  
  const plugins = json.expo.plugins.map(p => Array.isArray(p) ? p[0] : p);
  const missingPlugins = requiredPlugins.filter(p => !plugins.includes(p));
  
  if (missingPlugins.length > 0) {
    warnings.push(`⚠️  Missing plugins: ${missingPlugins.join(', ')}`);
  }
  
  if (!json.expo.extra || !json.expo.extra.eas) {
    warnings.push('⚠️  EAS project ID not configured (will be auto-generated)');
  } else if (json.expo.extra.eas.projectId === 'your-project-id-here') {
    warnings.push('⚠️  EAS project ID is placeholder (will be auto-generated during eas build:configure)');
  }
  
  return true;
});

// Check package.json
checkJsonFile('package.json', 'package.json', (json) => {
  if (!json.scripts || !json.scripts.start) {
    return 'Missing start script';
  }
  
  if (!json.scripts.start.includes('--dev-client')) {
    errors.push('❌ Start script must include --dev-client flag');
    return false;
  }
  
  const requiredDeps = [
    'expo',
    'expo-dev-client',
    'react-native',
    'expo-local-authentication',
    'expo-secure-store',
    'react-native-health'
  ];
  
  const deps = { ...json.dependencies, ...json.devDependencies };
  const missingDeps = requiredDeps.filter(dep => !deps[dep]);
  
  if (missingDeps.length > 0) {
    warnings.push(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
  }
  
  return true;
});

// Check for eas.json (optional - will be created)
const easJsonExists = fs.existsSync(path.join(__dirname, 'eas.json'));
if (easJsonExists) {
  checks.push('✅ eas.json already exists');
} else {
  warnings.push('⚠️  eas.json not found (will be created by eas build:configure)');
}

// Check metro.config.js
checkFileExists('metro.config.js', 'metro.config.js');

// Check babel.config.js
checkFileExists('babel.config.js', 'babel.config.js');

// Print results
console.log('\n📋 iOS Development Build Readiness Check\n');
console.log('='.repeat(50));

if (checks.length > 0) {
  console.log('\n✅ Checks Passed:');
  checks.forEach(check => console.log(`  ${check}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(`  ${warning}`));
}

if (errors.length > 0) {
  console.log('\n❌ Errors (must fix before building):');
  errors.forEach(error => console.log(`  ${error}`));
  console.log('\n');
  process.exit(1);
} else {
  console.log('\n✅ Project is ready for iOS development build!');
  console.log('\nNext steps:');
  console.log('  1. Run: eas build:configure');
  console.log('  2. Run: eas build --profile development --platform ios');
  console.log('  3. Install build on iPhone');
  console.log('  4. Run: npm start');
  console.log('  5. Connect iPhone to dev server\n');
  process.exit(0);
}

