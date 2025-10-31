import request from 'supertest';
import app from '../index';

jest.mock('../lib/firebase', () => ({
  verifyFirebaseIdToken: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('../lib/pubsub', () => ({
  publishOnboardingCompleted: jest.fn(),
}));

const mockVerifyFirebaseIdToken = jest.requireMock('../lib/firebase').verifyFirebaseIdToken as jest.Mock;
const mockGetSupabaseClient = jest.requireMock('../lib/supabase').getSupabaseClient as jest.Mock;
const mockPublishOnboardingCompleted = jest.requireMock('../lib/pubsub').publishOnboardingCompleted as jest.Mock;

describe('POST /api/onboarding/complete', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects requests without authorization header', async () => {
    const response = await request(app)
      .post('/api/onboarding/complete')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Missing or invalid Authorization header' });
  });

  it('rejects requests with invalid payload', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-123' });

    const response = await request(app)
      .post('/api/onboarding/complete')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'primary_module_id is required' });
  });

  it('completes onboarding and enqueues nudge event', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-123' });

    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
    const insertMock = jest.fn().mockResolvedValue({ error: null });

    const fromMock = jest.fn((table: string) => {
      if (table === 'users') {
        return { update: updateMock };
      }

      if (table === 'module_enrollment') {
        return { insert: insertMock };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    mockGetSupabaseClient.mockReturnValue({ from: fromMock });
    mockPublishOnboardingCompleted.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/onboarding/complete')
      .set('Authorization', 'Bearer good-token')
      .send({ primary_module_id: 'module-456' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(updateMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-123',
        module_id: 'module-456',
        is_primary: true,
      }),
    ]);
    expect(mockPublishOnboardingCompleted).toHaveBeenCalledWith({
      user_id: 'user-123',
      primary_module_id: 'module-456',
    });
  });
});
