# iOS Development Build - Credential Setup Instructions

## Current Status
✅ EAS CLI installed
✅ Logged into Expo as: ferdie.botden
✅ EAS project configured: @ferdie.botden/wellness-os
✅ Apple Developer Account: Ready

## Next Steps - Credential Setup

The build process needs iOS credentials configured. Follow these steps:

### Step 1: Configure Development Profile Credentials

Run this command:
```bash
cd client
eas credentials
```

**When prompted:**
1. **Select platform** → Choose **iOS** (should already be selected)
2. **Which build profile?** → Select **development** (use arrow keys, press Enter)
3. **How would you like to upload your credentials?** → Select **Let Expo handle all credentials, including keys and certificates**
   - This is the easiest option and recommended for development builds
4. **Apple ID** → Enter your Apple Developer account email
5. **Password** → Enter your Apple ID password
6. **Two-factor authentication** → If prompted, enter the 6-digit code from your trusted device
7. **iOS app only uses standard/exempt encryption?** → Answer **Y** (Yes)
   - Your app uses standard HTTPS encryption, which is exempt

### Step 2: Build iOS Development Build

After credentials are configured, run:
```bash
eas build --profile development --platform ios
```

**When prompted:**
- **Register your device?** → Answer **Yes** (to install on your iPhone)
- EAS will help you get your device UDID automatically

### Alternative: Direct Build (If Credentials Already Set)

If credentials are already configured, you can build directly:
```bash
eas build --profile development --platform ios
```

## What Happens Next

1. **Build queues** on EAS servers (15-30 minutes)
2. **Email notification** sent when build completes
3. **Download link** provided in terminal and email
4. **Install on iPhone** using Expo Orbit or direct download
5. **Start dev server** with `npm start`
6. **Connect iPhone** to dev server

## Troubleshooting

### If Credential Setup Fails
- Ensure Apple Developer account is active
- Check that your Apple ID has accepted the developer agreement
- Verify 2FA is working on your Apple ID
- Try logging out and back in: `eas logout` then `eas login`

### If Build Fails
- Check EAS build logs: `eas build:list`
- Verify bundle identifier matches: `com.wellnessos.app`
- Ensure all plugins in `app.json` are compatible

## Current Configuration

- **EAS Project**: @ferdie.botden/wellness-os
- **Project ID**: f5c39858-7d01-4a73-890a-311d6be683e1
- **Bundle ID**: com.wellnessos.app
- **Build Profile**: development
- **Platform**: iOS

Your project is ready! Run `eas credentials` to set up iOS credentials, then build.







