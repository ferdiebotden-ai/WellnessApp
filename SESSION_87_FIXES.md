# Session 87+ Fixes — Protocol UI/UX Issues

> User feedback from Session 86 testing. Each section is a discrete fix that can be tackled in sequence.

---

## Priority Order

| # | Issue | Severity | Est. Effort |
|---|-------|----------|-------------|
| 1 | HomeScreen redundancy cleanup | High | Medium |
| 2 | ProtocolQuickSheet scroll/expand fix | High | Medium |
| 3 | AI Coach pre-filled question | Medium | Low |
| 4 | Health tab placeholder data handling | Medium | Low |
| 5 | Apple Health settings UX + module error | High | High |

---

## Issue 1: HomeScreen Redundancy Cleanup

**Problem:**
HomeScreen currently shows THREE protocol-related sections:
1. "All Caught Up" (TodaysFocusCard empty state)
2. "Today's Schedule" section
3. "My Schedule" section

This is redundant and confusing.

**Expected Behavior:**
HomeScreen should have clear, non-redundant sections:
1. **Today's Health Summary** (QuickHealthStats) — Already exists
2. **Today's Protocols** — Single unified section for scheduled protocols
3. **Weekly Progress** — Already exists and is good

**Files to Review:**
- `client/src/screens/HomeScreen.tsx`

**Tasks:**
- [ ] Audit all protocol-related sections on HomeScreen
- [ ] Remove "My Schedule" if redundant with "Today's Schedule"
- [ ] Rename "Today's Schedule" to "Today's Protocols" for clarity
- [ ] Ensure TodaysFocusCard "All Caught Up" only shows when NO protocols scheduled
- [ ] Verify each section has distinct purpose and no overlap
- [ ] Test empty states for each section

**Acceptance Criteria:**
- Only ONE section shows scheduled protocols
- Clear visual hierarchy: Health → Protocols → Progress
- No duplicate information displayed

---

## Issue 2: ProtocolQuickSheet Scroll/Expand Fix

**Problem:**
When tapping a protocol card on HomeScreen, the ProtocolQuickSheet bottom sheet:
- Cannot scroll content (text gets cut off)
- Cannot be pulled/dragged to full screen height
- Content is not fully readable

**Expected Behavior:**
- Sheet should be scrollable when content exceeds visible area
- Sheet should be draggable (pull up to expand, pull down to dismiss)
- All content should be readable

**Files to Modify:**
- `client/src/components/protocol/ProtocolQuickSheet.tsx`

**Tasks:**
- [ ] Verify ScrollView is properly configured with `flex: 1`
- [ ] Add gesture handling for drag-to-expand (consider `react-native-gesture-handler` or `@gorhom/bottom-sheet`)
- [ ] Test with protocols that have long summaries
- [ ] Ensure "What to Do" and "Why This Works" sections fully expand
- [ ] Add visual indicator that content is scrollable (fade gradient at bottom?)

**Implementation Options:**

**Option A: Fix current Modal-based approach**
```tsx
// Ensure ScrollView can scroll
<ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{ flexGrow: 1 }}
  showsVerticalScrollIndicator={true}
  bounces={true}
>
```

**Option B: Replace with proper bottom sheet library**
Consider using `@gorhom/bottom-sheet` which handles:
- Snap points (60%, 90%, 100%)
- Gesture-based dragging
- Keyboard avoidance
- Backdrop press to dismiss

**Acceptance Criteria:**
- All protocol content is readable
- User can scroll through long content
- User can drag sheet to expand/collapse
- Sheet dismisses on backdrop tap or swipe down

---

## Issue 3: AI Coach Pre-filled Question

**Problem:**
When clicking "Ask AI Coach" from a protocol context, the input field is empty. User has to manually type a question about the protocol.

**Expected Behavior:**
Input should be pre-filled with a contextual question like:
- "Tell me more about Evening Light Management"
- "Why is Morning Light Exposure recommended for me?"

**Files to Modify:**
- `client/src/components/ChatModal.tsx`
- `client/src/components/protocol/ProtocolQuickSheet.tsx`
- `client/src/screens/HomeScreen.tsx`

**Tasks:**
- [ ] Add `initialQuestion` prop to ChatModal
- [ ] When opening from protocol context, pass pre-filled question
- [ ] Format: "Tell me more about {protocolName}"
- [ ] Ensure cursor is at end of pre-filled text
- [ ] User can edit or clear the pre-filled question

**Implementation:**

```tsx
// ChatModal.tsx - Add to Props interface
interface Props {
  visible: boolean;
  onClose: () => void;
  initialContext?: ChatContext;
  initialQuestion?: string; // NEW
}

// In ChatModalContent
useEffect(() => {
  if (visible && initialQuestion && !hasUsedContext) {
    setInput(initialQuestion);
  }
}, [visible, initialQuestion]);

// When opening from ProtocolQuickSheet
onAskAICoach={() => {
  setChatContext({
    type: 'protocol',
    protocolId: protocol.protocol.id,
    protocolName: protocol.protocol.name,
  });
  setInitialQuestion(`Tell me more about ${protocol.protocol.name}`);
  setShowChatModal(true);
}}
```

**Acceptance Criteria:**
- Opening AI Coach from protocol pre-fills relevant question
- User can modify or send the pre-filled question
- Suggested questions still appear below input

---

## Issue 4: Health Tab Placeholder Data

**Problem:**
Health tab shows data even when no real health data exists. Currently displays mock/placeholder values instead of empty states.

**Expected Behavior:**
- If no wearable connected OR no health data: Show empty state with CTA to connect
- If wearable connected but no data yet: Show "Waiting for data..." state
- Only show metrics when real data exists

**Files to Review:**
- `client/src/screens/HealthDashboardScreen.tsx`
- `client/src/hooks/useHealthHistory.ts`
- `client/src/components/health/*.tsx`

**Tasks:**
- [ ] Review `useHealthHistory.ts` — currently returns mock data
- [ ] Add check for real data vs mock data
- [ ] Create empty state component for Health Dashboard
- [ ] Show "Connect a wearable" CTA when no integration
- [ ] Show "No data yet" when integration exists but no readings
- [ ] Remove or flag mock data generator for production

**Implementation:**

```tsx
// useHealthHistory.ts
const useHealthHistory = (days: number) => {
  const { data, loading } = useHealthData();

  // Check if we have real data
  const hasRealData = data && data.length > 0 && !data[0].isMock;

  return {
    data: hasRealData ? data : null,
    loading,
    isEmpty: !hasRealData,
  };
};

// HealthDashboardScreen.tsx
if (isEmpty) {
  return <HealthEmptyState onConnectWearable={navigateToSettings} />;
}
```

**Acceptance Criteria:**
- No fake data shown to users
- Clear empty state when no health data
- CTA to connect wearable/health source

---

## Issue 5: Apple Health Settings UX + Module Error

**Problem:**
Two related issues:

### 5A: Settings UX
Apple Health integration is buried under "Wearables" settings. Users expect a dedicated "Health" or "Apple Health" option.

### 5B: Module Not Found Error
On physical iPhone with Expo Dev build:
> "Healthcare is not available on this device. A physical iPhone is required for health integration. Cannot find module"

This error appears despite being on a physical iPhone.

**Root Cause (5B):**
Likely one of:
1. Native module not included in dev build
2. HealthKit entitlement missing from dev build
3. Module detection logic incorrect
4. Expo dev client doesn't include native health modules

**Files to Review:**
- `client/src/screens/settings/WearableSettingsScreen.tsx`
- `client/src/services/wearables/healthkit.ts` or similar
- `client/app.json` — HealthKit entitlements
- `client/ios/` — Native module configuration

**Tasks:**

### 5A: Settings UX
- [ ] Add "Apple Health" as separate card in Data Integrations (not under Wearables)
- [ ] OR rename "Wearables" to "Health & Wearables"
- [ ] Create dedicated `HealthIntegrationScreen.tsx` if needed
- [ ] Clear labeling: "Apple Health" for iOS, "Health Connect" for Android

### 5B: Module Error
- [ ] Check if `expo-health` or custom health module is in dependencies
- [ ] Verify `app.json` has HealthKit entitlements:
  ```json
  "ios": {
    "entitlements": {
      "com.apple.developer.healthkit": true,
      "com.apple.developer.healthkit.background-delivery": true
    }
  }
  ```
- [ ] Check if EAS build config includes health capabilities
- [ ] Review module detection logic — may need to check differently in dev builds
- [ ] Test: `expo prebuild` then build natively vs Expo Go

**Debugging Steps:**
```bash
# Check if health module is installed
npm ls | grep health

# Check app.json entitlements
cat app.json | grep -A5 healthkit

# Check if native modules built
ls ios/Pods | grep Health
```

**Acceptance Criteria:**
- Apple Health has clear, findable settings entry
- Physical iPhone can connect to Apple Health
- Error messages are accurate and actionable

---

## Session Execution Order

### Session 87: HomeScreen Cleanup + QuickSheet Fix
Focus: Issues 1 & 2
- Remove redundant protocol sections
- Fix ProtocolQuickSheet scrolling

### Session 88: AI Coach + Health Empty States
Focus: Issues 3 & 4
- Pre-fill AI Coach questions
- Handle empty health data properly

### Session 89: Apple Health Integration Fix
Focus: Issue 5
- Settings UX improvement
- Debug native module error
- May require EAS build testing

---

## Testing Checklist

After all fixes:
- [ ] HomeScreen shows single, clear protocol section
- [ ] ProtocolQuickSheet scrolls and can be expanded
- [ ] AI Coach opens with pre-filled question from protocol
- [ ] Health tab shows empty state when no data
- [ ] Apple Health connects on physical iPhone
- [ ] Settings clearly show health integration options

---

*Created: December 26, 2025 (Post-Session 86)*
*Status: Ready for implementation*
