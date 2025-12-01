jest.mock('../services/wearables/aggregators', () => ({
  requestWearablePermissions: jest.fn().mockResolvedValue({
    status: 'authorized',
    source: 'apple_health',
  }),
}));

import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { requestWearablePermissions } from '../services/wearables/aggregators';
import { useWearablePermissions } from './useWearablePermissions';

const mockedRequestWearablePermissions = requestWearablePermissions as jest.MockedFunction<
  typeof requestWearablePermissions
>;

interface TestComponentProps {
  shouldPrompt: boolean;
  enabled?: boolean;
  onResult?: (status: ReturnType<typeof useWearablePermissions>) => void;
}

const TestComponent: React.FC<TestComponentProps> = ({ shouldPrompt, enabled = true, onResult }) => {
  const result = useWearablePermissions({ shouldPrompt, enabled });

  useEffect(() => {
    onResult?.(result);
  }, [onResult, result]);

  return null;
};

describe('useWearablePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequestWearablePermissions.mockResolvedValue({
      status: 'authorized',
      source: 'apple_health',
    });
  });

  it('does not request permissions during onboarding flow', () => {
    render(<TestComponent shouldPrompt={false} />);

    expect(mockedRequestWearablePermissions).not.toHaveBeenCalled();
  });

  it('requests permissions once the first win milestone is reached', async () => {
    const onResult = jest.fn();
    const { rerender } = render(<TestComponent shouldPrompt={false} onResult={onResult} />);

    expect(mockedRequestWearablePermissions).not.toHaveBeenCalled();

    rerender(<TestComponent shouldPrompt onResult={onResult} />);

    await waitFor(() => expect(mockedRequestWearablePermissions).toHaveBeenCalledTimes(1));
    expect(onResult).toHaveBeenLastCalledWith({ status: 'authorized', source: 'apple_health' });

    rerender(<TestComponent shouldPrompt onResult={onResult} />);
    expect(mockedRequestWearablePermissions).toHaveBeenCalledTimes(1);
  });

  it('surfaces permission errors when the native request fails', async () => {
    mockedRequestWearablePermissions.mockRejectedValueOnce(new Error('native error'));
    const onResult = jest.fn();

    const { rerender } = render(<TestComponent shouldPrompt={false} onResult={onResult} />);
    rerender(<TestComponent shouldPrompt onResult={onResult} />);

    await waitFor(() =>
      expect(onResult).toHaveBeenLastCalledWith({ status: 'denied', error: 'native error' })
    );
  });
});
