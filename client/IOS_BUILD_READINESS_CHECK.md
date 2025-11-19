# iOS Development Build - Pre-Build Readiness Checklist

## ✅ Configuration Status

### 1. Project Configuration
- ✅ **app.json**: Properly configured with:
  - Bundle identifier: `com.wellnessos.app`
  - iOS deployment target: 13.4
  - HealthKit permissions configured
  - Face ID permission configured
  - EAS project ID placeholder (will be auto-generated)
- ✅ **package.json**: 
  - Start script uses `--dev-client` flag
  - All required dependencies installed
  - `expo-dev-client` included
- ✅ **Metro Config**: Properly configured for Expo SDK 51
- ✅ **Babel Config**: Using `babel-preset-expo`

### 2. Native Modules Configuration
All required native modules are properly configured in `app.json` plugins:
- ✅ `expo-build-properties` - Build settings
- ✅ `react-native-health` - iOS HealthKit
- ✅ `expo-health-connect` - Android Health Connect config
- ✅ `expo-secure-store` - Secure storage
- ✅ `expo-local-authentication` - Biometric auth

### 3. Dependencies
All required packages are installed:
- ✅ `expo`: ~51.0.0
- ✅ `expo-dev-client`: ~4.0.14
- ✅ `react-native`: 0.74.5
- ✅ Native modules (health, biometrics, secure store)

## ⚠️ Pre-Build Actions Required

### Before Running `eas build:configure`

1. **Verify Expo Account**
   ```bash
   # Check if logged in
   eas whoami
   
   # If not logged in, login
   eas login
   ```

2. **Verify Apple Developer Account**
   - Create free account at https://developer.apple.com (if not done)
   - Sign in with Apple ID
   - Agree to terms (no payment required for free tier)

3. **Install EAS CLI** (if not already installed)
   ```bash
   npm install -g eas-cli
   ```

## 📋 Build Process Checklist

### Phase 1: EAS Configuration
- [ ] Run `eas build:configure` in `client/` directory
- [ ] Verify `eas.json` is created with proper profiles:
  - `development` profile for Development Builds
  - `preview` profile for TestFlight builds
  - `production` profile for App Store builds
- [ ] Verify `app.json` `extra.eas.projectId` is auto-generated

### Phase 2: iOS Development Build
- [ ] Run `eas build --profile development --platform ios`
- [ ] Provide Apple ID credentials when prompted
- [ ] Register device UDID when prompted
- [ ] Wait for build to complete (15-30 minutes)

### Phase 3: Installation
- [ ] Download build from EAS dashboard or use Expo Orbit
- [ ] Install on iPhone
- [ ] Trust developer certificate in Settings → General → VPN & Device Management

### Phase 4: Development Server
- [ ] Start dev server: `cd client && npm start`
- [ ] Connect iPhone to same WiFi network as development machine
- [ ] Open Development Build app on iPhone
- [ ] Scan QR code or manually enter dev server URL

## 🔍 Verification Steps

### After Build Installation

1. **App Launch**
   - [ ] App launches without crashes
   - [ ] Splash screen displays correctly
   - [ ] No red error screens

2. **Native Modules**
   - [ ] Biometric authentication works (Face ID/Touch ID)
   - [ ] HealthKit permissions can be requested
   - [ ] Secure storage works
   - [ ] Navigation flows work

3. **Development Server Connection**
   - [ ] App connects to dev server automatically
   - [ ] Hot reload works (make a small change, see it update)
   - [ ] Fast refresh works

4. **Critical Features**
   - [ ] Firebase authentication works
   - [ ] Navigation between screens works
   - [ ] No console errors in Metro bundler

## 🐛 Common Issues & Solutions

### Issue: Build Fails During Configuration
**Solution**: 
- Ensure you're in the `client/` directory
- Verify `app.json` is valid JSON
- Check that all plugins in `app.json` are installed

### Issue: Build Fails with Code Signing Error
**Solution**:
- Verify Apple Developer account is set up
- Ensure Apple ID credentials are correct
- Check that device is registered

### Issue: App Won't Install on iPhone
**Solution**:
- Ensure iPhone is registered with Apple Developer account
- Trust developer certificate: Settings → General → VPN & Device Management
- Delete old build and reinstall

### Issue: App Won't Connect to Dev Server
**Solution**:
- Verify iPhone and dev machine are on same WiFi network
- Check Windows Firewall isn't blocking port 8081
- Try manually entering dev server URL in Development Build app
- Verify Metro bundler is running (`npm start`)

### Issue: Native Module Not Found
**Solution**:
- Ensure module is listed in `app.json` plugins
- Rebuild development build (native changes require rebuild)
- Check that module is compatible with Expo SDK 51

## 📝 Notes

### Free Apple Developer Account Limitations
- Builds expire after 7 days (need to rebuild)
- Can only install on registered devices
- Limited to 15 builds per month on EAS free tier

### When to Rebuild
Rebuild development build when:
- Adding new native dependencies
- Changing `app.json` plugins or configuration
- Updating Expo SDK version
- **DO NOT rebuild** for JavaScript/React changes (hot reload handles this)

### Expected Timeline
- EAS configuration: 5 minutes
- Build creation: 15-30 minutes (including queue time)
- Installation: 5 minutes
- First test: 10 minutes
- **Total: 45-60 minutes to first successful test**

## ✅ Ready to Build

Your codebase is properly configured and ready for iOS development build. Follow the checklist above to proceed with building and testing on your iPhone.







