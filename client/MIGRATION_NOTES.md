# Migration Notes: Expo SDK 49 → SDK 51 + Development Build

## Overview

This document outlines all changes made during the migration from Expo SDK 49 to SDK 51, including the switch to Development Build and package updates.

## Latest Update: SDK 51 Health Connect & Keychain Fixes

### Critical Fixes Applied

1. **Health Connect Package Correction**
   - **Issue:** Using `expo-health-connect@0.1.1` (config plugin only) instead of actual library
   - **Fix:** Added `react-native-health-connect@^2.0.0` (the actual Android Health Connect library)
   - **Note:** `expo-health-connect@~0.1.1` remains as config plugin

2. **Health Connect API Implementation**
   - **Issue:** Code used non-existent API methods (`isAvailable()`, incorrect `requestPermissions()`)
   - **Fix:** Updated to use correct API:
     - `getSdkStatus()` → `SdkAvailabilityStatus` enum
     - `initialize()` → `Promise<boolean>`
     - `requestPermission(permissions)` → takes array of `{accessType, recordType}`
     - `readRecords(recordType, options)` → correct structure with lowercase `'between'` operator

3. **Secure Storage Migration**
   - **Issue:** `react-native-keychain` has no Expo config plugin and is deprecated for Expo projects
   - **Fix:** Replaced with Expo-native solutions:
     - `expo-secure-store@~13.0.1` - For credential storage
     - `expo-local-authentication@~14.0.1` - For biometric authentication
   - **Impact:** All secure credential functions rewritten to use SecureStore + LocalAuthentication

4. **Type Definitions**
   - **Issue:** Type definitions didn't match actual Health Connect API
   - **Fix:** Created `react-native-health-connect.d.ts` with correct API signatures
   - **Removed:** `expo-health-connect.d.ts` (incorrect types)

## Major Changes

### 1. Expo SDK Upgrade

- **From:** SDK 49 (`expo@~49.0.0`)
- **To:** SDK 51 (`expo@~51.0.0`)
- **Reason:** SDK 49 incompatible with Expo Go, SDK 51 required for App Store compliance

### 2. Development Build Setup

- **Added:** `expo-dev-client@~4.0.14`
- **Changed:** Development workflow now uses custom development client instead of Expo Go
- **Impact:** First build takes 5-10 minutes, subsequent JS changes hot-reload instantly

### 3. React Native Upgrade

- **From:** React Native 0.72.4
- **To:** React Native 0.74.5
- **Breaking Changes:** None affecting this codebase

## Package Updates

### Core Dependencies

| Package | Old Version | New Version | Notes |
|--------|-------------|-------------|-------|
| `expo` | ~49.0.0 | ~51.0.0 | Major SDK upgrade |
| `react-native` | 0.72.4 | 0.74.5 | Minor upgrade |
| `expo-build-properties` | ~0.10.0 | ~0.12.1 | Updated for SDK 51 |
| `expo-haptics` | ~12.5.0 | ~13.0.1 | Updated for SDK 51 |
| `firebase` | ^9.23.0 | ^10.12.0 | Major version upgrade |

### Native Modules

| Package | Old Version | New Version | Notes |
|--------|-------------|-------------|-------|
| `react-native-purchases` | ^7.18.0 | ^8.1.0 | Major version upgrade |
| `react-native-keychain` | ^8.1.2 | ^8.2.0 | Minor upgrade |
| `react-native-health` | ^1.14.0 | ^1.19.0 | Updated for RN 0.74 |
| `mixpanel-react-native` | ^2.4.1 | ^3.1.2 | Major version upgrade (API changes) |

### Navigation (Unchanged)

- `@react-navigation/native`: ^6.1.6
- `@react-navigation/bottom-tabs`: ^6.5.7
- `@react-navigation/native-stack`: ^6.9.12
- `react-native-screens`: ~3.31.1
- `react-native-safe-area-context`: 4.10.1
- `react-native-gesture-handler`: ~2.16.1

### Removed Packages

- **`react-native-google-fit`** (^0.22.1)
  - **Reason:** Deprecated, replaced by Health Connect
  - **Replacement:** `react-native-health-connect@^2.0.0`
- **`react-native-keychain`** (^8.2.0)
  - **Reason:** No Expo config plugin, incompatible with Expo SDK 51
  - **Replacement:** `expo-secure-store` + `expo-local-authentication`

### Added Packages

- **`expo-dev-client`** (~4.0.14) - Development Build support
- **`expo-health-connect`** (~0.1.1) - Health Connect config plugin (NOT the library)
- **`react-native-health-connect`** (^2.0.0) - Actual Android Health Connect library
- **`expo-secure-store`** (~13.0.1) - Secure credential storage
- **`expo-local-authentication`** (~14.0.1) - Biometric authentication
- **`expo-status-bar`** (~1.12.1) - Status bar management

## Configuration Changes

### app.json

**iOS:**
- `deploymentTarget`: 13.0 → 13.4 (required for SDK 51)

**Android:**
- `compileSdkVersion`: 33 → 34
- `targetSdkVersion`: 33 → 34
- `minSdkVersion`: 26 (added)
- `buildToolsVersion`: 33.0.0 → 34.0.0

**Plugins:**
- Added `expo-health-connect` plugin (config plugin for react-native-health-connect)
- Added `react-native-health` plugin
- Added `expo-secure-store` plugin
- Added `expo-local-authentication` plugin (with Face ID permission)
- Updated `expo-build-properties` configuration

**New Fields:**
- `scheme`: "wellnessos" (for deep linking)

**Permissions:**
- Updated Android permissions to use short names (e.g., `ACTIVITY_RECOGNITION` instead of `android.permission.ACTIVITY_RECOGNITION`)

### metro.config.js

**Created:** New file with `.cjs` and `.mjs` support

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs', 'mjs');
module.exports = config;
```

### package.json Scripts

**Changed:**
- `start`: `expo start` → `expo start --dev-client`
- `android`: `expo start --android` → `expo run:android`
- `ios`: `expo start --ios` → `expo run:ios`

**Added:**
- `prebuild`: `expo prebuild`
- `prebuild:clean`: `expo prebuild --clean`

## Code Changes

### Wearables Service (`client/src/services/wearables/aggregators.ts`)

**Major Refactor:**
- Removed all `react-native-google-fit` imports and usage
- Replaced `expo-health-connect` import with `react-native-health-connect`
- Updated Android health data functions:
  - `requestGoogleFitPermissions()` → `requestHealthConnectPermissions()`
  - `fetchGoogleFitSleep()` → `fetchHealthConnectSleep()`
  - `fetchGoogleFitQuantitySamples()` → `fetchHealthConnectQuantitySamples()`
  - `deriveGoogleFitHrvReadings()` → `deriveHealthConnectHrvReadings()`
  - `deriveGoogleFitRestingHeartRateReadings()` → `deriveHealthConnectRestingHeartRateReadings()`

**API Changes:**
- Health Connect uses different permission model (explicit permission requests)
- Updated to use correct API:
  - `getSdkStatus()` instead of `isAvailable()`
  - `initialize()` call after availability check
  - `requestPermission([{accessType, recordType}])` instead of `requestPermissions([strings])`
  - `readRecords(recordType, options)` with lowercase `'between'` operator
- Record types use string literals: `'SleepSession'`, `'Steps'`, `'HeartRate'`, etc.
- Data structure mapping updated:
  - Sleep: `record.startTime` and `record.endTime` (not startDate/endDate)
  - Steps: `record.count` property
  - HeartRate: `record.beatsPerMinute` or `record.samples` array

### Secure Credentials Service (`client/src/services/secureCredentials.ts`)

**Complete Rewrite:**
- Removed all `react-native-keychain` imports and usage
- Replaced with `expo-secure-store` + `expo-local-authentication`
- Updated all functions:
  - `storeBiometricRefreshToken()` → Uses `SecureStore.setItemAsync()` with `requireAuthentication: true`
  - `retrieveRefreshTokenWithBiometrics()` → Uses `LocalAuthentication.authenticateAsync()` + `SecureStore.getItemAsync()`
  - `getSupportedBiometryType()` → Uses `LocalAuthentication.hasHardwareAsync()`, `isEnrolledAsync()`, `supportedAuthenticationTypesAsync()`
  - PIN functions → Use `SecureStore` for storage instead of Keychain services

**Key Changes:**
- Services become simple string keys instead of service objects
- Biometric protection uses `requireAuthentication: true` option in SecureStore
- Manual biometric prompts use LocalAuthentication before SecureStore access
- Return type for biometry changes from `BIOMETRY_TYPE` to custom `BiometryType` enum

### Analytics Service (`client/src/services/AnalyticsService.ts`)

**Mixpanel v3 Changes:**
- Updated initialization: `new Mixpanel(token, trackAutomaticEvents)`
- Added `trackAutomaticEvents` parameter (set to `false`)
- API remains async but constructor signature changed

### Type Definitions

**Replaced:** `client/src/types/expo-health-connect.d.ts` → `client/src/types/react-native-health-connect.d.ts`
- Correct type definitions for react-native-health-connect API
- Includes `SdkAvailabilityStatus` enum, `Permission` interface, correct API signatures
- Matches actual library implementation

**Updated:** Biometry type definitions
- Removed dependency on `react-native-keychain` types
- Created custom `BiometryType` in `secureCredentials.ts`
- Updated `AppLockProvider.tsx` and `BiometricLockScreen.tsx` to use new type

## Environment Variables

**No Changes:** All variables already use `EXPO_PUBLIC_` prefix

**Note:** `.env.example` updated to reflect current variable names (if it exists)

## Build Process Changes

### Before (SDK 49 + Expo Go)
1. `npm install`
2. `npm start`
3. Scan QR code with Expo Go app

### After (SDK 51 + Development Build)
1. `npm install`
2. `npx expo prebuild` (one-time or when native config changes)
3. `npm run android` or `npm run ios` (builds native app)
4. `npm start` (starts dev server)
5. App connects to dev server automatically

## Testing Checklist

Before deploying, verify:

- [ ] `npm install` completes without errors
- [ ] `npx expo-doctor` reports no critical issues
- [ ] `npx expo prebuild` generates native projects successfully
- [ ] Android build completes: `npx expo run:android`
- [ ] iOS build completes: `npx expo run:ios`
- [ ] App launches on device/emulator
- [ ] Firebase authentication works
- [ ] Health data permissions can be requested (iOS & Android)
- [ ] Biometric authentication works
- [ ] RevenueCat subscriptions initialize
- [ ] Mixpanel analytics tracks events
- [ ] All navigation flows work
- [ ] Hot reload works for JS changes

## Known Issues & Workarounds

### Issue: First Build Takes 5-10 Minutes
**Workaround:** This is expected. Subsequent builds are faster. Use `npx expo run:android --no-build-cache` if you encounter build cache issues.

### Issue: Health Connect Not Available on Older Android Devices
**Workaround:** Health Connect requires Android 14+ or devices with Health Connect app installed. Check availability before requesting permissions.

### Issue: Metro Bundler Cache Issues
**Workaround:** Use `npx expo start --clear` to clear cache.

## Breaking Changes

### For Developers

1. **Cannot use Expo Go:** Must use Development Build
2. **Native changes require rebuild:** JS-only changes still hot-reload
3. **Android Health Data:** API changed from Google Fit to Health Connect
4. **Mixpanel:** Constructor signature changed (backward compatible if using async init)

### For End Users

None - all changes are internal to development workflow.

## Migration Timeline

- **Phase 1:** Package version updates ✅
- **Phase 2:** Configuration file updates ✅
- **Phase 3:** Service file updates ✅
- **Phase 4:** Assets and environment setup ✅
- **Phase 5:** Documentation updates ✅
- **Phase 6:** Testing and validation ⏳

## Rollback Plan

If issues arise, rollback steps:

1. Revert `package.json` to SDK 49 versions
2. Revert `app.json` to SDK 49 configuration
3. Restore `react-native-google-fit` package
4. Revert service file changes
5. Remove `expo-dev-client` and `expo-health-connect`

**Note:** Rollback requires reverting all changes in this migration.

## Next Steps

1. Test on physical Android device (Android 14+ for Health Connect)
2. Test on physical iOS device
3. Verify all native modules work correctly
4. Update CI/CD pipeline if needed
5. Update team documentation
6. Consider EAS Build for production builds

## References

- [Expo SDK 51 Release Notes](https://docs.expo.dev/versions/latest/)
- [Development Build Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [Health Connect Migration Guide](https://developer.android.com/guide/health-and-fitness/health-connect)
- [Mixpanel React Native v3 Migration](https://github.com/mixpanel/mixpanel-react-native)

