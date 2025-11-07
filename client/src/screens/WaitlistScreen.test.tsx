import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { WaitlistScreen } from './WaitlistScreen';
import { submitWaitlistEntry } from '../services/api';

jest.mock('../services/api', () => ({
  submitWaitlistEntry: jest.fn(),
}));

const createProps = () => ({
  navigation: {} as never,
  route: {
    key: 'Waitlist',
    name: 'Waitlist' as const,
    params: { tier: 'pro' as const, moduleName: 'Stress & Emotional Regulation' },
  },
});

const mockSubmit = submitWaitlistEntry as jest.Mock;

describe('WaitlistScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tier value propositions', () => {
    const { getByText } = render(<WaitlistScreen {...createProps()} />);
    expect(getByText('Pro Access')).toBeTruthy();
    expect(getByText('Unlimited AI chat coaching with contextual follow-ups')).toBeTruthy();
  });

  it('shows validation error for invalid email', () => {
    const { getByTestId, getByText, queryByText } = render(<WaitlistScreen {...createProps()} />);
    fireEvent.changeText(getByTestId('waitlist-email-input'), 'invalid-email');
    fireEvent.press(getByTestId('waitlist-submit-button'));
    expect(getByText('Please enter a valid email address.')).toBeTruthy();
    expect(queryByText("You're on the list! We'll notify you when Pro unlocks.")).toBeNull();
  });

  it('submits email and shows success state', async () => {
    mockSubmit.mockResolvedValueOnce({ success: true });
    const { getByTestId, getByText } = render(<WaitlistScreen {...createProps()} />);
    fireEvent.changeText(getByTestId('waitlist-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('waitlist-submit-button'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('user@example.com', 'pro');
      expect(getByText("You're on the list! We'll notify you when Pro unlocks.")).toBeTruthy();
    });
  });
});
