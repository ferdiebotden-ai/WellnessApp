# Expo Development Setup - SDK 54 + Development Build

## Overview

This project uses **Expo SDK 54** with **Development Build** (custom development client) and **New Architecture** enabled. Unlike Expo Go, Development Build includes native code, allowing full access to all native modules.

### New Architecture
As of December 2025, this project has `newArchEnabled: true` in `app.json`. This is required because:
- Legacy architecture will be removed in a late 2025 React Native release
- ~75% of SDK 52+ projects already use New Architecture
- All expo-* packages support it as of SDK 53

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **yarn**
- **Android Studio** (for Android development)
- **Xcode 15+** (for iOS development, macOS only)
- **Expo CLI**: `npm install -g expo-cli` (optional, can use npx)

## Installation Steps

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Fix Peer Dependencies

Expo will automatically resolve compatible versions:

```bash
npx expo install --fix
```

### 3. Verify Configuration

Run Expo Doctor to check for issues:

```bash
npx expo-doctor
```

### 4. Prebuild Native Projects

Generate native iOS and Android projects:

```bash
# Clean prebuild (removes existing native folders)
npx expo prebuild --clean

# Or regular prebuild
npx expo prebuild
```

This creates:
- `android/` - Android native project
- `ios/` - iOS native project

## Development Workflow

### Start Development Server

```bash
# Start with Development Build mode
npm start
# or
npx expo start --dev-client
```

### Run on Android

**Option 1: Run on Emulator/Device**
```bash
npm run android
# or
npx expo run:android
```

**Option 2: Build APK and Install Manually**
1. Build: `npx expo run:android`
2. Install the generated APK on your device
3. Start dev server: `npm start`
4. Scan QR code or enter URL manually

### Run on iOS

**Option 1: Run on Simulator/Device**
```bash
npm run ios
# or
npx expo run:ios
```

**Option 2: Build and Install Manually**
1. Build: `npx expo run:ios`
2. Install on device via Xcode or TestFlight
3. Start dev server: `npm start`
4. Connect via development build

## Environment Variables

Create a `.env` file in the `client/` directory with:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:your-app-id

# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://api.example.com

# RevenueCat Configuration
EXPO_PUBLIC_REVENUECAT_API_KEY=your-revenuecat-api-key
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=your-apple-api-key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your-android-api-key

# Analytics Configuration
EXPO_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
```

**Important:** All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

## Key Differences from Expo Go

### Development Build vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Native modules | Limited set | All modules supported |
| First setup | Instant | Requires build (5-10 min) |
| JS changes | Hot reload | Hot reload |
| Native changes | Not possible | Requires rebuild |
| Custom native code | Not supported | Fully supported |

### Why Development Build?

This project requires native modules that aren't available in Expo Go:
- `expo-secure-store` + `expo-local-authentication` - Biometric authentication and secure storage
- `react-native-health` - iOS HealthKit
- `react-native-health-connect` - Android Health Connect (actual library)
- `expo-health-connect` - Health Connect config plugin (NOT the library)
- `react-native-purchases` - RevenueCat subscriptions
- `mixpanel-react-native` - Analytics

## Native Modules Configuration

All native modules are configured via Expo config plugins in `app.json`:

- `expo-build-properties` - Build settings (SDK versions, deployment targets)
- `react-native-health` - iOS HealthKit integration
- `expo-health-connect` - Android Health Connect config plugin (for react-native-health-connect)
- `expo-secure-store` - Secure credential storage
- `expo-local-authentication` - Biometric authentication (Face ID, Touch ID, Fingerprint)

## Troubleshooting

### Build Errors

**Android:**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx expo run:android
```

**iOS:**
```bash
# Clean iOS build
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

### Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start --clear
```

### Native Module Not Found

1. Ensure `npx expo prebuild` has been run
2. Rebuild native projects: `npx expo run:android` or `npx expo run:ios`
3. Check that the module is listed in `app.json` plugins

### Environment Variables Not Loading

- Ensure variables are prefixed with `EXPO_PUBLIC_`
- Restart Metro bundler after changing `.env`
- Rebuild native apps if variables are needed at build time

## Testing on Physical Devices

### Android

1. Enable USB debugging on your device
2. Connect via USB or use ADB over network
3. Run: `npx expo run:android`
4. Or build APK and install manually

### iOS

1. Connect iPhone/iPad via USB
2. Select device in Xcode
3. Run: `npx expo run:ios`
4. Or build and install via Xcode

## Production Builds

For production builds, use **EAS Build**:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build
eas build --platform android
eas build --platform ios
```

## Development Build Checklist

### When to Rebuild Native App

Rebuild your development build when:
- Adding new native dependencies (e.g., `@react-native-async-storage/async-storage`)
- Changing `app.json` plugins or configuration
- Updating Expo SDK version
- Native modules show "Native module not found" errors

**DO NOT rebuild** for:
- JavaScript/React changes (hot reload handles this)
- TypeScript changes
- Styling changes
- Environment variable changes (just restart Metro)

### Memory-Only Mode (Development)

When native modules like AsyncStorage are not available, the app automatically operates in **memory-only mode**:
- ✅ Firebase Auth works (but won't persist between app restarts)
- ✅ Firestore operations gracefully degrade (data stored in memory only)
- ✅ User profiles created in memory
- ✅ App fully functional for testing
- ⚠️ Data is lost when app closes (expected in dev mode)

**Console messages you'll see:**
- `ℹ️ AsyncStorage not available (native module not found). Auth and Firestore will use memory-only persistence.`
- `ℹ️ Firestore unavailable (memory-only mode), skipping profile fetch`
- `ℹ️ RevenueCat API key not configured. Subscriptions disabled in development.`

These are **informational only** - the app continues to function normally.

### QA Testing Steps

After logging in with Firebase credentials:

1. **Verify Login Success**
   - Login screen should disappear
   - Should navigate to onboarding or home screen
   - No "Native module not found" errors blocking navigation

2. **Verify Home Screen Loads**
   - Home dashboard should render
   - Health metrics cards visible
   - Task list loads (may be empty in dev mode)
   - No network request failures blocking UI

3. **Verify No Blocking Errors**
   - Check console for errors
   - Should only see informational warnings (ℹ️)
   - No red error screens
   - App remains responsive

4. **Verify Full Access in Dev Mode**
   - All features accessible (no paywall blocking)
   - AI Coach accessible
   - All modules accessible
   - Subscription features work (using dev fallbacks)

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure environment variables
3. ✅ Run `npx expo prebuild`
4. ✅ Build and run on device/emulator
5. ✅ Start development server
6. ✅ Test all native modules (health data, biometrics, purchases)

## Additional Resources

- [Expo Development Build Docs](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo SDK 54 Docs](https://docs.expo.dev/)
- [New Architecture Guide](https://docs.expo.dev/guides/new-architecture/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

---

*Last Updated: December 1, 2025*
