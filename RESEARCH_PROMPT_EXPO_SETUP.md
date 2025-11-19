# Research Prompt: Expo Go Development Setup for React Native App (November 2025)

## Research Objective
Provide comprehensive, up-to-date guidance for setting up a React Native application with Expo SDK 49 for development testing using Expo Go, including proper package versions, configuration, and native module compatibility.

## Context
I have a React Native application that needs to be configured for Expo Go development. The app uses:
- Expo SDK ~49.0.0
- React Native 0.72.4
- React 18.2.0
- Multiple native modules that may require Expo config plugins

## Specific Research Areas

### 1. Expo SDK 49 Compatibility & Requirements
- What are the exact compatible versions of React Native, React, and other core dependencies for Expo SDK 49?
- Are there any breaking changes or known issues with Expo SDK 49 as of November 2025?
- What Node.js version is required/recommended for Expo SDK 49?
- What are the minimum requirements for iOS and Android development?

### 2. Package Version Compatibility
For each of the following packages, provide:
- Latest stable version compatible with Expo SDK 49
- Any known compatibility issues
- Recommended version ranges

Packages to research:
- `@react-navigation/native` (currently ^6.1.6)
- `@react-navigation/bottom-tabs` (currently ^6.5.7)
- `@react-navigation/native-stack` (currently ^6.9.12)
- `react-native-screens` (currently ~3.22.0)
- `react-native-safe-area-context` (currently 4.6.3)
- `react-native-gesture-handler` (currently ~2.12.0)
- `expo-haptics` (currently ~12.5.0)
- `expo-build-properties` (currently ~0.10.0)
- `firebase` (currently ^9.23.0)
- `mixpanel-react-native` (currently ^2.4.1)
- `react-native-purchases` (RevenueCat) (currently ^7.18.0)
- `react-native-keychain` (currently ^8.1.2)
- `react-native-google-fit` (currently ^0.22.1)
- `react-native-health` (currently ^1.14.0)

### 3. Native Module Compatibility with Expo Go
- Which of these native modules are compatible with Expo Go (managed workflow)?
- Which require Expo Development Build (custom development client)?
- For modules requiring Development Build, what are the alternatives or workarounds for Expo Go?

Native modules in question:
- `react-native-keychain` (biometric authentication)
- `react-native-google-fit` (Android health data)
- `react-native-health` (iOS health data)
- `react-native-purchases` (RevenueCat subscriptions)
- `mixpanel-react-native` (analytics)
- `firebase` (authentication and Firestore)

### 4. Expo Config Plugins
- What Expo config plugins are required for each native module?
- How to properly configure `app.json` or `app.config.js` for these plugins?
- Are there any Expo config plugins that need to be installed separately?
- What are the proper plugin configurations for:
  - Health data access (HealthKit/Google Fit)
  - Biometric authentication
  - RevenueCat subscriptions
  - Firebase services

### 5. Setup Steps for Expo Go Development
Provide a step-by-step guide for:
- Initial project setup and configuration
- Installing dependencies correctly
- Configuring `app.json` or `app.config.js`
- Setting up environment variables
- Running the development server
- Connecting to Expo Go app on physical devices
- Troubleshooting common connection issues

### 6. Project Structure & Configuration Files
- What files are required for Expo SDK 49? (app.json, babel.config.js, etc.)
- What should be in `package.json` scripts?
- Are there any required configuration files we might be missing?
- What is the proper entry point file structure?

### 7. Common Issues & Solutions (November 2025)
- What are the most common installation errors with Expo SDK 49?
- How to resolve version conflicts between dependencies?
- What are known issues with native modules and Expo Go?
- How to handle Metro bundler errors?
- Network/connection issues with Expo Go

### 8. Best Practices & Recommendations
- Recommended project structure for Expo SDK 49
- Environment variable management
- Development workflow best practices
- Testing strategies with Expo Go
- Performance optimization tips

## Output Format
Please provide the research findings in a structured markdown document with:
1. Executive summary
2. Detailed findings for each research area
3. Step-by-step setup guide
4. Package version recommendations table
5. Configuration examples
6. Troubleshooting guide
7. References and sources

## Important Notes
- Focus on information current as of November 2025
- Prioritize official Expo documentation and recent community discussions
- Include any breaking changes or deprecations that affect setup
- Provide specific version numbers, not just ranges where possible
- Include code examples for configuration files

## Success Criteria
The research should enable:
1. Correctly configuring package.json with compatible versions
2. Setting up all required Expo configuration files
3. Understanding which native modules work with Expo Go vs requiring Development Build
4. Successfully running `npm install` without version conflicts
5. Starting Expo development server and connecting to Expo Go app

