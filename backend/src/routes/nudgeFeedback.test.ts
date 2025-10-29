import request from 'supertest';
import app from '../index';

jest.mock('../lib/firebase', () => ({
  verifyFirebaseIdToken: jest.fn(),
}));

jest.mock('../lib/supabase', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockVerifyFirebaseIdToken = jest.requireMock('../lib/firebase').verifyFirebaseIdToken as jest.Mock;
const mockGetSupabaseClient = jest.requireMock('../lib/supabase').getSupabaseClient as jest.Mock;

describe('POST /api/feedback/nudge/:nudge_log_id', () => {
  const nudgeLogId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects requests without authorization header', async () => {
    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .send({ feedback: 'thumb_up' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Missing or invalid Authorization header' });
  });

  it('rejects requests with invalid nudge_log_id', async () => {
    const response = await request(app)
      .post('/api/feedback/nudge/not-a-uuid')
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_up' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid nudge_log_id' });
  });

  it('returns 401 when token verification fails', async () => {
    mockVerifyFirebaseIdToken.mockRejectedValue(new Error('bad token'));

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_up' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid token' });
  });

  it('rejects requests with invalid feedback payload', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-1' });

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'neutral' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid feedback value' });
  });

  it('rejects requests when text is not a string', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-1' });

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_up', text: 123 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'text must be a string' });
  });

  it('returns 500 when fetching the audit log fails', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-1' });

    const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    const updateMock = jest.fn();

    const fromMock = jest.fn().mockImplementation((table: string) => {
      if (table !== 'ai_audit_log') {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: selectMock,
        update: updateMock,
      };
    });

    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_up' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch audit log record' });
  });

  it('returns 404 when audit log record is missing', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-1' });

    const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    const updateMock = jest.fn();

    const fromMock = jest.fn().mockImplementation(() => ({
      select: selectMock,
      update: updateMock,
    }));

    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_up' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Audit log record not found' });
  });

  it('returns 403 when user does not own the audit log entry', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-1' });

    const maybeSingleMock = jest.fn().mockResolvedValue({ data: { id: nudgeLogId, user_id: 'user-2' }, error: null });
    const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    const updateMock = jest.fn();

    const fromMock = jest.fn().mockImplementation(() => ({
      select: selectMock,
      update: updateMock,
    }));

    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_down' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  it('returns 500 when update fails', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-1' });

    const maybeSingleMock = jest.fn().mockResolvedValue({ data: { id: nudgeLogId, user_id: 'user-1' }, error: null });
    const eqSelectMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqSelectMock });

    const updateEqUserMock = jest.fn().mockImplementation(async (column: string, value: string) => {
      expect(column).toBe('user_id');
      expect(value).toBe('user-1');
      return { error: { message: 'update failed' } };
    });

    const updateEqIdMock = jest.fn().mockImplementation((column: string, value: string) => {
      expect(column).toBe('id');
      expect(value).toBe(nudgeLogId);
      return { eq: updateEqUserMock };
    });

    const updateMock = jest.fn().mockReturnValue({ eq: updateEqIdMock });

    const fromMock = jest.fn().mockImplementation(() => ({
      select: selectMock,
      update: updateMock,
    }));

    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_up', text: 'Nice' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to update feedback' });
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ user_feedback: 'thumb_up' }));
  });

  it('updates feedback successfully', async () => {
    mockVerifyFirebaseIdToken.mockResolvedValue({ uid: 'user-1' });

    const maybeSingleMock = jest.fn().mockResolvedValue({ data: { id: nudgeLogId, user_id: 'user-1' }, error: null });
    const eqSelectMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqSelectMock });

    const updateEqUserMock = jest.fn().mockImplementation(async (column: string, value: string) => {
      expect(column).toBe('user_id');
      expect(value).toBe('user-1');
      return { error: null };
    });

    const updateEqIdMock = jest.fn().mockImplementation((column: string, value: string) => {
      expect(column).toBe('id');
      expect(value).toBe(nudgeLogId);
      return { eq: updateEqUserMock };
    });

    const updateMock = jest.fn().mockReturnValue({ eq: updateEqIdMock });

    const fromMock = jest.fn().mockImplementation(() => ({
      select: selectMock,
      update: updateMock,
    }));

    mockGetSupabaseClient.mockReturnValue({ from: fromMock });

    const response = await request(app)
      .post(`/api/feedback/nudge/${nudgeLogId}`)
      .set('Authorization', 'Bearer token')
      .send({ feedback: 'thumb_down', text: 'Too generic' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(selectMock).toHaveBeenCalledWith('id, user_id');
    expect(eqSelectMock).toHaveBeenCalledWith('id', nudgeLogId);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ user_feedback: 'thumb_down' }));
    expect(maybeSingleMock).toHaveBeenCalled();
  });
});
