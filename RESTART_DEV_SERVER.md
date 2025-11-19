# Commands to Clean Start Development Server

## Quick Restart (Recommended)

From the `client/` directory:

```bash
cd client
npm start -- --clear
```

Or using Expo directly:

```bash
cd client
npx expo start --clear
```

## Full Clean Restart (If Quick Restart Doesn't Work)

### Step 1: Stop Any Running Processes

**Windows PowerShell:**
```powershell
# Find and kill Metro bundler processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

**Or manually:**
- Press `Ctrl+C` in the terminal where Metro is running
- Close any terminal windows running `npm start` or `expo start`

### Step 2: Clear Cache and Restart

```bash
cd client

# Clear Expo cache
npx expo start --clear

# Or if that doesn't work, clear npm cache too:
npm start -- --reset-cache
```

## Nuclear Option (Complete Clean)

If you're still having issues, do a complete clean:

```bash
cd client

# Clear Expo cache
npx expo start --clear

# Clear watchman (if installed)
watchman watch-del-all

# Clear Metro bundler cache
rm -rf node_modules/.cache

# Clear npm cache
npm cache clean --force

# Restart
npm start -- --clear
```

## After Restart

1. The Metro bundler should start and show a QR code
2. On your iPhone, open the Expo Development Build app
3. Scan the QR code or enter the URL manually
4. The app should reload with fresh cache

## Troubleshooting

If you see "Port 8081 already in use":
```bash
# Windows PowerShell - Find what's using port 8081
netstat -ano | findstr :8081

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

Then restart:
```bash
npm start -- --clear
```

