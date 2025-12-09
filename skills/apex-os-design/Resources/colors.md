# Apex OS Color System

## Background Layers

Use these layers to create depth hierarchy. Deeper content uses darker colors.

### Liquid Glass Materials (iOS 26+)

For modals, overlays, and premium hero elements, use translucent materials with backdrop blur:

```typescript
const glassMaterials = {
  ultraThin: 'rgba(24, 28, 37, 0.7)',    // Overlays, popovers
  thin: 'rgba(24, 28, 37, 0.85)',        // Optional card enhancement
  regular: 'rgba(24, 28, 37, 0.95)',     // Modals, bottom sheets
};

// Usage with backdrop blur
const glassCard = {
  backgroundColor: glassMaterials.thin,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', // Safari
};
```

**When to use glass materials:**
- Modal backgrounds
- Bottom sheets
- Recovery Score Card (hero element)
- Floating action buttons

**When to use opaque surfaces:**
- Standard cards (default)
- List items
- Form inputs
- Navigation elements

**Note:** Glass materials are optional enhancements. Opaque cards work perfectly and are the default. Use glass sparingly for premium depth on hero elements.

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| `canvas` | #0F1218 | 15, 18, 24 | App background, deepest layer |
| `surface` | #181C25 | 24, 28, 37 | Cards, modals, chat bubbles |
| `elevated` | #1F2430 | 31, 36, 48 | Inputs, pressed states, nav bar |
| `subtle` | #2A303D | 42, 48, 61 | Borders, dividers, progress backgrounds |

**Usage pattern:**
```typescript
const backgrounds = {
  canvas: '#0F1218',
  surface: '#181C25',
  elevated: '#1F2430',
  subtle: '#2A303D',
};
```

## Text Colors

| Token | Hex | Use | Contrast on Canvas |
|-------|-----|-----|-------------------|
| `textPrimary` | #F6F8FC | Headlines, key data, critical content | 14.8:1 ✓ |
| `textSecondary` | #A7B4C7 | Body text, descriptions | 7.2:1 ✓ |
| `textMuted` | #6C7688 | Captions, labels, timestamps | 4.5:1 ✓ |
| `textDisabled` | #4A5568 | Disabled controls, placeholders | 3.1:1 (decorative only) |

**Rules:**
- Headlines always use `textPrimary`
- Body text uses `textSecondary`
- Never use `textDisabled` for readable content

```typescript
const text = {
  primary: '#F6F8FC',
  secondary: '#A7B4C7',
  muted: '#6C7688',
  disabled: '#4A5568',
};
```

## Accent Colors

| Token | Hex | Use |
|-------|-----|-----|
| `accentTeal` | #63E6BE | Primary CTAs, active states, positive emphasis |
| `accentBlue` | #5B8DEF | Secondary actions, links, informational emphasis |
| `accentGold` | #D4A574 | Pro tier markers, achievements, trust/warmth signals |

**Usage rules:**

- **Teal:** Primary action buttons, active navigation, protocol completion, positive metrics
- **Blue:** Links, secondary buttons, informational badges
- **Gold:** Pro tier badge, locked features, achievements, premium indicators

```typescript
const accents = {
  teal: '#63E6BE',
  blue: '#5B8DEF',
  gold: '#D4A574',
};
```

## Recovery Zone Colors

These colors communicate biometric state. Use them sparingly and always with text labels.

| Zone | Hex | Range | Meaning |
|------|-----|-------|---------|
| `recoveryHigh` | #4ADE80 | 75-100% | Push day, full capacity |
| `recoveryModerate` | #FBBF24 | 60-74% | Steady day, some caution |
| `recoveryLow` | #F87171 | <60% | Recovery day, take it easy |

```typescript
const recoveryZones = {
  high: '#4ADE80',
  moderate: '#FBBF24',
  low: '#F87171',
};

function getRecoveryColor(score: number): string {
  if (score >= 75) return recoveryZones.high;
  if (score >= 60) return recoveryZones.moderate;
  return recoveryZones.low;
}
```

## Zone Color Usage Rules

### Recovery Card Background

Apply zone color as overlay at ~12% opacity on `surface` background:

```typescript
import { mix } from 'polished';

function getRecoveryCardBackground(score: number): string {
  const zoneColor = getRecoveryColor(score);
  return mix(0.12, zoneColor, backgrounds.surface);
}

// Or with React Native:
const recoveryCardStyle = {
  backgroundColor: backgrounds.surface,
  // Overlay: use a View with zone color at 12% opacity
};
```

### Progress Bars

- Background: `subtle` (#2A303D)
- Fill: zone color based on current score
- Height: 6-8px
- Border radius: rounded ends (height / 2)

```typescript
const progressBarStyle = {
  background: subtle,
  fill: getRecoveryColor(score),
  height: 6,
  borderRadius: 3,
};
```

### Trend Indicators

Small arrows or tags showing change direction use zone colors:

```typescript
// +12% improvement → recoveryHigh (green)
// -5% decline → recoveryLow (red)
// No change → textMuted
```

### Critical Rule

**Color is never the only signal.** Always pair with:
- Text label ("High", "Moderate", "Low")
- Icon (checkmark, warning, alert)
- Pattern or shape differentiation

## Semantic Colors

For system states beyond recovery:

| State | Color | Use |
|-------|-------|-----|
| Success | `#4ADE80` | Confirmations, completed actions |
| Warning | `#FBBF24` | Caution states, pending actions |
| Error | `#F87171` | Errors, failures, critical issues |
| Info | `#5B8DEF` | Informational messages, tips |

**Usage pattern:**
```typescript
const semantic = {
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#5B8DEF',
};
```

## Color Application Examples

### Card Variants

```typescript
// Standard card
{ backgroundColor: surface, borderColor: subtle }

// Active/selected card
{ backgroundColor: surface, borderColor: accentTeal }

// Recovery card (high)
{ backgroundColor: mix(0.12, recoveryHigh, surface), borderColor: subtle }

// Error state card
{ backgroundColor: mix(0.08, error, surface), borderColor: error }
```

### Button Variants

```typescript
// Primary button
{ backgroundColor: accentTeal, color: canvas }

// Secondary button
{ backgroundColor: elevated, borderColor: accentTeal, color: accentTeal }

// Ghost button
{ backgroundColor: 'transparent', color: accentTeal }

// Disabled button
{ backgroundColor: subtle, color: textDisabled }
```

### Input States

```typescript
// Default
{ backgroundColor: elevated, borderColor: subtle }

// Focused
{ backgroundColor: elevated, borderColor: accentTeal }

// Error
{ backgroundColor: elevated, borderColor: error }

// Disabled
{ backgroundColor: canvas, borderColor: subtle, color: textDisabled }
```

## Complete Color Token Export

```typescript
export const colors = {
  // Backgrounds
  canvas: '#0F1218',
  surface: '#181C25',
  elevated: '#1F2430',
  subtle: '#2A303D',
  
  // Text
  textPrimary: '#F6F8FC',
  textSecondary: '#A7B4C7',
  textMuted: '#6C7688',
  textDisabled: '#4A5568',
  
  // Accents
  accentTeal: '#63E6BE',
  accentBlue: '#5B8DEF',
  accentGold: '#D4A574',
  
  // Recovery zones
  recoveryHigh: '#4ADE80',
  recoveryModerate: '#FBBF24',
  recoveryLow: '#F87171',
  
  // Semantic
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#5B8DEF',
};
```

## Accessibility Notes

All text color combinations meet WCAG AA (4.5:1 minimum):

| Foreground | Background | Ratio | Status |
|------------|------------|-------|--------|
| textPrimary | canvas | 14.8:1 | ✓ AAA |
| textPrimary | surface | 13.2:1 | ✓ AAA |
| textSecondary | canvas | 7.2:1 | ✓ AA |
| textSecondary | surface | 6.4:1 | ✓ AA |
| textMuted | canvas | 4.5:1 | ✓ AA |
| accentTeal | canvas | 9.1:1 | ✓ AAA |
| accentTeal | surface | 8.1:1 | ✓ AAA |

**Do not use:**
- `textDisabled` for any content users need to read
- Zone colors for text (use for backgrounds/accents only)
- Low-contrast combinations for interactive elements
