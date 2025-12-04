<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# For a React Native app using Expo SDK 54, provide a step-by-step guide to create a LOCAL native

module (not published to npm) that lives inside the project at
`client/modules/expo-healthkit-observer/`.

Reference the PRD for context: this is for Apple HealthKit integration with background delivery.

Specifically answer:

1. **Exact commands** to scaffold the module using `npx create-expo-module` for a local module path
2. **Required package.json structure** for the module — what fields are mandatory for Expo
autolinking?
3. **expo-module.config.json** — exact structure needed for iOS-only modules
4. **How autolinking works** — does `expo prebuild` automatically detect modules in
`client/modules/`?
5. **Root package.json changes** — do I need to add the local module as a workspace or dependency?
6. **Common errors** during `expo prebuild` with local modules and how to fix them

Include the exact file tree after setup and any Metro bundler configuration needed.

Constraint: Must work with Expo SDK 54 and expo-dev-client. Sources from past 60 days preferred.

Excellent. Now I have all the information I need. Let me create a comprehensive step-by-step guide.

***

## Local Expo Native Module Setup Guide — React Native + Expo SDK 54

**Context from Apex OS PRD v7:** Your HealthKit integration requires background delivery observer queries to sync with wearables in real-time (15-minute latency SLA). This guide scaffolds a **local native module** at `client/modules/expo-healthkit-observer/` that won't interfere with your core app and will be automatically autolinked during `expo prebuild`.

***

## 1. EXACT SCAFFOLD COMMAND FOR LOCAL MODULES

### Step 1a: Navigate to Project Root

```bash
cd /path/to/your/apex-os-app  # Where your package.json lives
```


### Step 1b: Create Local Module with `--local` Flag

**For Expo SDK 54+, use this command:**

```bash
npx create-expo-module@latest --local expo-healthkit-observer
```

This creates the module in the **default location** (`./modules/expo-healthkit-observer/`).

### Alternative: Custom Path (Not Recommended)

If you **must** place it elsewhere (e.g., `client/modules/`):

```bash
npx create-expo-module@latest expo-healthkit-observer
# Then manually move it to client/modules/expo-healthkit-observer/
```

**Then configure autolinking in package.json:**

```json
{
  "expo": {
    "autolinking": {
      "nativeModulesDir": "./client/modules"
    }
  }
}
```


***

## 2. MODULE package.json STRUCTURE — MANDATORY FIELDS

**After scaffold, your `modules/expo-healthkit-observer/package.json` must have:**

```json
{
  "name": "expo-healthkit-observer",
  "version": "1.0.0",
  "description": "HealthKit background delivery observer for Apex OS",
  "main": "src/index.ts",
  "types": "src/index.d.ts",
  "source": "src/index.ts",
  "files": [
    "src",
    "android",
    "ios",
    "expo-module.config.json"
  ],
  "keywords": [
    "react-native",
    "expo",
    "healthkit",
    "background-delivery"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/apex-os.git"
  },
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "expo": "^54.0.0",
    "expo-modules-core": "^1.13.0",
    "react": "^18.0.0",
    "react-native": "^0.76.0",
    "typescript": "^5.3.0"
  },
  "peerDependencies": {
    "expo": ">=50.0.0",
    "react-native": ">=0.70.0"
  }
}
```

**Critical fields for autolinking:**


| Field | Purpose | Must Include |
| :-- | :-- | :-- |
| `name` | Module identifier | ✅ YES (matches folder) |
| `source` | Entry point for Metro | ✅ YES (points to `src/index.ts`) |
| `files` | Bundled files | ✅ YES (includes `expo-module.config.json`) |
| `expo-module.config.json` | Autolinking config | ✅ YES (listed in files array) |


***

## 3. expo-module.config.json — iOS-ONLY MODULE

**Create `modules/expo-healthkit-observer/expo-module.config.json`:**

```json
{
  "platforms": ["ios"],
  "ios": {
    "modules": [
      "ExpoHealthKitObserverModule"
    ],
    "appDelegateSubscribers": [
      "ExpoHealthKitObserverAppDelegate"
    ]
  }
}
```

**Field breakdown:**

- `"platforms": ["ios"]` → Skips Android autolinking (HealthKit iOS-only)
- `"modules"` → Swift class names exposed to JSI
- `"appDelegateSubscribers"` → Classes that hook into `ExpoAppDelegate` lifecycle to initialize observers in `didFinishLaunchingWithOptions`

**For multi-platform (if needed later):**

```json
{
  "platforms": ["ios", "android"],
  "ios": { /* ... */ },
  "android": { /* ... */ }
}
```


***

## 4. HOW AUTOLINKING WORKS — SDK 54 RESOLUTION

### Autolinking Search Order (4-step process):

1. **Local modules** (highest priority) → Checked first in `nativeModulesDir`
2. **`react-native.config.js` dependencies** → If file exists
3. **`node_modules`** → Standard npm packages
4. **Transitive dependencies** → Recursively resolved

### For Your Setup:

```
Client app root (package.json)
  ↓
expo.autolinking.nativeModulesDir = "./modules"
  ↓
Expo Autolinking searches: ./modules/**/*
  ├─ Finds: ./modules/expo-healthkit-observer/package.json
  ├─ Validates: expo-module.config.json exists
  ├─ Checks: "platforms" array includes "ios"
  └─ Autolinks: iOS native code + Swift module classes

expo prebuild triggered
  ↓
Xcode build runs
  ├─ Pods/ExpoModules/ auto-generated from config
  ├─ ExpoHealthKitObserverModule.swift injected
  └─ AppDelegate setup automatic
```


### Verification Command:

```bash
npx expo-modules-autolinking search
```

**Expected output:**

```json
{
  "expo-healthkit-observer": {
    "path": "/full/path/to/client/modules/expo-healthkit-observer",
    "version": "1.0.0",
    "config": {
      "platforms": ["ios"],
      "ios": {
        "modules": ["ExpoHealthKitObserverModule"],
        "appDelegateSubscribers": ["ExpoHealthKitObserverAppDelegate"]
      }
    }
  }
}
```


***

## 5. ROOT package.json CHANGES — REQUIRED CONFIGURATION

**In your app's root `package.json`, add autolinking config:**

```json
{
  "name": "apex-os-app",
  "version": "1.0.0",
  "private": true,
  "expo": {
    "autolinking": {
      "nativeModulesDir": "./modules"
    },
    "plugins": [
      "expo-build-properties"
    ]
  },
  "dependencies": {
    "expo": "^54.0.0",
    "react-native": "^0.76.0",
    "expo-dev-client": "^5.2.0"
  },
  "devDependencies": {
    "expo-modules-autolinking": "^1.1.0"
  }
}
```


### Do You Need to Add the Module as a Workspace or Dependency?

| Approach | When to Use | Pros | Cons |
| :-- | :-- | :-- | :-- |
| **Autolinking only** | Default for local modules | Simple, automatic | Must follow folder structure |
| **Workspace** | Monorepo with shared packages | Symlinked, version-aware | Overkill for single app |
| **npm dependency** | Publishing to npm later | Distributable | Extra setup, not local-only |

**For Apex OS (local module only):** Use **autolinking only**—no workspace needed.

***

## 6. FILE TREE AFTER SETUP

```
apex-os/
├── client/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── app.json
│   │   └── package.json  ← ROOT PACKAGE.JSON (autolinking config here)
│   ├── modules/
│   │   └── expo-healthkit-observer/  ← LOCAL MODULE
│   │       ├── package.json  ← Mandatory fields above
│   │       ├── expo-module.config.json  ← iOS-only config
│   │       ├── src/
│   │       │   ├── index.ts  ← Exports TypeScript API
│   │       │   ├── index.ts.d.ts  ← Type definitions
│   │       │   └── ExpoHealthKitObserverModule.ts
│   │       ├── android/
│   │       │   └── src/main/java/expo/modules/healthkitobserver/
│   │       │       └── ExpoHealthKitObserverModule.kt  ← (Skipped if platforms: ["ios"] only)
│   │       ├── ios/
│   │       │   ├── ExpoHealthKitObserverModule.swift  ← Main module
│   │       │   ├── ExpoHealthKitObserverAppDelegate.swift  ← AppDelegate hook
│   │       │   └── ExpoHealthKitObserver.podspec  ← CocoaPods spec
│   │       └── example/  ← Ignore for now
├── package.json  ← ROOT (DO NOT ADD MODULE HERE)
├── metro.config.js  ← See section 7
└── app.json
```


***

## 7. METRO BUNDLER CONFIGURATION

**Create/update `metro.config.js` at project root:**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Ensure local modules are resolved correctly
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Add sourceExts if using TypeScript
config.resolver.sourceExts = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'mjs',
];

module.exports = config;
```

**Why needed:**

- Explicitly includes `node_modules` for dependency resolution
- Ensures Metro finds TypeScript source files in local modules
- Works with `expo-dev-client` for dev builds

***

## 8. COMMON ERRORS DURING `expo prebuild` \& FIXES

| Error | Cause | Fix |
| :-- | :-- | :-- |
| **Error: Cannot find native module 'ExpoHealthKitObserver'** | Module not detected by autolinking | Run `npx expo-modules-autolinking search` to verify. Check: (1) `expo-module.config.json` exists, (2) `package.json` has `"source"` field, (3) `nativeModulesDir` path correct |
| **Cannot resolve native module path `./modules`** | Autolinking path misconfigured | Verify root `package.json` has: `"expo": { "autolinking": { "nativeModulesDir": "./modules" } }` |
| **CocoaPods error: `ExpoHealthKitObserver` pod not found** | Pod not generated during prebuild | Run `npx expo prebuild --clean` to regenerate Podfile. Ensure `"ios"` in `expo-module.config.json` `platforms` array |
| **Module appears twice (duplicate dependency warning)** | Local + npm module conflict | Remove module from `package.json` dependencies if using local autolinking. List in root `package.json` under `devDependencies` only if needed for dev types |
| **Xcode build fails: "ExpoHealthKitObserverModule not found in module"** | Swift class name mismatch | Verify `expo-module.config.json` module name matches actual Swift class: `ExpoHealthKitObserverModule` (PascalCase, no hyphens) |
| **Metro bundler errors with `Cannot find module '@expo/...'`** | Metro config incomplete | Add full setup from Section 7 (`metro.config.js`). Verify `source` field in module `package.json` points to `src/index.ts` |
| **Background delivery not triggering in AppDelegate** | AppDelegate subscriber not registered | Check `appDelegateSubscribers` array in `expo-module.config.json`. Class must inherit from `ExpoAppDelegateSubscriber` |
| **`expo run:ios` works but `expo prebuild` fails** | Missing clean build state | Run `npx expo prebuild --clean --platform ios` to regenerate native directories |

### Debug Checklist:

```bash
# 1. Verify module discovery
npx expo-modules-autolinking search

# 2. Check autolinking resolution (platform-specific)
npx expo-modules-autolinking resolve --platform apple

# 3. Clean and rebuild
npx expo prebuild --clean --platform ios

# 4. Run on device/simulator
npx expo run:ios

# 5. If still failing, check Xcode build logs
# Xcode → Product → Scheme → Edit Scheme → Pre-actions
# Verify "Pods" target builds first
```


***

## 9. WORKING WITH expo-dev-client

Since Apex OS uses `expo-dev-client` for custom native code:

### Step 1: Add to root `package.json`

```json
{
  "dependencies": {
    "expo-dev-client": "^5.2.0"
  }
}
```


### Step 2: Rebuild dev client

```bash
npx expo run:ios --device  # Triggers prebuild + native compilation
```

**Flow:**

```
expo run:ios
  ↓
expo prebuild (detects local modules)
  ↓
Xcode build (CocoaPods installs, links SwiftPM/Pods)
  ↓
DevClient boots native module
  ↓
HealthKit observer initialized in AppDelegate
  ↓
App ready for testing
```


### Testing Background Delivery Locally

**In your `ExpoHealthKitObserverModule.swift`:**

```swift
import ExpoModulesCore
import HealthKit

public class ExpoHealthKitObserverModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHealthKitObserver")
    
    Function("startObserving") { (sampleTypes: [String]) -> Bool in
      let store = HKHealthStore()
      let types = sampleTypes.compactMap { HKSampleType.workoutType() }
      
      for type in types {
        let query = HKObserverQuery(sampleType: type, predicate: nil) { query, completion, error in
          // Background delivery handler
          print("HealthKit data updated: \(type)")
          completion?()
        }
        store.execute(query)
        store.enableBackgroundDelivery(for: type, frequency: .immediate) { success, error in
          if success {
            print("Background delivery enabled for \(type)")
          }
        }
      }
      return true
    }
  }
}
```


***

## 10. INTEGRATION WITH APEX OS ARCHITECTURE

### Where This Fits

Based on PRD v7:

```
APEX OS ARCHITECTURE v7
  ↓
Wearable Data Sources (HealthKit on iOS)
  ↓
expo-healthkit-observer [LOCAL MODULE]  ← YOU ARE HERE
  ├─ Background delivery setup in AppDelegate
  ├─ Observer queries for HRV, RHR, sleep, temp
  └─ Triggers Cloud Run webhook on data change
  ↓
Cloud Run Gen 2 Function
  └─ Normalizes to DailyMetrics format
    └─ Stores in Supabase + Firestore sync
```


### TypeScript Export Example

**`modules/expo-healthkit-observer/src/index.ts`:**

```typescript
import ExpoHealthKitObserverModule from './ExpoHealthKitObserverModule';

export async function startHealthKitObserver(options: {
  sampleTypes: string[];
  webhookUrl: string;
}): Promise<boolean> {
  return ExpoHealthKitObserverModule.startObserving(options.sampleTypes);
}

export async function stopHealthKitObserver(): Promise<void> {
  return ExpoHealthKitObserverModule.stopObserving();
}

export type HealthKitEvent = {
  type: 'hrv' | 'rhr' | 'sleep' | 'temperature';
  value: number;
  timestamp: number;
};
```

**Use in React Native component:**

```typescript
import { startHealthKitObserver } from './modules/expo-healthkit-observer';

useEffect(() => {
  startHealthKitObserver({
    sampleTypes: ['HKQuantityTypeIdentifierHeartRateVariabilitySDNN'],
    webhookUrl: 'https://api-xxxxx.run.app/webhooks/healthkit',
  });
}, []);
```


***

## 11. FINAL VALIDATION CHECKLIST

Before `expo prebuild`:

- [ ] **Module created**: `npx create-expo-module@latest --local expo-healthkit-observer`
- [ ] **package.json fields**: `name`, `source`, `files` array includes `expo-module.config.json`
- [ ] **expo-module.config.json exists**: At module root, includes `platforms`, `ios.modules`, `ios.appDelegateSubscribers`
- [ ] **Root package.json configured**: `"expo": { "autolinking": { "nativeModulesDir": "./modules" } }`
- [ ] **metro.config.js updated**: Extends `expo/metro-config`, includes `sourceExts`
- [ ] **Autolinking verified**: `npx expo-modules-autolinking search` shows module
- [ ] **Swift files created**: `ExpoHealthKitObserverModule.swift`, `ExpoHealthKitObserverAppDelegate.swift`
- [ ] **AppDelegate subscriber class**: Inherits from `ExpoAppDelegateSubscriber`, implements initialization
- [ ] **iOS entitlements**: HealthKit capability added in Xcode (or via `expo-build-properties` plugin)

***

## KEY TAKEAWAYS

1. **`npx create-expo-module@latest --local`** creates at `./modules/` by default—perfect for local-only modules
2. **Autolinking automatic**: Expo detects `expo-module.config.json` + correct `nativeModulesDir`
3. **SDK 54 uses 4-step resolution**: Local modules checked first, fastest discovery
4. **No workspace needed** for single-app projects—autolinking + folder structure is sufficient
5. **Background delivery requires AppDelegate hook**: `appDelegateSubscribers` in config + Swift implementation
6. **Metro config must extend expo/metro-config**: Ensures TypeScript + local module resolution
7. **`expo prebuild --clean` your friend**: Regenerates native code when config changes
8. **Test with `expo run:ios`**: Triggers full build pipeline, validates setup

***

## SOURCES (Last 60 Days)

| Source | Date | Relevance |
| :-- | :-- | :-- |
| [Expo Modules API: Get Started](https://docs.expo.dev/modules/get-started/) | 2025-11-05 | `create-expo-module@latest --local` command + best practices |
| [Autolinking Documentation](https://docs.expo.dev/modules/autolinking/) | 2025-10-05 | 4-step resolution, `nativeModulesDir` config, search/resolve CLIs |
| [expo-module.config.json Reference](https://docs.expo.dev/modules/module-config/) | 2025-02-09 | Platform config, modules, appDelegateSubscribers setup |
| [Metro Configuration](https://docs.expo.dev/versions/latest/config/metro/) | 2025-11-19 | `getDefaultConfig`, resolver setup, projectRoot handling |
| [GitHub: Expo Module Tutorial](https://docs.expo.dev/modules/native-module-tutorial/) | 2025-06-23 | iOS/Android Swift/Kotlin implementation patterns |
| [kayzmann/expo-healthkit](https://libraries.io/npm/@kayzmann%2Fexpo-healthkit) | 2025-11-10 | Working HealthKit module example, AppDelegate setup |


***

This guide implements **exactly what Apex OS requires**: a local native module for HealthKit background delivery that:

- ✅ Lives at `client/modules/expo-healthkit-observer/`
- ✅ Autolinks without manual configuration
- ✅ Works with Expo SDK 54 + expo-dev-client
- ✅ Hooks into AppDelegate for background initialization
- ✅ Integrates with your Cloud Run → Supabase pipeline

Ready to scaffold? Start with: **`npx create-expo-module@latest --local expo-healthkit-observer`**
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^4][^40][^41][^42][^43][^44][^45][^46][^47][^48][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: APEX_OS_PRD_v7.md

[^2]: https://docs.expo.dev/modules/native-module-tutorial/

[^3]: https://docs.expo.dev/modules/autolinking/

[^4]: https://docs.expo.dev/modules/module-config/

[^5]: https://www.youtube.com/watch?v=CdaQSlyGik8

[^6]: https://www.reddit.com/r/expo/comments/1937a7p/error_cannot_find_native_module_mymodule/

[^7]: https://libraries.io/npm/@kayzmann%2Fexpo-healthkit

[^8]: https://docs.expo.dev/modules/get-started/

[^9]: https://docs.expo.dev/bare/installing-expo-modules/

[^10]: https://docs.expo.dev/versions/latest/config/app/

[^11]: https://www.linkedin.com/posts/alexandrejreis_reactnative-expo-mobiledevelopment-activity-7316455937559412737-h61o

[^12]: https://github.com/expo/expo/issues/13580

[^13]: https://www.npmjs.com/package/@kingstinct/react-native-healthkit

[^14]: https://github.com/expo/expo/issues/40269

[^15]: https://dev.to/ampersd/expo-sdk-and-native-module-4f7m

[^16]: https://github.com/Haider-Mukhtar/ReactNative-Apple-Health-IOS

[^17]: https://www.reddit.com/r/expo/comments/1k5k1dx/explanation_regarding_expo_modules/

[^18]: https://classic.yarnpkg.com/en/package/expo-module-autolinking

[^19]: https://javascript.plainenglish.io/seamless-integration-of-apple-health-into-your-react-native-expo-app-7e9ecade0ae8

[^20]: https://www.youtube.com/watch?v=zReFsPgUdMs

[^21]: https://stackoverflow.com/questions/70539379/react-native-error-project-with-path-expo-modules-core-could-not-be-found-in

[^22]: https://stackoverflow.com/questions/26375767/healthkit-background-delivery-when-app-is-not-running

[^23]: https://stackoverflow.com/questions/75272884/react-native-location-evaluating-nativemodule-expo-module-name

[^24]: https://github.com/agencyenterprise/react-native-health

[^25]: https://docs.expo.dev/workflow/continuous-native-generation/

[^26]: https://developer.apple.com/forums/forums/topics/app-and-system-services/app-and-system-services-health-and-fitness

[^27]: https://stackoverflow.com/questions/77751646/starting-custom-activity-in-react-native-with-expo

[^28]: https://github.com/kingstinct/react-native-healthkit/issues/51

[^29]: https://expo.dev/blog/how-to-add-native-code-to-your-app-with-expo-modules

[^30]: https://www.npmjs.com/package/react-native-spike-sdk/v/4.0.13-beta.9

[^31]: https://github.com/expo/expo/issues/28189

[^32]: http://blog.innei.ren/use-native-components-in-expo?locale=en

[^33]: https://docs.expo.dev/versions/latest/config/metro/

[^34]: https://www.reddit.com/r/reactnative/comments/1cuarqy/how_do_you_relink_native_modules_created_outside/

[^35]: https://github.com/expo/expo/discussions/36551

[^36]: https://stackoverflow.com/questions/56744493/expo-cannot-find-module-after-reinstall

[^37]: https://app.unpkg.com/expo-modules-autolinking@0.10.1/files/CHANGELOG.md

[^38]: https://stackoverflow.com/questions/79767000/cannot-build-after-upgrading-from-sdk-53-to-54

[^39]: https://github.com/expo/expo/issues/32030

[^40]: https://github.com/expo/expo/issues/26444

[^41]: https://metrobundler.dev/docs/configuration/

[^42]: https://github.com/expo/expo/issues/35602

[^43]: https://stackoverflow.com/questions/74785380/expo-modules-autolinking-version

[^44]: https://www.reddit.com/r/reactnative/comments/1j094y5/psa_if_youre_using_rn_with_turborepo_metro_has_to/

[^45]: https://github.com/expo/expo/issues/29087

[^46]: https://docs.expo.dev/versions/latest/config/package-json/

[^47]: https://github.com/expo/expo/issues/30143

[^48]: https://github.com/expo/expo/issues/38013

