import { test, expect } from '@playwright/test';
import { createHmac } from 'crypto';

test.describe('RevenueCat subscription lifecycle', () => {
  test('webhook accepts valid Core subscription events', async ({ request }) => {
    test.skip(
      !process.env.REVENUECAT_WEBHOOK_TEST_URL || !process.env.REVENUECAT_WEBHOOK_TEST_SECRET,
      'RevenueCat webhook smoke test requires REVENUECAT_WEBHOOK_TEST_URL and REVENUECAT_WEBHOOK_TEST_SECRET.'
    );

    const url = process.env.REVENUECAT_WEBHOOK_TEST_URL as string;
    const secret = process.env.REVENUECAT_WEBHOOK_TEST_SECRET as string;

    const payload = {
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'playwright-user',
        product_id: 'core_monthly',
        transaction_id: 'test_txn_123',
      },
    };

    const body = JSON.stringify(payload);
    const signature = createHmac('sha256', secret).update(body).digest('base64');

    const response = await request.post(url, {
      data: payload,
      headers: {
        'content-type': 'application/json',
        'x-revenuecat-signature': signature,
      },
    });

    expect(response.ok()).toBeTruthy();
  });
});
