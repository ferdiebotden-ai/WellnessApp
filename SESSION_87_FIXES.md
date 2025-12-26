# Session 87+ Fixes — Protocol UI/UX Issues

> User feedback from Session 86 testing. Each section is a discrete fix that can be tackled in sequence.
> Updated with root cause analysis from code review.

---

## Priority Order

| # | Issue | Severity | Est. Effort | Root Cause | Status |
|---|-------|----------|-------------|------------|--------|
| 1 | HomeScreen redundancy cleanup | High | Medium | Architecture issue | ✅ DONE (Session 87) |
| 2 | ProtocolQuickSheet scroll/expand fix | High | Medium | Implementation bug | ✅ DONE (Session 87) |
| 3 | AI Coach context not working | High | Medium | ListEmptyComponent bug | ✅ DONE (Session 88) |
| 4 | Health tab placeholder data handling | Medium | Low | useMockData=true default | ✅ DONE (Session 88) |
| 5 | Apple Health settings UX + module error | High | High | Native module linking | 📅 Session 89 |

---

## Issue 1: HomeScreen Redundancy Cleanup

### Problem
HomeScreen shows contradictory protocol sections:
1. **TodaysFocusCard** → Shows "TODAY'S FOCUS" with priority protocol OR "All Caught Up" when empty
2. **MyScheduleSection** → Shows "MY SCHEDULE" with all enrolled protocols

**The UX Conflict:**
When TodaysFocusCard shows "All Caught Up" (no protocol due NOW), but MyScheduleSection shows protocols scheduled for later — the messaging is contradictory. User sees "All caught up!" but also sees a list of protocols below.

### Root Cause Analysis
From `HomeScreen.tsx`:
- Line 404-407: `TodaysFocusCard` renders unconditionally
- Line 428-431: `MyScheduleSection` renders unconditionally
- These serve overlapping purposes

From `MyScheduleSection.tsx`:
- Line 42: Title is "MY SCHEDULE" (not "Today's Schedule")
- Shows ALL enrolled protocols regardless of time

**There is NO "Today's Schedule" section** — user may have been referring to TodaysFocusCard as "Today's Schedule".

### PRD Alignment
The PRD references Headspace/Oura's "Today" tab with **ONE focal point** ("One Big Thing" philosophy). Having two sections dilutes this.

### Recommended Solution

**Option A: Remove TodaysFocusCard entirely (Recommended)**
- Rename MyScheduleSection to "Today's Protocols"
- Add smart sorting: protocols due NOW highlighted at top
- Single source of truth for protocols

**Option B: Conditional TodaysFocusCard**
- Only show TodaysFocusCard when a protocol is actively due NOW
- Hide it entirely when nothing is due (no "All Caught Up" message)
- MyScheduleSection shows everything else

### Files to Modify
- `client/src/screens/HomeScreen.tsx`
- `client/src/components/home/MyScheduleSection.tsx`
- `client/src/components/home/TodaysFocusCard.tsx` (possibly remove)

### Tasks
- [x] Decide: Option A (remove TodaysFocusCard) or Option B (conditional) — **Option A chosen**
- [x] If Option A: Remove TodaysFocusCard from HomeScreen
- [x] Rename "MY SCHEDULE" to "TODAY'S PROTOCOLS"
- [x] Ensure protocols due NOW are visually highlighted (already done with pulsing border)
- [ ] Test empty state: when no protocols enrolled at all
- [x] Verify no contradictory messaging

### Acceptance Criteria ✅
- Only ONE section shows scheduled protocols
- No "All Caught Up" message when protocols exist for later
- Clear visual hierarchy: Health Summary → Today's Protocols → Weekly Progress

---

## Issue 2: ProtocolQuickSheet Scroll/Expand Fix

### Problem
When tapping a protocol card on HomeScreen, the ProtocolQuickSheet bottom sheet:
- Cannot scroll content (text gets cut off)
- Cannot be pulled/dragged to full screen height
- Content is not fully readable

### Root Cause Analysis
From `ProtocolQuickSheet.tsx`:
- Uses basic `Modal` with `transparent` + manual overlay
- ScrollView exists but may not have proper flex constraints
- No gesture handling for drag-to-expand
- Static height: `maxHeight: '70%', minHeight: '60%'`

**The ScrollView configuration (lines 137-141):**
```tsx
<ScrollView
  style={styles.scrollContent}
  contentContainerStyle={styles.scrollContentInner}
  showsVerticalScrollIndicator={false}
>
```

**Potential Issues:**
1. `styles.scrollContent` may not have `flex: 1`
2. Parent container constraints may prevent scrolling
3. `TouchableWithoutFeedback` wrapper may intercept scroll gestures

### Recommended Solution

**Option A: Fix Current Implementation (Quick)**
```tsx
// Ensure proper flex configuration
scrollContent: {
  flex: 1,
  maxHeight: '100%', // Allow full expansion
},
scrollContentInner: {
  flexGrow: 1,
  paddingBottom: 20, // Space for last item
},
```

**Option B: Replace with @gorhom/bottom-sheet (Better UX)**
```bash
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

Benefits:
- Snap points (60%, 90%, 100%)
- Native gesture handling
- iOS-native feel (matches PRD's Oura aesthetic)
- Keyboard avoidance built-in

### Files to Modify
- `client/src/components/protocol/ProtocolQuickSheet.tsx`

### Tasks
- [x] Test current ScrollView with verbose content
- [x] If scrolling broken: Fix flex constraints (Option A) — **Fixed: removed minHeight, increased maxHeight, added flexGrow**
- [ ] If drag-to-expand needed: Implement @gorhom/bottom-sheet (Option B) — *Deferred: basic scroll fix applied first*
- [x] Add visual scroll indicator (scrollbar or fade gradient) — **Enabled showsVerticalScrollIndicator + bounces**
- [ ] Test with longest protocol summary in database
- [x] Ensure backdrop tap dismisses sheet — *Already working*

### Acceptance Criteria (Partial ✅)
- [x] All protocol content is readable (scroll works)
- [ ] User can drag sheet to expand toward full screen — *Requires @gorhom/bottom-sheet (future enhancement)*
- [ ] User can drag sheet down to dismiss — *Requires @gorhom/bottom-sheet (future enhancement)*
- [x] Sheet dismisses on backdrop tap

---

## Issue 3: AI Coach Context Not Working

### Problem
When clicking "Ask AI Coach" from ProtocolQuickSheet:
- Chat modal opens but is **completely blank/default**
- No protocol context banner appears
- No suggested questions appear
- Input is empty (expected: should show context + suggestions)

**Expected Behavior (what was designed):**
- Context banner: "Discussing: {protocolName}"
- Suggested questions: "Why is this recommended?", "When should I do this?", etc.
- Tap suggestion → fills input
- User can also type custom question

### Root Cause Analysis

**In ChatModal.tsx (lines 159-197):**
The context features ARE implemented:
- `initialContext?.protocolName` shows context banner
- `PROTOCOL_QUESTIONS` array has suggested questions
- `handleSuggestedQuestion` fills input on tap

**The Bug is in HomeScreen.tsx:**
Looking at `handleAskAICoach` (line 268-280):
```tsx
const handleAskAICoach = useCallback(
  (protocol: ScheduledProtocol) => {
    setChatContext({
      type: 'protocol',
      protocolId: protocol.protocol.id,
      protocolName: protocol.protocol.name,
    });
    setShowChatModal(true);
  },
  []
);
```

**And ChatModal rendering (likely around line 450+):**
Need to verify that `initialContext={chatContext}` is being passed to ChatModal.

**Likely Issues:**
1. `chatContext` state not being passed to ChatModal as `initialContext` prop
2. OR ChatModal rendered before `setChatContext` completes (race condition)
3. OR `initialContext` prop name mismatch

### Files to Modify
- `client/src/screens/HomeScreen.tsx` — Verify ChatModal props
- `client/src/components/ChatModal.tsx` — Verify prop handling

### Debugging Steps
```tsx
// Add console.log to verify context is passed
// In HomeScreen.tsx ChatModal render:
<ChatModal
  visible={showChatModal}
  onClose={() => setShowChatModal(false)}
  initialContext={chatContext} // <-- Is this line present?
/>

// In ChatModal.tsx:
console.log('ChatModal initialContext:', initialContext);
```

### Tasks
- [ ] Verify ChatModal in HomeScreen has `initialContext={chatContext}` prop
- [ ] Add console.log to debug prop passing
- [ ] If race condition: use `useEffect` to open modal after context is set
- [ ] Test: Open AI Coach from protocol → verify context banner appears
- [ ] Test: Verify suggested questions appear
- [ ] Test: Tap suggested question → verify input is filled

### Implementation Fix (if prop not passed)
```tsx
// In HomeScreen.tsx, find ChatModal render and ensure:
<ChatModal
  visible={showChatModal}
  onClose={handleCloseChatModal}
  initialContext={chatContext}  // THIS MUST BE PRESENT
/>
```

### Acceptance Criteria
- Opening AI Coach from protocol shows context banner with protocol name
- Suggested questions appear below input
- Tapping suggested question fills the input
- User can send question with protocol context

---

## Issue 4: Health Tab Placeholder Data

### Problem
Health tab shows data even when no real health data exists. Currently displays mock/placeholder values instead of empty states.

### Root Cause Analysis
From `useHealthHistory.ts` (Session 85):
- Contains mock data generator for development
- Returns fake data when real API data unavailable
- No flag to distinguish mock vs real data

**This was intentional for development** but should not appear in production/testing.

### PRD Alignment
The PRD emphasizes "trust-building" with users. Showing fake data undermines trust and provides no value.

### Recommended Solution
```tsx
// useHealthHistory.ts
const useHealthHistory = (days: number) => {
  const { data, loading, error } = useHealthData();

  // In production, don't show mock data
  const hasRealData = data && data.length > 0;

  return {
    data: hasRealData ? data : null,
    loading,
    error,
    isEmpty: !hasRealData && !loading,
  };
};

// HealthDashboardScreen.tsx
if (isEmpty) {
  return (
    <HealthEmptyState
      onConnectWearable={() => navigation.navigate('WearableSettings')}
    />
  );
}
```

### Files to Modify
- `client/src/hooks/useHealthHistory.ts`
- `client/src/screens/HealthDashboardScreen.tsx`
- Create: `client/src/components/health/HealthEmptyState.tsx`

### Tasks
- [ ] Review `useHealthHistory.ts` mock data logic
- [ ] Add `isEmpty` return value when no real data
- [ ] Create `HealthEmptyState` component with CTA
- [ ] Update `HealthDashboardScreen` to show empty state
- [ ] Remove or conditionally disable mock data generator
- [ ] Test with no wearable connected

### Acceptance Criteria
- No fake/mock data shown to users
- Clear empty state: "Connect Apple Health to see your metrics"
- CTA button navigates to wearable/health settings
- Real data displays correctly when available

---

## Issue 5: Apple Health Settings UX + Module Error

### Problem
Two related issues:

### 5A: Settings UX
Apple Health integration is buried under "Wearables" settings. Users expect a dedicated "Health" or "Apple Health" option.

### 5B: Module Not Found Error
On physical iPhone with Expo Dev build:
> "Healthcare is not available on this device. A physical iPhone is required for health integration. Cannot find module"

This error appears despite being on a physical iPhone.

### Root Cause Analysis (5B)

**This is a native module linking issue.** Possible causes:

1. **Expo Go limitation:** Expo Go doesn't include HealthKit native modules
2. **EAS Dev Build missing entitlements:** Build profile may not include HealthKit capability
3. **Module detection logic incorrect:** Code assumes "no module" = "simulator" but it's actually "dev build without native module"

**The error message is misleading** — it says "physical iPhone required" when the real issue is the native module isn't linked.

### Files to Review
- `client/app.json` — HealthKit entitlements
- `client/eas.json` — Build configuration
- `client/src/services/wearables/healthkit.ts` — Module detection logic
- `client/src/screens/settings/WearableSettingsScreen.tsx` — Error display

### Tasks

#### 5A: Settings UX
- [ ] Add "Apple Health" as separate card in Profile → Data section
- [ ] OR rename "Wearables" to "Health & Wearables"
- [ ] Ensure clear labeling: "Apple Health" (iOS) / "Health Connect" (Android)

#### 5B: Module Error
- [ ] Check `app.json` for HealthKit entitlements:
  ```json
  "ios": {
    "entitlements": {
      "com.apple.developer.healthkit": true,
      "com.apple.developer.healthkit.background-delivery": true
    },
    "infoPlist": {
      "NSHealthShareUsageDescription": "...",
      "NSHealthUpdateUsageDescription": "..."
    }
  }
  ```
- [ ] Check `eas.json` build profile includes health capabilities
- [ ] Review module detection — improve error message accuracy
- [ ] Test with `expo prebuild && npx pod-install` then Xcode build
- [ ] If using Expo Dev Client, ensure native modules are included

### Debugging Commands
```bash
# Check health module installation
npm ls | grep health
npx expo install expo-health  # If missing

# Check app.json entitlements
grep -A10 "healthkit" app.json

# Check if native build has HealthKit
ls ios/*.xcworkspace  # Should exist after prebuild
```

### Acceptance Criteria
- Apple Health has clear, findable settings entry
- Physical iPhone can successfully connect to Apple Health
- Error messages are accurate ("Native module not available in this build")
- Works in EAS Development Build on physical device

---

## Session Execution Order

### Session 87: HomeScreen Cleanup + QuickSheet Fix
**Focus:** Issues 1 & 2 (High priority, Medium effort)

Tasks:
1. Decide on HomeScreen architecture (Option A or B)
2. Remove/modify TodaysFocusCard
3. Rename "MY SCHEDULE" → "TODAY'S PROTOCOLS"
4. Fix ProtocolQuickSheet ScrollView
5. Test both changes end-to-end

### Session 88: AI Coach Context Fix + Health Empty States
**Focus:** Issues 3 & 4 (High/Medium priority, Medium/Low effort)

Tasks:
1. Debug ChatModal prop passing
2. Fix context/suggested questions display
3. Create HealthEmptyState component
4. Remove mock data from production flow

### Session 89: Apple Health Integration Fix
**Focus:** Issue 5 (High priority, High effort)

Tasks:
1. Review app.json and eas.json configuration
2. Improve Settings UX for health integrations
3. Fix native module detection logic
4. Test with EAS Development Build
5. May require native Xcode build for full testing

---

## Testing Checklist

After all fixes:
- [ ] HomeScreen shows single, clear protocol section (no "All Caught Up" + protocols conflict)
- [ ] ProtocolQuickSheet scrolls and can be expanded
- [ ] AI Coach opens with context banner and suggested questions from protocol
- [ ] Health tab shows empty state when no real data
- [ ] Apple Health connects successfully on physical iPhone
- [ ] Settings clearly show health integration options

---

## Code References

| File | Line | Purpose |
|------|------|---------|
| `HomeScreen.tsx` | 404-407 | TodaysFocusCard render |
| `HomeScreen.tsx` | 428-431 | MyScheduleSection render |
| `HomeScreen.tsx` | 268-280 | handleAskAICoach |
| `HomeScreen.tsx` | ~450+ | ChatModal render (verify props) |
| `ProtocolQuickSheet.tsx` | 137-141 | ScrollView configuration |
| `ChatModal.tsx` | 159-197 | Context banner + suggested questions |
| `useHealthHistory.ts` | - | Mock data generator |

---

*Created: December 26, 2025 (Post-Session 86)*
*Updated: December 26, 2025 (Added root cause analysis)*
*Status: Ready for implementation*
