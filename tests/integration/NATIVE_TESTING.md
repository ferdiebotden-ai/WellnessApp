# Native Feature Testing Guide

> Manual testing procedures for native mobile features that cannot be automated in web/headless environments.

## Overview

Certain features require actual iOS/Android devices with wearable connections. This document provides structured test scenarios for QA.

---

## 1. HealthKit Integration (iOS)

### Prerequisites
- Physical iPhone with iOS 17+
- Apple Watch paired and synced
- HealthKit permissions granted to app

### Test Scenarios

#### 1.1 HRV Data Sync
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sleep overnight with Apple Watch | Sleep data recorded in Health app |
| 2 | Open Apex OS in morning | App syncs HRV, sleep, RHR data |
| 3 | Check daily_metrics table | `hrv_method: 'sdnn'`, values populated |
| 4 | View Recovery Dashboard | Score displayed with 5-component breakdown |

#### 1.2 Wake Detection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sleep with Apple Watch | Wake event detected automatically |
| 2 | Open app within 30 min of wake | Morning Anchor nudge appears |
| 3 | Tap "Confirm Wake" | Check-in questionnaire skipped (wearable user) |

---

## 2. Health Connect Integration (Android)

### Prerequisites
- Android device with Health Connect installed
- Samsung Watch, Fitbit, or Pixel Watch paired
- Health Connect permissions granted

### Test Scenarios

#### 2.1 Data Sync
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sleep overnight with wearable | Sleep data in Health Connect |
| 2 | Open Apex OS in morning | App syncs via Health Connect API |
| 3 | Check daily_metrics table | `hrv_method: 'rmssd'`, values populated |
| 4 | View Recovery Dashboard | Score displayed with correct zone color |

#### 2.2 Cross-Platform Parity
| Test | iOS | Android |
|------|-----|---------|
| HRV Method | SDNN | RMSSD |
| Sleep Detection | HealthKit | Health Connect |
| Recovery Range | 0-100 | 0-100 |
| Zone Thresholds | Same | Same |

---

## 3. Lite Mode (No Wearable)

### Prerequisites
- App installed on phone
- No wearable connected
- Onboarding completed with "Skip wearable" option

### Test Scenarios

#### 3.1 Wake Confirmation Overlay
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set phone aside overnight | - |
| 2 | Unlock phone between 4am-11am | Wake confirmation overlay appears |
| 3 | Tap "Let's Go" | Check-in questionnaire shows |
| 4 | Tap "Snooze" | Overlay dismissed, reappears in 10 min |
| 5 | Tap "Skip for today" | Overlay dismissed for 24 hours |

#### 3.2 Check-in Questionnaire
| Field | Input | Validation |
|-------|-------|------------|
| Sleep Quality | Slider 1-5 | Labels: Poor ↔ Excellent |
| Sleep Duration | Dropdown | Options: <5, 5-6, 6-7, 7-8, 8+ |
| Energy Level | Slider 1-5 | Labels: Low ↔ High |

#### 3.3 Check-in Score Calculation
| Inputs | Expected Score | Zone |
|--------|---------------|------|
| Quality: 4, Hours: 7-8, Energy: 4 | 75-80 | Green |
| Quality: 2, Hours: <5, Energy: 2 | 35-45 | Red/Yellow |
| Skip | 60 (default) | Yellow |

---

## 4. Push Notification Testing

### Prerequisites
- App configured for push notifications
- FCM token registered in users table

### Test Scenarios

#### 4.1 Nudge Delivery
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger nudge via scheduler | Push notification received |
| 2 | Tap notification | Deep link opens correct screen |
| 3 | Dismiss notification | Event logged in nudge_events |

#### 4.2 Suppression Rules
| Scenario | Setup | Expected |
|----------|-------|----------|
| Quiet Hours | Set 10pm-6am, trigger at 11pm | No notification |
| Daily Cap | 5 nudges already today | No notification |
| Low Recovery | Recovery <30% | Only morning anchor |

---

## 5. Calendar Integration (Google Calendar)

### Prerequisites
- Google Calendar connected
- OAuth token stored

### Test Scenarios

#### 5.1 MVD Detection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create 7+ hours of meetings for today | - |
| 2 | Open app | MVD badge appears on dashboard |
| 3 | Check suppression | Non-MVD nudges suppressed |

---

## 6. Test Execution Checklist

### Pre-Release Testing
- [ ] iOS HealthKit sync working
- [ ] Android Health Connect sync working
- [ ] Lite Mode check-in flow complete
- [ ] Push notifications delivered
- [ ] Deep links resolve correctly
- [ ] Suppression rules enforced
- [ ] Recovery scores calculate correctly

### Regression Testing
- [ ] No data loss on app update
- [ ] Existing baseline preserved
- [ ] Historical scores accessible
- [ ] Wearable reconnection works

---

## 7. Known Limitations

| Feature | Limitation | Workaround |
|---------|------------|------------|
| HealthKit | Background sync unreliable | Manual sync option |
| Health Connect | May require app restart | Clear cache |
| Wake Detection | Depends on phone unlock | Manual wake confirmation |
| Calendar | OAuth expires after 7 days | Re-auth flow |

---

## 8. Reporting Issues

When reporting native testing issues, include:
1. Device model and OS version
2. Wearable model (if applicable)
3. Steps to reproduce
4. Screenshots/videos
5. Supabase user ID (for log lookup)

---

*Document created: Session 51 (December 5, 2025)*
*Last updated: Session 51*
