# Apex OS MVP Issues — Pre-Launch Fixes

> **Purpose:** This document details UX/UI issues identified during MVP testing. Each issue includes the problem description, expected behavior, vision alignment, and file locations for implementation.
>
> **Workflow:** Use `/start` to begin a session focused on one issue. Complete the fix, run verification, then use `/close` to commit and update STATUS.md.

---

## Quick Reference

| ID | Issue | Priority | Status |
|----|-------|----------|--------|
| MVP-001 | Protocol Toggle Not De-selecting | High | ✅ Complete |
| MVP-002 | Protocol Selection Counter Inaccurate | High | ✅ Complete |
| MVP-003 | Timezone Selector Not Editable | Medium | Open |
| MVP-004 | Remove Start Check-in Button | Medium | Open |
| MVP-005 | Duplicate Protocols on Home Screen | High | Open |
| MVP-006 | Protocol Card Detail UX Redesign | High | Open |
| MVP-007 | AI Chat Text Input Horizontal Scroll | High | Open |
| MVP-008 | Time Picker Redesign with Scroll Wheel | Medium | Open |

---

## Issue Details

---

### MVP-001: Protocol Toggle Not De-selecting

**Status:** Complete (Session 95)
**Priority:** High
**Complexity:** Low

#### Problem Description

On the StarterProtocolSelectionScreen during onboarding, users can select protocols by tapping the card or the toggle switch. However, when attempting to de-select (toggle OFF) a previously selected protocol, the toggle does not respond. Users are unable to remove protocols they don't want.

#### Expected Behavior

- Tapping a selected protocol card OR its toggle switch should de-select it
- Visual feedback should immediately show the toggle switching from ON to OFF
- The border color should change from teal (selected) to muted (deselected)
- The selection counter at the bottom should decrement

#### Root Cause Analysis

The implementation looks correct on the surface:
- `handleToggleProtocol` uses Set-based state with proper add/delete logic
- The Switch component has `onValueChange={() => onToggle(protocol.id)}`
- The card's Pressable also calls `onPress={() => onToggle(protocol.id)}`

Possible causes:
1. **State reference issue**: The Set mutation might not trigger re-render properly
2. **Switch component quirk**: React Native's Switch may have iOS/Android differences
3. **Stale closure**: The callback might be capturing an old state reference

#### Vision Alignment

Per PRD v8.1, onboarding should complete in 3-4 minutes with minimal friction. A broken toggle creates confusion and may cause users to abandon onboarding or start with unwanted protocols.

#### UX Best Practice

From [React Native Switch documentation](https://reactnative.dev/docs/switch): "The Switch is a controlled component that requires an `onValueChange` callback that updates the `value` prop in order for the component to reflect user actions."

The pattern should be:
```tsx
// Create new Set to trigger re-render (don't mutate existing)
setSelectedProtocolIds(prev => {
  const next = new Set(prev);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
});
```

#### Files to Modify

| File | Purpose |
|------|---------|
| `client/src/screens/onboarding/StarterProtocolSelectionScreen.tsx` | Main screen with toggle logic |

#### Key Code Locations

- **Toggle handler:** Lines 189-199 (`handleToggleProtocol`)
- **Switch component:** Lines 121-127 (ProtocolCard)
- **Card press:** Lines 77-85 (Pressable)

#### Verification Steps

1. Start fresh onboarding flow
2. Arrive at protocol selection screen
3. Tap a protocol card to de-select → Should toggle OFF
4. Tap the switch directly to de-select → Should toggle OFF
5. Verify counter decrements properly
6. Continue to next screen with modified selection

---

### MVP-002: Protocol Selection Counter Inaccurate

**Status:** Complete (Session 95)
**Priority:** High
**Complexity:** Low

#### Problem Description

The footer displays "5 of 6 selected" but the count doesn't match the actual number of selected protocols. The counter may show incorrect totals or fail to update when selections change.

#### Expected Behavior

- Counter should accurately reflect: `[selected count] of [total available] selected`
- Updates immediately when protocols are toggled
- Correct total count across all sections (if multi-goal)

#### Root Cause Analysis

The current calculation:
```tsx
const selectedCount = selectedProtocolIds.size;
const totalCount = sections.reduce((acc, s) => acc + s.data.length, 0);
```

Potential issues:
1. **Duplicate protocol IDs**: If the same protocol appears in multiple module sections, it inflates `totalCount` but only counts once in `selectedProtocolIds`
2. **Async state**: If sections load after initial render, totalCount might be stale
3. **Set not updating**: Tied to MVP-001 - if toggle doesn't work, count won't change

#### Vision Alignment

"Professional Respect" means data should be accurate. An incorrect counter undermines trust and the data-dense, Bloomberg-terminal aesthetic we're aiming for.

#### Files to Modify

| File | Purpose |
|------|---------|
| `client/src/screens/onboarding/StarterProtocolSelectionScreen.tsx` | Counter calculation |

#### Key Code Locations

- **Count calculation:** Lines 208-210
- **Footer display:** Lines 273-276

#### Verification Steps

1. Navigate to protocol selection with single goal → Count should match
2. Navigate with multiple goals → Count should sum all sections without duplicates
3. Toggle protocols on/off → Count updates in real-time
4. Select all → Shows "X of X selected"
5. Deselect all → Shows "0 of X selected"

---

### MVP-003: Timezone Selector Not Editable

**Status:** Open
**Priority:** Medium
**Complexity:** Medium

#### Problem Description

On the BiometricProfileScreen, the timezone is auto-detected and displayed correctly (e.g., "America/New_York" with "Auto-detected" label). However, there is no way for users to change it if the auto-detection is wrong or if they travel frequently.

#### Current Implementation

```tsx
<View style={styles.timezoneDisplay}>
  <Text style={styles.timezoneText}>{detectedTimezone}</Text>
  <Text style={styles.timezoneAuto}>Auto-detected</Text>
</View>
```

This is a read-only display with no interaction handler.

#### Expected Behavior

1. Show auto-detected timezone with "Auto-detected" badge
2. Tapping the timezone field opens a searchable dropdown/modal
3. Users can search by city name (e.g., "Los Angeles", "London", "Tokyo")
4. Selected timezone replaces the auto-detected one
5. "Auto-detected" badge changes to "Custom" or disappears
6. Timezone is passed to API on continue

#### UX Best Practice

From [NN/g Time Zone Selection](https://www.nngroup.com/articles/time-zone-selectors/) and [Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/time-zone-selection-ux/):

1. **Auto-detect with override**: Always allow users to correct auto-detection
2. **Search by city/country**: Users think in cities, not UTC offsets
3. **Alphabetical organization**: Sort by city name for quick scanning
4. **Show current time**: Display the local time for the selected zone to confirm

Recommended pattern:
- Tappable field that looks editable (subtle edit icon)
- Opens a modal with search input at top
- Searchable list of "City (Country) — UTC±X" entries
- Selecting a city updates the field immediately

#### Vision Alignment

Per PRD Appendix E, timezone is collected for "nudge scheduling at appropriate local times." If the timezone is wrong, users get nudges at the wrong time, defeating the purpose of ambient intelligence.

#### Files to Modify

| File | Purpose |
|------|---------|
| `client/src/screens/onboarding/BiometricProfileScreen.tsx` | Add timezone selector |
| `client/src/components/TimezonePickerModal.tsx` | New component (create) |

#### Key Code Locations (BiometricProfileScreen)

- **Timezone display:** Lines 402-412
- **Detected timezone:** Lines 49-53 (useMemo)
- **State management:** Add `useState` for custom timezone

#### Implementation Approach

1. Create `TimezonePickerModal` component:
   - Use `expo-localization` to get IANA timezone list
   - Implement searchable FlatList with city/country matching
   - Show UTC offset for each option

2. Update BiometricProfileScreen:
   - Add `customTimezone` state
   - Make timezone display tappable (Pressable)
   - Open modal on tap
   - Pass `customTimezone ?? detectedTimezone` to next screen

#### Verification Steps

1. See auto-detected timezone on biometric screen
2. Tap timezone → Modal opens with search
3. Type "Tokyo" → Filter shows matching results
4. Select "Asia/Tokyo" → Field updates
5. Continue through onboarding → Timezone saved correctly
6. Check profile settings → Shows selected timezone

---

### MVP-004: Remove Start Check-in Button

**Status:** Open
**Priority:** Medium
**Complexity:** Low

#### Problem Description

The "Start Check-in" button appears on the home screen for Lite Mode users (no wearable connected). The original intent was to allow manual data entry when wearable data is unavailable. However, this feature adds complexity without clear user value in the MVP.

#### Current Implementation

The button appears in `LiteModeScoreCard` when `data` is null:

```tsx
const EmptyState: React.FC<{ onCheckIn?: () => void }> = ({ onCheckIn }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyTitle}>No check-in yet</Text>
    <Text style={styles.emptySubtext}>
      Complete your morning check-in for personalized guidance
    </Text>
    {onCheckIn && (
      <Pressable onPress={onCheckIn}>
        <Text>Start Check-in</Text>
      </Pressable>
    )}
  </View>
);
```

#### Why Remove It

1. **User confusion**: Not clear what "check-in" means or why it's needed
2. **Minimal value**: Without wearable data, the check-in provides limited personalization
3. **Scope creep**: MVP should focus on users WITH wearables (target persona)
4. **Simplification**: Fewer features = cleaner UX

#### Expected Behavior After Removal

For Lite Mode users (no wearable):
- Show a simpler empty state: "Connect a wearable to see your recovery score"
- Provide link to wearable connection settings
- No check-in flow or button

#### Vision Alignment

"The Optimized Professional" target user ALREADY tracks with wearables. Lite Mode was a fallback, not a primary use case. For MVP, we should encourage wearable connection rather than supporting a degraded manual experience.

#### Files to Modify

| File | Purpose |
|------|---------|
| `client/src/components/LiteModeScoreCard.tsx` | Remove check-in button, update empty state |
| `client/src/screens/HomeScreen.tsx` | Remove check-in handler (lines 137-175) |
| `client/src/components/WakeConfirmationOverlay.tsx` | May need updates if check-in is removed |
| `client/src/components/CheckInQuestionnaire.tsx` | Mark as deprecated/unused |

#### Key Code Locations

- **EmptyState component:** LiteModeScoreCard lines 143-162
- **onCheckIn prop:** Lines 55, 150-159
- **HomeScreen handler:** Lines 137-175 (`handleCheckInComplete`)

#### Verification Steps

1. Disconnect wearable (or use test account without wearable)
2. Navigate to home screen
3. Should see "Connect a wearable" message instead of check-in button
4. Tapping should navigate to wearable connection settings

---

### MVP-005: Duplicate Protocols on Home Screen

**Status:** Open
**Priority:** High
**Complexity:** Medium

#### Problem Description

Users report seeing the same protocol appearing multiple times in the "Today's Protocols" section on the home screen. Each protocol should only appear once.

#### Root Cause Analysis

The enrolled protocols flow:
1. `useEnrolledProtocols` hook fetches from API
2. API returns `user_protocol_enrollment` records
3. Records are mapped to `ScheduledProtocol` objects
4. Rendered in `MyScheduleSection` with `key={protocol.id}`

Potential causes:
1. **Database duplicates**: Multiple enrollment records for same user/protocol
2. **Multi-module enrollment**: Same protocol in different modules
3. **Key collision**: Using enrollment ID vs protocol ID
4. **Stale refresh**: Fetching before previous data is cleared

The database has a unique constraint on `(user_id, protocol_id)` which should prevent duplicates, but the constraint might not be enforced on upserts, or there's a race condition.

#### Expected Behavior

- Each protocol appears exactly once in "Today's Protocols"
- If a user enrolls in the same protocol through different paths, only one entry exists
- Enrollment table has proper unique constraint enforced

#### Files to Investigate/Modify

| File | Purpose |
|------|---------|
| `client/src/hooks/useEnrolledProtocols.ts` | Check for client-side deduplication |
| `client/src/services/api.ts` | `fetchEnrolledProtocols` function |
| `functions/src/protocolEnrollment.ts` | Backend enrollment logic |
| `supabase/migrations/` | Check unique constraint on enrollment table |

#### Verification Steps

1. Check database for duplicate enrollment records:
   ```sql
   SELECT user_id, protocol_id, COUNT(*)
   FROM user_protocol_enrollment
   GROUP BY user_id, protocol_id
   HAVING COUNT(*) > 1;
   ```
2. If duplicates exist, clean them up and verify constraint
3. Enroll in same protocol multiple ways → Only one appears
4. Home screen shows each protocol exactly once

---

### MVP-006: Protocol Card Detail UX Redesign

**Status:** Open
**Priority:** High
**Complexity:** High

#### Problem Description

The current protocol card experience has multiple issues:

1. **Redundant "Why This?" chip**: The card has a "Why this?" button AND tapping opens a bottom sheet with the same info
2. **Full-screen navigation**: Opening details navigates to a new screen instead of expandable overlay
3. **Too many taps**: User must navigate away from home to see protocol details

#### Current Implementation

- Protocol card has "Why this?" chip that toggles a snippet inline
- Tapping card opens `ProtocolQuickSheet` (bottom sheet at 60%/90%)
- "View Full Details" in sheet navigates to `ProtocolDetailScreen`
- Four sections: What to Do, Why This Works, Your Progress, (full detail has: Mechanism, Evidence, Your Data, Confidence)

#### Expected Behavior

**Simplified Protocol Card (Home Screen):**
- Protocol name, icon, scheduled time
- Brief one-line summary (max 50 chars)
- "Details" or "See more" text link (not "Why this?" chip)
- No inline toggle - all details in the sheet

**Enhanced Bottom Sheet (Expandable):**
- Opens at 50% height showing summary
- User can drag up to full screen
- Sections are collapsible/expandable:
  - **What to Do** — Step-by-step instructions (expanded by default)
  - **Why This Works** — Mechanism explanation (collapsed)
  - **Research & Evidence** — DOI citations, study summaries (collapsed)
  - **Your Data** — Personal correlation data if available (collapsed)
- Mark Complete and Ask AI Coach buttons at bottom
- No need for separate ProtocolDetailScreen for MVP

**Key Principle:** Progressive disclosure. Show the minimum needed, let users expand for depth.

#### UX Best Practice

From [NN/g Bottom Sheets](https://www.nngroup.com/articles/bottom-sheet/) and [Mobbin Bottom Sheet examples](https://mobbin.com/glossary/bottom-sheet):

1. **Start minimized**: Begin at 50% height, user controls expansion
2. **Thumb-friendly close**: Place close button in lower corners, not top right
3. **Content adjusts to height**: Show more sections as user expands
4. **Avoid modal-to-screen navigation**: Keep context, don't navigate away

#### Vision Alignment

Per PRD Section 2.1 Evidence Transparency: "Every recommendation includes a 'Why?' layer" with four panels. The bottom sheet should house all four panels in expandable sections, maintaining the Bloomberg Terminal information density while keeping the home screen clean.

#### Files to Modify

| File | Purpose |
|------|---------|
| `client/src/components/home/ScheduledProtocolCard.tsx` | Simplify card, remove "Why this?" chip |
| `client/src/components/protocol/ProtocolQuickSheet.tsx` | Enhance with all 4 sections, make expandable |
| `client/src/screens/HomeScreen.tsx` | May simplify handlers |
| `client/src/screens/ProtocolDetailScreen.tsx` | May deprecate or keep for edge cases |

#### Key Code Locations

- **ScheduledProtocolCard "Why this?" chip:** Lines 147-170
- **ProtocolQuickSheet sections:** Lines 59-92 (ExpandableSection)
- **View Full Details link:** Lines 273-279

#### Implementation Approach

1. **Simplify ScheduledProtocolCard:**
   - Remove `showWhy` state and inline snippet toggle
   - Replace "Why this?" chip with simple "Details" text
   - Keep the card minimal: icon, name, time, category

2. **Enhance ProtocolQuickSheet:**
   - Add snap points: 50%, 90%, 100%
   - Add all four evidence sections as ExpandableSection components
   - Fetch evidence data if not already loaded
   - Keep action buttons sticky at bottom

3. **Update section content:**
   - "What to Do": Parse from summary into bullet points
   - "Why This Works": Full mechanism text
   - "Research & Evidence": DOI, study name, key finding
   - "Your Data": Correlation data from user's history (or placeholder if <7 days)

#### Verification Steps

1. Home screen protocol cards are minimal and clean
2. Tap card → Bottom sheet opens at 50%
3. Drag up → Expands to full screen
4. All four sections visible, collapsed by default except "What to Do"
5. Tap section → Expands with full content
6. Mark Complete works from sheet
7. No navigation to separate detail screen needed

---

### MVP-007: AI Chat Text Input Horizontal Scroll

**Status:** Open
**Priority:** High
**Complexity:** Low

#### Problem Description

When typing in the AI Chat text input, long text scrolls horizontally instead of wrapping to new lines. Users cannot see what they've written without scrolling back, which is confusing and frustrating.

#### Current Implementation

```tsx
<TextInput
  style={styles.input}
  value={input}
  onChangeText={setInput}
  placeholder="Ask your coach..."
  placeholderTextColor={palette.textMuted}
  onSubmitEditing={handleSend}
  returnKeyType="send"
  multiline={false}  // <-- THE PROBLEM
  blurOnSubmit={false}
/>
```

The `multiline={false}` prop forces single-line behavior with horizontal scrolling.

#### Expected Behavior

- Text wraps to new lines as user types
- Input field expands vertically (up to a max height)
- User can see all their text without horizontal scrolling
- Pressing Enter on hardware keyboard can still send (with modifier key) or create new line
- Send button remains the primary way to submit

#### UX Best Practice

From [Mobbin Text Area examples](https://mobbin.com/glossary/text-area) and [LogRocket Scrolling Patterns](https://blog.logrocket.com/ux-design/creative-scrolling-patterns-ux/):

- "Text area has a fixed width but adjustable height"
- "Text wraps to the next line when it reaches the end of the visible width"
- Vertical scrolling is more intuitive than horizontal on mobile

**Industry standard (Slack, iMessage, WhatsApp):**
- Single-line input that expands to multiline as needed
- Max height of ~4-5 lines before scrolling internally
- Send on button press, not Enter (Enter creates new line)

#### Vision Alignment

Per PRD Section 5.4: "Input field design: Clear error states, 16px padding." The input should be professional and usable. Horizontal scrolling is a usability anti-pattern.

#### Files to Modify

| File | Purpose |
|------|---------|
| `client/src/components/ChatModal.tsx` | Change TextInput to multiline |

#### Key Code Locations

- **TextInput:** Lines 282-291
- **Input styles:** Lines 412-422

#### Implementation

```tsx
<TextInput
  style={styles.input}
  value={input}
  onChangeText={setInput}
  placeholder="Ask your coach..."
  placeholderTextColor={palette.textMuted}
  multiline={true}  // <-- FIX
  textAlignVertical="top"  // Android: align text to top
  blurOnSubmit={false}
  returnKeyType="default"  // Allow Enter for new line
/>

// Update styles
input: {
  flex: 1,
  padding: tokens.spacing.md,
  backgroundColor: palette.surface,
  borderRadius: tokens.radius.lg,
  color: palette.textPrimary,
  maxHeight: 120,  // ~5 lines
  minHeight: 44,   // Single line minimum
  borderWidth: 1,
  borderColor: palette.border,
  ...typography.body,
  textAlignVertical: 'center',  // Centers when single line
},
```

#### Verification Steps

1. Open AI Chat
2. Type a long message → Text wraps to new lines
3. Press Enter → Creates new line (not send)
4. Input expands up to ~5 lines
5. After 5 lines, internal vertical scroll
6. Press Send button → Message sends
7. Input resets to single line

---

### MVP-008: Time Picker Redesign with Scroll Wheel

**Status:** Open
**Priority:** Medium
**Complexity:** Medium

#### Problem Description

The current time picker for scheduling protocols shows a limited set of preset times (6 AM, 7 AM, 8 AM, etc.) as button chips. This has several issues:

1. **Limited options**: Only 9 preset times, not every hour
2. **No minute precision**: All times are on the hour
3. **Not intuitive**: Button grid doesn't feel like native time selection
4. **Inconsistent with platform**: iOS/Android users expect wheel pickers

#### Current Implementation

```tsx
const QUICK_TIMES = [
  { label: '6:00 AM', value: '06:00', period: 'morning' },
  { label: '7:00 AM', value: '07:00', period: 'morning' },
  // ... 9 total options
];
```

Users must select from these fixed options, which may not match their actual schedule.

#### Expected Behavior

1. **Default time pre-selected**: Based on protocol category (morning, evening, etc.)
2. **Native scroll wheel**: Hours (1-12), Minutes (00, 15, 30, 45), AM/PM
3. **15-minute increments**: Practical precision without overwhelming
4. **Smooth scrolling**: Platform-native feel (iOS spinner, Android scroll)
5. **Confirm selection**: Clear "Set Time" button to confirm

#### UX Best Practice

From [Eleken Time Picker UX](https://www.eleken.co/blog-posts/time-picker-ux) and [Mobbin Time Picker examples](https://mobbin.com/glossary/time-picker):

1. **Follow platform conventions**: iOS users expect spinner, Android accepts scroll wheel
2. **Limit columns**: Hour, Minute, AM/PM = 3 columns max
3. **Use min/max constraints**: Don't allow scheduling in the past
4. **Large tap targets**: Each time slot must be easily tappable

**Recommended approach:**
- Use `@react-native-community/datetimepicker` for native feel
- Or `react-native-modal-datetime-picker` for consistent cross-platform
- Or custom scroll wheel with 15-minute increments

#### Vision Alignment

Per PRD: "Ambient Intelligence" requires protocols at the right time. If users can't set precise times, nudges may interrupt meetings or arrive too late to be useful.

#### Files to Modify

| File | Purpose |
|------|---------|
| `client/src/components/protocol/TimePickerBottomSheet.tsx` | Replace button grid with scroll wheel |

#### Key Code Locations

- **QUICK_TIMES array:** Lines 36-46
- **Time grid rendering:** Lines 165-192
- **Selection handler:** Line 84 (`setSelectedTime`)

#### Implementation Options

**Option A: Native DateTimePicker**
```tsx
import DateTimePicker from '@react-native-community/datetimepicker';

<DateTimePicker
  value={timeAsDate}
  mode="time"
  display="spinner"  // iOS: spinner, Android: clock or spinner
  minuteInterval={15}  // 15-minute increments
  onChange={handleTimeChange}
/>
```

**Option B: Custom Scroll Wheel**
- Use `react-native-picker-select` or similar
- Three columns: Hour (1-12), Minute (00, 15, 30, 45), Period (AM, PM)
- Style to match Apex OS dark theme

**Recommendation:** Option A (native picker) for MVP speed, can enhance later.

#### Verification Steps

1. Tap protocol to schedule
2. Time picker opens with wheel/spinner
3. Default time is category-appropriate (7 AM for morning protocols)
4. Can scroll to any hour
5. Can select 15-minute increments (e.g., 7:15 AM)
6. Confirm selection → Time saved correctly
7. Home screen shows selected time on protocol card

---

## Session Workflow

### Starting a Session

Run `/start` and specify which issue to work on:

```
/start MVP-001
```

The agent will:
1. Read this file for issue details
2. Read STATUS.md for context
3. Confirm the issue and approach
4. Begin implementation

### Completing a Session

Run `/close` after fixing the issue:

```
/close
```

The agent will:
1. Verify the fix (TypeScript compiles, tests pass)
2. Commit changes with issue ID in message
3. Update STATUS.md with session summary
4. Mark issue as complete in this file

---

## Issue Status Key

- **Open**: Not started
- **In Progress**: Currently being worked on
- **Blocked**: Waiting on decision or dependency
- **Complete**: Fixed and verified
- **Won't Fix**: Decided not to address for MVP

---

*Last Updated: December 26, 2025*
*Document Version: 1.0*
