#!/bin/bash
# Deployment Verification Script
# Run this to check your current deployment status

set -e

PROJECT="wellness-os-app"
REGION="us-central1"

echo "========================================"
echo "WELLNESS OS - DEPLOYMENT VERIFICATION"
echo "========================================"
echo ""

# Check 1: Pub/Sub Topics
echo "✓ Checking Pub/Sub Topics..."
gcloud pubsub topics list --project=$PROJECT --format="table(name)" | grep -E "(daily-tick|hourly-tick)" && echo "  ✅ Topics exist" || echo "  ❌ Topics missing"
echo ""

# Check 2: Cloud Functions
echo "✓ Checking Cloud Functions..."
FUNCTIONS=$(gcloud functions list --region=$REGION --project=$PROJECT --format="value(name)" 2>/dev/null)
if echo "$FUNCTIONS" | grep -q "api"; then
    echo "  ✅ api function deployed"
else
    echo "  ❌ api function NOT deployed"
fi

if echo "$FUNCTIONS" | grep -q "generateDailySchedules"; then
    echo "  ✅ generateDailySchedules function deployed"
else
    echo "  ❌ generateDailySchedules function NOT deployed"
fi

if echo "$FUNCTIONS" | grep -q "generateAdaptiveNudges"; then
    echo "  ✅ generateAdaptiveNudges function deployed"
else
    echo "  ❌ generateAdaptiveNudges function NOT deployed"
fi
echo ""

# Check 3: Cloud Scheduler Jobs
echo "✓ Checking Cloud Scheduler Jobs..."
JOBS=$(gcloud scheduler jobs list --location=$REGION --project=$PROJECT --format="value(name)" 2>/dev/null)
if echo "$JOBS" | grep -q "daily-schedule-trigger"; then
    echo "  ✅ daily-schedule-trigger exists"
else
    echo "  ❌ daily-schedule-trigger NOT created"
fi

if echo "$JOBS" | grep -q "hourly-nudge-trigger"; then
    echo "  ✅ hourly-nudge-trigger exists"
else
    echo "  ❌ hourly-nudge-trigger NOT created"
fi
echo ""

# Check 4: Latest Deployment
echo "✓ Checking latest function deployment..."
LATEST_FUNCTION=$(gcloud functions describe api --region=$REGION --project=$PROJECT --format="value(updateTime)" 2>/dev/null)
if [ -n "$LATEST_FUNCTION" ]; then
    echo "  Last api function update: $LATEST_FUNCTION"
else
    echo "  ❌ Cannot determine deployment time"
fi
echo ""

# Check 5: Function URLs
echo "✓ Function URLs:"
API_URL=$(gcloud functions describe api --region=$REGION --project=$PROJECT --format="value(serviceConfig.uri)" 2>/dev/null)
if [ -n "$API_URL" ]; then
    echo "  API Endpoint: $API_URL"
else
    echo "  ❌ API endpoint not found"
fi
echo ""

echo "========================================"
echo "NEXT STEPS:"
echo "========================================"
echo ""
echo "If any ❌ appear above, follow these steps:"
echo ""
echo "1. Deploy functions (if not deployed or outdated):"
echo "   cd functions && npm run build && firebase deploy --only functions"
echo ""
echo "2. Create Cloud Scheduler jobs (if missing):"
echo "   See DEPLOYMENT_CHECKLIST.md - Step 7"
echo ""
echo "3. Run database migrations (if not done):"
echo "   - Open Supabase SQL Editor"
echo "   - Run: supabase/migrations/20251122000000_add_headline_to_modules.sql"
echo ""
echo "4. Seed modules & protocols (if not done):"
echo "   - Run: supabase/seed/mission_009_modules_protocols.sql"
echo ""
