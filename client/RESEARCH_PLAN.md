# Research Plan: Expo SDK 51 Migration Verification

## Issues Found

1. ✅ **expo-health-connect version** - Fixed (was ~1.0.0, now ~0.1.1)
2. ❌ **react-native-keychain config plugin** - Error: No config plugin found
3. ⚠️ **expo-health-connect API** - Need to verify actual API matches our implementation
4. ⚠️ **Package compatibility** - Need to verify all versions are correct for SDK 51

## Research Questions

### 1. expo-health-connect API Verification
**Priority: HIGH**

**Questions:**
- What is the actual API for `expo-health-connect@0.1.1`?
- Does it have `isAvailable()`, `requestPermissions()`, `readRecords()`?
- What are the correct permission constants?
- What are the correct record type constants?
- How do you read sleep, steps, heart rate data?
- What is the actual data structure returned?

**Research Sources:**
- Official Expo documentation for expo-health-connect
- GitHub repository: https://github.com/expo/expo/tree/main/packages/expo-health-connect
- npm package README
- Example code/usage patterns

### 2. react-native-keychain Config Plugin
**Priority: HIGH**

**Questions:**
- Does `react-native-keychain@8.2.0` have an Expo config plugin?
- If not, what's the correct way to configure it for Expo SDK 51?
- Should we use `expo-local-authentication` instead?
- What's the recommended approach for biometric auth in Expo SDK 51?

**Research Sources:**
- react-native-keychain GitHub repo
- Expo documentation on config plugins
- Expo SDK 51 migration guides
- Alternative biometric auth solutions

### 3. Package Version Compatibility
**Priority: MEDIUM**

**Questions:**
- Are all package versions correct for Expo SDK 51?
- Any known compatibility issues?
- Should we use `npx expo install` for all Expo packages?

**Packages to verify:**
- `react-native-health@^1.19.0`
- `react-native-purchases@^8.1.0`
- `mixpanel-react-native@^3.1.2`
- `firebase@^10.12.0`
- All React Navigation packages

### 4. Health Connect Implementation
**Priority: MEDIUM**

**Questions:**
- Does our implementation match the actual API?
- Are we handling permissions correctly?
- Are we reading data in the correct format?
- Any Android-specific requirements?

## Recommended Research Approach

### Option A: Perplexity Deep Research
1. Create detailed research prompts for each question
2. Get comprehensive reports with code examples
3. Verify against official documentation
4. Update implementation based on findings

### Option B: Manual Research + Testing
1. Check official docs for each package
2. Review GitHub repos and issues
3. Test API calls in a small test project
4. Iterate on implementation

## Next Steps

1. **Immediate Fix:** Remove or fix `react-native-keychain` plugin configuration
2. **Research Phase:** Deep dive into expo-health-connect API
3. **Verification:** Test Health Connect API calls match our implementation
4. **Update:** Fix any API mismatches in aggregators.ts
5. **Test:** Run expo-doctor again to verify all issues resolved

## Expected Outcomes

After research, we should have:
- ✅ Correct expo-health-connect API usage
- ✅ Fixed react-native-keychain configuration
- ✅ Verified all package versions
- ✅ Updated implementation to match actual APIs
- ✅ Passing expo-doctor check







