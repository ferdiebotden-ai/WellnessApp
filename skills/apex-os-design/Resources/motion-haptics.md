# Apex OS Motion & Haptics

## Motion Principles

### Core Philosophy

Every animation must serve one of three purposes:
1. **Confirm action** — User knows their input was received
2. **Guide attention** — Direct focus to important changes
3. **Provide continuity** — Connect screens/states logically

**Anti-principle:** No animation for decoration. Users are busy professionals.

### Performance Requirements

- All animations run at **60fps**
- Maximum duration: **350ms** for UI responses
- Use native driver where possible (`useNativeDriver: true`)
- Test on low-end devices (iPhone 8, mid-range Android)

---

## Animation Timing Reference

### Interaction Responses

| Interaction | Duration | Easing | Effect |
|-------------|----------|--------|--------|
| Button press | 100ms | linear | scale(0.97) |
| Card press | 100ms | linear | scale(0.98) |
| Toggle/switch | 150ms | ease-out | translate + color |
| Checkbox | 150ms | ease-out | scale + opacity |

### Transitions

| Transition | Duration | Easing | Effect |
|------------|----------|--------|--------|
| Screen entry | 250ms | ease-out | fadeIn + translateY(8→0) |
| Screen exit | 200ms | ease-in | fadeOut + translateY(0→-8) |
| Modal appear | 250ms | spring | scale(0.95→1) + fadeIn |
| Modal dismiss | 200ms | ease-in | scale(1→0.95) + fadeOut |
| Tab switch | 200ms | ease-out | crossfade |
| Slide from right | 250ms | ease-out | translateX(100%→0) |

### Data & Content

| Animation | Duration | Easing | Effect |
|-----------|----------|--------|--------|
| Metric count-up | 300-500ms | ease-out | 0 → final value |
| Progress bar fill | 400ms | ease-out | width 0% → target |
| Card stagger | 50ms gap | ease-out | sequential fadeIn + translateY |
| Chart draw | 400-600ms | ease-out | line/bar animate in |
| Skeleton shimmer | 1500ms | linear | opacity pulse (loop) |

### Feedback & States

| Animation | Duration | Easing | Effect |
|-----------|----------|--------|--------|
| Success state | 300ms | spring | scale bounce + checkmark |
| Error shake | 300ms | ease-out | translateX wiggle |
| Loading pulse | 1000ms | ease-in-out | opacity 0.5→1 (loop) |
| Thinking dots | 150ms each | ease-in-out | staggered scale |

---

## Easing Functions

### Available Easings (React Native Reanimated)

```typescript
import { Easing } from 'react-native-reanimated';

const easings = {
  // Standard
  linear: Easing.linear,
  easeIn: Easing.in(Easing.cubic),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  
  // Spring (natural feel)
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  
  // Bounce (celebration)
  bounce: Easing.bounce,
};
```

### When to Use Each

| Easing | Use For |
|--------|---------|
| linear | Button press, immediate response |
| ease-out | Screen transitions, data loading |
| ease-in | Exit animations |
| spring | Modals, cards, natural movements |
| bounce | Celebration, success states |

---

## Implementation Patterns

### Button Press Animation

```typescript
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

function AnimatedButton({ children, onPress }) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

### Screen Entry Animation

```typescript
import { useEffect } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

function AnimatedScreen({ children }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  
  useEffect(() => {
    opacity.value = withTiming(1, { 
      duration: 250, 
      easing: Easing.out(Easing.cubic) 
    });
    translateY.value = withTiming(0, { 
      duration: 250, 
      easing: Easing.out(Easing.cubic) 
    });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return (
    <Animated.View style={[styles.screen, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
```

### Staggered Card Entry

```typescript
function StaggeredList({ items }) {
  return (
    <View>
      {items.map((item, index) => (
        <StaggeredItem key={item.id} delay={index * 50}>
          <Card>{item.content}</Card>
        </StaggeredItem>
      ))}
    </View>
  );
}

function StaggeredItem({ children, delay }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withTiming(0, { duration: 250 });
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [delay]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
```

### Animated Number Count-Up

```typescript
import { useEffect, useState } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedProps,
  withTiming,
  Easing 
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function AnimatedNumber({ value, suffix = '' }) {
  const animatedValue = useSharedValue(0);
  
  useEffect(() => {
    animatedValue.value = withTiming(value, { 
      duration: 500, 
      easing: Easing.out(Easing.cubic) 
    });
  }, [value]);
  
  const animatedProps = useAnimatedProps(() => ({
    text: `${Math.round(animatedValue.value)}${suffix}`,
  }));
  
  return (
    <AnimatedTextInput
      style={styles.metric}
      animatedProps={animatedProps}
      editable={false}
    />
  );
}
```

---

## Reduced Motion Support

### Detection

```typescript
import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export function useReducedMotion() {
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

### Conditional Animation

```typescript
function AnimatedComponent({ children }) {
  const reduceMotion = useReducedMotion();
  
  // If reduced motion, skip animation
  const duration = reduceMotion ? 0 : 250;
  
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  
  useEffect(() => {
    if (!reduceMotion) {
      opacity.value = withTiming(1, { duration });
    }
  }, [reduceMotion]);
  
  // ...
}
```

### Fallback Behaviors

| Animation | Reduced Motion Alternative |
|-----------|---------------------------|
| Fade in | Instant appear |
| Slide | Instant position |
| Count-up | Show final value |
| Chart draw | Show complete chart |
| Loading pulse | Static indicator |

---

## Haptic Feedback

### Haptic Types (expo-haptics)

```typescript
import * as Haptics from 'expo-haptics';

const hapticTypes = {
  // Impact feedback (physical sensation)
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Notification feedback (success/warning/error)
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  // Selection feedback (UI selection)
  selection: () => Haptics.selectionAsync(),
};
```

### Interaction → Haptic Mapping

| Interaction | Haptic Type | Notes |
|-------------|-------------|-------|
| Button tap | Light | Subtle confirmation |
| Card tap | Light | Navigation feedback |
| Tab selection | Selection | Quick, light |
| Toggle switch | Selection | State change |
| Protocol start | Medium | Important action |
| Protocol complete | Success | Celebration |
| Wearable sync success | Success | Positive confirmation |
| Error state | Error | Alert user |
| Form validation error | Warning | Gentle alert |
| Slider drag | Selection (continuous) | Granular feedback |
| Pull to refresh | Medium (on threshold) | Confirm refresh triggered |

### Implementation Pattern

```typescript
// Centralized haptic helper
export const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};

// Usage in components
function Button({ onPress, variant = 'primary' }) {
  const handlePress = () => {
    haptic.light();
    onPress?.();
  };
  
  return (
    <Pressable onPress={handlePress}>
      {/* ... */}
    </Pressable>
  );
}

function ProtocolCompleteButton({ onComplete }) {
  const handleComplete = () => {
    haptic.success();  // Stronger feedback for important action
    onComplete?.();
  };
  
  return (
    <Button onPress={handleComplete}>Mark Complete</Button>
  );
}
```

### Haptic Settings

Allow users to control haptic intensity in Settings:

```typescript
type HapticPreference = 'enhanced' | 'minimal' | 'off';

// Store in user preferences
const hapticPreference = useUserPreference('haptics');

// Conditional haptic helper
export function triggerHaptic(type: keyof typeof haptic) {
  const preference = getHapticPreference();
  
  if (preference === 'off') return;
  
  if (preference === 'minimal') {
    // Use lighter versions
    if (type === 'medium' || type === 'heavy') {
      haptic.light();
    } else if (type === 'success' || type === 'warning' || type === 'error') {
      haptic.selection();
    } else {
      haptic[type]();
    }
  } else {
    // Enhanced: use as specified
    haptic[type]();
  }
}
```

---

## Loading & Skeleton States

### Skeleton Screen Pattern

```typescript
function SkeletonCard() {
  const shimmer = useSharedValue(0);
  
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,  // Infinite
      false // No reverse
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4,
  }));
  
  return (
    <Animated.View style={[styles.skeleton, animatedStyle]}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonBody} />
      <View style={styles.skeletonBody} />
    </Animated.View>
  );
}
```

### AI Thinking Indicator

```typescript
function ThinkingDots() {
  return (
    <View style={styles.container}>
      <PulsingDot delay={0} />
      <PulsingDot delay={150} />
      <PulsingDot delay={300} />
    </View>
  );
}

function PulsingDot({ delay }) {
  const scale = useSharedValue(0.8);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.8, { duration: 300 })
        ),
        -1,
        false
      );
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [delay]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View style={[styles.dot, animatedStyle]} />
  );
}
```

---

## Gesture Animations

### Pull to Refresh

```typescript
import { RefreshControl } from 'react-native';

function RefreshableList({ data, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    haptic.medium();  // Feedback on threshold
    await onRefresh();
    haptic.success(); // Feedback on complete
    setRefreshing(false);
  };
  
  return (
    <FlatList
      data={data}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#63E6BE"
          colors={['#63E6BE']}
        />
      }
    />
  );
}
```

### Swipe Actions

```typescript
import { Swipeable } from 'react-native-gesture-handler';

function SwipeableCard({ children, onDelete }) {
  const renderRightActions = () => (
    <Pressable 
      style={styles.deleteAction}
      onPress={() => {
        haptic.warning();
        onDelete();
      }}
    >
      <TrashIcon color="#F87171" />
    </Pressable>
  );
  
  return (
    <Swipeable 
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => haptic.selection()}
    >
      {children}
    </Swipeable>
  );
}
```

---

## Micro-Delight Moments

These small touches create the "I love this app" feeling that users remember and share.

### Protocol Completion Celebration

When user marks a protocol complete, create a moment of satisfaction:

```typescript
function ProtocolCompleteAnimation({ onComplete }) {
  // 1. Checkmark springs in (300ms)
  const checkmarkScale = useSharedValue(0);
  
  // 2. Card glows teal briefly (100ms pulse)
  const glowOpacity = useSharedValue(0);
  
  // 3. Particles burst from center (400ms)
  const particles = useRef([...Array(5)].map(() => ({
    x: useSharedValue(0),
    y: useSharedValue(0),
    opacity: useSharedValue(1),
  })));

  const celebrate = () => {
    // Checkmark with spring
    checkmarkScale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
    });
    
    // Teal glow pulse
    glowOpacity.value = withSequence(
      withTiming(0.3, { duration: 50 }),
      withTiming(0, { duration: 100 })
    );
    
    // Particles burst outward and fade
    particles.current.forEach((p, i) => {
      const angle = (i / 5) * Math.PI * 2;
      p.x.value = withTiming(Math.cos(angle) * 20, { duration: 400 });
      p.y.value = withTiming(Math.sin(angle) * 20, { duration: 400 });
      p.opacity.value = withTiming(0, { duration: 400 });
    });
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    onComplete();
  };

  return (
    <Pressable onPress={celebrate}>
      <Animated.View style={[styles.card, { 
        shadowColor: '#63E6BE',
        shadowOpacity: glowOpacity 
      }]}>
        <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
          <CheckIcon color="#63E6BE" />
        </Animated.View>
        {particles.current.map((p, i) => (
          <Animated.View 
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#63E6BE',
              transform: [{ translateX: p.x }, { translateY: p.y }],
              opacity: p.opacity,
            }}
          />
        ))}
      </Animated.View>
    </Pressable>
  );
}
```

### Loading States with Personality

**Pulsing Logo (Primary Loading)**

Replace generic spinners with branded loading:

```typescript
function ApexLoadingIndicator() {
  const scale = useSharedValue(0.95);
  const glowOpacity = useSharedValue(0.3);
  
  useEffect(() => {
    // Breathing rhythm: 1.2s per cycle
    scale.value = withRepeat(
      withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true // reverse
    );
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 600 }),
      -1,
      true
    );
  }, []);

  return (
    <Animated.View style={{
      transform: [{ scale }],
      shadowColor: '#63E6BE',
      shadowOpacity: glowOpacity,
      shadowRadius: 12,
    }}>
      <ApexLogo size={48} color="#63E6BE" />
    </Animated.View>
  );
}
```

**AI Thinking Dots (Enhanced)**

```typescript
function AIThinkingDots() {
  const dots = [useSharedValue(0.4), useSharedValue(0.4), useSharedValue(0.4)];
  
  useEffect(() => {
    dots.forEach((dot, i) => {
      dot.value = withDelay(
        i * 200, // Stagger each dot
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.4, { duration: 400 })
          ),
          -1
        )
      );
    });
  }, []);

  return (
    <View style={styles.thinkingContainer}>
      {dots.map((opacity, i) => (
        <Animated.View 
          key={i}
          style={[styles.dot, { opacity }]} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thinkingContainer: {
    flexDirection: 'row',
    gap: 6,
    padding: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#63E6BE',
  },
});
```

### Empty States with Warmth

Add subtle breathing animation to empty state illustrations:

```typescript
function EmptyStateIllustration({ children }) {
  const scale = useSharedValue(0.98);
  
  useEffect(() => {
    // Gentle breathing: 3s per cycle
    scale.value = withRepeat(
      withTiming(1.02, { 
        duration: 1500, 
        easing: Easing.inOut(Easing.ease) 
      }),
      -1,
      true
    );
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
}

// Usage
<EmptyState
  illustration={
    <EmptyStateIllustration>
      <RestDayIcon size={120} color="#6C7688" />
    </EmptyStateIllustration>
  }
  title="Recovery day"
  message="Your body is building. No protocols needed today."
/>
```

### Success Glow Effect

Reusable glow effect for positive moments:

```typescript
function GlowEffect({ children, color = '#63E6BE', trigger }) {
  const glowOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (trigger) {
      glowOpacity.value = withSequence(
        withTiming(0.4, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [trigger]);

  return (
    <Animated.View style={{
      shadowColor: color,
      shadowOpacity: glowOpacity,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
    }}>
      {children}
    </Animated.View>
  );
}
```

### Recovery Score Reveal

Special animation for the hero metric:

```typescript
function RecoveryScoreReveal({ score }) {
  const displayValue = useSharedValue(0);
  const ringProgress = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  
  useEffect(() => {
    // Count up the number
    displayValue.value = withTiming(score, { 
      duration: 800, 
      easing: Easing.out(Easing.cubic) 
    });
    
    // Fill the progress ring
    ringProgress.value = withTiming(score / 100, { 
      duration: 1000, 
      easing: Easing.out(Easing.cubic) 
    });
    
    // Glow pulses when animation completes
    glowIntensity.value = withDelay(800, 
      withSequence(
        withTiming(0.5, { duration: 200 }),
        withTiming(0.15, { duration: 300 })
      )
    );
    
    // Haptic at completion
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800);
  }, [score]);

  const zoneColor = getZoneColor(score); // Returns green/amber/red
  
  return (
    <Animated.View style={{
      shadowColor: zoneColor,
      shadowOpacity: glowIntensity,
      shadowRadius: 24,
    }}>
      <AnimatedText style={styles.scoreText}>
        {displayValue.value.toFixed(0)}
      </AnimatedText>
      <AnimatedCircularProgress progress={ringProgress} color={zoneColor} />
    </Animated.View>
  );
}
```

---

## Anti-Patterns

### Never Do

- Animation duration > 350ms for UI responses
- Multiple concurrent animations on same element
- Animation that blocks user interaction
- Heavy haptics (heavy impact) for minor actions
- Haptic feedback without visual feedback
- Looping animations without reduced motion check
- Spring animations with very low damping (bouncy chaos)

### Avoid

- Parallax effects on scroll (performance heavy)
- 3D transforms (inconsistent support)
- Blur animations (expensive)
- Chained animations > 3 steps
- Haptics on scroll events (overwhelming)
