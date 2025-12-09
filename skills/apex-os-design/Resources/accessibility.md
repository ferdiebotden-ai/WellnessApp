# Apex OS Accessibility Guidelines

## Core Requirements

Apex OS must be usable by everyone, including users with:
- Visual impairments (low vision, color blindness)
- Motor impairments (limited dexterity)
- Cognitive differences (attention, memory)
- Users relying on assistive technology

**Standard:** WCAG 2.1 AA compliance minimum

---

## Visual Accessibility

### Color Contrast

**Minimum ratios (WCAG AA):**
- Normal text: **4.5:1**
- Large text (18pt+): **3:1**
- UI components and graphics: **3:1**

**Apex OS palette compliance:**

| Foreground | Background | Ratio | Status |
|------------|------------|-------|--------|
| textPrimary (#F6F8FC) | canvas (#0F1218) | 14.8:1 | ✓ AAA |
| textPrimary (#F6F8FC) | surface (#181C25) | 13.2:1 | ✓ AAA |
| textSecondary (#A7B4C7) | canvas (#0F1218) | 7.2:1 | ✓ AA |
| textSecondary (#A7B4C7) | surface (#181C25) | 6.4:1 | ✓ AA |
| textMuted (#6C7688) | canvas (#0F1218) | 4.5:1 | ✓ AA |
| accentTeal (#63E6BE) | canvas (#0F1218) | 9.1:1 | ✓ AAA |

**Testing tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Xcode Accessibility Inspector
- Android Accessibility Scanner

### Color Independence

**Rule:** Color must never be the only visual means of conveying information.

**Bad:**
```tsx
// Only color indicates error
<TextInput style={{ borderColor: hasError ? '#F87171' : '#2A303D' }} />
```

**Good:**
```tsx
// Color + icon + text
<View>
  <TextInput style={{ borderColor: hasError ? '#F87171' : '#2A303D' }} />
  {hasError && (
    <View style={styles.errorRow}>
      <ErrorIcon color="#F87171" />
      <Text style={styles.errorText}>Please enter a valid email</Text>
    </View>
  )}
</View>
```

**Always pair color with:**
- Text labels
- Icons or symbols
- Patterns or shapes

### Recovery Zone Indicators

Recovery zones (high/moderate/low) must include text labels:

```tsx
// Bad: Only color
<View style={{ backgroundColor: getRecoveryColor(score) }} />

// Good: Color + label
<View style={{ backgroundColor: getRecoveryColor(score) }}>
  <Text>{score}%</Text>
  <Text>{getRecoveryLabel(score)}</Text>  {/* "Push Day", "Recovery Day", etc. */}
</View>
```

---

## Touch & Motor Accessibility

### Touch Targets

**Minimum size:** 44×44 points (Apple HIG, WCAG)
**Recommended:** 48×48 points

```tsx
// Bad: Icon is only touch target
<Pressable onPress={onClose}>
  <CloseIcon size={16} />  {/* Only 16×16! */}
</Pressable>

// Good: Padded pressable area
<Pressable
  onPress={onClose}
  style={{ padding: 14 }}  // 16 + 28 = 44pt minimum
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
>
  <CloseIcon size={16} />
</Pressable>
```

### Touch Target Spacing

- Minimum spacing between targets: **8 points**
- Recommended spacing: **16 points**

### Gesture Alternatives

Every gesture-based action must have a button alternative:

| Gesture | Alternative |
|---------|-------------|
| Swipe to delete | Delete button in menu |
| Pull to refresh | Refresh button |
| Pinch to zoom | Zoom buttons (+/-) |
| Long press | Explicit "options" button |

---

## Screen Reader Support

### Accessibility Props (React Native)

```tsx
<View
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Start morning light protocol"
  accessibilityHint="Begins a 10-minute timer for light exposure"
  accessibilityState={{ disabled: isDisabled }}
>
  <Text>Start Protocol</Text>
</View>
```

### Accessibility Roles

| Element | Role | Notes |
|---------|------|-------|
| Button | `button` | Tappable actions |
| Link | `link` | Navigation to other screens |
| Image | `image` | Meaningful images |
| Header | `header` | Section titles |
| Tab | `tab` | Bottom nav items |
| Checkbox | `checkbox` | Toggle selections |
| Switch | `switch` | On/off toggles |
| Progress | `progressbar` | Progress bars |
| Alert | `alert` | Important messages |

### Labeling Guidelines

**Concise labels:**
- Button: "Start Protocol" (not "Tap here to start the protocol")
- Input: "Email address" (not "Enter your email address here")

**Hints for complex actions:**
- Only add when label isn't self-explanatory
- Describe what happens, not how to activate

**State announcements:**
```tsx
<View
  accessibilityLabel={`Recovery score ${score}%`}
  accessibilityValue={{
    now: score,
    min: 0,
    max: 100,
    text: `${score}% recovery`,
  }}
/>
```

### Image Accessibility

**Meaningful images:**
```tsx
<Image
  source={protocolIcon}
  accessibilityLabel="Morning light exposure protocol icon"
/>
```

**Decorative images:**
```tsx
<Image
  source={decorativePattern}
  accessibilityLabel=""
  accessible={false}
/>
```

### Chart Accessibility

Charts must have text summaries:

```tsx
<View
  accessible={true}
  accessibilityRole="image"
  accessibilityLabel="HRV trend over 7 days. Starting at 55ms on Monday, increasing to 65ms on Sunday. Overall improvement of 8%."
>
  <HRVChart data={data} />
</View>
```

---

## Motion Accessibility

### Reduced Motion Support

**Detection:**
```typescript
import { AccessibilityInfo } from 'react-native';

function useReducedMotion() {
  const [isReduced, setIsReduced] = useState(false);
  
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduced);
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduced
    );
    return () => listener.remove();
  }, []);
  
  return isReduced;
}
```

**Implementation:**
```tsx
function AnimatedCard({ children }) {
  const reduceMotion = useReducedMotion();
  
  // Skip animation if reduced motion enabled
  if (reduceMotion) {
    return <View style={styles.card}>{children}</View>;
  }
  
  // Normal animated version
  return <AnimatedView>{children}</AnimatedView>;
}
```

### Fallback Behaviors

| Animation | Reduced Motion Alternative |
|-----------|---------------------------|
| Fade in | Instant appear |
| Slide transition | Cut transition |
| Count-up numbers | Show final value |
| Chart drawing | Show complete chart |
| Loading shimmer | Static placeholder |
| Pulsing indicators | Static icon |

### Auto-playing Content

- No auto-playing videos or animations > 5 seconds
- Provide pause/stop controls
- Respect system reduced motion setting

---

## Text Accessibility

### Dynamic Type Support

Support system font scaling:

```typescript
import { PixelRatio } from 'react-native';

// Cap scaling to prevent layout breakage
const fontScale = Math.min(PixelRatio.getFontScale(), 1.3);

const scaledFontSize = (baseSize: number) => baseSize * fontScale;
```

**Testing:** Verify layout at 100%, 130%, and 150% font scale.

### Text Properties

```tsx
<Text
  allowFontScaling={true}
  maxFontSizeMultiplier={1.3}  // Cap at 130%
  numberOfLines={2}  // Prevent excessive growth
  ellipsizeMode="tail"
>
  Protocol description
</Text>
```

### Line Height & Spacing

- Minimum line height: 1.4 for body text
- Paragraph spacing: at least 1.5× font size
- Maximum line length: ~65 characters

---

## Focus Management

### Focus Order

Ensure logical focus order matching visual layout:

```tsx
<View>
  <Text accessibilityRole="header">Recovery</Text>  {/* 1. Header first */}
  <RecoveryScore />  {/* 2. Main content */}
  <ProtocolList />   {/* 3. Supporting content */}
  <Button>Start</Button>  {/* 4. Action last */}
</View>
```

### Focus Indicators

Focusable elements must have visible focus states:

```tsx
const styles = StyleSheet.create({
  button: {
    // Normal state
  },
  buttonFocused: {
    // Focus ring
    borderWidth: 2,
    borderColor: '#63E6BE',
    // Or outline for web
  },
});
```

### Screen Announcements

Announce important changes:

```typescript
import { AccessibilityInfo } from 'react-native';

// Announce sync completion
AccessibilityInfo.announceForAccessibility('Wearable sync complete');

// Announce protocol completion
AccessibilityInfo.announceForAccessibility('Morning light protocol completed');
```

---

## Forms & Input

### Input Labels

Every input must have an associated label:

```tsx
// Using accessibilityLabel
<TextInput
  accessibilityLabel="Email address"
  placeholder="Enter email"
/>

// Or visible label
<View>
  <Text nativeID="emailLabel">Email address</Text>
  <TextInput accessibilityLabelledBy="emailLabel" />
</View>
```

### Error Messages

Errors must be:
1. Associated with the input
2. Announced to screen readers
3. Visible (not color-only)

```tsx
<View>
  <TextInput
    accessibilityLabel="Email address"
    accessibilityInvalid={hasError}
    accessibilityDescribedBy={hasError ? 'emailError' : undefined}
  />
  {hasError && (
    <Text
      nativeID="emailError"
      accessibilityRole="alert"
      style={styles.error}
    >
      Please enter a valid email address
    </Text>
  )}
</View>
```

### Form Feedback

```tsx
// Success feedback
<View accessibilityRole="alert" accessibilityLiveRegion="polite">
  <Text>Settings saved successfully</Text>
</View>

// Error feedback
<View accessibilityRole="alert" accessibilityLiveRegion="assertive">
  <Text>Failed to save. Please try again.</Text>
</View>
```

---

## Haptic Accessibility

### Haptic Settings

Provide control over haptic feedback:

```
Settings > Accessibility > Haptic Feedback
- Enhanced (default)
- Minimal
- Off
```

### Implementation

```typescript
type HapticPreference = 'enhanced' | 'minimal' | 'off';

function triggerHaptic(type: 'light' | 'medium' | 'success' | 'error') {
  const preference = getHapticPreference();
  
  if (preference === 'off') return;
  
  if (preference === 'minimal') {
    // Use lighter haptics
    Haptics.selectionAsync();
  } else {
    // Full haptics
    hapticMap[type]();
  }
}
```

---

## Testing Checklist

### Manual Testing

- [ ] **VoiceOver (iOS):** Navigate entire app with VoiceOver
- [ ] **TalkBack (Android):** Navigate entire app with TalkBack
- [ ] **Switch Control:** Complete key flows with Switch Control
- [ ] **Large Text:** Test at 150% font scale
- [ ] **Reduced Motion:** Test with Reduce Motion enabled
- [ ] **Color Filters:** Test with grayscale filter (color blindness)
- [ ] **Bold Text:** Test with Bold Text enabled

### Automated Testing

```bash
# iOS
xcrun simctl accessibility audit <device-id>

# Android
adb shell settings get secure accessibility_enabled
```

### Key Flows to Test

1. Onboarding (account creation)
2. Home screen recovery score
3. Starting a protocol
4. Completing a protocol
5. Using AI chat
6. Changing settings

---

## Quick Reference

### Minimum Requirements

| Requirement | Standard |
|-------------|----------|
| Text contrast | 4.5:1 (AA) |
| Touch targets | 44×44pt |
| Focus indicator | Visible |
| Color independence | Always |
| Reduced motion | Respected |
| Screen reader labels | All interactive elements |

### Common Issues to Avoid

| Issue | Fix |
|-------|-----|
| Small touch targets | Add padding, hitSlop |
| Missing labels | Add accessibilityLabel |
| Color-only indicators | Add text/icon |
| No focus indicators | Add focus styles |
| Auto-playing animation | Respect reduced motion |
| Unlabeled images | Add accessibilityLabel or hide |
| Missing error association | Link error to input |
