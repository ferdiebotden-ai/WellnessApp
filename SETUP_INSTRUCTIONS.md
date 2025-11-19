# Setup Instructions for Development Mode

## Quick Start Checklist

After implementing the fixes, follow these steps:

### 1. Deploy Firestore Security Rules

The `firestore.rules` file has been created in the project root. You need to deploy these rules to Firebase:

**Option A: Via Firebase Console (Easiest)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wellness-os-app`
3. Navigate to **Firestore Database** > **Rules** tab
4. Copy the contents from `firestore.rules` file
5. Paste into the rules editor
6. Click **"Publish"**

**Option B: Via Firebase CLI** (if you have it installed)
```bash
firebase deploy --only firestore:rules
```

### 2. Create Environment Variables File

✅ **Already Created!** The `.env` file has been created in the `client/` directory with your Firebase credentials extracted from your iOS/Android config files.

**✅ App ID Updated:** Using your iOS App ID (`1:26324650924:ios:7b801ae00b4e2ed0be8809`) for testing.

**Note:** The `.env` file has all values configured:
- ✅ API Key: `AIzaSyAIYiCsMzeiJKpnERTac6fz48WHy7YN6xU`
- ✅ Project ID: `wellness-os-app`
- ✅ Storage Bucket: `wellness-os-app.firebasestorage.app`
- ✅ Messaging Sender ID: `26324650924`
- ✅ App ID: `1:26324650924:ios:7b801ae00b4e2ed0be8809` (iOS App ID - may need web app ID for production)

**Important:** If you encounter any Firebase initialization errors, you may need to add a Web App in Firebase Console and use its App ID instead. The Firebase JS SDK (used by Expo) typically expects a web app ID format (`1:26324650924:web:xxxxx`), but the iOS App ID should work for testing.

### 3. Restart Metro Bundler

After creating the `.env` file, restart your development server:

```bash
cd client
npm start
```

Press `r` to reload, or restart completely if needed.

### 4. Test the Login Flow

1. Open the app on your iPhone
2. Try logging in with an email/password
3. Check the console logs - you should see:
   - `🔧 Wellness OS - Development Mode`
   - `Backend API: Not configured (using fallbacks)` or your API URL
   - `Firebase Project: wellness-os-app`
4. After login, you should be redirected to the home screen
5. No paywall should appear (dev mode bypasses it)

### 5. Verify Firestore User Document

After logging in, check Firebase Console:
1. Go to **Firestore Database** > **Data** tab
2. You should see a `users` collection
3. Click on your user ID - you should see a document with:
   - `email`: Your email address
   - `onboarding_completed`: false
   - `created_at`: Timestamp

## Expected Behavior

### ✅ What Should Work:
- Login creates user profile in Firestore automatically
- Home screen loads without errors
- No "Network request failed" errors (graceful fallbacks)
- No paywall modals blocking access
- Console shows friendly messages about missing services (not errors)
- Full app access for testing (all modules unlocked)

### ⚠️ Console Messages (Normal):
- `RevenueCat not configured (no API keys). Subscriptions disabled in development.`
- `Mixpanel not configured. Analytics disabled in development.`
- `Backend API unavailable, using development fallback monetization status.`

These are informational logs, not errors. The app will work fine without these services.

## Troubleshooting

### Issue: "Failed to fetch user profile" error persists
**Solution:** Make sure Firestore security rules are deployed (Step 1)

### Issue: Firebase config errors
**Solution:** Verify your `.env` file has correct Firebase credentials and restart Metro bundler

### Issue: Still seeing paywall
**Solution:** Check that `DEV_MODE_FULL_ACCESS = true` in `client/src/providers/MonetizationProvider.tsx` (line 16)

### Issue: Home screen doesn't load
**Solution:** Check console for specific errors. The home screen should load even with empty data (shows "Your schedule is clear")

## Production Checklist

Before deploying to production, remember to:

1. Set `DEV_MODE_FULL_ACCESS = false` in `MonetizationProvider.tsx`
2. Update Firestore security rules to remove the permissive `match /{document=**}` rule
3. Configure proper `EXPO_PUBLIC_API_BASE_URL` pointing to deployed Google Cloud Functions
4. Add RevenueCat and Mixpanel API keys to `.env`
5. Test the paywall flow with real subscription tiers

