# Apex — Complete Design System Guide
*Version 2.0 | November 2025*  
*Purpose: Teach AI/designers optimal design practices for the Apex mobile application*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Philosophy & Brand Identity](#design-philosophy--brand-identity)
3. [Color Psychology & Palette](#color-psychology--palette)
4. [Typography System](#typography-system)
5. [Layout & Spacing](#layout--spacing)
6. [Iconography & Visual Elements](#iconography--visual-elements)
7. [Navigation Patterns](#navigation-patterns)
8. [Microinteractions & Animations](#microinteractions--animations)
9. [Data Visualization](#data-visualization)
10. [Accessibility Standards](#accessibility-standards)
11. [Responsive Design](#responsive-design)
12. [Best Practices Checklist](#best-practices-checklist)

---

## Executive Summary

**Apex is a professional, evidence-based health optimization platform** — not a gamified fitness app. The design must balance **credibility with engagement**, **clinical clarity with warmth**, and **data-driven insights with emotional connection**.

### Design Positioning

**We are:** Whoop (data-driven) + Headspace (trustworthy) + Noom (behavioral science)  
**We are NOT:** Duolingo (playful gaming) or generic fitness trackers

### Core Design Principles

1. **Professional, Not Playful** — Health outcomes over game mechanics
2. **Calm, Not Chaotic** — Minimal visual noise, generous white space
3. **Evidence-First** — Citations, data visualizations, and transparent reasoning
4. **Accessible by Default** — WCAG 2.1 AA compliance minimum
5. **Dark Mode Native** — Optimized for evening use (primary use case)

### Brand Identity

**Name:** Apex  
**Tagline:** "Peak health, evidence-based."  
**Essence:** Reaching the apex (highest point) of human performance through evidence-based protocols and AI-powered coaching.

---

## Design Philosophy & Brand Identity

### Brand Personality

**Voice Attributes:**
- **Credible** — Backed by peer-reviewed research (Huberman Lab alignment)
- **Professional** — Wellness coach, not fitness buddy
- **Empowering** — User autonomy, no guilt or shame
- **Modern** — Clean, sophisticated, contemporary aesthetic
- **Peak Performance** — Aspiration without elitism

**Design Inspiration Benchmarks:**
- **Whoop** — Data-first dashboards, health metrics emphasis
- **Headspace** — Calming aesthetics, professional polish
- **Apple Health** — Clean information architecture, minimal visual language
- **Oura** — Sophisticated dark UI, premium feel
- **Linear** — Modern SaaS product quality, precision design

### Visual Language Strategy

**Minimalist-Professional Hybrid:**
- Clean layouts with generous white space (40-60% of screen real estate)
- Data visualization as hero element (charts, trends, rings)
- Selective use of depth (subtle shadows, layering)
- No excessive ornamentation or decoration

**Emotional Tone:**
- **Calm & Reassuring** — Reduce health anxiety through design
- **Aspirational** — Premium feel without elitism
- **Trustworthy** — Transparency in AI recommendations and citations
- **Peak-Focused** — Every design element reinforces optimization journey

---

## Color Psychology & Palette

### Primary Color Strategy

**Healthcare Color Psychology Research Findings:**
- **Blue:** Most trusted color in healthcare (78% patient preference), associated with calm, professionalism, trust
- **Green:** Healing, balance, progress, nature (especially effective for wellness/fitness apps)
- **White/Light Gray:** Clinical clarity, cleanliness, simplicity

### Official Color Palette

#### Light Mode (Default for Onboarding & Daytime)

**Primary Colors:**
- **Deep Blue (#2D5A8C)** — Trust, calm, primary actions
  - Use: Primary buttons, headers, key data points
  - Psychology: Lowers blood pressure and heart rate, promotes relaxation
  
- **Teal/Mint (#00BFA5)** — Growth, wellness, accent
  - Use: Progress indicators, success states, secondary actions
  - Psychology: Balance between calming blue and energizing green

**Supporting Colors:**
- **Success Green (#4CAF50)** — Health improvement, positive trends
- **Alert Amber (#FFA726)** — Gentle warnings (NOT red alarms)
- **Background White (#FFFFFF)** — Clinical clarity
- **Neutral Gray (#F5F5F5)** — Secondary backgrounds
- **Text Charcoal (#212121)** — High contrast, readable

#### Dark Mode (Primary Use Case for Evening/Night)

**Why Dark Mode for Apex:**
- Primary use case: Evening protocol tracking (7pm-11pm)
- Reduces blue light exposure before sleep (aligns with sleep optimization mission)
- 60% higher user retention in healthcare apps with dark mode (research)
- Battery savings on OLED screens (15-67% depending on brightness)

**Dark Mode Palette:**
- **Background Deep Navy (#1A1F2E)** — Sophisticated, not pure black
- **Surface Elevated Gray (#2C3240)** — Cards, elevated elements
- **Primary Teal (#00D4B5)** — Brighter accent for dark backgrounds
- **Text Off-White (#E8E8E8)** — Softer than pure white, reduces eye strain
- **Secondary Text Gray (#B0B3B8)** — Lower hierarchy information

**Dark Mode Implementation Best Practices:**
1. **Avoid Pure Black (#000000)** — Use deep navy/charcoal for warmth
2. **Increase Color Saturation** — Colors need 10-15% more saturation in dark mode
3. **Reduce Contrast for Body Text** — Use off-white (#E8E8E8) not pure white
4. **Elevate with Layers** — Use subtle gray tones (#2C3240, #353A48) for depth
5. **Test at 30% Brightness** — Most users don't use 100% brightness

### Color Usage Guidelines

**Do's:**
- Use blue/teal for trust and calm
- Reserve green for health improvements and positive trends
- Use amber (not red) for gentle reminders
- Maintain 4.5:1 contrast ratio minimum (WCAG AA)
- Test colors with color-blind simulation tools

**Don'ts:**
- Avoid bright reds (anxiety-inducing, clinical alarm associations)
- No neon or overly saturated colors
- Don't use color as the only indicator (accessibility requirement)
- Avoid more than 3-4 colors on a single screen

---

## Typography System

### Font Family Selection

**Recommended Font Stack:**

**Primary (UI & Body):**
- **SF Pro / Inter / Roboto** — System fonts, excellent legibility
- Reasoning: Native to platform, optimized for screens, professional
- Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Data/Metrics (Monospace):**
- **SF Mono / Roboto Mono** — Tabular figures for data alignment
- Use: Health metrics, numbers, timestamps

**Why Sans-Serif Only:**
- Superior screen legibility at all sizes
- Modern, clean, professional aesthetic
- Better accessibility for users with dyslexia
- Aligns with healthcare app best practices (80% of top health apps use sans-serif)

### Type Scale & Hierarchy

**Mobile Typography Scale (iOS/Android):**

```
Display Large:     32px / 2rem (module headers, rare use)
Heading 1:         24px / 1.5rem (screen titles)
Heading 2:         20px / 1.25rem (section headers)
Heading 3:         18px / 1.125rem (card titles)
Body Large:        16px / 1rem (primary body text, CTA buttons)
Body Regular:      14px / 0.875rem (standard body text)
Body Small:        12px / 0.75rem (captions, metadata)
Caption:           11px / 0.6875rem (legal text, least important info)
```

**Font Weight System:**
- **Bold (700):** Headings, key data points, emphasis
- **Semi-Bold (600):** Subheadings, labels, "Apex" wordmark
- **Medium (500):** Body text, default for most content
- **Regular (400):** Secondary text, less important information

### Typography Best Practices

**Line Height & Spacing:**
- **Headings:** 1.2x line height (tighter for impact)
- **Body Text:** 1.5x line height (optimal readability)
- **Minimum Touch Target:** 44px height for buttons (iOS HIG)
- **Paragraph Spacing:** 16-24px between paragraphs

**Accessibility Requirements:**
- **Minimum Body Text:** 14px (16px preferred for accessibility)
- **Maximum Line Length:** 60-80 characters per line
- **Text Scaling:** Support Dynamic Type (iOS) and Font Scaling (Android)
- **Contrast:** 4.5:1 for body text, 3:1 for large text (WCAG AA)

**Usage Guidelines:**
```
✅ DO:
- Use sentence case for body text and labels
- Use Title Case for screen titles and buttons
- Left-align text (never center-align paragraphs)
- Reserve ALL CAPS for short labels only (e.g., "NEW")
- Use consistent font sizes for similar elements

❌ DON'T:
- Mix more than 3 font sizes on one screen
- Use font size alone to create hierarchy
- Use italics for long text (reduces legibility)
- Use text smaller than 12px for any interactive element
- Use light font weights on dark backgrounds (reduces contrast)
```

---

## Layout & Spacing

### Grid System

**8px Base Grid:**
- All spacing increments in multiples of 8px (8, 16, 24, 32, 40, 48...)
- Reasoning: Divisible by 2 and 4, scales consistently across devices
- Exception: 4px for fine-tuning icon alignment

**Spacing Scale:**
```
XXS: 4px   — Icon padding, fine adjustments
XS:  8px   — Tight spacing (chips, small elements)
S:   16px  — Standard element spacing
M:   24px  — Section spacing, card padding
L:   32px  — Major section breaks
XL:  48px  — Screen-level padding
XXL: 64px  — Hero section spacing
```

### Screen Layout Patterns

#### Safe Areas & Margins

**Mobile Screen Margins:**
- **Side Margins:** 16-24px (depending on device size)
- **Top/Bottom Safe Area:** Follow platform guidelines (notch/home indicator)
- **Card Inner Padding:** 16-20px
- **List Item Padding:** 16px horizontal, 12px vertical

#### Content Density

**Information Hierarchy (Top to Bottom):**
1. **Hero Section** (above fold) — Primary metric or daily schedule
2. **Primary Content** — Key actions, important data
3. **Secondary Content** — Supporting information, additional features
4. **Tertiary Content** — Settings, help, less-used features

**White Space Philosophy:**
- **Generous White Space = Professional Health App**
- Target: 40-50% of screen should be white space
- Use white space to group related elements
- Avoid cramming multiple actions into limited space

### Card & Container Design

**Card System:**
```
Primary Card:
- Border Radius: 12-16px (modern, friendly)
- Shadow: Subtle (0-2px offset, 4-8px blur, 10-15% opacity)
- Padding: 16-20px
- Background: White (light mode) or #2C3240 (dark mode)

Secondary Card:
- Border Radius: 8-12px
- No shadow (uses background color differentiation)
- Padding: 12-16px
```

**Elevation Layers:**
- **Base (0dp):** App background
- **Low (2dp):** Cards, list items
- **Medium (4dp):** Buttons, input fields (on press)
- **High (8dp):** Modals, dialogs, floating action buttons

---

## Iconography & Visual Elements

### Icon System

**Icon Style:**
- **Line Icons (Outlined)** — Professional, clean, modern
- Reasoning: Better than filled icons for health apps (more clinical, less playful)
- **Stroke Weight:** 1.5-2px (consistent across all icons)
- **Corner Radius:** Subtle rounding (not sharp corners, not overly rounded)

**Recommended Icon Libraries:**
- **Feather Icons** — Minimal, consistent, professional
- **Heroicons** — Modern, clean, well-designed
- **SF Symbols (iOS)** — Native, accessible, optimized

**Icon Sizes:**
```
Small:  16px — Inline with text, badges
Medium: 24px — Standard UI icons (navigation, actions)
Large:  32px — Feature icons, onboarding
Hero:   48-64px — Empty states, success/error screens
```

### Icon Usage Guidelines

**Color & States:**
- **Default State:** Secondary text color (#777 light, #B0B3B8 dark)
- **Active State:** Primary color (#2D5A8C or #00BFA5)
- **Disabled State:** 40% opacity
- **Interactive Icons:** 44x44px touch target minimum

**Icon + Text Pairing:**
- **Horizontal Spacing:** 8-12px between icon and label
- **Vertical Alignment:** Center-align icon with first line of text
- **Icon First:** Place icon before text (left-to-right languages)

### Imagery Guidelines

**Photography Style:**
- **Minimal Use** — Apex is data-first, not image-heavy
- **When Used:** Authentic, diverse, lifestyle photography (not stock)
- **Treatment:** Subtle overlay (5-15% dark overlay) for text legibility
- **Avoid:** Overly posed, clinical, or sterile imagery

**Illustrations:**
- **Minimal & Functional** — Use only for empty states or onboarding
- **Style:** Line art, simple shapes, consistent with icon system
- **Color:** Limited palette (primary + 1-2 accent colors)

---

## Navigation Patterns

### Bottom Navigation Bar

**Why Bottom Nav:**
- **Thumb-Friendly:** 85% of users hold phones one-handed
- **Industry Standard:** Used by Whoop, Apple Health, Headspace
- **Reachability:** Critical on large screens (6"+ displays)

**Bottom Nav Structure (4-5 tabs max):**
```
1. Home (Dashboard)    — Primary health dashboard
2. Protocols           — Browse available protocols
3. Insights            — Data trends, weekly reports
4. Profile             — Settings, preferences, account
```

**Bottom Nav Design:**
- **Tab Height:** 56-64px
- **Icon Size:** 24px
- **Label:** Optional (icon + text preferred for clarity)
- **Active State:** Primary color + label bold
- **Inactive State:** Gray with 60% opacity

### Top Navigation

**Top Bar Elements:**
- **Left:** Back button or "Apex" logo (context-dependent)
- **Center:** Screen title (optional, use judiciously)
- **Right:** Actions (1-2 icons max — settings, AI coach, notifications)

**AI Coach Quick Access:**
- **Position:** Top-right corner, persistent across screens
- **Icon:** Sparkle/AI icon + badge for new insights
- **Behavior:** Opens bottom sheet modal (iOS) or full-screen overlay (Android)

### Contextual Navigation

**Entry Points for AI Coach Chat:**
1. **Persistent Top Bar** — Always accessible
2. **Contextual Cards** — "Ask AI Coach about this trend" on insights
3. **Protocol Details** — "Questions about this protocol?" button
4. **Low Recovery Alerts** — "Ask AI Coach why" button

---

## Microinteractions & Animations

### Animation Philosophy

**Professional Health App Animation Guidelines:**
- **Subtle, Not Showy** — Animations serve function, not spectacle
- **Fast, Not Slow** — 200-300ms standard, 100-150ms for quick feedback
- **Natural, Not Mechanical** — Use easing curves (ease-out, ease-in-out)

### Standard Animations

**Loading States:**
- **Skeleton Screens** — Gray placeholder blocks (preferred over spinners)
- **Progress Indicators** — Linear bars for defined processes
- **Spinners:** Only for indefinite waits (avoid when possible)

**Transitions:**
```
Screen Transitions:     300-400ms ease-out
Modal Appearance:       250ms ease-out (slide up from bottom)
Card Expand:            200ms ease-in-out
Button Press:           100ms (haptic feedback + scale 0.95x)
Data Updates:           200ms fade + slide
```

### Haptic Feedback

**iOS Haptic Engine Usage:**
- **Success (protocol completed):** Light impact haptic
- **Warning (streak at risk):** Medium impact haptic
- **Error:** Notification error haptic
- **Button Press:** Selection haptic (subtle)

**When to Use Haptics:**
✅ Confirming important actions (protocol log, goal set)  
✅ Celebrating milestones (streak reached, badge earned)  
✅ Gentle reminders (nudge received)  
❌ Every button tap (overwhelming)  
❌ Passive data updates (annoying)

### Celebratory Moments (Minimal, Professional)

**Protocol Completion:**
- ✅ Simple checkmark fade-in (200ms)
- ✅ Subtle green glow pulse (400ms)
- ✅ Light haptic feedback
- ❌ Confetti, explosions, over-the-top animations

**Streak Milestones (7, 30, 100 days):**
- ✅ Badge slide-in notification (300ms)
- ✅ Gentle pulsing flame icon
- ❌ Full-screen takeovers, forced interruptions

**Health Metric Improvements:**
- ✅ Upward trending arrow animation
- ✅ Number count-up animation (800ms)
- ❌ Flashing, strobing, distracting effects

---

## Data Visualization

### Chart Types & Usage

**Primary Chart Types:**

**Line Charts:**
- **Use:** Time-series data (HRV trends, sleep quality over 7-30 days)
- **Style:** Smooth curves (not jagged), subtle gradient fill below line
- **Color:** Single color (teal/blue) with 20% opacity fill
- **Grid:** Minimal horizontal lines only, no vertical lines
- **Y-Axis:** Left-aligned labels, right-aligned values

**Ring/Circular Progress:**
- **Use:** Daily adherence percentage, module progress
- **Style:** Open ring (not closed circle), 4-6px stroke width
- **Color:** Gradient from primary to accent (teal to light teal)
- **Center Value:** Large, bold number (e.g., "67%")

**Bar Charts:**
- **Use:** Weekly protocol completion, comparative data
- **Style:** Rounded corners (4px), consistent spacing (8px gap)
- **Color:** Single color with hover/active state differentiation
- **Max Bars:** 7 (daily week view) or 12 (monthly view)

### Data Visualization Best Practices

**General Guidelines:**
```
✅ DO:
- Use consistent colors across all charts
- Animate data updates (200-300ms ease-out)
- Provide context (comparison to last week, average, goal)
- Show data labels on hover/tap
- Use empty states with helpful copy ("Start tracking to see trends")

❌ DON'T:
- Use more than 3 colors in a single chart
- Distort axes (start Y-axis at 0 when appropriate)
- Overload with data points (aggregate when necessary)
- Use 3D effects or skeuomorphism
- Animate charts on every view (only on first load or data change)
```

**Accessibility for Charts:**
- Provide text alternatives (data table view option)
- Use patterns + colors (not color alone)
- Ensure 3:1 contrast for chart elements
- Support VoiceOver/TalkBack announcements

---

## Accessibility Standards

### WCAG 2.1 Compliance (AA Minimum)

**Contrast Requirements:**
- **Body Text:** 4.5:1 contrast ratio minimum
- **Large Text (18px+):** 3:1 contrast ratio minimum
- **UI Components:** 3:1 contrast ratio (buttons, input borders)

**Color Accessibility:**
- Never use color as the only indicator
- Provide text labels, icons, or patterns in addition to color
- Test with color-blind simulation (Deuteranopia, Protanopia, Tritanopia)

### Touch Target Sizes

**Minimum Sizes (iOS & Android):**
- **Primary Actions:** 44x44px (iOS HIG) / 48x48dp (Material Design)
- **Secondary Actions:** 32x32px minimum
- **Inline Links:** 44px height, full-width tap area

**Spacing Between Targets:**
- **Minimum:** 8px clear space between adjacent tap targets
- **Preferred:** 16px for critical actions

### Dynamic Type & Font Scaling

**iOS Dynamic Type Support:**
- Support all 7 default text sizes (XS to XXXL)
- Test at largest accessibility size (310% scale)
- Ensure UI doesn't break at extreme sizes

**Android Font Scaling:**
- Support system font scaling (0.85x to 2.0x)
- Use `sp` units for text, `dp` for spacing
- Test at 200% scaling minimum

### Screen Reader Support

**VoiceOver (iOS) / TalkBack (Android):**
- Provide meaningful labels for all interactive elements
- Group related content (e.g., health metric + value + trend)
- Announce state changes (e.g., "Protocol completed")
- Ensure logical focus order (top to bottom, left to right)

**Accessibility Labels Examples:**
```
❌ BAD:  "Button" or "Icon"
✅ GOOD: "Complete Morning Light protocol"

❌ BAD:  "58ms"
✅ GOOD: "Heart rate variability: 58 milliseconds, up 3 from yesterday"

❌ BAD:  "Graph"
✅ GOOD: "Sleep quality trend: 7-day average 85%, up 12% from last week"
```

---

## Responsive Design

### Breakpoints & Device Support

**Target Devices:**
- **Small Phones:** 320-375px width (iPhone SE, older Android)
- **Standard Phones:** 375-414px width (iPhone 12-15, Pixel)
- **Large Phones:** 414-428px width (iPhone Pro Max, Galaxy S series)
- **Tablets:** 768px+ width (iPad, Android tablets)

**Responsive Strategies:**
- **Mobile-First Approach** — Design for smallest screen, scale up
- **Flexible Grids** — Use percentage widths, not fixed pixels
- **Scalable Typography** — Use `rem` or `sp` units
- **Adaptive Layouts** — Change layout structure at tablet breakpoint

### Orientation Support

**Portrait (Primary):**
- 95% of health app usage is in portrait mode
- Optimize all screens for vertical scrolling
- Bottom navigation remains accessible

**Landscape (Secondary):**
- Support landscape for charts/data visualization
- Hide or collapse bottom navigation
- Expand chart height to utilize full screen

### Platform-Specific Considerations

**iOS Design Patterns:**
- Use native navigation patterns (back swipe gesture)
- SF Pro font family (system default)
- Bottom sheet modals for contextual actions
- Haptic feedback for confirmations

**Android Design Patterns:**
- Material Design 3 principles
- Roboto font family (system default)
- Floating Action Button for primary action (optional)
- Material ripple effects on tap

**Cross-Platform Consistency:**
- Maintain brand color palette across platforms
- Use consistent iconography (avoid platform-specific icons)
- Adapt navigation patterns to platform conventions
- Test on both iOS and Android devices

---

## Best Practices Checklist

### Design Handoff Checklist

**Visual Design:**
- [ ] All screens designed for both light and dark mode
- [ ] Color contrast tested and meets WCAG AA standards
- [ ] Typography scale applied consistently
- [ ] Spacing follows 8px grid system
- [ ] Interactive states defined (default, hover, pressed, disabled, active)

**Components:**
- [ ] Reusable components documented in design system
- [ ] Icon set complete and exported at all required sizes
- [ ] Button styles defined for primary, secondary, tertiary actions
- [ ] Input field states documented (empty, filled, error, disabled)
- [ ] Modal and overlay patterns specified

**Interactions:**
- [ ] Animation timings and easing curves specified
- [ ] Haptic feedback moments identified
- [ ] Loading states designed (skeleton screens, spinners)
- [ ] Error states and messaging defined
- [ ] Success confirmations designed

**Accessibility:**
- [ ] Touch targets meet 44x44px minimum
- [ ] Color is not the only indicator for status/information
- [ ] Text alternatives provided for charts and images
- [ ] Focus order logical and intuitive
- [ ] Dynamic Type/Font Scaling support confirmed

**Documentation:**
- [ ] Design tokens exported (colors, typography, spacing)
- [ ] Component usage guidelines written
- [ ] Platform-specific notes documented (iOS vs Android differences)
- [ ] Edge cases addressed (long text, empty states, error states)
- [ ] Design system maintained in Figma/Sketch with version control

### Development Collaboration

**Assets Export:**
- **Icons:** SVG format (vector, scalable)
- **Images:** 2x and 3x resolution (iOS), xxhdpi and xxxhdpi (Android)
- **Fonts:** Include font files if using custom fonts
- **Colors:** Hex codes + RGB values for consistency

**Design-Dev Communication:**
- Annotate designs with measurements (padding, margins, sizes)
- Specify animation durations and easing curves
- Document conditional logic (show/hide states)
- Provide Zeplin/Figma links with inspect mode enabled

---

## Conclusion

This design system balances **professional credibility** with **user engagement**, **data clarity** with **emotional warmth**, and **evidence-based design** with **intuitive usability**.

**Key Takeaways:**
1. **Professional Over Playful** — This is a wellness coach, not a game
2. **Dark Mode First** — Optimized for evening use (primary use case)
3. **Data-Driven Dashboards** — Health metrics as hero elements
4. **Minimal Animations** — Subtle, functional, never distracting
5. **Accessibility by Default** — WCAG AA compliance is non-negotiable

**Design Success Metrics:**
- User can complete primary task (log protocol) in < 3 taps
- 90% of screens readable at WCAG AAA contrast (7:1)
- All animations complete in < 300ms
- 100% of screens support Dynamic Type/Font Scaling
- Zero accessibility violations in automated testing

---

**Document Version:** 2.0  
**Last Updated:** November 2025  
**App Name:** Apex  
**Brand Identity:** Peak health, evidence-based  
**Maintained By:** Apex Design Team

---

*This guide is a living document. Update as design patterns evolve and user feedback is incorporated.*