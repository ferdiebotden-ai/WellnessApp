<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Before running the following research prompt, understand our project from our project files, the instructions, etc. Think critically understanding Best Practises for December 2025:

## Research Prompt 1: "Why?" Reasoning UX System

**Purpose:** Define the UX pattern and content structure for reasoning transparency panels that explain nudge recommendations to users.

**Context for Perplexity:**
> I'm building a premium wellness app (like WHOOP/Oura) that gives personalized protocol recommendations. Our differentiator is "reasoning transparency" — users can tap "Why?" on any recommendation to see exactly how the AI reached that conclusion. The audience is high-performing professionals who want evidence, not hand-waving.

---

### PROMPT 1: REASONING TRANSPARENCY UX

```
I'm building a mobile wellness app that provides AI-driven protocol recommendations. I need to implement a "Why?" reasoning expansion feature that shows users exactly how the AI reached each recommendation.

CONTEXT:
- Target user: High-performing professionals (think Huberman listeners, WHOOP users)
- Platform: React Native (iOS/Android)
- Tone: Analytical, evidence-based, not patronizing
- Recommendations are based on: wearable data, user behavior patterns, protocol science

RESEARCH QUESTIONS:

1. **UX Patterns for Expandable Explanations:**
   - What are the best mobile UX patterns for "tap to expand" explanations?
   - How do WHOOP, Oura, and Headspace handle "why" explanations for recommendations?
   - What's the optimal information hierarchy (what to show first vs. on expansion)?
   - Should explanations be inline (card expands) or modal (overlay)?
   - What are the accessibility considerations (WCAG compliance)?

2. **Content Structure for AI Explanations:**
   - What frameworks exist for explaining AI recommendations to non-technical users?
   - How should scientific citations be formatted for mobile reading?
   - What's the optimal character/word count for each explanation section?
   - How do you balance personalization ("your data") vs. science ("the research")?

3. **Trust & Credibility Signals:**
   - What visual elements increase trust in AI recommendations (confidence meters, source badges)?
   - How should DOI links be displayed for academic citations?
   - What role does "confidence level" play in user trust?
   - Are there studies on how explanation length affects perceived credibility?

4. **Animation & Interaction Design:**
   - What are standard expand/collapse animation timings (iOS/Android)?
   - How should content fade in during expansion?
   - What tap targets are appropriate for mobile?
   - How do you handle "tap outside to close" vs. explicit close button?

5. **Competitive Analysis:**
   - How does WHOOP explain its recovery scores and recommendations?
   - How does Oura explain readiness scores and suggestions?
   - How does MyFitnessPal/Noom explain meal recommendations?
   - How do AI assistants (ChatGPT, Claude) format explanations?

DELIVERABLES NEEDED:
- Recommended 4-panel structure for reasoning explanations
- Character limits for each section
- Animation specifications (durations, easing curves)
- Confidence display patterns (visual design)
- Citation formatting guidelines
- React Native component structure recommendation
- Accessibility checklist
```

Now I have comprehensive context. Let me compile the research findings:

# Reasoning Transparency UX Research Report: "Why?" System for Apex OS

**Date:** December 3, 2025
**Context:** Apex OS wellness app targeting Huberman Lab listeners and high-performing professionals
**Differentiator:** Evidence-based recommendations with full reasoning transparency ("Why?" layer)

***

## EXECUTIVE SUMMARY

Based on competitive analysis of WHOOP, Oura, and emerging 2025 UX best practices, this report defines the optimal UX system for Apex OS's reasoning transparency feature. The "Why?" panel should use **inline expandable cards** with **4-section content structure**, **250-300ms animations**, and **High/Medium/Low confidence displays**. Key finding: competitors (WHOOP Coach, Oura Advisor) lack citation transparency—this is Apex OS's primary moat.

***

## 1. COMPETITIVE LANDSCAPE: HOW COMPETITORS HANDLE EXPLANATIONS

### WHOOP 4.0/5.0 Coach (2025 Status)

**Approach:**[^1][^2]

- AI chatbot interface (GPT-4 powered)
- "Search engine for your body" — reactive Q\&A model
- Educational snippets sprinkled throughout app
- **No peer-reviewed citations** — explains mechanisms but doesn't show sources

**Strengths:**

- 50+ languages supported
- Contextual explanations tied to metrics (e.g., "why HRV dropped")
- Shows correlations (e.g., "late night beer = HRV crash next day")

**Weaknesses:**

- **8-12 notifications per day** = fatigue[^3]
- Black-box recovery score (users don't understand the formula)[^4]
- Hardware-locked (\$399 + \$239/year)
- No DOI references or evidence layer

**Traffic Light System:** WHOOP uses red/yellow/green recovery scores—visually impactful but less analytical than numerical scores.[^1]

***

### Oura Ring Gen 3 + Advisor (March 2025 Launch)

**Approach:**[^5][^1]

- LLM-powered AI advisor with memory
- Conversational UI for Q\&A
- Customizable tone (professional, casual, supportive)
- 60% weekly engagement rate

**Strengths:**

- Deep explanations: "Advisor explains NSDR impact on adenosine levels"[^5]
- Snack recommendations, protocol guidance
- Far surpasses WHOOP's AI in breadth

**Weaknesses:**

- **No evidence citations** — still "trust me bro" recommendations
- Readiness score is bland numerals (70-100) without visual urgency[^1]
- Hardware-locked (\$299-549 ring + \$72/year)
- Black-box algorithm (HRV explains <5% of Readiness variance)[^4]

***

### Apple Health+ (Expected ~2026)

**Approach:**[^6]

- Clinical AI with physician training data
- Expected to emphasize medical-grade explanations
- Details unknown (not yet launched)

**Risk to Apex OS:** Massive distribution advantage once launched. We must establish brand + data moat before 2026.

***

### Key Insight: The Citation Gap

**NO competitor provides peer-reviewed citations with DOI links.** This is Apex OS's primary differentiator. Users in the Huberman ecosystem (5.8M+ listeners) are trained to ask "Where's the study?" — we answer that question.[^6]

***

## 2. UX PATTERNS FOR EXPANDABLE EXPLANATIONS

### Best Practices from 2025 UX Research

#### A. Inline Expansion vs. Modal Overlay

**Recommendation: Inline Expandable Card**[^7][^8][^9]


| Pattern | Pros | Cons | Best For |
| :-- | :-- | :-- | :-- |
| **Inline Expansion** | Context preserved, no modal stack, smooth animations | Can push content down (use max-height) | Brief explanations (200-400 chars) |
| **Modal Overlay** | Full attention, more space for complex info | Breaks flow, requires dismiss action | Long-form explanations (>500 chars) |
| **Bottom Sheet** | Mobile-native, partial overlay | Obscures content, gesture conflicts | Mobile-first apps with heavy content |

**For Apex OS:** Use **inline expansion** for "Why?" layer. User taps recommendation → card expands in-place → shows 4-panel structure (below).

**Why:** Preserves context, feels lightweight, aligns with "respect intelligence" brand voice (no heavy modals).

***

#### B. Animation Timing \& Easing

**Standard Mobile Animation Specs (2025):**[^10][^11][^12][^13]


| Animation Type | Duration | Easing Curve | Notes |
| :-- | :-- | :-- | :-- |
| **Expand/Collapse** | **250-300ms** | `ease-in-out` or `cubic-bezier(0.16, 1, 0.3, 1)` | Smooth, not sluggish |
| **Fade In (text)** | 150-200ms | `ease-in` | Content appears after expansion |
| **Icon Rotation** | 200ms | `ease-out` | Chevron rotates 180° |
| **Micro-interactions** | 150ms | `ease-out` | Button press, toggle |

**Android Developer Options Note:** Users can set system animation scale to 0.5x or off—don't exceed 300ms or it feels slow.[^11][^10]

**For Apex OS:**

- Card expansion: **280ms** with `ease-in-out`
- Text fade-in: **180ms** (staggered 50ms after card expansion starts)
- Chevron icon rotation: **250ms**

***

#### C. Touch Target Size \& Accessibility

**WCAG 2.2 Mobile Guidelines:**[^14][^15][^16]

- **Minimum tap target:** 44x44 pixels (iOS) / 48x48 pixels (Android)
- **Spacing between targets:** 8px minimum
- **Keyboard navigation:** Must support Tab/Enter for screen readers
- **ARIA attributes:** `aria-expanded="true/false"`, `aria-controls="explanationPanel"`
- **Focus states:** Clear visual indicator for keyboard users

**For Apex OS:**

- Full card header is tappable (not just icon)
- Chevron icon: 24x24px within 48x48px touch area
- Focus ring: 3px solid teal (`#63E6BE`) with 2px offset

***

#### D. Visual Indicators for Expandability

**Best Practices:**[^8][^9][^13][^7]


| Indicator | Effectiveness | Notes |
| :-- | :-- | :-- |
| **Chevron (▼/▲)** | High | Universal pattern, rotates on expand |
| **Plus/Minus (+/−)** | Medium | Less common in modern apps |
| **"More" text link** | Low | Not discoverable on mobile |
| **Color change on tap** | High | Combines with icon for feedback |

**For Apex OS:**

- Use **chevron icon** (▼ collapsed, ▲ expanded)
- Position: Right-aligned in card header
- Animate rotation: 180° over 250ms
- Header background: Slight color shift on tap (teal accent)

***

## 3. CONTENT STRUCTURE FOR AI EXPLANATIONS

### The 4-Panel Reasoning Framework

Based on Explainable AI (XAI) research and user trust patterns, recommendations should include:[^17][^18][^19][^20][^21]

#### **Panel 1: Mechanism (The "What")**

- **Character limit:** 80-120 chars (1-2 sentences)
- **Purpose:** Physiological explanation in plain language
- **Example:** "Bright light in the first hour after waking triggers cortisol release, advancing your circadian phase and improving sleep timing."


#### **Panel 2: Evidence (The "Proof")**

- **Character limit:** 100-150 chars (citation + brief context)
- **Purpose:** Peer-reviewed study with DOI link
- **Format:** `Author et al. (Year). Title. DOI: [clickable link]`
- **Example:** "Wright et al. (2013). Entrainment of the human circadian clock to the natural light-dark cycle. DOI: [10.1016/j.cub.2013.06.039](https://doi.org/10.1016/j.cub.2013.06.039)"

**DOI Formatting Best Practice:**[^22][^23]

- Use full `https://doi.org/` URL (not short form)
- Make entire citation tappable (opens in in-app browser or external)
- Use blue underlined link style (familiar pattern)


#### **Panel 3: Your Data (The "Why You")**

- **Character limit:** 100-150 chars (personalized context)
- **Purpose:** Show what triggered THIS specific recommendation for THIS user
- **Example:** "Your average sleep onset is 45 min (vs. 20 min target). Morning light adherence correlates with 14 min improvement in similar users."

**Personalization Best Practice:**[^24][^25][^17]

- Reference user's actual data (sleep onset, HRV, etc.)
- Show comparison to baseline or target
- Mention correlation if pattern detected (e.g., "users with similar HRV patterns...")


#### **Panel 4: Confidence (The "How Sure")**

- **Character limit:** 40-60 chars (label + context)
- **Purpose:** AI confidence level in this recommendation
- **Format:** Visual indicator + brief explanation
- **Example:** "Confidence: High (based on 30+ days of your data)"

**Total "Why?" Panel Length:** 320-480 characters (fits on mobile without scrolling).

***

### Confidence Score Display Patterns

**Research Findings:**[^26][^27][^28][^29][^30][^31]


| Display Method | Pros | Cons | Best For |
| :-- | :-- | :-- | :-- |
| **Percentage (0-100%)** | Precise, familiar | Can create false certainty | Technical audiences |
| **Label (High/Med/Low)** | Easy to interpret, less overwhelming | Less precise | General audiences |
| **Color-coded badge** | Visual at-a-glance | Requires color legend | Mobile apps |
| **Progress bar** | Shows scale visually | Takes up space | Desktop interfaces |

**For Apex OS (December 2025 Best Practice):**

Use **3-tier label system** with color coding:


| Confidence | Threshold | Badge Color | Display Text | When to Show |
| :-- | :-- | :-- | :-- | :-- |
| **High** | ≥0.7 | Teal (`#63E6BE`) | "High confidence" | >30 days data + strong correlation |
| **Medium** | 0.4-0.69 | Blue (`#5B8DEF`) | "Medium confidence" | 7-30 days data or weak correlation |
| **Low** | <0.4 | Gray (`#A7B4C7`) | "Limited confidence" | <7 days data — suppress nudge entirely per PRD[^6] |

**Visual Pattern:**

```
Confidence: ● High
Based on 30+ days of your data
```

**Why This Matters:**[^30][^26]

- Builds trust by acknowledging AI fallibility
- Creates friction that encourages critical thinking
- Aligns with Apex OS brand voice (scientific, direct, respectful)

**Caution:** Don't show confidence if <0.4—suppress the recommendation entirely per Apex OS suppression rules.[^6]

***

## 4. REACT NATIVE IMPLEMENTATION GUIDELINES

### Component Structure Recommendation

**Technology Stack (from PRD):**[^6]

- React Native (Expo 54)
- React Native Reanimated (for smooth animations)
- No polling—use real-time Firebase listeners

**Component Hierarchy:**

```jsx
<TouchableOpacity onPress={toggleExpand} accessible accessibilityRole="button">
  <View style={styles.cardHeader}>
    <Text style={styles.nudgeTitle}>Morning Light: 10 min</Text>
    <Animated.View style={chevronRotation}>
      <ChevronIcon />
    </Animated.View>
  </View>
  
  {isExpanded && (
    <Animated.View style={expandAnimation}>
      <View style={styles.reasoningPanel}>
        <Section title="Mechanism" content={mechanism} />
        <Section title="Evidence" content={citation} isDOI />
        <Section title="Your Data" content={personalData} />
        <ConfidenceBadge level={confidence} />
      </View>
    </Animated.View>
  )}
</TouchableOpacity>
```

**Key React Native Patterns:**[^32][^33][^34][^35][^36]

1. **State Management:**

```jsx
const [isExpanded, setIsExpanded] = useState(false);
```

2. **Animation with Reanimated 2:**

```jsx
const heightAnimation = useAnimatedStyle(() => ({
  height: withTiming(isExpanded ? 'auto' : 0, { duration: 280 }),
  opacity: withTiming(isExpanded ? 1 : 0, { duration: 180 })
}));
```

3. **Chevron Rotation:**

```jsx
const rotateAnimation = useAnimatedStyle(() => ({
  transform: [{ rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 250 }) }]
}));
```

4. **Accessibility:**

```jsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityState={{ expanded: isExpanded }}
  accessibilityHint="Double tap to see explanation"
>
```


***

### Performance Considerations

**Best Practices for Smooth Animations:**[^12][^37]

- Use `react-native-reanimated` (runs on native thread, not JS thread)
- Avoid `LayoutAnimation` for complex expansions (jank on Android)
- Set `shouldRasterizeIOS={true}` on cards with shadows
- Use `removeClippedSubviews={true}` on FlatList containing cards
- Memoize card components with `React.memo()` to prevent re-renders

**Battery Impact:** Animations at 280ms with native thread = negligible battery drain vs. polling APIs (which Apex OS avoids per PRD).[^6]

***

## 5. ACCESSIBILITY CHECKLIST

### WCAG 2.2 Compliance for Mobile Expandable Content

**Mandatory Requirements:**[^15][^16][^38][^39][^40][^14]

- [ ] **Perceivable:**
    - Color contrast ≥4.5:1 for text on background
    - Text resizable up to 200% without loss of content
    - DOI links have ≥3:1 contrast ratio
- [ ] **Operable:**
    - Tap targets ≥44x44px (iOS) or 48x48px (Android)
    - Keyboard navigation supported (Tab to focus, Enter/Space to toggle)
    - No time limits on reading expanded content
    - Focus trapped within expanded panel until dismissed
- [ ] **Understandable:**
    - Clear heading structure (`<Text accessibilityRole="header">`)
    - Consistent expand/collapse behavior across all cards
    - ARIA labels: `aria-expanded`, `aria-controls`, `aria-labelledby`
- [ ] **Robust:**
    - Compatible with iOS VoiceOver and Android TalkBack
    - Works in both light and dark mode
    - Adapts to system font size settings
    - No content clipping on smaller screens

**Screen Reader Announcements:**

```jsx
accessibilityLabel={`Morning light recommendation. ${isExpanded ? 'Expanded, showing explanation' : 'Collapsed, double tap to expand'}`}
```


***

## 6. CHARACTER LIMITS \& LAYOUT SPECS

### Content Length Guidelines (Per Section)

| Section | Min Chars | Max Chars | Target | Why |
| :-- | :-- | :-- | :-- | :-- |
| **Mechanism** | 80 | 150 | 120 | 1-2 sentences, plain language |
| **Evidence (Citation)** | 60 | 120 | 90 | Author, year, DOI (brief title optional) |
| **Your Data** | 80 | 150 | 120 | User-specific context + correlation |
| **Confidence** | 30 | 60 | 45 | Label + brief explanation |
| **Total** | 250 | 480 | 375 | Fits on mobile without scrolling |

**Why These Limits:**

- Mobile attention span: Users scan, don't read deeply
- "Respect intelligence" brand voice: Concise, not verbose[^6]
- Fits within single card expansion (no internal scrolling needed)

***

### Visual Layout Specs

**Card Dimensions:**

- **Collapsed height:** 64px (header only)
- **Expanded height:** 280-320px (4 sections + padding)
- **Max width:** 100% of screen width - 32px margin (16px each side)
- **Border radius:** 12px (matches Apex OS design system)[^6]
- **Shadow:** `elevation: 2` (Android), `shadowOpacity: 0.1` (iOS)

**Section Spacing:**

- Header padding: 16px vertical, 16px horizontal
- Section padding: 12px vertical, 16px horizontal
- Gap between sections: 8px
- Chevron icon: 24x24px in 48x48px touch area (right-aligned)

**Typography:**

- **Header (nudge title):** 16px, semibold, primary text color
- **Section titles:** 14px, medium, secondary text color
- **Body text:** 14px, regular, primary text color
- **DOI link:** 14px, regular, teal color, underlined
- **Confidence badge:** 12px, medium, badge-specific color

***

## 7. ANIMATION SPECIFICATIONS

### Detailed Timing \& Easing

**Card Expansion Animation:**

```javascript
{
  property: 'height',
  duration: 280,
  easing: Easing.inOut(Easing.ease),
  toValue: isExpanded ? 320 : 64
}
```

**Text Fade-In (Staggered):**

```javascript
{
  property: 'opacity',
  duration: 180,
  delay: 50, // Starts 50ms after height animation
  easing: Easing.in(Easing.ease),
  toValue: isExpanded ? 1 : 0
}
```

**Chevron Rotation:**

```javascript
{
  property: 'rotation',
  duration: 250,
  easing: Easing.out(Easing.ease),
  toValue: isExpanded ? '180deg' : '0deg'
}
```

**Platform-Specific Adjustments:**

- **iOS:** Use `UIViewPropertyAnimator` via native modules for butter-smooth feel
- **Android:** Ensure animations run on native thread (Reanimated 2+)
- **60Hz vs. 120Hz screens:** Animations auto-adapt to refresh rate

***

## 8. CITATION FORMATTING GUIDELINES

### Peer-Reviewed Citation Display

**Standard Format (APA-style for mobile):**

```
Author et al. (Year). Abbreviated Title. DOI: [link]
```

**Example:**

```
Wright et al. (2013). Circadian entrainment. DOI: 10.1016/j.cub.2013.06.039
```

**Interactive Elements:**

- Entire citation is tappable (not just DOI)
- Opens in **in-app browser** (WebView) to keep user in app
- Back button returns to expanded card (state preserved)
- External link icon (↗) next to DOI for clarity

**Mobile-Optimized Citation Display:**[^23][^22]

- Abbreviate title to first 3-4 words if >40 chars
- Use `et al.` for >2 authors
- Make DOI a full URL: `https://doi.org/10.xxxx/xxxxx`
- Color: Teal (`#63E6BE`) for links, underlined
- Tap feedback: 0.7 opacity on press

**Fallback for Missing DOI:**
If no DOI available (rare for peer-reviewed), use PubMed ID or journal URL:

```
Wright et al. (2013). Study name. PMID: 12345678
```


***

## 9. CONFIDENCE LEVEL IMPLEMENTATION

### 3-Tier Confidence System (Detailed)

#### High Confidence (≥0.7)

**Display:**

```
● High confidence
Based on 30+ days of your data
```

**Badge Color:** Teal (`#63E6BE`)
**When:** User has 30+ days of tracked data + strong correlation detected (p<0.05)
**User Impact:** Full recommendation shown, normal nudge priority

#### Medium Confidence (0.4-0.69)

**Display:**

```
● Medium confidence
Based on 7-30 days of your data
```

**Badge Color:** Blue (`#5B8DEF`)
**When:** User has 7-30 days of data OR weak correlation (p<0.10)
**User Impact:** Recommendation shown but with caveats ("Early insight—more data needed")

#### Low Confidence (<0.4)

**Display:** *(Not shown—nudge is suppressed entirely)*
**When:** <7 days of data OR no correlation detected
**User Impact:** Recommendation not surfaced per Apex OS suppression rule \#8[^6]

***

### Calculating Confidence Score (Backend Logic)

**Factors (from PRD):**[^6]


| Factor | Weight | Threshold |
| :-- | :-- | :-- |
| **Data Recency** | 30% | Data from last 7 days vs. 30+ days |
| **Sample Size** | 25% | Number of protocol completions logged |
| **Correlation Strength** | 25% | Pearson r-value + p-value validation |
| **User Engagement** | 10% | Protocol adherence rate (>50% = higher confidence) |
| **Context Match** | 10% | Does calendar/location/weather match protocol trigger conditions? |

**Example Calculation:**

```
Confidence = (0.3 × recency_score) + (0.25 × sample_score) + 
             (0.25 × correlation_score) + (0.1 × engagement_score) + 
             (0.1 × context_score)
```

If `Confidence < 0.4` → Suppress nudge entirely (don't show at all).

***

## 10. APEX OS-SPECIFIC DESIGN SYSTEM INTEGRATION

### Color Palette (From Brand Guide)[^6]

**Dark Mode (Primary):**

```css
Background Primary:   #0F1218 (Deep navy-black)
Background Surface:   #181C25 (Card backgrounds)
Primary Accent:       #63E6BE (Teal - CTAs, highlights)
Secondary Accent:     #5B8DEF (Blue - secondary actions)
Text Primary:         #F6F8FC (White-ish)
Text Secondary:       #A7B4C7 (Muted descriptions)
```

**Light Mode:**

```css
Background Primary:   #FCFCF9 (Cream)
Background Surface:   #FFFFFD (Card backgrounds)
Primary Accent:       #218D8D (Darker teal for contrast)
Text Primary:         #13343B (Slate-900)
Text Secondary:       #626C71 (Slate-500)
```

**Reasoning Panel Styling:**

- **Card background:** `Background Surface` (auto-adapts to light/dark mode)
- **Section dividers:** 1px solid `rgba(167, 180, 199, 0.2)` (subtle)
- **Confidence badge background:** Semi-transparent accent color (15% opacity)
- **DOI link color:** `Primary Accent` (teal)

***

### Brand Voice in Explanations

**Tone Attributes (From Brand Guide):**[^6]

- **Scientific:** Use specific numbers, cite mechanisms
- **Accessible:** Explain jargon in plain language
- **Direct:** No fluff, get to the point
- **Non-patronizing:** Assume user intelligence

**Bad Example:**
> "Great news! Studies show morning light can really help you sleep better. Give it a try!"

**Good Example (Apex OS Voice):**
> "Morning light (10,000 lux within 60 min of waking) advances circadian phase by 0.5-2.7 hours, improving sleep onset."

***

## KEY TAKEAWAYS

### 1. UX Pattern: Inline Expandable Card

- **Format:** Tap-to-expand card (not modal overlay)
- **Animation:** 280ms expansion with ease-in-out
- **Accessibility:** WCAG 2.2 compliant (44x44px tap targets, ARIA labels, keyboard nav)


### 2. Content Structure: 4-Panel Framework

- **Panel 1:** Mechanism (80-120 chars)
- **Panel 2:** Evidence with DOI (60-120 chars)
- **Panel 3:** Your Data (80-150 chars)
- **Panel 4:** Confidence (30-60 chars)
- **Total:** 250-480 chars (target 375)


### 3. Confidence Display: 3-Tier Label System

- **High (≥0.7):** Teal badge, "Based on 30+ days"
- **Medium (0.4-0.69):** Blue badge, "Based on 7-30 days"
- **Low (<0.4):** Suppress entirely (don't show nudge)


### 4. Animation Specs: Native-Thread Performance

- **Expand:** 280ms, ease-in-out
- **Text fade:** 180ms, ease-in, 50ms delay
- **Chevron rotation:** 250ms, ease-out, 180°
- **Technology:** React Native Reanimated 2+


### 5. Citation Formatting: Mobile-Optimized DOI Links

- **Format:** `Author et al. (Year). Title. DOI: [link]`
- **Clickable:** Full citation is tappable, opens in-app browser
- **Color:** Teal, underlined, external link icon (↗)


### 6. Competitive Advantage: Evidence Citations

- **WHOOP, Oura, others:** No peer-reviewed citations
- **Apex OS:** Every recommendation includes DOI link
- **Target audience:** Huberman listeners expect "show me the study"


### 7. Accessibility: WCAG 2.2 Mobile Compliance

- Tap targets ≥44x44px (iOS) / 48x48px (Android)
- Screen reader support (VoiceOver, TalkBack)
- Keyboard navigation (Tab, Enter, Space)
- Color contrast ≥4.5:1 for text, ≥3:1 for UI


### 8. Character Limits: Respect Mobile Attention

- Keep each section <150 chars
- Total "Why?" panel: 250-480 chars
- No internal scrolling needed (fits on screen)

***

## NEXT STEPS / ACTION ITEMS

### Immediate (This Sprint)

1. **Build React Native expandable card component** using Reanimated 2
2. **Design 3-tier confidence badge system** (High/Medium/Low with colors)
3. **Create DOI link formatter** (convert raw DOI to clickable `https://doi.org/` URL)
4. **Test animations on 60Hz and 120Hz devices** (iOS + Android)

### Short-Term (Next 2 Sprints)

5. **Implement accessibility testing** with VoiceOver and TalkBack
6. **Build confidence score calculator** (backend Cloud Function with 5-factor weighting)
7. **Populate Protocol Library with DOI citations** (verify all 18 protocols have peer-reviewed sources)
8. **A/B test character limits** (250 vs. 375 vs. 480 chars) for user comprehension

### Long-Term (Pre-Launch)

9. **User testing with target audience** (Huberman listeners, WHOOP/Oura users)
10. **Refine confidence thresholds** based on early user data (adjust 0.4/0.7 cutoffs if needed)
11. **Build in-app citation library** (saved DOIs for later reference)
12. **Monitor DOI link click-through rates** (do users actually verify citations?)

***

## APPENDIX: RECOMMENDED REACT NATIVE COMPONENT STRUCTURE

### File Structure

```
/client/src/components/
├── ReasoningPanel/
│   ├── ReasoningPanel.tsx          # Main expandable card
│   ├── MechanismSection.tsx        # Panel 1
│   ├── EvidenceSection.tsx         # Panel 2 (DOI link)
│   ├── YourDataSection.tsx         # Panel 3 (personalized)
│   ├── ConfidenceBadge.tsx         # Panel 4 (3-tier)
│   ├── styles.ts                   # Shared styles
│   └── animations.ts               # Reanimated configs
```


### TypeScript Interface

```typescript
interface ReasoningPanelProps {
  nudgeId: string;
  mechanism: string;        // 80-120 chars
  citation: {
    authors: string;
    year: number;
    title: string;
    doi: string;
  };
  userData: string;         // 80-150 chars
  confidence: number;       // 0.0-1.0
  isExpanded: boolean;
  onToggle: () => void;
}
```


***

**Report End.** This research defines best practices for reasoning transparency UX in wellness apps as of December 2025, with specific implementation guidance for Apex OS's "Why?" layer feature.
<span style="display:none">[^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63]</span>

<div align="center">⁂</div>

[^1]: https://michaelkummer.com/oura-ring-review/

[^2]: https://www.menshealth.com/uk/health/a69470032/whoop-5-review/

[^3]: BRAND_GUIDE.md

[^4]: https://www.sportsmith.co/articles/whoop-vs-oura-ring-real-life-data-analysis-and-comparisons/

[^5]: https://www.reddit.com/r/ouraring/comments/1h418mf/came_from_whoop_first_thoughts/

[^6]: APEX_OS_PRD_FINAL_v6.md

[^7]: https://salsa.digital/insights/accordion-ui-design-examples-inspiration-tips-and-best-practices

[^8]: https://www.eleken.co/blog-posts/accordion-ui

[^9]: https://uxpatterns.dev/patterns/content-management/accordion

[^10]: https://www.zdnet.com/article/changing-this-one-setting-on-my-android-phone-doubled-the-speed-literally/

[^11]: https://www.reddit.com/r/Android/comments/10alioo/android_tip_how_to_change_animation_speeds_and/

[^12]: https://educationalvoice.co.uk/animation-for-mobile-app/

[^13]: https://nextnative.dev/blog/mobile-app-ui-design-best-practices

[^14]: https://www.levelaccess.com/blog/wcag-for-mobile-apps/

[^15]: https://www.audioeye.com/post/does-wcag-apply-to-mobile-apps/

[^16]: https://www.accessibility.works/blog/ada-wcag-compliance-standards-guide-mobile-apps/

[^17]: https://www.eleken.co/blog-posts/ai-transparency

[^18]: https://arxiv.org/html/2507.23535v1

[^19]: https://www.uxmatters.com/mt/archives/2025/04/designing-ai-user-interfaces-that-foster-trust-and-transparency.php

[^20]: https://shelf.io/blog/ai-transparency-and-explainability/

[^21]: https://adamfard.com/blog/explainable-ai

[^22]: https://www.sourcely.net/post/citation-management-apps-for-mobile-research-on-the-go

[^23]: https://paperpile.com/s/scientific-phone-apps-and-mobile-devices-citation-style/

[^24]: https://www.matrixnmedia.com/top-5-mobile-ui-ux-design-trends-to-watch-in-2025/

[^25]: https://blog.appliedinnovationexchange.com/exploring-generative-ai-ux-patterns-defining-the-rules-of-interaction-a6d5aeb80d3b

[^26]: https://catalogue.projectsbyif.com/patterns/show-confidence/

[^27]: https://www.koruux.com/ai-patterns-for-ui-design/

[^28]: https://blog.cloudflare.com/pl-pl/confidence-score-rubric/

[^29]: https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/concepts/confidence-score

[^30]: https://www.nngroup.com/articles/ai-hallucinations/

[^31]: https://www.infrrd.ai/blog/confidence-scores-in-llms

[^32]: https://www.youtube.com/watch?v=CwlWdJkpzSY

[^33]: https://stackoverflow.com/questions/71595404/how-to-expand-card-onpress-react-native

[^34]: https://www.youtube.com/watch?v=NzrJJLSbWf8

[^35]: https://dev.to/dimaportenko/collapsible-card-with-react-native-reanimated-495a

[^36]: https://blog.logrocket.com/building-react-native-collapsible-accordions/

[^37]: https://www.justinmind.com/ui-design/mobile-app-animations

[^38]: https://accessibilitypartners.ca/mobile-app-accessibility-guidelines/

[^39]: https://www.w3.org/TR/WCAG21/

[^40]: https://www.w3.org/WAI/standards-guidelines/mobile/

[^41]: COMPETITIVE_ANALYSIS.md

[^42]: https://www.chopdawg.com/ui-ux-design-trends-in-mobile-apps-for-2025/

[^43]: https://uxcam.com/blog/mobile-ux/

[^44]: https://www.garagegymreviews.com/whoop-vs-oura

[^45]: https://baymard.com/blog/mobile-ux-ecommerce

[^46]: https://trends.uxdesign.cc

[^47]: https://www.cosmopolitan.com/health-fitness/a61975698/oura-ring-vs-whoop-tracker/

[^48]: https://lumenalta.com/insights/explainable-ai-in-design

[^49]: https://adamfard.com/blog/ai-ux-design

[^50]: https://www.linkedin.com/pulse/comprehensive-guide-sleep-trackers-whoop-oura-garmin-matt-beedle-ovnde

[^51]: https://blog.logrocket.com/ux-design/accordion-ui-design/

[^52]: https://www.youtube.com/watch?v=DQX011V9VrI

[^53]: https://stackoverflow.com/questions/4946295/android-expand-collapse-animation

[^54]: https://blog.prototypr.io/designing-the-accordion-best-practices-3c1bd54bf26e

[^55]: https://www.nngroup.com/articles/accordions-on-desktop/

[^56]: https://www.ultralytics.com/glossary/confidence

[^57]: https://www.documind.chat/blog/citation-management-tools

[^58]: https://fourwaves.com/blog/apps-for-researchers/

[^59]: https://www.papersapp.com

[^60]: https://www.reddit.com/r/reactnative/comments/9wfeo3/recreating_ios_app_store_expanding_cards_in_react/

[^61]: https://algonquincollege.libguides.com/c.php?g=488529\&p=5067337

[^62]: https://apps.apple.com/ca/app/citer-paper-format-citation/id6480121473

[^63]: https://www.waldo.com/blog/react-native-card

