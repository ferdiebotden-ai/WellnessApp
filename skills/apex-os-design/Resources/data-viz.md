# Apex OS Data Visualization

## Core Principles

1. **Interpretation first:** User understands the "story" in ~5 seconds
2. **Always label:** Axes, units, and time windows are never ambiguous
3. **Consistent color:** Teal for primary data, zone colors for recovery states
4. **Interactive:** Tap → tooltip with exact value

## Line Trend Charts

### Use Cases

- HRV over time
- Sleep duration trends
- Recovery score history
- Readiness trends

### Visual Specification

```typescript
const lineChartStyle = {
  line: {
    color: '#63E6BE',
    strokeWidth: 2,
    strokeLinecap: 'round',
  },
  gradient: {
    colors: ['rgba(99, 230, 190, 0.3)', 'rgba(99, 230, 190, 0)'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  axis: {
    color: '#6C7688',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  grid: {
    color: '#2A303D',
    strokeWidth: 1,
    strokeDasharray: [4, 4],
  },
  dot: {
    color: '#63E6BE',
    radius: 4,
    strokeWidth: 2,
  },
};
```

### Structure

```
     65┤                    ●
       │              ●    
     60┤        ●    
       │  ●    
     55┤       
       └──────────────────────
        Mon Tue Wed Thu Fri Sat Sun
        
        HRV (ms) · Past 7 days
```

### Default Behavior

- **Time window:** 7 days
- **Y-axis:** Auto-scale with padding
- **Data points:** Show dots at each data point
- **Animation:** Line draws in from left (400-600ms)

### Tooltip on Tap

```
┌───────────────┐
│ Thu, Dec 5    │
│ HRV: 62ms     │
│ ↑ 8% vs avg  │
└───────────────┘
```

### Implementation

```tsx
import { LineChart } from 'react-native-chart-kit';

function HRVTrendChart({ data }) {
  return (
    <LineChart
      data={{
        labels: data.map(d => d.dayLabel),
        datasets: [{ data: data.map(d => d.value) }],
      }}
      width={screenWidth - 32}
      height={180}
      chartConfig={{
        backgroundColor: '#181C25',
        backgroundGradientFrom: '#181C25',
        backgroundGradientTo: '#181C25',
        color: (opacity = 1) => `rgba(99, 230, 190, ${opacity})`,
        labelColor: () => '#6C7688',
        propsForDots: {
          r: '4',
          strokeWidth: '2',
          stroke: '#63E6BE',
        },
        propsForBackgroundLines: {
          stroke: '#2A303D',
          strokeDasharray: '4,4',
        },
      }}
      bezier
      withInnerLines={true}
      withOuterLines={false}
      onDataPointClick={({ value, index }) => showTooltip(data[index])}
    />
  );
}
```

---

## Progress Bars

### Use Cases

- Recovery score fill
- Protocol completion
- Goal progress
- Sleep stage breakdown

### Visual Specification

```typescript
const progressBarStyle = {
  track: {
    backgroundColor: '#2A303D',
    height: 6,
    borderRadius: 3,
  },
  fill: {
    height: 6,
    borderRadius: 3,
    // Color varies by context
  },
};
```

### Variants

**Recovery Progress:**
```typescript
// Fill color based on zone
const recoveryProgress = {
  ...progressBarStyle,
  fill: {
    backgroundColor: getRecoveryColor(score),
  },
};
```

**Protocol Adherence:**
```typescript
// Always teal
const adherenceProgress = {
  ...progressBarStyle,
  fill: {
    backgroundColor: '#63E6BE',
  },
};
```

**Goal Progress:**
```typescript
// Teal until complete, then green
const goalProgress = {
  fill: {
    backgroundColor: progress >= 1 ? '#4ADE80' : '#63E6BE',
  },
};
```

### Animation

Animate fill from 0 to target value on load (300-500ms, ease-out).

```tsx
function AnimatedProgressBar({ progress, color }) {
  const width = useSharedValue(0);
  
  useEffect(() => {
    width.value = withTiming(progress, { 
      duration: 400, 
      easing: Easing.out(Easing.cubic) 
    });
  }, [progress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));
  
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}
```

---

## Adherence Dots

### Use Cases

- Weekly protocol completion
- Habit tracking visualization
- Quick glance adherence

### Visual Specification

```
●●●●●○○  5/7 this week
```

```typescript
const adherenceDotsStyle = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filled: {
    backgroundColor: '#63E6BE',
  },
  empty: {
    backgroundColor: '#2A303D',
  },
  label: {
    marginLeft: 8,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#6C7688',
  },
};
```

### Implementation

```tsx
function AdherenceDots({ completed, total, showLabel = true }) {
  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < completed ? styles.filled : styles.empty]}
          />
        ))}
      </View>
      {showLabel && (
        <Text style={styles.label}>{completed}/{total}</Text>
      )}
    </View>
  );
}
```

---

## Correlation Cards

### Use Cases

- Protocol → outcome relationships
- "Why?" explanations with data
- Shareable insights

### Structure

```
┌─────────────────────────────────────┐
│ 🔗 CORRELATION                      │
│                                     │
│ Cold Plunge → HRV                   │
│                                     │
│ +12%                                │
│ HRV on following days               │
│                                     │
│ ████████████████░░░░  High          │
│ Confidence (14 data points)         │
│                                     │
│ See the science →                   │
└─────────────────────────────────────┘
```

### Elements

| Element | Style | Notes |
|---------|-------|-------|
| Label | Caption, uppercase, textMuted | "CORRELATION" |
| Title | H3, textPrimary | "Cold Plunge → HRV" |
| Metric | MetricMedium, accentTeal, monospace | "+12%" |
| Description | BodySmall, textSecondary | "HRV on following days" |
| Confidence bar | Progress bar | Fill based on confidence |
| Confidence label | Caption, textMuted | "High (14 data points)" |
| CTA | Ghost button, accentTeal | "See the science →" |

### Confidence Levels

| Level | Range | Bar Fill | Label |
|-------|-------|----------|-------|
| Low | < 0.6 | 30% | "Low (X data points)" |
| Medium | 0.6-0.8 | 60% | "Medium (X data points)" |
| High | > 0.8 | 90% | "High (X data points)" |

### Implementation

```tsx
function CorrelationCard({ 
  protocol, 
  outcome, 
  change, 
  confidence, 
  dataPoints,
  onSeeScience 
}) {
  const confidencePercent = confidence > 0.8 ? 90 : confidence > 0.6 ? 60 : 30;
  const confidenceLabel = confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low';
  
  return (
    <Card>
      <Text style={styles.label}>CORRELATION</Text>
      <Text style={styles.title}>{protocol} → {outcome}</Text>
      
      <Text style={styles.metric}>{change > 0 ? '+' : ''}{change}%</Text>
      <Text style={styles.description}>{outcome} on following days</Text>
      
      <View style={styles.confidenceContainer}>
        <ProgressBar progress={confidencePercent / 100} color="#63E6BE" />
        <Text style={styles.confidenceLabel}>
          {confidenceLabel} ({dataPoints} data points)
        </Text>
      </View>
      
      <Pressable onPress={onSeeScience}>
        <Text style={styles.cta}>See the science →</Text>
      </Pressable>
    </Card>
  );
}
```

---

## Metric Cards

### Use Cases

- Dashboard summaries
- Quick stats display
- Comparison metrics

### Structure

```
┌─────────────────────────────────────┐
│ SLEEP DURATION                      │
│                                     │
│ 7h 23m                              │
│ ↑ 18 min vs last week               │
└─────────────────────────────────────┘
```

### Visual Specification

```typescript
const metricCardStyle = {
  container: {
    backgroundColor: '#181C25',
    borderRadius: 12,
    padding: 16,
    minWidth: 140,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#6C7688',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 28,
    fontWeight: '600',
    // fontFamily: monospace
    color: '#F6F8FC',
    marginTop: 8,
  },
  trend: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#A7B4C7',
    marginTop: 4,
  },
  trendPositive: {
    color: '#4ADE80',
  },
  trendNegative: {
    color: '#F87171',
  },
};
```

### Grid Layout

For dashboard views, use 2-column grid:

```tsx
<View style={styles.metricsGrid}>
  <MetricCard label="Sleep" value="7h 23m" trend="+18 min" positive />
  <MetricCard label="HRV" value="62ms" trend="+8%" positive />
  <MetricCard label="RHR" value="58bpm" trend="-2 bpm" positive />
  <MetricCard label="Steps" value="8,432" trend="-12%" negative />
</View>
```

---

## Sleep Stage Breakdown

### Use Cases

- Sleep composition analysis
- Weekly sleep patterns

### Structure

```
SLEEP STAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

███████████████░░░░░░░░░  Deep    1h 42m
██████████████████████░░  Light   3h 18m
███████░░░░░░░░░░░░░░░░░  REM     1h 12m
██░░░░░░░░░░░░░░░░░░░░░░  Awake   23 min

Total: 7h 23m
```

### Color Coding

```typescript
const sleepStageColors = {
  deep: '#5B8DEF',    // Blue
  light: '#63E6BE',   // Teal
  rem: '#D4A574',     // Gold
  awake: '#F87171',   // Red (muted)
};
```

### Implementation

```tsx
function SleepStagesChart({ stages }) {
  const total = stages.reduce((sum, s) => sum + s.duration, 0);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SLEEP STAGES</Text>
      
      {stages.map(stage => (
        <View key={stage.name} style={styles.row}>
          <View style={styles.barContainer}>
            <View 
              style={[
                styles.bar, 
                { 
                  width: `${(stage.duration / total) * 100}%`,
                  backgroundColor: sleepStageColors[stage.key],
                }
              ]} 
            />
          </View>
          <Text style={styles.label}>{stage.name}</Text>
          <Text style={styles.duration}>{formatDuration(stage.duration)}</Text>
        </View>
      ))}
      
      <Text style={styles.total}>Total: {formatDuration(total)}</Text>
    </View>
  );
}
```

---

## Recovery Zone Indicator

### Use Cases

- Recovery score context
- Day-type indicator

### Structure

```
┌─────────────────────────────────────┐
│ ●●●●●●●●○○  78%  PUSH DAY           │
└─────────────────────────────────────┘
```

### Visual Specification

```typescript
const zoneIndicator = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    // fontFamily: monospace
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};
```

### Zone Labels

| Score | Color | Label |
|-------|-------|-------|
| 75-100% | #4ADE80 | "PUSH DAY" |
| 60-74% | #FBBF24 | "STEADY DAY" |
| < 60% | #F87171 | "RECOVERY DAY" |

---

## Reduced Motion Support

All charts must support `prefers-reduced-motion`:

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

// Usage in charts
function AnimatedChart({ data }) {
  const reduceMotion = useReducedMotion();
  
  // If reduced motion, show final state immediately
  const animationDuration = reduceMotion ? 0 : 400;
  
  // ...
}
```

---

## Chart Accessibility

### Requirements

1. **Text alternatives:** Provide summary of chart data for screen readers
2. **Tooltips:** Accessible via tap, not just hover
3. **Color independence:** Use labels in addition to colors
4. **Focus indicators:** Keyboard-navigable data points (web)

### Implementation

```tsx
function AccessibleChart({ data, summary }) {
  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={summary}
    >
      <ChartComponent data={data} />
    </View>
  );
}

// Example summary
const summary = "HRV trend over 7 days. Starting at 55ms on Monday, increasing to 65ms on Sunday. Overall trend is positive with 8% improvement.";
```
