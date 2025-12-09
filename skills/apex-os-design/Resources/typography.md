# Apex OS Typography System

## Font Families

### UI Font: Inter

Inter is the primary font for all UI text, headlines, and body content.

```typescript
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

const uiFont = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
```

### Data Font: Monospace

Use monospace for metrics, numbers, and data displays. Platform-specific selection:

```typescript
import { Platform } from 'react-native';
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

const dataFont = Platform.select({
  ios: {
    regular: 'SF Mono',
    semiBold: 'SF Mono',
    bold: 'SF Mono',
  },
  android: {
    regular: 'JetBrainsMono_400Regular',
    semiBold: 'JetBrainsMono_600SemiBold',
    bold: 'JetBrainsMono_700Bold',
  },
  default: {
    regular: 'monospace',
    semiBold: 'monospace',
    bold: 'monospace',
  },
});
```

### Font Loading

Use Expo's font loading with a splash screen:

```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  
  return <MainApp />;
}
```

## Type Scale

### Display & Headlines

| Style | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| Display | 44-48 | 700 | 1.1 | Onboarding hero, major empty states |
| H1 | 28-32 | 700 | 1.2 | Screen titles |
| H2 | 22-24 | 600 | 1.25 | Section headers, card titles |
| H3 | 18-20 | 600 | 1.3 | Subheaders, protocol titles in lists |

### Body Text

| Style | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| Body | 16 | 400 | 1.5 | Main content, protocol descriptions |
| Body Small | 14 | 400 | 1.5 | Secondary lines, helper text |
| Caption | 12 | 500 | 1.4 | Labels, timestamps, badges |

### Metrics (Monospace)

| Style | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| Metric Large | 48-56 | 700 | 1.0 | Hero metrics (recovery, HRV) |
| Metric Medium | 24-32 | 600 | 1.1 | Secondary metrics on cards |
| Metric Small | 16-18 | 500 | 1.2 | Inline data values |

## Style Definitions

```typescript
import { StyleSheet } from 'react-native';

export const typography = StyleSheet.create({
  // Display & Headlines
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    lineHeight: 48 * 1.1,
    color: '#F6F8FC',
  },
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 28 * 1.2,
    color: '#F6F8FC',
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    lineHeight: 22 * 1.25,
    color: '#F6F8FC',
  },
  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 18 * 1.3,
    color: '#F6F8FC',
  },
  
  // Body
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 16 * 1.5,
    color: '#A7B4C7',
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: '#A7B4C7',
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 12 * 1.4,
    color: '#6C7688',
  },
  
  // Metrics (use with Platform.select for font family)
  metricLarge: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 48,
    color: '#F6F8FC',
  },
  metricMedium: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 28 * 1.1,
    color: '#F6F8FC',
  },
  metricSmall: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 16 * 1.2,
    color: '#F6F8FC',
  },
});
```

## Usage Rules

### Headlines

- **Always** use `textPrimary` (#F6F8FC) for headlines
- Headlines are sentence case or Title Case
- Never use quirky all-lowercase styling
- One H1 per screen maximum

### Body Text

- Default to `textSecondary` (#A7B4C7) for readable content
- Line height 1.5 for body, 1.4 for captions
- Maximum line length: ~65 characters for long-form copy (AI explanations)

### Metrics

- **Always** use monospace for numerical data
- Recovery scores, HRV, sleep duration, percentages = monospace
- Animate count-up on initial load (respect reduced motion)
- Right-align or center metrics, never left-align in metric displays

### Hierarchy

- Use maximum 2-3 type sizes per screen
- Data dashboards can use more but maintain clear hierarchy
- Every screen should have one clear primary element

## Text Component Examples

### Recovery Score

```tsx
<View style={styles.metricContainer}>
  <Text style={styles.metricLabel}>RECOVERY</Text>
  <Text style={[typography.metricLarge, { fontFamily: dataFont.bold, color: recoveryColor }]}>
    {score}%
  </Text>
  <Text style={styles.metricTrend}>↑ 12% vs baseline</Text>
</View>
```

### Protocol Card Title

```tsx
<View style={styles.protocolHeader}>
  <Text style={typography.h3}>Morning Light Exposure</Text>
  <Text style={typography.bodySmall}>10-30 min outdoor light within 60 min of waking</Text>
</View>
```

### Section Header

```tsx
<Text style={[typography.caption, { textTransform: 'uppercase', letterSpacing: 1 }]}>
  TODAY'S PROTOCOLS
</Text>
```

### AI Chat Message

```tsx
<View style={styles.aiMessage}>
  <Text style={typography.body}>
    Your HRV improved 8% this week. The morning light protocol is working—you've completed it 6/7 days.
  </Text>
</View>
```

## Responsive Scaling

For larger screens (tablets), scale up proportionally:

```typescript
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const getResponsiveSize = (mobile: number, tablet: number) => 
  isTablet ? tablet : mobile;

// Usage
const h1Size = getResponsiveSize(28, 36);
const metricSize = getResponsiveSize(48, 64);
```

## Dynamic Type Support (Accessibility)

Support system font scaling for accessibility:

```typescript
import { PixelRatio } from 'react-native';

// Respect system font scale but cap at 1.3x for layout stability
const fontScale = Math.min(PixelRatio.getFontScale(), 1.3);

const scaledFontSize = (size: number) => size * fontScale;
```

**Testing requirement:** Verify layouts don't break at 1.3x font scale.

## Anti-Patterns

**Never:**
- Use Inter for data metrics (use monospace)
- Use more than 4 type sizes on a single screen
- Set line height below 1.4 for body text
- Use `textDisabled` for any readable content
- Left-align large metric numbers
- Use decorative fonts or weights not in the system
