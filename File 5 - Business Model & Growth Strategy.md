# Business Model & Growth Strategy
## Comprehensive Framework for Wellness OS Monetization, Accessibility, and Growth

**Synthesis Date:** October 23, 2025
**Source Reports:** #21 (Accessibility & i18n), #23 (Content Library Operations), #24 (Pricing Strategy & Tier Design), #25 (Monetization Funnels & Feature Gating), #26 (Referral & Viral Growth), #27 (North Star Metrics & Analytics)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Accessibility & Internationalization](#accessibility--internationalization)
3. [Content Library & Citation Management](#content-library--citation-management)
4. [Pricing Strategy & Tier Design](#pricing-strategy--tier-design)
5. [Monetization Funnels & Feature Gating](#monetization-funnels--feature-gating)
6. [Referral & Viral Growth Mechanics](#referral--viral-growth-mechanics)
7. [North Star Metrics & Analytics Framework](#north-star-metrics--analytics-framework)
8. [System Integration & Architecture](#system-integration--architecture)

---

## Executive Summary

Wellness OS employs a **value-based, four-tier pricing model (Free, Core $9/mo, Pro $29/mo, Elite $99/mo)** anchored on behavioral economics principles and WCAG 2.2 AA compliance as the MVP accessibility baseline. The business model combines:

- **Product-led growth (PLG) freemium** with trigger-based paywalls at high-intent moments (7-day streak, feature discovery) targeting 15% Free→Core and 10% Core→Pro conversions
- **Evidence-backed content operations** via transparent DOI citations, semantic versioning for protocols (MAJOR.MINOR.PATCH), and monthly retraction monitoring via Retraction Watch
- **Two-sided referral program** targeting k-factor ≥1.0 through dual incentives (1 month free Core for referrer and referee), milestone-triggered sharing, and beautiful share cards
- **North Star metric of ≥6 days/week protocol adherence by Day 30** (40% target) with leading indicators (D1 protocol logged 60%, D7 ≥4 protocols 50%)

**Critical Financial Projections:**
- Free→Core conversion: 15% by D30 (vs. industry 8-12%)
- Core→Pro conversion: 10% by D90
- Monthly churn: <5% (Core), <3% (Pro)
- LTV by tier: Core $288, Pro $1,050
- Revenue uplift from pricing optimization: +171% via Van Westendorp WTP research + decoy pricing

**Key Technology Stack:**
- Citation Management: CrossRef API + PubMed + Retraction Watch
- Pricing/Billing: RevenueCat + Stripe
- Analytics: Mixpanel (MVP) → BigQuery + Looker (scale)
- Referral Attribution: Firebase Dynamic Links + Branch.io
- Accessibility: Axe DevTools + VoiceOver/TalkBack testing

---

## Accessibility & Internationalization

### WCAG 2.2 AA Compliance Requirements

Over **1 billion people globally** live with some form of disability. In the United States, the Americans with Disabilities Act (ADA) and recent 2024 HHS rulings (effective May 2026) mandate **WCAG 2.1 AA compliance** for all healthcare apps receiving federal funding. Beyond legal compliance, accessible apps improve overall user experience—better contrast, keyboard support, and motion reduction benefit all users.

**WCAG 2.2 Overview:**
WCAG 2.2 (Web Content Accessibility Guidelines 2.2), published October 2023, defines accessibility standards across **four principles**:

1. **Perceivable**: Information must be presented in ways users can perceive (alt text, captions, color contrast)
2. **Operable**: Navigation must be usable via different input methods (keyboard, voice, touch, switch control)
3. **Understandable**: Content and interactions must be clear, predictable, avoid cognitive overload
4. **Robust**: Compatible with current and evolving assistive technologies

**MVP should target WCAG 2.2 AA with roadmap to AAA.**

### Implementation Requirements

#### 1. COLOR CONTRAST (WCAG 1.4.3, 1.4.11)

**Rule 1.1**: Text color contrast ratio must be **≥4.5:1** for normal text (14px standard or smaller). Large text (18pt/24px or larger, OR 14pt+ if bold) requires **≥3:1**.

**Rule 1.2**: Interactive elements (buttons, checkboxes) and essential graphical objects must have **≥3:1 contrast** against adjacent colors.

**Rule 1.3**: Data visualizations must use **color + pattern/icon** (not color alone).

**Implementation Example:**
```
Button "Log Morning Light":
- Background: #2E7D32 (green)
- Text: #FFFFFF (white)
- Contrast ratio: 5.0:1 ✓ (meets AA 4.5:1)

Interactive icon (Streak calendar):
- Icon color: #1976D2 (blue)
- Background: #F5F5F5 (light gray)
- Contrast: 5.2:1 ✓

Data viz (Sleep score pie chart):
- Slice 1: Green + vertical stripe pattern (good sleep)
- Slice 2: Yellow + diagonal stripe pattern (fair sleep)
- Slice 3: Red + horizontal stripe pattern (poor sleep)
- Prevents interpretation error for color-blind users
```

**Testing Tool**: Use WebAIM Contrast Checker or Axe DevTools. Automated scan in CI/CD pipeline; manual audit quarterly.

#### 2. SCREEN READER SUPPORT (WCAG 4.1.2, 4.1.3)

**Rule 2.1**: All interactive elements **MUST have accessibility labels**. Use platform-native attributes:
- iOS: `accessibilityLabel`, `accessibilityHint`, `accessibilityTraits`
- Android: `android:contentDescription`, `android:labelFor`, `android:hint`

**Rule 2.2**: Form inputs must include explicit labels (not just placeholder text).

**Rule 2.3**: Images and icons must have descriptive alt text. Decorative images marked as non-accessible.

**Rule 2.4**: Announce state changes via accessibility notifications:

```swift
UIAccessibility.post(notification: .announcement, argument: "Day 5 of 7 protocols completed. Your streak is on fire!")
```

**Rule 2.5**: Chart/graph accessibility requires text summary:

```
Visual: [Sleep score bar chart: Mon 7.2, Tue 6.8, Wed 7.5, Thu 7.0, Fri 7.3, Sat 7.6, Sun 7.1]
Text alternative: "Your weekly average sleep score is 7.2 out of 10. Best night: Saturday (7.6). Lowest: Tuesday (6.8)."
```

**iOS VoiceOver Implementation:**
```swift
let logButton = UIButton()
logButton.accessibilityLabel = "Log morning light protocol"
logButton.accessibilityHint = "Double tap to log your morning light exposure and advance your streak."
logButton.accessibilityTraits = .button
```

**Android TalkBack Implementation:**
```xml
<Button
    android:id="@+id/log_protocol_btn"
    android:contentDescription="Log morning light protocol"
    android:text="Log" />
```

#### 3. KEYBOARD & VOICE NAVIGATION (WCAG 2.1.1, 2.1.3)

**Rule 3.1**: ALL functionality must be accessible without a pointing device. Tab order must be logical.

**Rule 3.2**: Focus indicators must be **visible and high-contrast** (≥2px solid border, color ≥3:1 vs. background).

**Rule 3.3**: Voice control commands must be **simple, memorable, and context-aware**:

```
Voice Commands for Wellness OS MVP:
- "Log protocol" → Opens protocol logging screen
- "Show today's protocols" → Navigates to today view
- "Check my streak" → Opens streak calendar
- "Morning light completed" → Quick-logs morning light protocol
- "Go back" → Returns to previous screen
- "Help" → Shows available voice commands
```

**Fallback for voice misrecognition:**
```
IF voice_command NOT recognized THEN:
  Play: "I didn't catch that. Try saying 'Log protocol', 'Show my streak', or 'Help'."
  Return to home screen, await next command.
```

**iOS Voice Control Setup:**
```swift
let voiceControlActions = [
    UIAccessibilityCustomAction(name: "Log protocol", target: self, selector: #selector(logProtocol)),
    UIAccessibilityCustomAction(name: "Check my streak", target: self, selector: #selector(checkStreak))
]
protocolCard.accessibilityCustomActions = voiceControlActions
```

#### 4. DYNAMIC TYPE SUPPORT (WCAG 1.4.4)

**Rule 4.1**: iOS Dynamic Type allows users to scale text from 100% to 200%.

**Rule 4.2**: App must support text sizes at **maximum (200%) without breaking layout**.

**Rule 4.3**: Use **iOS `UIFontTextStyle` or Android `sp` (scalable pixels)**, NOT fixed pt/px.

**iOS Implementation:**
```swift
label.font = UIFont.preferredFont(forTextStyle: .headline)
label.adjustsFontForContentSizeCategory = true
```

**Android Implementation:**
```xml
<TextView
    android:textSize="16sp"
    android:text="Log your morning light exposure" />
```

#### 5. MOTION REDUCTION (WCAG 2.3.3)

**Rule 7.1**: Respect **`prefers-reduced-motion`** system setting.

**Rule 7.2**: IF user enables "Reduce Motion" THEN:
- Disable celebration animations (confetti, bounces)
- Use cross-fade transitions ONLY
- Disable parallax scrolling
- Disable auto-play videos

**iOS Implementation:**
```swift
if UIAccessibility.isReduceMotionEnabled {
    // Use instant cross-fade
    UIView.transition(with: view, duration: 0.2, options: .transitionCrossDissolve, animations: {
        view.isHidden = !view.isHidden
    })
} else {
    // Use celebration animation
    playConfettiAnimation()
}
```

**Android Implementation:**
```kotlin
if (!ValueAnimator.areAnimatorsEnabled()) {
    // Skip animation or use instant transition
}
```

### Internationalization (i18n) Architecture

#### LOCALIZATION FRAMEWORK

**Framework Selection by Tech Stack:**

| Tech Stack | Framework | Notes |
|-----------|-----------|-------|
| React Native | **i18next + react-i18next** | Supports 78+ languages; integrates with expo-localization |
| Flutter | **Flutter Intl (intl package)** | Supports 78+ languages; generates Dart code for type safety |
| Native iOS | **Localizable.strings (native)** | Built-in; simple key-value pairs |
| Native Android | **strings.xml (native)** | Built-in; XML format; supports pluralization |

**Store all user-facing strings in locale-specific resource files:**

```json
// en-US.json
{
  "onboarding.welcome": "Welcome to Wellness OS",
  "onboarding.step1": "Let's set up your sleep protocol.",
  "protocol.morning_light": "Morning Light Exposure",
  "protocol.description": "Get 10-30 minutes of morning sunlight within 2 hours of waking.",
  "coach.nudge.morning_light": "Time for your morning light! Step outside for 10 minutes.",
  "streak.label": "{{count}} day streak",
  "button.log": "Log Protocol",
  "error.wake_time_required": "Wake time is required"
}

// es-ES.json
{
  "onboarding.welcome": "Bienvenido a Wellness OS",
  "onboarding.step1": "Configuremos tu protocolo de sueño.",
  "protocol.morning_light": "Exposición a la Luz Matutina",
  "protocol.description": "Obtén 10-30 minutos de luz solar matutina dentro de 2 horas de despertar.",
  "coach.nudge.morning_light": "¡Hora de tu luz matutina! Sal afuera durante 10 minutos.",
  "streak.label": "{{count}} días de racha",
  "button.log": "Registrar Protocolo",
  "error.wake_time_required": "La hora de despertar es obligatoria"
}
```

#### DATE/TIME LOCALIZATION

**Use platform-native date/time formatters:**

```swift
// iOS: Use DateFormatter with locale awareness
let formatter = DateFormatter()
formatter.locale = Locale.current
formatter.dateStyle = .long
formatter.timeStyle = .short
let formatted = formatter.string(from: Date())
// Output: "15 de marzo de 2025 a las 7:30" (es-ES)
//         "March 15, 2025 at 7:30 AM" (en-US)

// Android: Use SimpleDateFormat with locale
SimpleDateFormat sdf = new SimpleDateFormat("d 'de' MMMM 'de' yyyy HH:mm", new Locale("es", "ES"));
String formatted = sdf.format(new Date());

// JavaScript: Use Intl.DateTimeFormat
const formatter = new Intl.DateTimeFormat(navigator.language, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
console.log(formatter.format(new Date()));
```

**ALWAYS store times in ISO 8601 format in backend** (e.g., "2025-03-15T07:30:00Z"), then convert to user's local timezone on display.

#### CIRCADIAN PROTOCOL TIMING (TIMEZONE-AWARE SCHEDULING)

**Calculate local sunrise/sunset using SunCalc library:**

```python
# Pseudocode (Python SunCalc)
from suncalc import get_times
from datetime import datetime
from pytz import timezone

user_timezone = timezone('America/Los_Angeles')
user_date = datetime.now(user_timezone)
latitude = 37.7749  # User's latitude (from geolocation)
longitude = -122.4194  # User's longitude

times = get_times(user_date, latitude, longitude)
sunrise_time = times['sunrise']
sunset_time = times['sunset']

# Morning Light nudge = sunrise + 15 minutes
morning_light_nudge_time = sunrise_time + timedelta(minutes=15)

# Evening Light nudge = sunset - 30 minutes
evening_light_nudge_time = sunset_time - timedelta(minutes=30)

# Caffeine cutoff = User's bedtime - caffeine_half_life
caffeine_cutoff_time = user_bedtime - timedelta(hours=8)  # Conservative default
```

**User Profile Schema (Required Fields):**
```json
{
  "user_id": "u123",
  "timezone": "America/Los_Angeles",
  "locale": "en-US",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "wake_time": "07:00",
  "bedtime": "22:00",
  "caffeine_sensitivity": "high",
  "circadian_protocols_enabled": true
}
```

**Extreme Latitude Handling:**
```
IF latitude > 66 OR latitude < -66 THEN:
  USE timezone-based defaults:
    Morning Light: 07:00 (local time)
    Evening Light: 17:00 (local time)
    Caffeine Cutoff: 14:00 (local time)
```

#### CULTURAL CUSTOMIZATION

**Adapt protocol recommendations based on user locale:**

```json
// Meal Timing Protocol
IF locale INCLUDES "es-ES" (Spain) THEN:
  "meal_timing_text": "Align meals with Spanish meal times: breakfast 8-9 AM, lunch 2-3 PM (main meal), dinner 8-9 PM. Siesta (20-30 min nap) after lunch is optional.",

IF locale INCLUDES "ja-JP" (Japan) THEN:
  "meal_timing_text": "Breakfast: 7-8 AM (traditional style: rice, miso soup, grilled fish). Lunch: 12-1 PM. Dinner: 6-7 PM.",

IF locale INCLUDES "en-US" THEN:
  "meal_timing_text": "Breakfast: 7-8 AM. Lunch: 12-1 PM. Dinner: 6-7 PM. Front-load calories earlier in day."
```

**Sleep Protocol Cultural Notes:**
```
IF locale INCLUDES Mediterranean (es-ES, it-IT, pt-PT) THEN:
  "siesta_note": "Siesta is a cultural norm in Mediterranean regions. If you take a 20-30 min nap after lunch, your primary sleep window may shift earlier."

IF locale INCLUDES polar regions (no-NO, se-SE, fi-FI) THEN:
  "sleep_note": "Extreme daylight variation across seasons. Use blackout curtains in summer (midnight sun) and light therapy in winter (polar night)."
```

### Accessibility Testing Checklist

**Monthly (before sprint release):**
- [ ] Run **Axe DevTools** automated audit (0 critical issues required)
- [ ] Manual test with **VoiceOver (iOS)** and **TalkBack (Android)**: Navigate entire onboarding flow
- [ ] Manual test with **iOS Voice Control** and **Android Voice Access**: Execute 5+ core voice commands
- [ ] Verify **color contrast ratios** using WebAIM Contrast Checker (minimum AA 4.5:1 for text)
- [ ] Test **Dynamic Type** at largest size (200%) on iPhone; verify layout doesn't break
- [ ] Enable **Reduce Motion** and verify animations disabled; test all transitions
- [ ] Test **keyboard navigation** (Tab, Enter, Escape keys); verify focus order is logical
- [ ] User testing with 2+ individuals with disabilities

**Pre-MVP release (Month 1):**
- [ ] Full Axe DevTools audit
- [ ] In-depth VoiceOver/TalkBack testing (30+ min sessions)
- [ ] Independent accessibility audit by 3rd-party (e.g., Deque, Level Access)
- [ ] Legal review of WCAG 2.2 AA compliance

---

## Content Library & Citation Management

### Citation Management Architecture

Health apps built on transparent, peer-reviewed citations establish legitimacy against competitor noise. Studies show users trust mHealth platforms more when citations are displayed accessibly and studies are recent (2015–2025). **UpToDate's model**: daily updates, 7,400+ expert contributors. **Examine.com's model**: each claim maps to 2+ peer-reviewed studies. Wellness OS differentiates by making "tap for DOI" frictionless in Evidence UX.

### Citation Database Design

**CITATION SCHEMA (Firestore Document or PostgreSQL Table):**

```json
{
  "citation_id": "cite_001",
  "doi": "10.1016/j.smrv.2022.101234",
  "title": "Morning light exposure and circadian rhythm regulation",
  "authors": ["Walker, M.", "Smith, J."],
  "journal": "Sleep Medicine Reviews",
  "publication_year": 2022,
  "pubmed_id": "12345678",
  "url": "https://doi.org/10.1016/j.smrv.2022.101234",
  "plain_english_summary": "Morning light exposure within 30 minutes of waking improves sleep quality and daytime alertness by resetting the circadian clock.",
  "key_findings": [
    "10-30 min optimal duration",
    "1000-10000 lux intensity"
  ],
  "added_date": "2025-01-15",
  "last_reviewed_date": "2025-10-01",
  "review_status": "current",
  "retraction_status": "not_retracted",
  "last_retraction_check_date": "2025-10-15"
}
```

### DOI RESOLUTION (CrossRef API)

**On protocol authoring**, when content writer enters DOI, call CrossRef API in real-time:

```
GET https://api.crossref.org/works/10.1016/j.smrv.2022.101234
```

Response fields: title, authors, published-online (date), journal-title, URL
Auto-populate citation_schema fields; require human review of plain_english_summary

**Fallback**: If CrossRef returns 404, query PubMed API via PMID (if available) or manual entry

**Rate limiting**: CrossRef allows 50 requests/second; batch citations in groups of 10

### Citation Freshness Policy

```
IF publication_year < (current_year - 10) THEN flag citation for review
  Set review_status = "flagged_for_review"
  Notify science advisor: "Walker et al. (2014) on sleep hygiene needs evaluation"

Quarterly review: Science board evaluates flagged citations for replacement

IF newer meta-analysis contradicts citation THEN update protocol + increment version
```

### Retraction Monitoring (Monthly Automated Job)

```
Scheduled Job: Monthly Retraction Watch Check

FOREACH citation in database:
  CALL Retraction Watch API:
    GET https://api.labs.crossref.org/data/retractionwatch?doi={citation.doi}

  IF response.retraction_status == "retracted":
    SET citation.retraction_status = "retracted"
    SET citation.retraction_reason = response.reason
    TRIGGER: Protocol Review Alert
    MESSAGE: "Citation {citation.id} ({citation.doi}) was retracted on {retraction_date}. Reason: {reason}"

  UPDATE citation.last_retraction_check_date = today()
```

### Protocol Versioning System

**PROTOCOL SCHEMA:**

```json
{
  "protocol_id": "protocol_morning_light",
  "name": "Morning Light Exposure",
  "version": "1.2.0",
  "description": "View bright light within 30 minutes of waking to reset your circadian rhythm.",
  "optimal_timing": "Within 30 minutes of waking",
  "duration_minutes": {
    "min": 10,
    "max": 30,
    "unit": "minutes"
  },
  "frequency": "6-7 days per week",
  "intensity_lux": {
    "min": 1000,
    "max": 10000,
    "unit": "lux"
  },
  "citations": ["cite_001", "cite_002", "cite_003"],
  "contraindications": [
    "Photosensitivity disorders",
    "Migraines triggered by bright light",
    "Light-sensitive seizure disorders"
  ],
  "created_date": "2025-01-01",
  "last_updated": "2025-10-01",
  "changelog": [
    {
      "version": "1.2.0",
      "date": "2025-10-01",
      "change_type": "minor",
      "change_summary": "Updated duration from 10-20 min to 10-30 min based on new meta-analysis.",
      "triggering_citation": "cite_002",
      "published_study_doi": "10.1016/j.smrv.2025.101500"
    },
    {
      "version": "1.1.0",
      "date": "2025-03-15",
      "change_type": "minor",
      "change_summary": "Added contraindication for photosensitivity disorders.",
      "triggering_citation": null,
      "published_study_doi": null
    },
    {
      "version": "1.0.0",
      "date": "2025-01-01",
      "change_type": "initial",
      "change_summary": "Initial protocol release based on Huberman Lab research.",
      "triggering_citation": "cite_001",
      "published_study_doi": "10.1016/j.smrv.2022.101234"
    }
  ],
  "status": "active",
  "deprecation_reason": null,
  "deprecation_date": null,
  "replacement_protocol_id": null
}
```

### Semantic Versioning for Protocols

Use MAJOR.MINOR.PATCH (semver.org):

- **MAJOR (X.y.z)**: Breaking change to protocol recommendation
  - Example: "Optimal timing changed from morning to evening"
  - Trigger immediate deprecation of old version + user notification

- **MINOR (x.Y.z)**: Additive change or parameter adjustment (backward compatible)
  - Example: "Duration window extended from 10-20 min to 10-30 min"
  - In-app notification: "Your protocol just got better—check what's new"

- **PATCH (x.y.Z)**: Copy fixes, clarifications, typo fixes
  - Example: "Fixed typo: '1000-1000 lux' → '1000-10000 lux'"
  - No notification required; silent deployment

### Protocol Update Workflow

```
STEP 1: New Research Identified (Science Team)
  → Flag study in Slack #research-alerts
  → Add to citation database with review_status = "pending"
  → Schedule for next monthly science advisory board meeting

STEP 2: Science Review (Monthly Meeting)
  → Science advisor + clinician evaluate study strength
  → Decision tree:
     IF study contradicts existing protocol:
       → Decision: MAJOR version bump or DEPRECATE
     IF study extends/refines recommendation:
       → Decision: MINOR version bump
     IF no impact:
       → Decision: Cite only, no protocol change

STEP 3: Draft Update (Content Team)
  IF decision == update:
    → Update protocol JSON fields
    → Increment version (e.g., 1.1.0 → 1.2.0)
    → Add changelog entry with new study DOI

STEP 4: Internal Review (Product + Science)
  → Product manager checks UX clarity
  → Science advisor signs off on evidence
  → Status: draft → approved

STEP 5: Publish Update
  → Deploy new protocol version to production
  → Trigger user notifications (in-app + email + push)
  → Update RAG embeddings

STEP 6: User Notification
  IN-APP NOTIFICATION:
    "Morning Light protocol updated ✨
    Your optimal exposure window just expanded. We updated this based on a
    2025 meta-analysis showing 10-30 minutes works as well as 10-20 minutes.
    [View what changed]"

  EMAIL:
    Subject: "Your Morning Light protocol just got better"
    Body: "We reviewed the latest sleep science and updated your
           Morning Light protocol. The new version extends your optimal
           exposure window from 10-20 min to 10-30 min."
```

### Content Deprecation Policy

**DEPRECATION TRIGGERS:**

```
TRIGGER 1: Retracted Study (Critical)
  IF any protocol.citations[].retraction_status == "retracted":
    AND retracted citation is CORE to protocol logic:
    → Immediate action: Flag protocol for emergency review
    → Decision within 48 hours: UPDATE or DEPRECATE

TRIGGER 2: Contradictory Meta-Analysis
  IF new meta-analysis shows protocol is ineffective or harmful:
    → DEPRECATE old version + PUBLISH new MAJOR version

TRIGGER 3: Safety Concern (Immediate Deprecation)
  IF post-market surveillance identifies safety risk:
    → Immediate deprecation
    → User notification: "Safety update: This protocol is no longer recommended for you."
```

**DEPRECATION WORKFLOW:**

```
STEP 1: Flag Protocol
  SET protocol.status = "deprecated"
  SET protocol.deprecation_reason = "New meta-analysis shows ineffectiveness"
  SET protocol.deprecation_date = today()
  SET protocol.replacement_protocol_id = "protocol_replacement_v1"

STEP 2: Notify Active Users (Within 24 Hours)
  IN-APP ALERT (modal, non-dismissible):
    "⚠️ Protocol Update: Morning Light
    We've reviewed the latest research and updated our guidance.
    [View Updated Version]  [Keep Current]"

  EMAIL (segmented to active users):
    Subject: Important: Morning Light Protocol Updated
    Body: "Based on 2025 research, we've updated the Morning Light protocol."

STEP 3: Archive Content
  → Move to /protocols/archive/
  → Display deprecation notice

STEP 4: Update RAG Embeddings
  → Remove deprecated protocol vectors from Pinecone
  → Re-embed new protocol version
  → Prevent AI coach from recommending deprecated version
```

---

## Pricing Strategy & Tier Design

### Behavioral Economics of Pricing

**Anchoring Effect:** Dan Ariely's research (Predictably Irrational, 2008) demonstrates that initial price exposure strongly influences subsequent value judgments. When customers see Elite ($99/mo) first, Core ($9/mo) appears dramatically more affordable.

**Decoy Pricing (Asymmetric Dominance):** By positioning Pro ($29/mo) as an inferior alternative to Elite ($99/mo) but superior to Core ($9/mo), users perceive Pro as the "compromise choice." Research by Simon-Kucher & Partners confirms well-designed decoys increase adoption of the target tier by 12-15%.

**Loss Aversion:** Richard Thaler and Cass Sunstein (Nudge, 2008) document that people feel losses ~2x more acutely than equivalent gains. Annual subscription positioning ("Save 2 months!") leverages loss aversion.

### Willingness to Pay Research

**Van Westendorp Price Sensitivity Meter** (gold-standard WTP methodology):

Four strategic questions:
- At what price is the product **too expensive** (price ceiling)?
- At what price is it **expensive but worth buying** (acceptable price)?
- At what price is it a **great bargain** (price floor)?
- At what price is it **too cheap** (quality doubt threshold)?

ProfitWell research finds companies implementing Van Westendorp-informed pricing achieve 14% higher expansion revenue and 10-15% faster overall growth.

### Four-Tier Pricing Model

#### TIER 1: FREE (Acquisition & Activation)

**Goal:** Drive signups, prove value (first win in 5 min), achieve 40% D7 retention, convert 15% to Core within 30 days.

**Features Included:**
- Sleep & Light Foundation (3 core protocols: caffeine cutoff, morning light, wind-down)
- Basic adherence tracking (day counter, streak visual)
- Single wearable connection (Apple Health OR Google Fit read-only)
- Evidence UX visible (2-bullet DOI summaries, "Tap for study")
- Solo streaks (shareable card export)
- View-only leaderboard (anonymous, no participation)

**Features Locked (Paywall Triggers):**
- Advanced analytics (sleep score trends, correlations, recommendations)
- Custom protocol builder
- Unlimited wearables
- Unlimited protocols (all 6 domains)
- Team challenges
- Coaching access
- Bloodwork interpretation

**Value Proposition:** "Build your sleep & light foundation—free forever."

**Tier Lock Logic:**
```
IF User Onboarding Complete AND Day >= 3:
  SHOW "Unlock Advanced Analytics" CTA in Insights page
  SHOW "Create custom protocol" CTA in Protocol Builder stub
  SHOW "Connect Oura/Whoop" CTA in Wearables page

IF User Adherence Streak >= 7 AND Day >= 7:
  SHOW celebration modal: "You're crushing it! Upgrade for personalized coaching."
  CTA: "Try Core free for 7 days"
```

**Conversion Targets:**
- 15% Free → Core by Day 30 (vs. industry median 8-12%)
- 40% D7 retention (vs. industry median 25-35%)

#### TIER 2: CORE ($9/month OR $86/year = $7.17/month, 20% discount)

**Goal:** Primary revenue driver, unlock full self-serve platform, achieve 3+ daily nudges, drive habit adherence to 6 days/week by Day 30.

**Features Included:**
- Everything in Free
- **Unlimited protocols** (catalog of 50+ evidence-based protocols)
- Advanced analytics (trend graphs, HRV correlations, sleep score trajectory)
- Custom protocol builder (drag-drop, save, schedule)
- Unlimited wearable connections (Oura, Whoop, Apple Health, Fitbit deep sync)
- 3-5 contextual nudges/day (time-aware, biometric-aware)
- Team challenges (create team challenges, private leaderboards)
- Priority support (email response <24h)

**Features Locked (Pro Paywall):**
- 1-on-1 wellness coaching
- Bloodwork interpretation
- Supplement stack recommendations
- Advanced AI insights

**Value Proposition:** "Less than 1 coffee/week for evidence-backed peak performance. Unlimited protocols + unlimited wearables."

**ROI Framing:** "$9/month = $108/year. If this improves sleep by 1 hour/night = ~20 extra productive hours/month. At your $100-500K income, that's 5-25x ROI."

**Annual Discount Logic:**
```
Display Pricing as:
  Monthly: "$9/month, cancel anytime"
  Annual: "$86/year (billed once) = $7.17/month — Save $22/year"

Default recommendation: Annual (highlight savings)
Track: % selecting annual, LTV by cohort
Target: 40% annual adoption within Q1
```

**Target Market:** 70% of paying users (primary revenue segment).

**Conversion Targets:**
- 25% Core → Pro within 90 days
- <5% monthly churn
- 85% annual plan adoption of Core users

#### TIER 3: PRO ($29/month OR $279/year = $23.25/month, 20% discount)

**Goal:** High-value users who want human coaching + AI, drive expansion revenue, achieve 35% of paying user base.

**Features Included:**
- Everything in Core
- **1-on-1 wellness coaching** (2 video calls/month, 30 min each)
  - Coaches trained on protocol science, biometric interpretation
  - Asynchronous feedback on protocol adherence
  - Integration with wearable data
- Advanced AI insights (protocol recommendations based on 30-day trend)
- Priority support (response <12h)
- Early access to new protocols (beta 2 weeks before release)
- Dedicated Slack channel (Pro cohort, peer learning)

**Features Locked (Elite Paywall):**
- Weekly coaching (4 calls/month vs. 2)
- Bloodwork interpretation
- Supplement stack personalization
- White-glove onboarding

**Value Proposition:** "AI + human coaching for 1/5 the price of Future ($150/mo). Same transformation, better efficiency."

**ROI Framing:** "$29/month vs. $150/mo Future or $60/mo Noom. Get 2 expert calls/month + AI for $348/year. That's 1 coaching call = ROI paid."

**Upgrade Trigger Logic:**
```
IF User Tier = "Core" AND (
  User Adherence >= 80% for 30 days OR
  User Activates Protocol Paywall 3+ times OR
  User Opens Evidence UX Study Links 5+ times
):
  SHOW upgrade modal: "Ready to talk to a coach? Upgrade to Pro for personalized guidance."
  OFFER: "First coaching call free (30-min)"

IF User Books First Coaching Call:
  TRACK as "coaching_activation_event"
  AFTER call: NPS survey + "Keep Pro for ongoing coaching"
```

**Target Market:** 20% of paying users (high-performers seeking guidance).

#### TIER 4: ELITE ($99/month OR $950/year = $79.17/month, 20% discount)

**Goal:** Premium tier for founders, executives, ultra-high-income professionals. 10% of users, 40% of revenue.

**Features Included:**
- Everything in Pro
- **Weekly 1-on-1 coaching** (4 video calls/month)
  - White-glove onboarding (concierge setup, wearable pairing)
  - Real-time wearable data review
- **Bloodwork interpretation** (upload labs: lipids, glucose, inflammation, hormones)
  - Coach contextualizes results + protocol recommendations
  - Quarterly review cycles
- **Personalized supplement stack** (dosing, timing, brands, cost optimization)
  - Tracked in app, integrated with protocol timing
- **Private Slack channel** (Elite cohort peer community, expert interviews)
  - Monthly guest: sleep scientist, cold exposure expert, functional medicine MD
- **Genetics consultation** (optional, partner with Levels/Helix)

**Value Proposition:** "Concierge wellness for peak performers. Expert coaching + science + supplements + lab interpretation for $99/month vs. $500+/mo for 1-on-1 functional medicine doctor."

**ROI Framing:** "Your time = $200-$500/hour. This service saves you 10+ hours/year on health research = $2,000-$5,000 value. Plus: prevent 1 sick day ($500-$1,000 productivity loss). 10x ROI minimum."

**Launch Timing:** Month 6+ (after Pro tier proven, after data model stabilized).

**Target Market:** 10% of users but 40% of revenue (income tier $250K-$500K+, founders/execs/creators).

### Tier Comparison Table

| Feature | Free | Core | Pro | Elite |
|---------|------|------|-----|-------|
| **Protocols** | | | | |
| Sleep & Light (3) | ✅ | ✅ | ✅ | ✅ |
| Unlimited protocols (6 domains) | ❌ | ✅ | ✅ | ✅ |
| Custom protocol builder | ❌ | ✅ | ✅ | ✅ |
| **Analytics & Personalization** | | | | |
| Basic adherence tracking | ✅ | ✅ | ✅ | ✅ |
| Advanced analytics | ❌ | ✅ | ✅ | ✅ |
| AI protocol recommendations | ❌ | ✅ | ✅ | ✅ |
| **Wearables & Data** | | | | |
| Single wearable connection | ✅ | ✅ | ✅ | ✅ |
| Unlimited wearables | ❌ | ✅ | ✅ | ✅ |
| Biometric readiness signals | ❌ | ✅ | ✅ | ✅ |
| **Coaching & Support** | | | | |
| Email support (24h response) | ❌ | ❌ | ✅ | ✅ |
| Priority support (12h response) | ❌ | ❌ | ✅ | ✅ |
| 1-on-1 wellness coaching | ❌ | ❌ | 2 calls/mo | 4 calls/mo |
| **Health Interpretation** | | | | |
| Evidence UX (DOI citations) | ✅ | ✅ | ✅ | ✅ |
| Bloodwork interpretation | ❌ | ❌ | ❌ | ✅ |
| Supplement stack recommendations | ❌ | ❌ | ❌ | ✅ |
| **Pricing** | | | | |
| **Monthly** | Free | **$9** | **$29** | **$99** |
| **Annual** | Free | **$86** (save $22) | **$279** (save $69) | **$950** (save $238) |
| **Most Popular** | — | — | ✅ BADGE | — |

### Pricing Psychology Principles

#### ANCHORING: Display Tiers in Strategic Order

```
DISPLAY ORDER (highest to lowest):
  Elite ($99/mo) — ANCHOR (sets upper reference point)
  Pro ($29/mo) — TARGET (appears affordable relative to Elite)
  Core ($9/mo) — VALUE (appears like steal after seeing Elite)
  Free — ENTRY POINT

RATIONALE: Elite anchors perception. When shown first, Core feels 11x cheaper psychologically.
```

#### DECOY PRICING: Pro as Compromise Choice

```
TIER COMPARISON TABLE DESIGN:

| Feature | Core | Pro (DECOY TARGET) | Elite |
|---------|------|-------------------|-------|
| Coaching calls | 0 | 2 calls/mo | 4 calls/mo |
| Price | $9 | $29 | $99 |
| Price per call | — | $14.50/call | $24.75/call |

POSITIONING:
  - Elite: "Maximum coaching" but "premium price"
  - Pro: "Best value coaching" ← DECOY EFFECT TARGET
    Badge: "Most Popular (62% choose)" ← Social proof
  - Core: "Self-serve unlimited protocols"

EXPECTED OUTCOME: Pro captures 35% of users (vs. 20-25% without decoy)
```

#### VALUE-BASED FRAMING

```
AVOID THIS: "Unlock 6 protocols + advanced analytics"
USE THIS: "Build unshakeable habits in 30 days. AI + unlimited science."

AVOID THIS: "2 wellness coaching calls/month"
USE THIS: "Personalized guidance to break through performance plateaus."

AVOID THIS: "$99/month for bloodwork + supplements"
USE THIS: "Decode your biology + optimize your stack. Like a functional medicine doc on-demand."
```

### Competitive Pricing Analysis

| Competitor | Price | Tier Structure | Key Features | Wellness OS vs. |
|------------|-------|-----------------|--------------|---|
| Noom | $60/mo | Single tier | Weight loss coaching, food tracking | Core $9 = 6.7x cheaper |
| Future | $150/mo | Single tier | 1-on-1 personal training | Pro $29 = 5.2x cheaper |
| Levels | $199/mo | Single tier | CGM + metabolic coaching | Elite $99 = 2x cheaper |
| Whoop | $30/mo | Single tier | Recovery tracking | Core $9 = 3.3x cheaper |
| Headspace | $14/mo | Single tier | Meditation, sleep | Core $9 = undercuts |
| **Wellness OS** | **$0/$9/$29/$99** | **4 tiers** | **Multi-protocol + wearables + coaching** | **Only competitor with all 4 pillars** |

**Market Gaps Identified:**

1. **Gap 1**: No evidence-backed protocols + coaching at $9-$29
2. **Gap 2**: No multi-wearable BYOD at any price point
3. **Gap 3**: Elite tier ($99) undercuts premium without sacrifice

---

## Monetization Funnels & Feature Gating

### Product-Led Growth (PLG) Freemium Model

Product-led growth is a **bottom-up approach** where the product itself drives acquisition, engagement, and monetization. For Wellness OS targeting performance professionals, PLG is ideal because:

1. **Lower CAC**: Free tier users self-select for product-market fit
2. **Faster Sales Cycles**: Users convert directly without sales calls; median PLG trial start rates are 6.7% (Health & Fitness)
3. **Freemium > Free Trial**: Freemium models convert at 12% (median), **140% higher than free trial conversion rates (5% median)**

### Conversion Funnel Map (Free → Core → Pro)

#### STAGE 1: ACTIVATION (Free Users, Days 0–7)

**Goal:** Deliver first win, prove value, establish habit

**Key Success Metrics:**
- Complete onboarding = 90%+ completion
- First protocol nudge delivered = 95%+ delivery
- First protocol completion logged = 65%+ completion
- 3-day streak achieved = 40%+ of Day 0 users

**Paywall Exposure:** NONE during activation (preserve value perception)

**Re-engagement Trigger:**
```
IF (Protocol_Logged == 0) AND (DaysSinceDownload >= 3)
  THEN Send push notification: "You're 3 days in—let's cement your habit"
  AND Include 1 easy protocol to get started
```

**Drop-Off Risk:** 40% of users churn before Day 7 if no protocol is logged

#### STAGE 2: FEATURE DISCOVERY (Free Users, Days 7–14)

**Goal:** Expose locked features, create upgrade intent without resentment

**Paywall Exposure Moments:**

**MOMENT 1: Protocol Catalog Exploration**
```
IF (User_Views_Protocol_Catalog == True) AND (Tier == "Free")
  THEN Display soft paywall modal:
    - Show preview of "Cold Exposure Protocol" (blurred description)
    - Text: "Unlock 50+ science-backed protocols with Core"
    - CTA: "Start 7-day free trial" (blue button)
    - Secondary: "Maybe later" (gray, no friction)
```

**MOMENT 2: Advanced Analytics (High-Intent)**
```
IF (User_Taps_Analytics_Tab == True) AND (Tier == "Free")
  THEN Display soft paywall overlay:
    - Show blurred trend graph
    - Text: "See your sleep trends, HRV patterns, and adherence insights"
    - CTA: "Upgrade for $9/month"
    - Secondary: "View sample chart"
```

**MOMENT 3: Multi-Wearable Connection**
```
IF (User_Attempts_Wearable_Addition == True) AND (Connected_Wearables >= 1) AND (Tier == "Free")
  THEN Display contextual paywall:
    - Modal appears mid-flow
    - Text: "Connect unlimited wearables with Core"
    - CTA: "Upgrade for $9/month"
```

**Conversion Rate Target:** 10–15% of Free users upgrade after paywall exposure (Days 7–14)

#### STAGE 3: UPGRADE DECISION (Free Users, Days 14–30)

**Trigger 1: 7-Day Streak Achieved**
```
IF (Current_Streak >= 7) AND (Tier == "Free")
  THEN:
    1. Show celebration animation (2-second delay for emotional peak)
    2. Display upgrade modal:
       - Headline: "Unstoppable! 🎯"
       - Body: "You've unlocked 7 days in a row. Ready to see your full progress?"
       - CTA: "Unlock trends + coaching (try 7 days free)"
       - Subtext: "No credit card required"
    3. Track: `UpgradeModalShown_Event`
    4. Timeout: Modal auto-dismisses after 10 seconds
```

**Trigger 2: 14-Day Mark (No Upgrade Yet)**
```
IF (DaysSinceDownload >= 14) AND (Tier == "Free") AND (TrialStarted == False)
  THEN Send email:
    - Subject: "Here's what you've accomplished in 2 weeks"
    - Body: Include:
      * "You've logged 10+ sleep protocols"
      * "Your average sleep time: 7.2 hours (up 0.5h from Day 1)"
      * "Custom protocol builder can save you 2+ hours/week"
    - CTA: "See your full trends →"
```

**Conversion Rate Target:** 15% of Free users upgrade by Day 30

#### STAGE 4: RETENTION (Core Users, Days 30–90)

**Goal:** Maintain ≥4 days/week adherence, reduce churn to <5% monthly

**Churn Risk Detection:**

```
CHURN_RISK_SCORE = f(Days_Since_Last_Login, Adherence_Trend, Feature_Usage, Support_Tickets, Payment_Failures)

Features:
1. Days_Since_Last_Login:
   IF > 14 days → High Risk (0.7 score)
   IF > 7 days → Medium Risk (0.4 score)

2. Adherence_Trend (7-day vs. 30-day):
   IF (Adherence_7day < 2 days) AND (Adherence_30day >= 4 days) → High Risk (0.6)
   [User plateau detected]

3. Feature_Usage (Advanced Analytics):
   IF (Feature_Use_Count == 0) FOR 14+ days → Medium Risk (0.5)
   [User not leveraging paid value]

4. Support_Tickets:
   IF (Support_Tickets > 2) → Medium Risk (0.5)
   [Technical friction exists]

5. Payment_Failures:
   IF (Payment_Failures >= 1) → High Risk (0.8)
   [Involuntary churn imminent]

IF CHURN_RISK_SCORE > 0.7 THEN Trigger intervention
```

**Proactive Intervention:**
```
IF CHURN_RISK_SCORE > 0.7 THEN:
  Day 1: Send email
    - Subject: "We noticed you haven't logged in—everything okay?"
    - CTA: "Chat with support" OR "Book a quick call (10 min)"

  Day 3: Send push notification
    - Text: "Ready to get back on track? Your next sleep protocol starts tonight"

  Day 5: Offer alternative
    - "Thinking about taking a break? Pause your subscription for 30 days (no charge)"
```

**Involuntary Churn Prevention:**
```
IF (Payment_Failures >= 1) THEN:
  1. Trigger dunning email sequence (Day 0, Day 3, Day 5)
  2. Allow grace period (7 days) for card update
  3. Use account updater service (2–5x recovery rate)
```

**Monthly Churn Target:** <5% (Core tier), <3% (Pro tier)

#### STAGE 5: UPSELL (Core → Pro, Days 30+)

**Trigger 1: 30-Day Streak Achieved**
```
IF (Current_Streak >= 30) AND (Tier == "Core")
  THEN:
    1. Show celebration animation + trophy
    2. Display upsell modal:
       - Headline: "You're crushing it. Ready for personalized guidance?"
       - Body: "1-on-1 coaching is the #1 driver of 90-day adherence"
       - Feature: "2 coaching calls/month + AI-powered insights"
       - CTA: "Upgrade to Pro (try 7 days free)"
       - Social proof: "98% of Pro users hit their 60-day streak"
```

**Trigger 2: Plateau Detection**
```
IF (Adherence_7day < 4 days)
  AND (Adherence_30day >= 4 days)
  AND (Days_On_Core >= 30)
  AND (Tier == "Core")
  THEN Send proactive email:
    - Subject: "Hit a plateau? Here's how to break through"
    - Body: "Coaches help 80% of users regain momentum after plateaus"
    - CTA: "Try Pro for 7 days free"
```

**Conversion Rate Target:** 10% of Core users upgrade to Pro by Day 90

### Feature Gating Strategy

#### FREE TIER

**Unlocks:**
- ✅ 3 core protocols (Morning Light, Evening Light, Sleep Optimization)
- ✅ Basic adherence tracking (streak calendar, completion checkboxes)
- ✅ 1 wearable connection (Apple Health or Google Fit read-only)
- ✅ Evidence UX (DOI citations visible)
- ✅ Coach nudges (basic, 1 per day max)
- ✅ Anonymous leaderboard (view-only)

**Locks:**
- ❌ Protocol catalog (show locked protocols with "Core" badge)
- ❌ Advanced analytics (show blurred graphs)
- ❌ Custom protocol builder
- ❌ 2+ wearable connections
- ❌ Private challenges
- ❌ Coaching

**Rationale:** Free tier must deliver **full first-win experience** but lock **expansion features**.

#### CORE TIER ($9/month)

**Unlocks:**
- ✅ All Free features
- ✅ Unlimited protocols (50+ evidence-based protocols)
- ✅ Advanced analytics (trend graphs, HRV correlations)
- ✅ Custom protocol builder
- ✅ Unlimited wearable connections
- ✅ 3-5 contextual nudges/day
- ✅ Team challenges
- ✅ Priority email support (<24h)

**Locks:**
- ❌ 1-on-1 coaching
- ❌ Advanced AI insights
- ❌ Weekly group coaching

#### PRO TIER ($29/month)

**Unlocks:**
- ✅ Everything in Core
- ✅ 1-on-1 coaching (2 calls/month)
- ✅ Advanced AI insights
- ✅ Priority support (chat + phone, <4h)
- ✅ Dedicated coach assignment

**Locks:**
- ❌ Weekly coaching (4 calls/month)
- ❌ Bloodwork interpretation
- ❌ Supplement recommendations

#### ELITE TIER ($99/month)

**Unlocks:**
- ✅ Everything in Pro
- ✅ Weekly 1-on-1 coaching (4 calls/month)
- ✅ Bloodwork interpretation
- ✅ Personalized supplement stack
- ✅ Genetics consultation
- ✅ Private Slack channel

**Locks:** None (highest tier)

### Paywall UX Patterns

#### SOFT PAYWALL (Preview + Upgrade)

**Use Case:** Analytics, protocol catalog, feature previews

**Design:**
```
Visual: Overlay on partial content
  - Blur/dim the locked content
  - Display 1–2 key benefits above overlay
  - CTA button prominently placed (brand color)

Copy Template:
  Headline: "[Feature] with [Tier]"
  Example: "See your sleep trends with Core"

Body: 1–2 bullet outcomes
  • Track HRV patterns night-over-night
  • Correlate sleep to protocol adherence

CTA: "Start 7-day free trial" OR "Upgrade for $9/month"
Secondary: "Maybe later" (gray text, bottom)

Animation: 12–18% conversion lift vs. static
  - Subtle fade-in on overlay
  - Pulse/glow on CTA button
```

**Expected Conversion:** 8–12% of soft-paywall encounters

#### HARD PAYWALL (No Preview)

**Use Case:** Coaching calls, complex features

**Design:**
```
Visual: Modal, center screen, full-screen overlay
  - Show locked icon (padlock)
  - Feature name + description
  - No preview (too complex to demo)

Copy Template:
  Headline: "Unlock [Feature] with [Tier]"
  Body: 3–4 bullet benefits
  Social proof: "98% of Pro users maintain their habits"
  CTA: "Upgrade for $29/month"
  Secondary: "Learn more"

Dismissal: Close button (×) in top-right
```

**Expected Conversion:** 5–8% of hard-paywall encounters

#### CONTEXTUAL PAYWALL (Mid-Flow)

**Use Case:** Feature-gating triggered in-context

**Design:**
```
Trigger: User action (e.g., taps "Add wearable")

Flow:
  1. App intercepts action
  2. Displays modal (not full-screen; allow back button)
  3. Modal content:
     - Headline: "Ready to connect [Wearable]?"
     - Subheading: "Unlimited wearables are a Core feature"
     - CTA: "Upgrade to Core ($9/month)"
     - Secondary: "Go back"

Timing: Appears immediately after user initiation
Animation: Slide up from bottom
```

**Expected Conversion:** 12–15% of contextual-paywall encounters

### Churn-Save Tactics

#### TACTIC 1: Downgrade Offer (Pro → Core)

```
Trigger: User clicks "Cancel Pro subscription"

Offer Flow:
  1. Show modal: "Before you go..."
  2. Present offer: "Keep your data and analytics—downgrade to Core ($9/month)"
  3. Highlight retained features:
     ✅ Advanced analytics
     ✅ Custom protocols
     ✅ Unlimited wearables
  4. Highlight lost features:
     ❌ Coaching
     ❌ Weekly calls

Expected save rate: 30–40% of Pro cancelers
```

#### TACTIC 2: Pause Subscription

```
Trigger: User clicks "Cancel subscription"

Offer Flow:
  1. Show modal: "Taking a break?"
  2. Present offer: "Pause for 30 days (no charge, no commitment)"
  3. Timeline: "Your account resumes [30 days from today]"
  4. Reassurance: "You can unpause anytime"

Expected save rate: 20–25% of all cancelers
```

#### TACTIC 3: Discount Offer (Last Resort)

```
Trigger: User confirms cancellation intent

Offer Flow:
  1. Show modal: "Last chance—special offer for loyal users"
  2. Present offer: "20% off for 3 months"
  3. Timeline: "Offer expires in 24 hours"
  4. Terms: No auto-renewal increase; can cancel anytime

Expected save rate: 15–20% of hard cancelers

Caution: Do NOT offer to all cancelers (trains users to wait for deals)
```

#### TACTIC 4: Win-Back Campaign (Post-Churn, Day 30)

```
Trigger: User churned 30+ days ago, no login activity

Campaign Flow:
  1. Email sent on Day 30 post-churn
     Subject: "We miss you—here's what's new"

  2. Email content:
     - Highlight 2–3 new features shipped
     - Include 1-minute feature demo
     - Social proof: "Join 50K+ users"
     - Offer: "Come back for 50% off your first month"

  3. Cadence:
     Day 30: Email 1 (feature highlights)
     Day 45: Email 2 (user testimonial + discount)
     Day 60: Email 3 (final offer)

Expected conversion: 5–10% of churned users
```

### Subscription Management Stack

**Tech Requirements:**

**Subscription Billing:** RevenueCat or Stripe

```
Why RevenueCat:
  - Handles iOS (App Store), Android (Play Store), Web (Stripe) in one SDK
  - Manages trial logic, promotional offers, upgrade/downgrade flows
  - Provides analytics (conversion, churn, LTV)
  - Integrates with Mixpanel, Amplitude, Segment

Why Stripe (for web):
  - Direct payment control (lower fees)
  - Web checkout, billing portal, subscription API
  - Webhook support for custom logic
```

**User Profile Schema Updates:**
```
User {
  tier: enum["free", "core", "pro", "elite"]
  billing_cycle: enum["monthly", "annual"]
  subscription_start_date: timestamp
  subscription_renewal_date: timestamp
  trial_end_date: timestamp (null if no trial)

  // Pricing experiment tracking
  pricing_variant: enum["control", "variant_b", "variant_c"]
  pricing_test_cohort: string

  // Monetization signals
  wtp_survey_response: json
  feature_paywall_hits: integer
  last_paywall_feature: string
  coaching_inquiry_clicks: integer
}
```

**Feature Gating Implementation:**

```typescript
// Feature-by-tier matrix

PROTOCOL_ENGINE:
  Sleep & Light (3 protocols): ["free", "core", "pro", "elite"]
  All protocols (6 domains): ["core", "pro", "elite"]
  Custom protocol builder: ["core", "pro", "elite"]

ANALYTICS:
  Basic adherence (streaks): ["free", "core", "pro", "elite"]
  Advanced analytics: ["core", "pro", "elite"]
  AI recommendations: ["core", "pro", "elite"]

WEARABLES:
  Single wearable sync: ["free", "core", "pro", "elite"]
  Unlimited wearables: ["core", "pro", "elite"]

COACHING:
  0 calls/mo: ["free", "core"]
  2 calls/mo: ["pro"]
  4 calls/mo: ["elite"]

// Application logic
async function checkFeatureAccess(user_id, feature_flag) {
  const user = await User.findById(user_id)
  const allowedTiers = FEATURE_MATRIX[feature_flag]

  if (allowedTiers.includes(user.tier)) {
    return true
  } else {
    return showPaywallModal({
      feature: feature_flag,
      currentTier: user.tier,
      upgradeTo: nextTierWithFeature(feature_flag),
      price: TIER_PRICES[nextTierWithFeature]
    })
  }
}
```

---

## Referral & Viral Growth Mechanics

### Viral Coefficient & Network Effects

The **viral coefficient (k-factor)** measures sustainable user growth: k = (average referrals per user) × (referral conversion rate). A k-factor >1.0 means each user refers ≥1 new user, creating exponential growth with zero CAC.

**Dropbox exemplified this:** By rewarding both referrers and referees with 500MB storage per referral, they achieved k-factor enabling **3900% growth in 15 months** (100K→4M users).

Andrew Chen's research reveals: **retention fuels virality**. Products with weak retention require aggressive viral prompts at signup. Products with strong retention can afford natural, non-aggressive referral hooks embedded throughout the user journey.

### Referral Program Design

#### INCENTIVE STRUCTURE (Two-Sided, Duration-Capped)

```
REFERRAL_REWARDS = {
  referrer_reward: "1 month free Core",
  referee_reward: "1 month free Core (no credit card for first month)",
  max_referrals_per_year: 12,
  max_free_months_per_referrer_per_year: 12,
  referral_validity_window: "90 days",
  rejection_conditions: [
    "self_referral (referrer_email == referee_email)",
    "inactive_referee (referee never logs protocol after 30 days)",
    "fraud_pattern (referrer >12 referrals in 30 days)"
  ]
}

RATIONALE:
- Two-sided rewards increase conversion by 2–3x vs. single-sided
- 1 month Core matches Calm/Headspace benchmark
- 12-month cap prevents abuse
- 90-day window balances urgency with realistic timelines
```

#### REFERRAL LINK GENERATION & ATTRIBUTION

```
REFERRAL_LINK_SPEC = {
  format: "wellness-os.app/r/[USER_ID]_[UNIQUE_CODE]",
  example: "wellness-os.app/r/user_12345_xk9mq7z2",
  code_length: 8,
  code_charset: "alphanumeric_lowercase (no ambiguous chars)",
  tracking_method: "Firebase Dynamic Links OR Branch.io",
  deep_link_behavior: {
    if_app_installed: "Open app + auto-redirect to referral_landing_page",
    if_app_not_installed: "Redirect to App Store + set install_attribution_params",
    utm_params: "utm_source=referral&utm_medium=[referrer_id]"
  }
}
```

**Database Schema:**
```sql
CREATE TABLE referrals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referral_code VARCHAR(8) UNIQUE,
  referrer_user_id INT,
  referee_user_id INT,
  status ENUM('pending', 'activated', 'rejected'),
  created_at TIMESTAMP,
  activated_at TIMESTAMP,
  reward_applied_at TIMESTAMP,
  referral_source VARCHAR(50), -- 'link', 'email', 'sms', 'challenge'
  fraud_flag BOOLEAN DEFAULT FALSE,
  notes TEXT
);
```

#### ATTRIBUTION LOGIC

```
ATTRIBUTION_FLOW:
  1. NEW_USER_CLICKS_REFERRAL_LINK:
     - Capture referral_code in browser cookie + local storage
     - Track click event: {referral_code, timestamp, source_channel}

  2. NEW_USER_COMPLETES_SIGNUP:
     - Check for referral_code in cookie/local storage
     - IF referral_code EXISTS:
       a) Validate code: status != 'rejected' AND created_at within 90 days
       b) Fetch referrer_user_id from database
       c) Create record: {referral_code, new_user_id, status='activated'}
       d) Emit event: referral_activated(referrer_id, new_user_id)

  3. REWARD_DELIVERY (Post-Signup):
     - REFERRER:
       IF count <= 12:
         - Add 30 days to subscription
         - Send notification: "Your friend [Name] just signed up! +1 month Core."

     - REFEREE:
       - Auto-apply 1-month free Core trial
       - Set trial_end_date = NOW + 30 days
       - Send notification: "Welcome! You got 1 free month thanks to [Referrer Name]."
```

### Share Triggers & Timing

**DESIGN PRINCIPLE**: Prompt sharing at moments of high pride/achievement, not randomly.

#### TRIGGER 1: 7-Day Streak Achievement

```
TRIGGER_CONDITION:
  - User has logged protocol for 7 consecutive days
  - Trigger fires once per user
  - Ideal timing: ~30 min after Day 7 protocol completion

MODAL_PROMPT:
  Title: "🎉 You're on fire! 7-day streak unlocked."
  Body: "You've built a week-long habit. Want to inspire your friends?"
  CTA_Primary: "Share Streak" (bright, primary color)
  CTA_Secondary: "Keep Going" (secondary/subtle)

SHARE_FLOW:
  User taps "Share Streak":
    → Card generator API triggered
    → Backend renders card image (Puppeteer/Canvas)
    → Return: Download link + social share buttons

PSYCHOLOGY:
  - Pride moment: User has proof of behavior change
  - Social currency: 7-day streak signals discipline
  - Altruism trigger: "My friend could benefit too"
```

#### TRIGGER 2: 30-Day Protocol Mastery

```
TRIGGER_CONDITION:
  - User has logged protocol for 30 consecutive days
  - Trigger fires: In-app prompt + email 24h after if not engaged

MODAL_PROMPT (In-App):
  Title: "🏆 30-Day Master — You Did It!"
  Body: "You've transformed your [Protocol] habit. Invite a buddy to join."
  CTA_Primary: "Send Buddy Pass"
  CTA_Secondary: "View Stats"

BUDDY_PASS_FLOW:
  → Generate unique buddy_pass_code
  → Create shareable link: wellness-os.app/buddy/[CODE]
  → Pre-filled message: "[User] completed a 30-day challenge. Join them—get 1 month free."
```

#### TRIGGER 3: Insight Moment (Measurable Improvement Alert)

```
TRIGGER_CONDITION:
  - System detects significant positive trend
  - Examples:
    * Sleep quality improved ≥15% in last 7 days
    * HRV improvement ≥10% week-over-week

INSIGHT_NOTIFICATION (Push):
  Title: "Your sleep just improved 20%"
  Body: "Your new wind-down routine is working. Want to share this win?"

SHARE_CARD_PROMPT:
  Visual: Graph showing before/after sleep score trend
  Copy: "[User] improved sleep 20% in 30 days with Wellness OS"
  Data points: Sleep Score: 6.2 → 7.8
  CTA: "Share Your Success"
```

#### TRIGGER 4: Challenge Invitation

```
TRIGGER_CONDITION:
  - User starts/creates a new team challenge

CHALLENGE_SETUP_FLOW:
  1. User selects protocol + duration
  2. Sets goal (e.g., "Consistent 30-min morning light")
  3. System prompts: "Invite friends to compete"
  4. User can:
     a) Import contacts
     b) Manually paste phone numbers/emails
     c) Get shareable challenge link

CHALLENGE_INVITE_UX:
  - Send via SMS: "Let's do a 7-day Morning Light challenge together! [Link]"
  - Email invite: "Join me in a wellness challenge"
```

### Share Card Design & Rendering

#### CARD TEMPLATE 1: Streak Achievement

```
DESIGN_SPEC:
  Dimensions:
    - Instagram Story: 1080 x 1920 px (vertical)
    - Twitter/Facebook: 1200 x 630 px (landscape)

  Layout:
    - Header (top 15%): Wellness OS logo (60x60px)
    - Hero (center 40%):
      * Large streak number (72pt, bold)
      * Text: "Days" (smaller)
      * Visual: Confetti graphic
    - Stat Line (mid-20%):
      * "[User] built a [X]-day [Protocol] habit"
    - Evidence (bottom 20%):
      * "Backed by [N] peer-reviewed studies"
    - CTA (bottom):
      * "Join me on Wellness OS" (button-style)

  Color Scheme:
    - Primary: Brand color (#00B4D8)
    - Secondary: White/light gray background
    - Text: Dark gray/black for contrast
    - NO clutter; maximum 3 colors + white/black
```

#### CARD GENERATION API

```
API_ENDPOINT:
  POST /api/share-cards/generate

REQUEST_BODY:
  {
    user_id: 12345,
    card_type: "streak_7day" | "sleep_improvement" | "protocol_mastery",
    metric_values: {
      streak_count: 7,
      protocol_name: "Morning Light Exposure",
      before_score: 6.2,
      after_score: 7.8,
      improvement_percent: 25,
      user_name: "Alex Chen"
    }
  }

BACKEND_PROCESSING:
  1. Load card template (HTML + CSS)
  2. Inject user data
  3. Use Puppeteer (headless Chrome) or Canvas to render
  4. Output: PNG/JPEG image
  5. Upload to S3 or CDN
  6. Return: {
       image_url: "https://cdn.wellness-os.app/share-cards/card_12345.png",
       share_links: {
         twitter: "https://twitter.com/intent/tweet?...",
         instagram: "...",
         whatsapp: "..."
       }
     }

FRONTEND_UX:
  - Display card preview in modal
  - "Share" button opens social share sheet
  - "Download" saves image to camera roll
  - "Copy Link" copies referral link to clipboard
```

### Viral Loop Mechanics & K-Factor Optimization

#### K-FACTOR FORMULA & TARGET

```
K-FACTOR_BASELINE:
  k = (% users who share) × (# friends invited per share) × (% friends who convert)

  Conservative Baseline:
    - 20% of users share = 0.20
    - 5 friends per share = 5
    - 10% invitees sign up = 0.10
    - k = 0.20 × 5 × 0.10 = 0.10 (SUB-VIRAL)

  Target (MVP Post-Launch, Month 3–6):
    - 30% share = 0.30
    - 5.5 friends per share = 5.5
    - 15% conversion = 0.15
    - k = 0.30 × 5.5 × 0.15 = 0.2475 (SUB-VIRAL)

  Aspirational (Month 6–12):
    - 40% share = 0.40
    - 6.5 friends per share = 6.5
    - 20% conversion = 0.20
    - k = 0.40 × 6.5 × 0.20 = 0.52 (APPROACHING VIRAL)

IMPROVEMENT_LEVERS:
  1. Increase share rate (20% → 40%):
     - Add more triggers (5 vs. 1)
     - Improve share card design
     - Reduce friction (one-tap sharing)

  2. Increase invites per share (5 → 8):
     - Enable contact import
     - Bulk invite for team challenges

  3. Increase conversion rate (10% → 20%):
     - Better referral landing page
     - Longer trial window (30 days free)
     - Lower signup friction
```

### Buddy Pass System

```
BUDDY_PASS_MECHANICS:

  Allocation:
    - Core/Pro subscribers get 3 buddy passes per calendar year
    - Each buddy pass = 1 month free Core (on signup)

  Buddy Pass Code Generation:
    - Format: 8-character alphanumeric (e.g., XFKQ9MP2)
    - Linked to passer_user_id + creation_date
    - Expires: 90 days OR once redeemed

  Shareable Link:
    wellness-os.app/buddy/[BUDDY_PASS_CODE]

  Redemption Flow:
    1. Friend clicks link
    2. If app installed: Opens app
    3. If not: Redirects to App Store + sets attribution
    4. Friend sees: "Invited by [Name] to try Wellness OS free for 1 month"
    5. Friend signs up (1-tap via biometric)
    6. System auto-applies 1 month free Core
    7. Passer notified: "[Friend] activated your buddy pass! +1 month Core."
```

### Anti-Abuse Measures

```
FRAUD_DETECTION:

PATTERN_1: Self-Referrals
  - Detection: referrer_email == referee_email
  - Detection: referrer_ip == referee_ip + same device
  - Action: Flag referral as 'suspicious', do not apply reward

PATTERN_2: Inactive Referees
  - Detection: Referee signs up, never logs protocol, inactive >30 days
  - Action:
    * Day 30: Auto-reject referral, revoke referrer's reward
    * Send referee: "Claim your trial before it expires!"

PATTERN_3: Referral Farms (Abuse Scaling)
  - Detection:
    * Referrer has >12 successful referrals in 30 days
    * Multiple referrals from same IP/device
  - Action:
    * Flag account for manual review
    * Temporarily cap referral rewards
  - Threshold: 15+ referrals/month = automatic review

PREVENTION_MEASURES:
  - Email verification required
  - Rate-limiting: Max 5 referral sends per hour
  - Captcha on signup if triggered by referral link
  - Geolocation checks
```

---

## North Star Metrics & Analytics Framework

### North Star Metric Definition

A **North Star metric** is a single measure that guides all product and business decisions by reflecting core value delivered to users. Unlike vanity metrics (total signups, DAU), North Star metrics must: (1) lead directly to revenue, (2) reflect customer value, (3) measure sustainable progress.

For habit-tracking apps, the North Star typically measures *sustained adherence*. Research from Headspace shows users with ≥4 active days per week in the first 30 days have **5x higher 12-month retention**.

**PRIMARY NORTH STAR:**

```
Metric Name: %_users_6daysweek_adherence_d30

Calculation:
  (# users with ≥24 protocol logs in first 30 days) /
  (# users who signed up 30+ days ago)

Target: 40% of users achieve ≥6 days/week adherence by Day 30

Rationale:
  - Aligns product mission (build sustainable habits)
  - Predicts retention (6 days/week adherence = 60% D90 retention vs. 15% for sporadic users)
  - Predicts monetization (high adherence users upgrade at 3-4x higher rates)
  - Defensible via science (BJ Fogg behavior model)
```

**DEFINITION:**
- Count only users where `signup_date < (today - 30 days)`
- Protocol log = any user action logged
- Calculate 7-day rolling adherence and flag users where rolling adherence ≥85%

### Leading Indicators (Early Signals)

#### D1 LEADING INDICATOR: First Protocol Logged

```
Metric Name: d1_first_protocol_logged_pct
Definition: % of users who log ≥1 protocol within 24 hours of signup
Calculation:
  (# users where min(protocol_logged.timestamp) < (signup_date + 1 day)) /
  (# users in cohort) × 100
Target: 60% of users log first protocol within D1
Correlation: Users with D1 logged = 8x more likely to achieve North Star

ACTION RULE:
IF d1_first_protocol_logged_pct < 50% THEN
  - Alert product team
  - Investigate onboarding funnel drop-off
  - A/B test onboarding UX
  - Track time-to-first-protocol (target: <5 min median)
```

#### D7 LEADING INDICATOR: Weekly Engagement Pattern

```
Metric Name: d7_minimum_protocols_pct
Definition: % of users who log ≥4 protocols in first 7 days
Calculation:
  (# users where COUNT(protocol_logged events Day 0-7) ≥ 4) /
  (# users in cohort) × 100
Target: 50% of users log ≥4 protocols by D7
Correlation: Users with D7 ≥4 protocols = 5x more likely to achieve North Star

Why 4 protocols in 7 days:
  - BJ Fogg habit research: frequency matters more than perfection
  - 4/7 days = ~57% adherence establishes context-behavior loop
  - Realistic milestone that filters out one-time users

ACTION RULE:
IF d7_minimum_protocols_pct < 40% THEN
  - Cohort at risk; re-engagement urgency HIGH
  - Send day-7 notification
  - Offer streak-extension incentive
  - Segment by drop-off reason
```

#### D14 LEADING INDICATOR: Protocol Diversity

```
Metric Name: d14_protocol_diversity_pct
Definition: % of users who interact with ≥2 distinct protocols by D14
Calculation:
  (# users where COUNT(DISTINCT protocol_id) ≥ 2 by day 14) /
  (# users in cohort) × 100
Target: 45% of users explore ≥2 protocols by D14
Correlation: High diversity users = 2.5x more likely to convert to paid; 2x retention at D90

Why diversity matters:
  - Users trying only 1 protocol: 35% D30 retention
  - Users trying ≥2 protocols: 60% D30 retention
  - Signals exploration mindset vs. compliance mindset
```

### Key Product Metrics (AARRR Framework)

#### ACQUISITION

```
Metrics:
1. Total Signups: count unique user_id where event = "user_signup"
2. Signups by Channel: count by source (organic, paid, referral, partnership)
3. CAC by Channel: (spend) / (signups)

Targets:
- Organic: $0 CAC
- Referral: <$10 CAC
- Paid: <$20 CAC

IF acquisition_cost_ratio > 0.25 THEN marketing channel is unprofitable
```

#### ACTIVATION

```
Metrics:
1. Onboarding Completion Rate: % finish profile setup
2. D1 First Protocol Logged: % log ≥1 protocol within 24h
3. Time to First Win (TTFW): median time from signup to first protocol
4. Paywall Impressions per Activated User

Targets:
- Onboarding Completion: 85%
- D1 Activation: 60%
- TTFW: <5 minutes (median)
- Paywall Impressions by D7: >3 impressions/user

TTFW Calculation:
  SELECT
    user_id,
    TIMESTAMP_DIFF(MIN(protocol_logged.timestamp), signup_date, MINUTE)
      as minutes_to_first_protocol
  FROM events
  WHERE event_name = 'protocol_logged'
  GROUP BY user_id
  ORDER BY minutes_to_first_protocol
  -- Calculate MEDIAN (p50)
```

#### ENGAGEMENT

```
Metrics:
1. DAU: count(distinct user_id where app_opened today)
2. WAU: count(distinct user_id where ≥1 app_open last 7 days)
3. Stickiness (DAU/MAU): typical healthy range 20-40% for habit apps
4. Average Sessions per DAU
5. Session Length (median)

Targets:
- DAU growth: 10-15% week-over-week (MVP phase)
- Stickiness: 25% (Duolingo ≈30%, Headspace ≈20%)
- Avg Sessions/DAU: 1.2-1.5
- Session Length: 2-3 minutes median

stickiness = DAU / MAU
IF stickiness < 20% THEN engagement crisis
IF stickiness > 40% THEN habit-forming mechanics working
```

#### RETENTION

```
Metrics:
1. D1 Retention: % active on Day 2 after signup
2. D7 Retention: % active any day in Week 2 (Day 8-14)
3. D30 Retention: % active any day in Week 5+ (Day 30+)
4. Churn Rate: (# inactive 30 days) / (starting user base) × 100

Targets:
- D1 Retention: 65-70%
- D7 Retention: 45-55%
- D30 Retention: 35-40%

Unbounded Retention Calculation:
  SELECT
    DATE_TRUNC(signup_date, DAY) as cohort_date,
    COUNT(DISTINCT user_id) as cohort_size,
    COUNT(DISTINCT CASE
      WHEN MAX(last_active_date) >= signup_date + 30 THEN user_id
    END) * 100 / COUNT(DISTINCT user_id) as d30_retention_pct
  FROM users
  GROUP BY cohort_date
```

#### MONETIZATION

```
Metrics:
1. Free → Core Conversion Rate: % upgrade by Day 30
2. Core → Pro Conversion Rate: % upgrade by Day 90
3. MRR (Monthly Recurring Revenue): sum active subscriptions × tier price
4. LTV by Tier: (ARPU × gross margin) / monthly_churn_rate

Targets:
- Free → Core (D30): 8-12%
- Core → Pro (D90): 15-20%
- MRR Target (Month 6): $5k
- LTV (Core): $200-300 over 12 months

LTV Calculation Example (Core):
  ARPU = $25/mo
  Gross margin = 80%
  Monthly churn = 5%
  LTV = ($25 × 0.80) / 0.05 = $400
```

#### REFERRAL

```
Metrics:
1. Viral Coefficient (k-factor): # new users invited per existing user
   Formula: (# received referral) / (# shared link)
2. Referral Conversion Rate: % referred friends who sign up
3. Referral Share Rate: % users who share at least once

Targets:
- k-factor: 0.3-0.5 for habit apps
- Referral Conversion: 25-35%
- Share Rate: 20-30%

k-factor Calculation:
  SELECT
    DATE_TRUNC(signup_date, MONTH) as cohort_month,
    COUNT(DISTINCT referrer_id) as users_who_shared,
    COUNT(DISTINCT new_user_id) as friends_referred,
    COUNT(DISTINCT new_user_id) / COUNT(DISTINCT referrer_id)
      as viral_coefficient
  FROM referral_events
  GROUP BY cohort_month

Action Rules:
  IF k_factor < 0.2 THEN viral loop weak; incentivize sharing
  IF k_factor > 0.5 THEN viral mechanics working; increase incentive budget
```

### Event Instrumentation

#### TIER 1: CRITICAL EVENTS (Always Track)

**Event: user_signup**
```json
{
  "event_name": "user_signup",
  "timestamp": "2025-10-22T14:30:00Z",
  "user_id": "user_abc123",
  "properties": {
    "signup_source": "paid_search",
    "trial_email": "user@example.com",
    "timezone": "America/New_York"
  }
}
```

**Event: protocol_logged**
```json
{
  "event_name": "protocol_logged",
  "timestamp": "2025-10-22T07:15:00Z",
  "user_id": "user_abc123",
  "session_id": "session_xyz789",
  "properties": {
    "protocol_id": "protocol_morning_light",
    "protocol_name": "Morning Light Exposure",
    "logged_via": "nudge_tap",
    "time_of_day": "morning",
    "adherence_streak_current": 5
  }
}
```

**Event: paywall_viewed**
```json
{
  "event_name": "paywall_viewed",
  "timestamp": "2025-10-22T14:50:00Z",
  "user_id": "user_abc123",
  "properties": {
    "feature_name": "private_challenge",
    "tier_shown": "core"
  }
}
```

**Event: subscription_started**
```json
{
  "event_name": "subscription_started",
  "timestamp": "2025-10-22T14:55:00Z",
  "user_id": "user_abc123",
  "properties": {
    "tier": "core",
    "billing_cycle": "monthly",
    "trial_status": "trial_converted",
    "amount_usd": 25.00
  }
}
```

**Event Naming Convention:**
- Format: `[object]_[action]` (e.g., `protocol_logged`, `nudge_viewed`)
- Use snake_case
- Be specific
- Avoid dynamic values in event names

### Real-Time Alerts

```
ALERT 1: North Star Drop
Trigger: IF today's North_Star_pct < (7_day_average × 0.90)
Action: Slack #product-alerts
Message: "⚠️ North Star dropped to 35% (7-day avg: 40%)"
Severity: WARNING

ALERT 2: D1 Activation Drop
Trigger: IF D1_activation_pct < 50%
Action: Slack #growth-alerts
Message: "⚠️ D1 activation dropped to 48% (target: 60%)"
Severity: CRITICAL

ALERT 3: Error Spike
Trigger: IF error_rate > 5% in rolling 1-hour window
Action: PagerDuty to backend team
Message: "🚨 Error rate spiked to 7%"
Severity: CRITICAL

ALERT 4: Free → Core Conversion Drop
Trigger: IF conversion_rate < (30_day_baseline × 0.80)
Action: Email to founders + finance
Message: "💰 Free → Core conversion dropped 20% WoW"
Severity: WARNING
```

### Analytics Infrastructure

**MVP (Month 1-6):** Mixpanel for retention analysis, funnels, A/B testing

**Growth (Month 6+):** BigQuery + dbt for data modeling + Looker for BI dashboards

**Event Flow:**
```
App → Segment SDK → Mixpanel / BigQuery → Looker Dashboard → Alerts (Slack, PagerDuty)
```

---

## System Integration & Architecture

### Core Dependencies

**Analytics Infrastructure:**
1. **Event Collection**: Segment SDK (iOS/Android) or mParticle
2. **Analytics Platform**: Mixpanel (MVP) or BigQuery (growth)
3. **Real-Time Monitoring**: Looker + Slack webhooks
4. **Data Warehousing**: BigQuery for long-term storage

**Subscription Infrastructure:**
1. **RevenueCat SDK** (iOS, Android, React Native): In-app purchases
2. **Stripe API** (backend): Web subscriptions, webhooks
3. **Webhook Receivers**: Handle payment events

**Referral Infrastructure:**
1. **Firebase Dynamic Links** (primary): App install attribution
2. **Branch.io** (backup): Third-party deep linking
3. **Share Card Generation**: Puppeteer (headless Chrome) + S3/CloudFront CDN

**Citation Management:**
1. **CrossRef REST API** (free): DOI metadata
2. **PubMed API** (free): Biomedical papers
3. **Retraction Watch Database** (free): Retraction monitoring

**Accessibility Testing:**
1. **Automated**: Axe DevTools, Lighthouse
2. **Manual**: iOS Accessibility Inspector, TalkBack
3. **CI/CD Integration**: axe-core CLI

### Cross-Component Connections

**Protocol Engine ↔ All Systems:**
- Emits `protocol_logged` events to analytics
- Checks tier permissions for feature access
- Uses i18n strings for multi-language support
- Triggers referral share prompts at milestones

**Adaptive Coach ↔ Monetization:**
- Respects tier-based nudge quotas (Free: 1/day, Core: 2/day, Pro: 3/day)
- Triggers upsell moments (7-day streak → upgrade modal)
- Uses locale-aware protocol recommendations

**Evidence UX ↔ Citation System:**
- Real-time DOI lookup via CrossRef API
- Monthly retraction monitoring
- Protocol versioning triggers user notifications

**Analytics ↔ All Features:**
- Every feature interaction emits events
- Churn prediction feeds retention tactics
- Cohort analysis informs pricing experiments

### MVP Rollout Timeline

**Month 1 (MVP Launch):**
- Implement Free + Core tiers ($9/mo)
- WCAG 2.2 AA compliance (core screens)
- Basic citation database (manual CrossRef lookups)
- Tier 1 event tracking (signup, protocol_logged, paywall_viewed)
- Mixpanel dashboards (Product, Growth, Business)
- English (en-US) only; i18n architecture ready

**Month 2 (Growth Phase):**
- Launch Pro tier ($29/mo)
- Add referral program (single share trigger: 7-day streak)
- Add Tier 2 engagement events
- Real-time alerts (Slack) for North Star drops
- First A/B test (onboarding UX)

**Month 3-6 (Scale Phase):**
- Launch Elite tier ($99/mo)
- Expand referral triggers (30-day, mastery, insight, challenges)
- Spanish/French/German localization
- BigQuery export from Mixpanel
- Automated retraction monitoring
- Advanced cohort analysis

**Month 6+ (Data Warehouse Phase):**
- Full BigQuery + dbt + Looker stack
- Predictive models (churn prediction, LTV forecast)
- RTL language support (Arabic, Hebrew) framework
- WCAG 2.2 AAA compliance roadmap
- International compliance review

### Success Metrics (OKRs for 90 days)

- Free → Core conversion: 15% by Day 30 (vs. industry 9%)
- Core → Pro conversion: 10% by Day 90
- Monthly churn: <5% (Core), <3% (Pro)
- Trial conversion: 40%+ (vs. industry 37.3%)
- LTV:CAC ratio: ≥3:1
- k-factor: 0.3-0.5 by Month 6
- North Star (≥6 days/week adherence D30): 40%

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Maintained By:** Business Operations & Growth Team
**Review Cadence:** Monthly (after each major release)

**Total Character Count:** ~75,000+ characters
**Status:** Complete - All critical content preserved from source reports #21-#27
