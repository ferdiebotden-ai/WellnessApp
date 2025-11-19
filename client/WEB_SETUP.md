# Web Development Setup - Troubleshooting Guide

## ✅ What We've Set Up

1. **Web Mock Layer** - Created `.web.ts` files for:
   - `aggregators.web.ts` - Mocks HealthKit/Google Fit
   - `secureCredentials.web.ts` - Mocks FaceID/SecureStore
   - `RevenueCatService.web.ts` - Mocks subscriptions
   - `AnalyticsService.web.ts` - Mocks Mixpanel
   - `firebase.web.ts` - Web-compatible Firebase config

2. **Web-Compatible Components**:
   - `KeyboardAvoidingView.web.tsx` - Falls back to View on web

3. **Error Handling**:
   - Added global error handlers in `App.tsx`
   - Enhanced console logging

## 🔍 Debugging the Black Screen

### Step 1: Check Browser Console
1. Open the browser DevTools (F12)
2. Go to the **Console** tab
3. Look for:
   - Red error messages
   - "WEB MOCK:" prefixed logs (confirms mocks are loading)
   - Firebase initialization errors
   - Navigation errors

### Step 2: Verify Server is Running
```bash
cd client
npx expo start --web
```

You should see:
```
Metro waiting on exp://192.168.x.x:8081
Web is waiting on http://localhost:8081
```

### Step 3: Check Network Tab
- Open DevTools → Network tab
- Reload the page
- Look for failed requests (red entries)
- Check if `index.bundle` is loading

### Step 4: Common Issues & Fixes

#### Issue: "Cannot read property 'OS' of undefined"
**Fix:** Platform import missing. Check all files use:
```typescript
import { Platform } from 'react-native';
```

#### Issue: Firebase Auth Stuck Loading
**Fix:** Check Firebase config in `.env`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

#### Issue: "Module not found" errors
**Fix:** Clear cache and reinstall:
```bash
cd client
rm -rf node_modules .expo
npm install
npx expo start --web --clear
```

#### Issue: Blank screen but no errors
**Fix:** Check if SplashScreen is rendering:
- Look for "Wellness OS" text in console
- Check if `AuthProvider` state is stuck at 'loading'

### Step 5: Test Minimal Render
Temporarily replace `App.tsx` content with:
```typescript
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1218' }}>
      <Text style={{ color: '#63E6BE', fontSize: 24 }}>✅ Web Working!</Text>
    </View>
  );
}
```

If this renders, the issue is in AuthProvider or Navigation.

## 🚀 Quick Start Commands

```bash
# Start web dev server
cd client
npx expo start --web

# Start with cleared cache
npx expo start --web --clear

# Check for TypeScript errors
npx tsc --noEmit
```

## 📝 Next Steps

Once the app loads:
1. **Open browser console** - Check for "WEB MOCK:" logs
2. **Navigate to HomeScreen** - Should show dashboard
3. **Test UI changes** - Edit `HomeScreen.tsx` and see hot-reload
4. **Polish UI** - Use Cursor AI to refine styles

## 🐛 Still Having Issues?

Check these files for errors:
- `client/src/services/firebase.web.ts` - Firebase web config
- `client/src/providers/AuthProvider.tsx` - Auth state management
- `client/src/navigation/RootNavigator.tsx` - Navigation setup

Look for console logs starting with:
- `🔧 Wellness OS` - App initialization
- `🧭 RootNavigator` - Navigation state
- `WEB MOCK:` - Mock services

