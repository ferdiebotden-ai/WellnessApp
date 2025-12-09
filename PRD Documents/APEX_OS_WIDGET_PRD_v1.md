# APEX OS FEATURE PRD: Lock Screen & Widget System
## Evidence Made Effortless — Ambient Surfaces Extension

**Version:** 1.1
**Date:** December 7, 2025
**Status:** Phase 2+ (Post-MVP)
**Parent Document:** APEX_OS_PRD_v8.1.md
**Implements:** Part 9.5 Widgets & Ambient Surfaces

---

## PART 0: Agent Instructions

### 0.1 Document Purpose
This Feature PRD extends the Morning Anchor experience (PRD v8.1 Part 4.1) to native widget surfaces. It specifies lock screen widgets, home screen widgets, StandBy mode, and Live Activities for iOS/Android platforms.

### 0.2 Dependencies
Before implementing this feature, ensure:
- [ ] Morning Anchor core logic complete (PRD v8.1 Part 4.1)
- [ ] Recovery Score calculation implemented (PRD v8.1 Part 4.1)
- [ ] Nudge Suppression Engine active (PRD v8.1 Part 2.3)
- [ ] User preferences schema includes widget settings

### 0.3 Critical Rules
| Rule | Why It Matters |
|------|----------------|
| Use EXACT brand colors (#63E6BE, #0F1218, etc.) | Visual consistency across all surfaces |
| Recovery Score formula MUST match PRD v8.1 | Data consistency with main app |
| Respect 9-rule suppression engine | Widget actions trigger nudge logic |
| NO cheerleader copy | "Recovery 34%" NOT "Great job checking in!" |
| Evidence citations on tap | Core differentiator — even in widgets |

---

## PART 1: Strategic Context

### 1.1 Why Widgets Matter for Apex OS
Widgets are **ambient retention infrastructure**. Our target user (The Optimizer) checks their phone 50-150× daily. Lock screen widgets create:
- **Passive awareness** — Recovery score visible without app open
- **Habit formation** — Daily glance → daily engagement
- **Competitive differentiation** — WHOOP/Oura show data; Apex shows what to DO

### 1.2 Widget Philosophy
| Principle | Implementation |
|-----------|----------------|
| Operating System, Not App | Widgets feel like native OS health infrastructure |
| Evidence Made Effortless | Tap any metric → see WHY with citation |
| Respect Intelligence | Progress Infrastructure approach—factual consistency indicators, not extrinsic manipulation (see PRD v8.1 Part 2.2) |
| Ambient, Not Annoying | Widget refreshes ≤5×/day; no animations |

### 1.3 Competitive Gap
| Competitor | Widget Approach | Apex OS Advantage |
|------------|-----------------|-------------------|
| WHOOP | Recovery %, Strain % (descriptive) | **Prescriptive**: "Recovery 34%. Foundation only." |
| Oura | Sleep/Readiness scores (descriptive) | **Actionable**: "Morning Light ready. Tap to start." |
| Apple Fitness | Activity rings (gamified) | **Evidence-based**: No rings, no streaks — just protocols |

---

## PART 2: Widget Specifications

### 2.1 iOS Lock Screen Widget (Primary Surface)

#### 2.1.1 Widget Family: Accessory Rectangular
**Size:** 176×52 points (above or below time)
**Placement:** Lock screen widget slot (iOS 16+)

#### 2.1.2 Layout Specification
┌─────────────────────────────────────────────┐
│ [Recovery Icon] 72% │ ☀️ Morning Light │
│ Full Protocol Day │ Ready │
└─────────────────────────────────────────────┘

text

**Left Zone (Recovery State):**
- Recovery percentage (from PRD v8.1 formula)
- Status label: "Full Protocol Day" / "MVD Active" / "Recovery Focus"

**Right Zone (Next Action):**
- Protocol icon (SF Symbol)
- Protocol short name
- State: "Ready" / "In Progress" / "Complete"

#### 2.1.3 Visual Design (Exact Brand Specs)
| Element | Value | Notes |
|---------|-------|-------|
| Background | Transparent (system blur) | iOS lock screen standard |
| Text Primary | #F6F8FC | Recovery %, protocol name |
| Text Secondary | #A7B4C7 | Status labels |
| Accent (Good) | #63E6BE | Recovery ≥70% |
| Accent (Caution) | #EFBF5B | Recovery 40-69% |
| Accent (Low) | #EF6B6B | Recovery <40% |
| Font | SF Pro Text | System default for widgets |
| Icon Size | 16×16 points | SF Symbols only |

#### 2.1.4 Recovery State Mapping
| Recovery Score | Color | Left Label | Right Action |
|----------------|-------|------------|--------------|
| 70-100% | #63E6BE | "Full Protocol Day" | Next scheduled protocol |
| 40-69% | #EFBF5B | "Balanced Day" | Foundation protocols only |
| <40% | #EF6B6B | "MVD Active" | Morning Light only |
| No Data | #6C7688 | "Sync Required" | "Connect Wearable" |

#### 2.1.5 Tap Action
- **Default:** Deep link to Morning Anchor screen in app
- **If protocol ready:** Deep link to protocol detail with "Start" pre-focused
- **URL Scheme:** `apexos://morning-anchor` or `apexos://protocol/{protocol-id}`

#### 2.1.6 Refresh Strategy
| Trigger | Budget Impact | Priority |
|---------|---------------|----------|
| App foreground | 0 (unlimited) | Always refresh |
| Wake detection (wearable sleepEnd) | 1 | Critical |
| Protocol completion | 1 | High |
| 6 AM daily | 1 | Scheduled |
| 12 PM daily | 1 | Scheduled |
| 6 PM daily | 1 | Scheduled |
| **Total Daily Budget** | **≤5 refreshes** | Target |

**WidgetKit Timeline:**
// Generate 24-hour timeline with 5 entries
func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
let entries = [
// 6 AM: Morning recovery + first protocol
// 12 PM: Midday check
// 6 PM: Evening protocol prep
// 10 PM: Sleep protocol reminder (if enabled)
// Next 6 AM: Placeholder until refresh
]
let timeline = Timeline(entries: entries, policy: .after(nextMorning6AM))
completion(timeline)
}

text

### 2.2 iOS Lock Screen Widget (Accessory Circular)

#### 2.2.1 Widget Family: Accessory Circular
**Size:** 84×84 points
**Use Case:** Compact recovery score only

#### 2.2.2 Layout
┌───────┐
│ 72% │ ← Recovery score, large
│ REC │ ← Label, small
└───────┘

text

#### 2.2.3 Visual Design
| Element | Value |
|---------|-------|
| Number | 24pt SF Pro Rounded Bold |
| Label | 10pt SF Pro Text, #A7B4C7 |
| Background | Transparent |
| Ring (optional) | Progress arc showing recovery |

### 2.3 iOS Home Screen Widget (Small - 2×2)

#### 2.3.1 Size
**Small:** 169×169 points (2×2 grid)

#### 2.3.2 Layout
┌─────────────────────────┐
│ Recovery: 72% │ ← Header
│ ━━━━━━━━━━░░░░ │ ← Progress bar
│ │
│ ☀️ Morning Light │ ← Next protocol
│ 10 min · Ready │
│ │
│ [Start Protocol] │ ← Interactive button (iOS 17+)
└─────────────────────────┘

text

#### 2.3.3 Interactive Elements (iOS 17+)
| Element | Action | Implementation |
|---------|--------|----------------|
| "Start Protocol" button | Logs protocol start + opens app | AppIntent with `openAppWhenRun: true` |
| Widget tap (anywhere else) | Opens Morning Anchor | Deep link |

#### 2.3.4 Button Intent
struct StartProtocolIntent: AppIntent {
static var title: LocalizedStringResource = "Start Protocol"
static var openAppWhenRun: Bool = true

text
@Parameter(title: "Protocol ID")
var protocolId: String

func perform() async throws -> some IntentResult {
    // Log protocol start to Firestore
    // Return success
    return .result()
}
}

text

### 2.4 iOS Home Screen Widget (Medium - 4×2)

#### 2.4.1 Size
**Medium:** 360×169 points (4×2 grid)

#### 2.4.2 Layout
┌─────────────────────────────────────────────────────┐
│ Recovery: 72% Today's Protocols │
│ HRV: 52ms (+8%) ━━━━━━━━━░░░ 2/4 │
│ │
│ ☀️ Morning Light 🏃 Morning Movement ❄️ NSDR │
│ ✓ Complete Ready · 20 min Locked │
│ │
└─────────────────────────────────────────────────────┘

text

#### 2.4.3 Protocol State Icons
| State | Display | Color |
|-------|---------|-------|
| Complete | ✓ checkmark | #63E6BE |
| Ready | Protocol icon | #F6F8FC |
| In Progress | Spinning indicator | #5B8DEF |
| Locked | 🔒 | #6C7688 |
| Skipped | — dash | #A7B4C7 |

### 2.5 iOS StandBy Mode (Full Screen)

#### 2.5.1 Context
StandBy activates when iPhone charges horizontally. Perfect for:
- **Bedside:** Evening wind-down + morning wake
- **Desk:** Workday protocol reminders

#### 2.5.2 Layout (Morning Anchor Full Screen)
┌─────────────────────────────────────────────────────────────┐
│ │
│ RECOVERY: 72% │
│ ━━━━━━━━━━━━━━━━━━░░░░░░ │
│ │
│ Sleep: 7.8h HRV: 52ms RHR: 58 bpm │
│ (+0.3h) (+8%) (−2) │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ TODAY'S PROTOCOL │ │
│ │ │ │
│ │ ☀️ Morning Light Exposure │ │
│ │ 10 min outdoor light within 60 min of waking │ │
│ │ │ │
│ │ 🏃 Morning Movement │ │
│ │ 20 min Zone 2 cardio │ │
│ │ │ │
│ │ ☕ Caffeine OK after 8:00 AM │ │
│ │ 90-120 min post-wake for optimal cortisol │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ [ START MORNING LIGHT ] │
│ │
│ Last updated: 6:23 AM │
└─────────────────────────────────────────────────────────────┘

text

#### 2.5.3 Night Mode (10 PM - 6 AM)
- **Colors shift:** All UI becomes red-tinted (#EF6B6B muted)
- **Content shifts:** Evening protocols only (Sleep Optimization, Evening Light)
- **Brightness:** Respects system Night Shift

#### 2.5.4 Technical Requirements
| Requirement | Specification |
|-------------|---------------|
| Widget Family | `.systemExtraLarge` for StandBy |
| Orientation | Landscape only |
| Refresh | On charger connect + hourly |
| Always-On Display | Supported on iPhone 14 Pro+ |

### 2.6 iOS Live Activities (Protocol Timer)

#### 2.6.1 Use Case
Active protocol tracking (Cold Exposure, NSDR, Walking Breaks)

#### 2.6.2 Dynamic Island States
**Compact (Collapsed):**
┌──────────────────┐
│ ❄️ Cold: 4:32 │
└──────────────────┘

text

**Expanded:**
┌─────────────────────────────────────┐
│ ❄️ Cold Exposure │
│ 4:32 / 5:00 remaining │
│ ━━━━━━━━━━━░░░░░░░░░ │
│ │
│ Breathing: 4-sec inhale, 6-sec out │
└─────────────────────────────────────┘

text

#### 2.6.3 Lock Screen Banner
┌─────────────────────────────────────────────┐
│ ❄️ Cold Exposure In Progress │
│ 4:32 remaining │
│ ━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░ │
│ [End Early] [+ 1 min] │
└─────────────────────────────────────────────┘

text

#### 2.6.4 ActivityKit Implementation
struct ProtocolActivityAttributes: ActivityAttributes {
public struct ContentState: Codable, Hashable {
var elapsedSeconds: Int
var totalSeconds: Int
var currentInstruction: String // e.g., "Breathing: 4-sec inhale"
}

text
var protocolId: String
var protocolName: String
var protocolIcon: String // SF Symbol name
}

text

#### 2.6.5 Constraints
| Constraint | Value |
|------------|-------|
| Max Duration | 12 hours (iOS limit) |
| Update Frequency | Every 1 second (timer) or on state change |
| Battery Impact | ~5-10% per active session |
| Fallback | If Live Activity fails, show in-app timer only |

---

## PART 3: Android Specifications

### 3.1 Android App Widget (Glance API)

#### 3.1.1 Target API
- **Minimum:** Android 12 (API 31) for Material You
- **Recommended:** Android 14+ (API 34) for lock screen widgets

#### 3.1.2 Widget Sizes
| Size | Grid | Use Case |
|------|------|----------|
| Small | 2×1 | Recovery score only |
| Medium | 3×2 | Recovery + next protocol |
| Large | 4×3 | Full Morning Anchor |

#### 3.1.3 Material You Theming
// Use dynamic colors from wallpaper
val primaryColor = MaterialTheme.colorScheme.primary
val surfaceColor = MaterialTheme.colorScheme.surface

// Fallback to brand colors if dynamic unavailable
val fallbackPrimary = Color(0xFF63E6BE) // Apex teal-mint
val fallbackSurface = Color(0xFF0F1218) // Apex navy-black

text

#### 3.1.4 Lock Screen Limitations (Android 14+)
| Feature | iOS | Android |
|---------|-----|---------|
| Interactive buttons | ✓ Full support | ✓ Buttons only |
| Toggles | ✓ | ✗ Not on lock screen |
| Live updates | ✓ Live Activities | ⚠️ Limited (no Dynamic Island) |
| Theming | Fixed (brand colors) | Dynamic (Material You) |

### 3.2 Android Glance Implementation
class MorningAnchorWidget : GlanceAppWidget() {
override suspend fun provideGlance(context: Context, id: GlanceId) {
provideContent {
val recoveryScore = getRecoveryScore()
val nextProtocol = getNextProtocol()

text
        MorningAnchorContent(
            recovery = recoveryScore,
            protocol = nextProtocol,
            modifier = GlanceModifier.fillMaxSize()
        )
    }
}
}

@Composable
fun MorningAnchorContent(
recovery: Int,
protocol: Protocol,
modifier: GlanceModifier
) {
Column(modifier = modifier.background(GlanceTheme.colors.surface)) {
// Recovery header
Text(
text = "Recovery: $recovery%",
style = TextStyle(
color = getRecoveryColor(recovery),
fontSize = 18.sp,
fontWeight = FontWeight.Bold
)
)
// Protocol card
ProtocolCard(protocol = protocol)
}
}

text

---

## PART 4: Data & Refresh Architecture

### 4.1 Widget Data Flow
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Wearable │ ──► │ HealthKit │ ──► │ Firestore │
│ (Oura/ │ │ / Health │ │ (User │
│ WHOOP) │ │ Connect │ │ Data) │
└─────────────┘ └─────────────┘ └──────┬──────┘
│
▼
┌─────────────────────────────────┐
│ Cloud Function │
│ (calculateRecoveryScore) │
│ Triggers on wearable sync │
└──────────────┬──────────────────┘
│
▼
┌─────────────────────────────────┐
│ App Group Shared Data │
│ (UserDefaults for widgets) │
└──────────────┬──────────────────┘
│
┌───────────────────┼───────────────────┐
▼ ▼ ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Lock │ │ Home │ │ StandBy │
│ Screen │ │ Screen │ │ Mode │
│ Widget │ │ Widget │ │ Widget │
└───────────┘ └───────────┘ └───────────┘

text

### 4.2 Shared Data Schema (App Group)
// Stored in UserDefaults(suiteName: "group.app.apexos.widgets")
struct WidgetData: Codable {
let recoveryScore: Int // 0-100
let recoveryState: RecoveryState // .full, .balanced, .mvd, .noData
let hrvValue: Int? // Raw HRV in ms
let hrvDelta: Int? // % change vs baseline
let sleepHours: Double?
let nextProtocol: WidgetProtocol?
let protocolsCompleted: Int
let protocolsTotal: Int
let lastUpdated: Date
}

struct WidgetProtocol: Codable {
let id: String
let name: String
let shortName: String
let iconName: String // SF Symbol
let durationMinutes: Int?
let state: ProtocolState // .ready, .inProgress, .complete, .locked
}

text

### 4.3 Refresh Triggers
| Trigger | Action | Platform |
|---------|--------|----------|
| App → Foreground | Immediate widget reload | iOS + Android |
| Wearable sync complete | Push update to widget data | iOS + Android |
| Protocol completed | Update progress, next protocol | iOS + Android |
| Background fetch (4×/day) | Recalculate recovery if stale | iOS only |
| Scheduled timeline | Pre-rendered entries at 6 AM/12 PM/6 PM | iOS only |
| WorkManager (periodic) | Every 6 hours | Android only |

### 4.4 Battery Optimization Rules
| Rule | Implementation |
|------|----------------|
| No network calls in widget | All data pre-fetched to App Group |
| Timeline pre-generation | 24-48 hours of entries generated at once |
| Conditional refresh | Skip if data unchanged |
| Respect Low Power Mode | Reduce refresh frequency by 50% |

---

## PART 5: Copy & Voice Guidelines

### 5.1 Widget Copy Rules
| Rule | Correct | Incorrect |
|------|---------|-----------|
| Direct, not cheerful | "Recovery 72%" | "Great recovery today!" |
| Data-specific | "HRV +8% vs baseline" | "Your HRV is looking good" |
| Actionable | "Morning Light ready" | "Time to optimize!" |
| Concise (≤6 words/line) | "Foundation only today" | "Today you should focus on foundation protocols" |

### 5.2 Widget Copy Examples
**High Recovery (≥70%):**
Recovery: 78%
Full Protocol Day
HRV: 56ms (+12%)

☀️ Morning Light · Ready

text

**Balanced Recovery (40-69%):**
Recovery: 54%
Balanced Day
HRV: 48ms (−4%)

☀️ Morning Light · Ready
Foundation protocols only

text

**Low Recovery (<40%) — MVD Active:**
Recovery: 34%
MVD Active
HRV: 38ms (−18%)

☀️ Morning Light only
Rest. Tomorrow's better for intensity.

text

**No Data State:**
Sync Required
Connect wearable for
personalized protocols

[Connect Oura/WHOOP]

text

### 5.3 Forbidden Widget Copy
| Never Say | Why | Instead Say |
|-----------|-----|-------------|
| "Great job!" | Patronizing | (Nothing — completion is its own reward) |
| "Keep your streak!" | Gamification | "Day 12" (factual only) |
| "You've got this!" | Cheerleader | (Remove entirely) |
| "Optimize your day!" | Vague wellness | "Morning Light · 10 min" |
| "🎉" or "🔥" emoji | Not premium | Use SF Symbols only |

---

## PART 6: Technical Requirements

### 6.1 iOS Implementation Checklist
- [ ] WidgetKit target added to Xcode project
- [ ] App Group configured (`group.app.apexos.widgets`)
- [ ] Widget families: `.accessoryRectangular`, `.accessoryCircular`, `.systemSmall`, `.systemMedium`, `.systemExtraLarge`
- [ ] AppIntents for interactive buttons (iOS 17+)
- [ ] ActivityKit for Live Activities
- [ ] StandBy mode support
- [ ] Dark mode + Night Shift compatible colors
- [ ] SF Symbols for all icons (no custom images on lock screen)

### 6.2 Android Implementation Checklist
- [ ] Glance dependency added (`androidx.glance:glance-appwidget`)
- [ ] Widget receiver registered in AndroidManifest
- [ ] Material You dynamic colors with brand fallbacks
- [ ] Widget sizes: 2×1, 3×2, 4×3
- [ ] WorkManager for background updates
- [ ] Lock screen widget support (Android 14+)

### 6.3 Acceptance Criteria
| Criterion | Specification | Verification |
|-----------|---------------|--------------|
| Widget loads in <500ms | Cold start to content displayed | Instrument with os_signpost |
| Recovery score matches app | Widget value = Morning Anchor value | Manual comparison test |
| Tap deep links correctly | All tap targets open correct app screens | QA test matrix |
| Battery impact <2% daily | Measured over 7-day period | Battery profiler |
| Refresh respects budget | ≤5 refreshes/day in production | Analytics logging |
| No crashes on widget | Zero widget-related crash reports | Crashlytics monitoring |

### 6.4 Anti-Patterns (Do NOT)
| Anti-Pattern | Why It's Wrong | Correct Approach |
|--------------|----------------|------------------|
| Network calls in widget | Battery drain, rejected by Apple | Pre-fetch to App Group |
| Real-time HRV updates | Exceeds refresh budget | Update on app open or sync |
| Custom fonts in widget | Inconsistent rendering | SF Pro (system) only |
| Complex animations | Battery + distraction | Static or subtle transitions |
| Showing raw HRV without context | "48ms" means nothing | "HRV: 48ms (−4% vs baseline)" |
| Multiple CTAs | Cognitive overload | One primary action per widget |

---

## PART 7: Implementation Phases

> **Note:** Widgets are a **Phase 2+ feature** (post-MVP). The MVP launches January 1, 2026 without widgets. Widget implementation begins after core app stability is confirmed.

### Phase 2A: Foundation (Q1 2026)
**Scope:** iOS Lock Screen + Home Screen Small
- [ ] Accessory Rectangular widget (recovery + next protocol)
- [ ] Accessory Circular widget (recovery score only)
- [ ] Home Screen Small widget (recovery + action button)
- [ ] Deep linking to Morning Anchor
- [ ] App Group data sync

### Phase 2B: Enhanced (Q1-Q2 2026)
**Scope:** iOS Medium + Interactive + Android
- [ ] Home Screen Medium widget (full protocol list)
- [ ] Interactive "Start Protocol" button (iOS 17+)
- [ ] Android Glance widgets (Small, Medium)
- [ ] Protocol completion from widget

### Phase 2C: Advanced (Q2 2026)
**Scope:** StandBy + Live Activities
- [ ] StandBy full-screen Morning Anchor
- [ ] Night mode for StandBy
- [ ] Live Activities for timed protocols
- [ ] Watch complications (stretch)

---

## APPENDIX A: Color Reference (Exact Values)

// Apex OS Brand Colors for Widgets
extension Color {
// Backgrounds
static let apexBackground = Color(hex: "0F1218") // Deep navy-black
static let apexSurface = Color(hex: "181C25") // Card backgrounds
static let apexElevated = Color(hex: "1F2430") // Raised elements

text
// Accents
static let apexPrimary = Color(hex: "63E6BE")         // Teal-mint (CTAs)
static let apexSecondary = Color(hex: "5B8DEF")       // Blue (secondary)
static let apexTertiary = Color(hex: "EFBF5B")        // Gold (achievements)

// Text
static let apexTextPrimary = Color(hex: "F6F8FC")     // White-ish
static let apexTextSecondary = Color(hex: "A7B4C7")   // Muted
static let apexTextMuted = Color(hex: "6C7688")       // Tertiary

// Status
static let apexGood = Color(hex: "63E6BE")            // Recovery ≥70%
static let apexCaution = Color(hex: "EFBF5B")         // Recovery 40-69%
static let apexAlert = Color(hex: "EF6B6B")           // Recovery <40%
}

text

## APPENDIX B: SF Symbols for Protocols

| Protocol | SF Symbol | Usage |
|----------|-----------|-------|
| Morning Light | `sun.max.fill` | Primary display |
| Evening Light | `sun.horizon.fill` | Evening protocols |
| Morning Movement | `figure.run` | Exercise |
| Walking Breaks | `figure.walk` | Low intensity |
| NSDR | `brain.head.profile` | Mental recovery |
| Breathwork | `wind` | Breathing protocols |
| Cold Exposure | `snowflake` | Cold protocols |
| Hydration | `drop.fill` | Hydration |
| Caffeine Timing | `cup.and.saucer.fill` | Caffeine cutoff |
| Sleep Optimization | `moon.fill` | Sleep protocols |
| Recovery | `heart.fill` | General recovery |
| Complete | `checkmark.circle.fill` | Done state |
| Locked | `lock.fill` | Unavailable |

---

## APPENDIX C: Widget Analytics

For complete widget analytics implementation including event schema, impression tracking, tap attribution, and privacy considerations, see the companion document:

**📊 APEX_OS_WIDGET_ANALYTICS_v1.md**

### Quick Reference: Key Metrics

| Metric | Target | Phase |
|--------|--------|-------|
| `widget_installed` | 40% of DAU | Phase 1 |
| `widget_tap_rate` | >5% | Phase 1 |
| `widget_to_protocol_start` | 25% of taps | Phase 1 |
| `widget_retention_lift` | +15% Day 30 | Phase 3 |

### Implementation Note

Firebase Analytics is NOT supported in iOS widget extensions. The analytics document specifies a deferred logging approach using App Group shared storage, flushing to Firebase on app foreground.

---

**Document End**
Last Updated: December 7, 2025
Parent Document: APEX_OS_PRD_v8.1.md (Part 9.5)
Author: Claude for Apex OS