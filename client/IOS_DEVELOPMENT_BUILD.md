# iOS Development Build Setup Guide

## Quick Start: Build iOS Development Build via EAS (No Mac Required)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS Build
```bash
eas build:configure
```

### Step 4: Build iOS Development Build
```bash
eas build --profile development --platform ios
```

This will:
- Build a Development Build in the cloud (takes ~15-20 minutes)
- Generate an `.ipa` file you can install on your iPhone
- Include all native modules (HealthKit, biometrics, etc.)

### Step 5: Install on Your iPhone
1. EAS will provide a download link or QR code
2. Open the link on your iPhone
3. Install the Development Build app
4. Trust the developer certificate in Settings → General → VPN & Device Management

### Step 6: Start Development Server
```bash
npm start
```

### Step 7: Connect Your iPhone
- Open the Development Build app on your iPhone
- Scan the QR code from the dev server
- Your app will load with hot reload!

## Alternative: Build Locally on Mac

If you have access to a Mac:

```bash
# Generate iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Build and run
npm run ios
```

## What's Different from Expo Go?

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Native modules | Limited set | All modules supported ✅ |
| HealthKit | ❌ Not available | ✅ Available |
| Biometrics | ❌ Not available | ✅ Available |
| First setup | Instant | Requires build (~15 min) |
| JS changes | Hot reload | Hot reload ✅ |
| Native changes | Not possible | Requires rebuild |

## Important Notes

- **Development Builds expire**: They're valid for ~30 days, then you'll need to rebuild
- **Apple Developer Account**: Free account works for development, but you'll need to rebuild every 7 days
- **Paid Account**: $99/year allows longer validity periods

## Troubleshooting

If build fails:
1. Check `app.json` configuration
2. Verify all plugins are correctly configured
3. Check EAS build logs: `eas build:list`

Your code is ready - you just need to build the Development Build!


