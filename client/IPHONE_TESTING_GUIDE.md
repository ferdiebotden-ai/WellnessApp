# iPhone Testing Guide - Step-by-Step

## ✅ Current Status Check

**What's Ready:**
- ✅ Node.js v22.20.0 installed
- ✅ npm 10.9.3 installed  
- ✅ Dependencies installed (`node_modules` exists)
- ✅ Expo SDK 51 configured
- ✅ Development Build setup configured (`expo-dev-client`)
- ✅ EAS configuration ready (`eas.json`)

**What's Needed:**
- ⚠️ iOS Development Build app on your iPhone (not built yet)
- ⚠️ `.env` file (optional but recommended for Firebase/API)

---

## 🎯 Two Options for iPhone Testing

### Option 1: EAS Build (Recommended - Works on Windows)
**Best for:** Testing on physical iPhone without a Mac
**Time:** ~15-20 minutes for first build
**Cost:** Free (with 7-day expiration) or $99/year Apple Developer

### Option 2: Local Mac Build
**Best for:** If you have access to a Mac
**Time:** ~5-10 minutes for first build
**Requires:** Mac with Xcode installed

---

## 📱 Option 1: EAS Build (Windows-Friendly)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo Account
```bash
eas login
```
*If you don't have an Expo account, create one at https://expo.dev*

### Step 3: Configure EAS Build (First Time Only)
```bash
eas build:configure
```
*This updates your `eas.json` if needed*

### Step 4: Build iOS Development Build
```bash
eas build --profile development --platform ios
```

**What happens:**
- Build runs in Expo's cloud (~15-20 minutes)
- You'll get a QR code and download link
- The build includes all native modules (HealthKit, biometrics, etc.)

### Step 5: Install on iPhone
1. **Download the build:**
   - Open the QR code/link on your iPhone
   - Or download the `.ipa` file and install via Finder (Mac) or iTunes

2. **Trust the developer certificate:**
   - Settings → General → VPN & Device Management
   - Tap on the developer certificate
   - Tap "Trust"

3. **Open the app:**
   - Look for "Wellness OS" or "Expo Development Build" on your home screen
   - Open it (it will show a connection screen)

### Step 6: Start Development Server
```bash
npm start
```

**What you'll see:**
- Metro bundler starts
- QR code appears in terminal
- Connection options displayed

### Step 7: Connect iPhone to Dev Server

**Method A: Scan QR Code (Easiest)**
1. Open the Development Build app on your iPhone
2. Tap "Scan QR Code" or use Camera app
3. Scan the QR code from terminal
4. App loads with hot reload! 🔥

**Method B: Manual Connection**
1. Make sure iPhone and computer are on same WiFi network
2. In Development Build app, tap "Enter URL manually"
3. Enter the URL shown in terminal (e.g., `exp://192.168.1.100:8081`)

---

## 🍎 Option 2: Local Mac Build (If You Have a Mac)

### Step 1: Prebuild iOS Project
```bash
npx expo prebuild --platform ios
```

### Step 2: Install CocoaPods Dependencies
```bash
cd ios
pod install
cd ..
```

### Step 3: Build and Install on iPhone
```bash
npm run ios
```
*Make sure iPhone is connected via USB and selected in Xcode*

### Step 4: Start Development Server
```bash
npm start
```

The app should automatically connect!

---

## 🔧 Environment Variables Setup (Optional but Recommended)

Your app has fallback values, but for full functionality, create a `.env` file:

### Create `.env` file in `client/` directory:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:your-app-id

# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://your-api-url.com

# RevenueCat Configuration (Optional)
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=your-apple-api-key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your-android-api-key

# Analytics Configuration (Optional)
EXPO_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
```

**Important:** 
- All variables must start with `EXPO_PUBLIC_`
- Restart Metro bundler after changing `.env`
- Rebuild native app if variables are needed at build time

---

## 🚀 Quick Start Commands

### Start Dev Server (After Build is Installed)
```bash
npm start
# or
npx expo start --dev-client
```

### Clear Cache and Restart
```bash
npx expo start --clear
```

### Check Expo Doctor
```bash
npx expo-doctor
```

---

## 🔍 Troubleshooting

### "Unable to connect to development server"
- ✅ Ensure iPhone and computer are on same WiFi network
- ✅ Check firewall isn't blocking port 8081
- ✅ Try manual URL entry in Development Build app
- ✅ Restart Metro bundler: `npm start -- --reset-cache`

### "Development Build expired"
- Development builds expire after 7 days (free account) or 30 days (paid)
- Rebuild: `eas build --profile development --platform ios`

### "Module not found" errors
- ✅ Ensure you're using Development Build (not Expo Go)
- ✅ Rebuild if you added new native modules
- ✅ Check `app.json` plugins are configured

### Metro bundler won't start
```bash
# Clear cache
npx expo start --clear

# Or reset completely
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 📝 Next Steps After Setup

1. ✅ Development Build installed on iPhone
2. ✅ Dev server running (`npm start`)
3. ✅ Connected and seeing your app
4. 🎉 **You're ready to test!**

**Hot Reload:** Changes to JavaScript/TypeScript files will automatically reload
**Native Changes:** Require rebuilding the Development Build

---

## 🎯 Summary Checklist

- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged into Expo (`eas login`)
- [ ] iOS Development Build created (`eas build --profile development --platform ios`)
- [ ] Development Build installed on iPhone
- [ ] Developer certificate trusted on iPhone
- [ ] `.env` file created (optional)
- [ ] Dev server started (`npm start`)
- [ ] iPhone connected to dev server
- [ ] App loads successfully! 🎉

---

## 💡 Pro Tips

1. **Keep Development Build Updated:** Rebuild every few weeks to avoid expiration
2. **Use Same WiFi:** Always ensure iPhone and dev machine are on same network
3. **Check Logs:** Use `npx expo start --dev-client` to see connection logs
4. **Test Native Features:** HealthKit, biometrics, etc. only work in Development Build
5. **Save Build URL:** EAS provides a permanent URL for your development build

---

**Ready to start?** Run `eas build --profile development --platform ios` to begin! 🚀





