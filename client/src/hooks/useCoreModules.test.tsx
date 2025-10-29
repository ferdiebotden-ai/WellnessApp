import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useCoreModules } from './useCoreModules';

jest.mock('../services/api', () => ({
  fetchCoreModules: jest.fn(),
}));

const mockFetchCoreModules = jest.requireMock('../services/api').fetchCoreModules as jest.Mock;

const Harness: React.FC = () => {
  const { modules, status, error, reload } = useCoreModules();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="modules">{modules.length}</Text>
      <Text testID="error">{error ?? ''}</Text>
      <Text testID="reload" onPress={() => reload()}>
        reload
      </Text>
    </>
  );
};

describe('useCoreModules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads modules successfully', async () => {
    mockFetchCoreModules.mockResolvedValueOnce([
      { id: 'module-1', name: 'Sleep Optimization', tier: 'core' as const },
    ]);

    const { getByTestId } = render(<Harness />);

    await waitFor(() => expect(getByTestId('status').props.children).toBe('success'));
    expect(getByTestId('modules').props.children).toBe(1);
  });

  it('recovers after an error when reloading', async () => {
    mockFetchCoreModules
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ id: 'module-2', name: 'Metabolic Fitness', tier: 'core' as const }]);

    const { getByTestId } = render(<Harness />);

    await waitFor(() => expect(getByTestId('status').props.children).toBe('error'));
    expect(getByTestId('error').props.children).toBe('network');

    fireEvent.press(getByTestId('reload'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('success'));
    expect(getByTestId('modules').props.children).toBe(1);
  });
});
