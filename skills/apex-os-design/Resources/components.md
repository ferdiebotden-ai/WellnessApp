# Apex OS Component Patterns

## Design Tokens

Reference these when implementing components:

```typescript
const tokens = {
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 20,      // Premium breathing space (was 16)
    lg: 28,      // Generous sections (was 24)
    xl: 40,      // Major breaks (was 32)
    xxl: 56,     // Hero sections
  },
  touch: {
    min: 44,
    preferred: 48,
    large: 56,
  },
};
```

## Elevation System

Premium apps use subtle shadows for spatial hierarchy. Dark mode shadows should be soft but present.

```typescript
const elevation = {
  none: 'none',
  card: '0 2px 8px rgba(0, 0, 0, 0.12)',           // Standard cards
  cardPressed: '0 1px 4px rgba(0, 0, 0, 0.08)',   // Pressed state (closer)
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.18)',    // Hover/focus state
  modal: '0 8px 24px rgba(0, 0, 0, 0.24)',        // Modals, sheets
  hero: '0 12px 32px rgba(0, 0, 0, 0.32)',        // Recovery card, hero elements
  floating: '0 16px 48px rgba(0, 0, 0, 0.4)',     // FABs, tooltips
};
```

### Elevation Usage

| Element | Elevation | Notes |
|---------|-----------|-------|
| Standard card | `card` | Subtle lift from canvas |
| Card on press | `cardPressed` | Feels like pushing down |
| Card on hover (web) | `cardHover` | Rises slightly |
| Recovery Score Card | `hero` | Dominant visual anchor |
| Modals, bottom sheets | `modal` | Clear separation |
| Floating buttons | `floating` | Maximum prominence |
| List items, inputs | `none` | Stay grounded |

### Platform Notes

- **iOS:** Use lighter shadows; system already provides depth cues
- **Android:** Shadows can be slightly more pronounced
- **Web:** Full shadow support; use `cardHover` on mouse interactions

```typescript
// React Native implementation
import { Platform } from 'react-native';

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
});
```

## Card (Base Pattern)

The fundamental container for grouped content. Uses generous padding for premium feel.

### Visual Specification

```typescript
const cardStyle = {
  backgroundColor: '#181C25',  // surface
  borderWidth: 1,
  borderColor: '#2A303D',      // subtle
  borderRadius: 12,
  padding: 20,                 // Premium spacing (was 16)
  ...elevation.card,           // Subtle shadow for depth
};
```

### Card Variants

| Variant | Background | Border | Elevation | Use Case |
|---------|------------|--------|-----------|----------|
| Default | surface | subtle | `card` | Standard content |
| Elevated | elevated | subtle | `cardHover` | Interactive cards |
| Highlighted | surface | teal (1px) | `card` | Active/selected |
| Hero | surface | none | `hero` | Recovery score |
| Glass | glassMaterials.thin | none | `modal` | Premium overlays (iOS 26+) |

### Hero Card (Recovery Score)

The Recovery Score Card is the visual anchor of Morning Anchor. It deserves special treatment:

```typescript
const heroCardStyle = {
  backgroundColor: '#181C25',
  borderRadius: 16,            // Larger radius
  padding: 28,                 // Extra generous
  ...elevation.hero,           // Maximum shadow prominence
  // Optional glass enhancement for iOS 26+:
  // backgroundColor: 'rgba(24, 28, 37, 0.85)',
  // backdropFilter: 'blur(20px)',
};
```

### Interaction

- Tappable cards: `scale(0.98)` on press, 100ms duration
- Shadow reduces on press (`elevation.cardPressed`)
- Shadow increases on hover/focus (`elevation.cardHover`)
- Light haptic on tap
- Chevron or indicator for navigable cards

### Variants

```typescript
// Standard card
const standardCard = {
  ...cardStyle,
};

// Selected/active card
const activeCard = {
  ...cardStyle,
  borderColor: '#63E6BE',  // accentTeal
};

// Error state card
const errorCard = {
  ...cardStyle,
  borderColor: '#F87171',  // error
  backgroundColor: 'rgba(248, 113, 113, 0.08)',
};
```

### Implementation

```tsx
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

function Card({ children, onPress, variant = 'standard' }) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };
  
  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, variantStyles[variant], animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

---

## Recovery Score Card (Hero)

Primary daily anchor component.

### Visual Specification

```typescript
const recoveryCardStyle = {
  backgroundColor: '#181C25',
  borderWidth: 1,
  borderColor: '#2A303D',
  borderRadius: 16,
  padding: 20,
  // Zone color overlay at 12% opacity
};
```

### Structure

```
┌─────────────────────────────────────┐
│ RECOVERY                     (label)│
│                                     │
│  78%                       (metric) │
│  ↑ 12% vs baseline          (trend) │
│  ═══════════════════    (progress)  │
│  Moderate — Ready for action        │
│                                     │
│  Why this score →         (link)    │
└─────────────────────────────────────┘
```

### Elements

| Element | Style | Notes |
|---------|-------|-------|
| Label | Caption, textMuted, uppercase | "RECOVERY" |
| Metric | MetricLarge, monospace, zone color | "78%" |
| Trend | BodySmall, textSecondary | "↑ 12% vs baseline" |
| Progress | 6px height, zone color fill | Animate on load |
| Interpretation | Body, textSecondary | One-line summary |
| Link | Caption, accentTeal | Optional "Why this score →" |

### Implementation

```tsx
function RecoveryScoreCard({ score, trend, interpretation, onPress }) {
  const zoneColor = getRecoveryColor(score);
  const overlayColor = `${zoneColor}1F`; // 12% opacity
  
  return (
    <Card onPress={onPress}>
      <View style={[styles.container, { backgroundColor: overlayColor }]}>
        <Text style={styles.label}>RECOVERY</Text>
        
        <AnimatedNumber 
          value={score} 
          style={[styles.metric, { color: zoneColor }]} 
          suffix="%" 
        />
        
        <Text style={styles.trend}>{trend}</Text>
        
        <ProgressBar 
          progress={score / 100} 
          color={zoneColor} 
          style={styles.progressBar} 
        />
        
        <Text style={styles.interpretation}>{interpretation}</Text>
        
        <Text style={styles.link}>Why this score →</Text>
      </View>
    </Card>
  );
}
```

---

## Protocol Card

Represents a single protocol in lists.

### Visual Specification

```typescript
const protocolCardStyle = {
  backgroundColor: '#181C25',
  borderWidth: 1,
  borderColor: '#2A303D',
  borderRadius: 12,
  padding: 16,
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 72,
};
```

### Structure

```
┌─────────────────────────────────────┐
│ ☀️  Morning Light           5/7  → │
│     10 min outdoor light            │
└─────────────────────────────────────┘
```

### Elements

| Element | Style | Notes |
|---------|-------|-------|
| Icon | 24×24, left aligned | Emoji or SF Symbol |
| Title | H3, textPrimary | Protocol name |
| Description | BodySmall, textMuted | One-line summary |
| Adherence | Caption, textMuted | "5/7" or dots ●●●●●○○ |
| Chevron | 16×16, textMuted | Navigation indicator |

### States

```typescript
// Default
const defaultState = {
  backgroundColor: '#181C25',
  opacity: 1,
};

// Completed today
const completedState = {
  backgroundColor: '#181C25',
  // Add subtle checkmark indicator
};

// Disabled / Rest day
const disabledState = {
  backgroundColor: '#181C25',
  opacity: 0.5,
};
```

### Implementation

```tsx
function ProtocolCard({ protocol, adherence, onPress }) {
  const isCompleted = protocol.completedToday;
  
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.icon}>{protocol.icon}</Text>
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{protocol.name}</Text>
            {isCompleted && <CheckIcon color="#4ADE80" size={16} />}
          </View>
          <Text style={styles.description}>{protocol.shortDescription}</Text>
        </View>
        
        <View style={styles.meta}>
          <AdherenceDots completed={adherence.completed} total={adherence.total} />
          <ChevronRight color="#6C7688" size={16} />
        </View>
      </View>
    </Card>
  );
}
```

---

## Buttons

### Primary Button

```typescript
const primaryButton = {
  backgroundColor: '#63E6BE',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  minHeight: 48,
  alignItems: 'center',
  justifyContent: 'center',
};

const primaryButtonText = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 16,
  color: '#0F1218',  // Dark text on teal
};
```

**Use for:** "Start Protocol", "Connect Wearable", "Save", primary CTAs

### Secondary Button

```typescript
const secondaryButton = {
  backgroundColor: '#1F2430',
  borderWidth: 1,
  borderColor: '#63E6BE',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  minHeight: 48,
};

const secondaryButtonText = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 16,
  color: '#63E6BE',
};
```

**Use for:** "Skip", "Maybe later", secondary actions

### Ghost Button

```typescript
const ghostButton = {
  backgroundColor: 'transparent',
  paddingVertical: 8,
  paddingHorizontal: 16,
};

const ghostButtonText = {
  fontFamily: 'Inter_500Medium',
  fontSize: 14,
  color: '#63E6BE',
};
```

**Use for:** Inline text actions ("See the science →")

### Button States

```typescript
// Pressed (all variants)
const pressed = {
  transform: [{ scale: 0.97 }],
  // 100ms duration
};

// Disabled
const disabled = {
  backgroundColor: '#2A303D',
  opacity: 0.5,
};

const disabledText = {
  color: '#4A5568',
};
```

### Implementation

```tsx
function Button({ variant = 'primary', children, onPress, disabled }) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.97, { duration: 100 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };
  
  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[styles[variant], disabled && styles.disabled, animatedStyle]}>
        <Text style={[styles[`${variant}Text`], disabled && styles.disabledText]}>
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
```

---

## Form Inputs

### Text Input

```typescript
const inputStyle = {
  backgroundColor: '#1F2430',
  borderWidth: 1,
  borderColor: '#2A303D',
  borderRadius: 12,
  padding: 14,
  fontSize: 16,
  fontFamily: 'Inter_400Regular',
  color: '#F6F8FC',
};

const inputFocused = {
  borderColor: '#63E6BE',
};

const inputError = {
  borderColor: '#F87171',
};

const placeholderColor = '#6C7688';
```

### Input States

| State | Border | Background |
|-------|--------|------------|
| Default | subtle | elevated |
| Focused | accentTeal | elevated |
| Error | error | elevated |
| Disabled | subtle | canvas |

### Implementation

```tsx
function TextInput({ label, error, ...props }) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <RNTextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        placeholderTextColor="#6C7688"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
```

---

## Bottom Navigation

### Visual Specification

```typescript
const bottomNavStyle = {
  backgroundColor: '#0F1218',
  borderTopWidth: 1,
  borderTopColor: '#2A303D',
  flexDirection: 'row',
  paddingBottom: 34, // Safe area on iPhone
  paddingTop: 8,
};

const navItem = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 48,
};
```

### Structure

```
┌─────────────────────────────────────┐
│  🏠      📋      📊      💬        │
│  Home  Protocols Insights  Chat    │
└─────────────────────────────────────┘
```

### States

| State | Icon Color | Label Color |
|-------|------------|-------------|
| Active | accentTeal | accentTeal |
| Inactive | textMuted | textMuted |

### Implementation

```tsx
function BottomNav({ currentRoute, onNavigate }) {
  const tabs = [
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'protocols', label: 'Protocols', icon: ListIcon },
    { key: 'insights', label: 'Insights', icon: ChartIcon },
    { key: 'chat', label: 'Chat', icon: MessageIcon },
  ];
  
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = currentRoute === tab.key;
        const color = isActive ? '#63E6BE' : '#6C7688';
        
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNavigate(tab.key);
            }}
          >
            <tab.icon color={color} size={24} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

---

## Adherence Indicators

### Dot Style

```
●●●●●○○  5/7
```

```typescript
const dotStyle = {
  width: 6,
  height: 6,
  borderRadius: 3,
  marginRight: 4,
};

const filledDot = {
  ...dotStyle,
  backgroundColor: '#63E6BE',
};

const emptyDot = {
  ...dotStyle,
  backgroundColor: '#2A303D',
};
```

### Implementation

```tsx
function AdherenceDots({ completed, total }) {
  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View 
            key={i} 
            style={i < completed ? styles.filledDot : styles.emptyDot} 
          />
        ))}
      </View>
      <Text style={styles.count}>{completed}/{total}</Text>
    </View>
  );
}
```

---

## Loading States

### Skeleton Screen

Use for initial data loading:

```typescript
const skeletonStyle = {
  backgroundColor: '#2A303D',
  borderRadius: 8,
  overflow: 'hidden',
};
```

Animate with shimmer effect:

```tsx
function Skeleton({ width, height, style }) {
  const shimmer = useSharedValue(0);
  
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + shimmer.value * 0.3,
  }));
  
  return (
    <Animated.View style={[styles.skeleton, { width, height }, style, animatedStyle]} />
  );
}
```

### Spinner

Use for actions in progress:

```tsx
function Spinner({ size = 24, color = '#63E6BE' }) {
  return <ActivityIndicator size={size} color={color} />;
}
```

### AI Thinking State

Pulsing dots for chat:

```tsx
function ThinkingIndicator() {
  return (
    <View style={styles.thinking}>
      <PulsingDot delay={0} />
      <PulsingDot delay={150} />
      <PulsingDot delay={300} />
    </View>
  );
}
```

---

## Empty States

### Structure

```
┌─────────────────────────────────────┐
│                                     │
│           [Illustration]            │
│                                     │
│      No protocols yet               │
│                                     │
│   Connect a wearable to get        │
│   personalized recommendations      │
│                                     │
│        [Connect Wearable]           │
│                                     │
└─────────────────────────────────────┘
```

### Implementation

```tsx
function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && (
        <Button onPress={onAction}>{actionLabel}</Button>
      )}
    </View>
  );
}
```

---

## Touch Targets

### Requirements

| Element | Minimum | Preferred |
|---------|---------|-----------|
| Buttons | 44×44pt | 48×48pt |
| Icons | 44×44pt | 48×48pt |
| List rows | 44pt height | 56-64pt height |

### Implementation Pattern

Always wrap small icons in a larger pressable area:

```tsx
// BAD: Icon is only touch target
<Pressable onPress={onClose}>
  <CloseIcon size={16} />
</Pressable>

// GOOD: Padded pressable area
<Pressable 
  onPress={onClose}
  style={{ padding: 12 }}  // Makes 16+24 = 40pt minimum
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}  // Expands to 56pt
>
  <CloseIcon size={16} />
</Pressable>
```
