# Oura Ring API v2 Integration Reference

**Status:** Deferred (Session 36 decision)
**Last Updated:** December 4, 2025
**Research Source:** Perplexity Deep Research Pro (Dec 2025)

> This document preserves integration research for future implementation. Oura was deprioritized in favor of HealthKit-first strategy due to membership requirements and webhook reliability issues.

---

## Why Deferred

| Issue | Impact | Mitigation |
|-------|--------|------------|
| **Membership Required** | Gen 3/4 users must pay $5.99/mo for API access | User awareness in onboarding |
| **Webhook Unreliability** | 504/500 errors creating subscriptions (Q3-Q4 2025) | Polling fallback required |
| **Developer Approval** | Production apps may require manual review | Timeline uncertainty |
| **OAuth Complexity** | 24-hour tokens require proactive refresh | Additional backend complexity |

**Alternative:** HealthKit is free, on-device, and Oura syncs to Apple Health anyway.

---

## OAuth 2.0 Configuration

### Endpoints

| Purpose | URL |
|---------|-----|
| Authorization | `https://cloud.ouraring.com/oauth/authorize` |
| Token | `https://api.ouraring.com/oauth/token` |
| Revoke | `https://api.ouraring.com/oauth/revoke?access_token={token}` |
| Developer Portal | `https://cloud.ouraring.com` |

### Scopes

| Scope | Data Access | Required for Apex OS |
|-------|-------------|---------------------|
| `daily` | Sleep, activity, readiness summaries | **Required** |
| `heartrate` | Time-series HR, HRV (Gen 3+) | **Required** |
| `personal` | Age, gender, height, weight | **Required** |
| `email` | Email address | Optional |
| `workout` | Auto/manual workouts | Optional |
| `tag` | User-entered tags | Optional |
| `session` | Guided/unguided app sessions | Optional |
| `spo2` | Daily SpO2 average | Optional |

**Minimum scopes for Apex OS:** `daily heartrate personal`

### Token Lifecycle

| Token | Lifetime | Notes |
|-------|----------|-------|
| Access Token | 86,400 seconds (24 hours) | Must refresh proactively |
| Refresh Token | Undisclosed (long-lived) | **Single-use** — new token issued on each refresh |

**Proactive Refresh Pattern:**
```typescript
async function getValidAccessToken(userId: string): Promise<string> {
  const integration = await getIntegration(userId, 'oura');
  const expiresAt = new Date(integration.expiresAt);
  const bufferMs = 5 * 60 * 1000; // 5 minutes before expiry

  if (expiresAt.getTime() - Date.now() < bufferMs) {
    const newTokens = await refreshOuraToken(integration.refreshTokenEncrypted);
    await saveNewTokens(userId, newTokens); // MUST save new refresh_token!
    return newTokens.access_token;
  }

  return decrypt(integration.accessTokenEncrypted);
}
```

**Token Storage:**
- Encrypt with AES-256-GCM before storing
- Store in `wearable_integrations` table
- Decrypt only when making API calls

---

## API Rate Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Requests | 5,000 per 5-minute window | Rolling window |
| HTTP Code | 429 Too Many Requests | On limit exceeded |
| Headers | `X-RateLimit-Remaining`, `Retry-After` | Standard rate limit headers |

**Handling:**
```typescript
// Exponential backoff on 429
async function fetchWithRetry<T>(url: string, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, { headers });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      await sleep(retryAfter * 1000 * (attempt + 1)); // Exponential
      continue;
    }

    return response.json();
  }
  throw new Error('Rate limit exceeded after max retries');
}
```

---

## Data Endpoints

### Base URL
`https://api.ouraring.com/v2/usercollection/{data-type}`

### Sleep Data
```
GET /v2/usercollection/sleep?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
Authorization: Bearer {access_token}
```

**Response fields:**
- `id`, `day` (YYYY-MM-DD)
- `bedtime_start`, `bedtime_end` (ISO 8601)
- `average_hrv` (RMSSD in ms)
- `average_heart_rate`, `lowest_heart_rate` (BPM)
- `average_breath` (breaths/min)
- `efficiency` (0-100%)
- `latency` (sleep onset, seconds)
- `total_sleep_duration`, `deep_sleep_duration`, `rem_sleep_duration`, `light_sleep_duration` (seconds)
- `awake_time` (seconds)
- `type`: `long_sleep` | `late_nap` | `rest`

### Daily Readiness
```
GET /v2/usercollection/daily_readiness?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

**Response fields:**
- `score` (0-100)
- `temperature_deviation`, `temperature_trend_deviation` (Celsius)
- `contributors`: activity_balance, body_temperature, hrv_balance, previous_day_activity, previous_night, recovery_index, resting_heart_rate, sleep_balance

### Daily Activity
```
GET /v2/usercollection/daily_activity?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

**Response fields:**
- `score` (0-100)
- `steps`, `active_calories`, `total_calories`
- `high_activity_time`, `medium_activity_time`, `low_activity_time` (seconds)
- `sedentary_time`, `resting_time`, `non_wear_time` (seconds)

### Personal Info
```
GET /v2/usercollection/personal_info
```

**Response fields:**
- Age, gender, height, weight
- Ring generation (to detect Gen 3/4 membership requirement)

---

## Webhook Support (Unreliable as of Dec 2025)

### Status
**EXISTS BUT UNRELIABLE** — Multiple reports of 504/500 errors when creating new subscriptions.

### Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v2/webhook/subscription` | List subscriptions |
| POST | `/v2/webhook/subscription` | Create subscription (currently failing) |
| PUT | `/v2/webhook/subscription/{id}` | Update subscription |
| DELETE | `/v2/webhook/subscription/{id}` | Delete subscription |

### Signature Verification
- **Algorithm:** HMAC-SHA256 (assumed, not documented)
- **Header:** Likely `X-Oura-Signature` (not confirmed)
- **Recommendation:** Contact Oura Partner Support for verification specifics

### Workaround
Use **polling** instead of webhooks:
- Daily scheduled sync via Cloud Scheduler
- On-demand sync when user opens app
- Proactive token refresh to maintain access

---

## Membership Requirement

### Gen 3/4 Users
- **Active Oura Membership REQUIRED** for API access
- Cost: $5.99/month or $69.99/year
- API returns 401/403 when membership lapses
- No grace period documented

### Gen 2 Users
- Free API access forever
- No membership required

### Detection
```typescript
// Detect ring generation via personal_info endpoint
const personalInfo = await ouraClient.fetchPersonalInfo();
// Check for Gen 3/4 indicators and warn user about membership requirement
```

### Onboarding UX
1. After OAuth, fetch personal_info
2. If Gen 3/4 detected, display: "Oura Membership ($5.99/mo) required for continuous sync"
3. Monitor for 401/403 errors → surface "Oura connection needs attention"

---

## Sandbox Environment

- **Available:** Yes
- **Access:** `useSandbox: true` flag in client libraries
- **Benefits:** No real ring required, sample data, free
- **Use for:** Development, automated testing, CI/CD

---

## TypeScript Types (Already Created)

See `functions/src/types/wearable.types.ts` for:
- `OuraSleepResponse`
- `OuraReadinessResponse`
- `OuraActivityResponse`
- `OuraWebhookPayload`
- `WearableIntegration`
- `DailyMetrics` (canonical format)

---

## Implementation Checklist (For Future)

When implementing Oura integration:

- [ ] Register developer app at cloud.ouraring.com
- [ ] Set redirect URI to `https://api-xxx.run.app/api/auth/oura/callback`
- [ ] Add env vars: `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`
- [ ] Create `tokenEncryption.ts` (AES-256-GCM)
- [ ] Create `OuraClient.ts` with rate limit handling
- [ ] Create OAuth routes (`/api/auth/oura/connect`, `/callback`, `/disconnect`)
- [ ] Create `MetricsNormalizer.ts` (Oura → DailyMetrics)
- [ ] Create `WearableSyncService.ts` with backfill
- [ ] Set up Cloud Scheduler for daily sync
- [ ] Add webhook receiver if/when Oura fixes reliability
- [ ] Create client settings screen for connection UI

---

## References

- [Oura API Documentation](https://cloud.ouraring.com/v2/docs)
- [Oura Partner Support](https://partnersupport.ouraring.com)
- [OAuth Authentication](https://api.ouraring.com/docs/authentication)
- [Error Handling & Rate Limits](https://cloud.ouraring.com/docs/error-handling)
- [Oura Membership](https://support.ouraring.com/hc/en-us/articles/4409086524819-Oura-Membership)
