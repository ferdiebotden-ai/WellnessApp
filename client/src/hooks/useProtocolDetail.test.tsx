import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { useProtocolDetail } from './useProtocolDetail';

jest.mock('../services/api', () => ({
  fetchProtocolById: jest.fn(),
}));

const mockFetchProtocolById = jest.requireMock('../services/api').fetchProtocolById as jest.Mock;

const Harness: React.FC<{ protocolId: string }> = ({ protocolId }) => {
  const { protocol, status, error, reload } = useProtocolDetail(protocolId);

  return (
    <View>
      <Text testID="status">{status}</Text>
      <Text testID="name">{protocol?.name ?? ''}</Text>
      <Text testID="error">{error ?? ''}</Text>
      <Text testID="reload" onPress={() => reload()}>
        reload
      </Text>
    </View>
  );
};

describe('useProtocolDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads protocol detail successfully', async () => {
    mockFetchProtocolById.mockResolvedValueOnce({
      id: 'protocol-1',
      name: 'Evening Wind Down',
      description: 'Supports rest',
      citations: ['https://doi.org/123'],
    });

    const { getByTestId } = render(<Harness protocolId="protocol-1" />);

    await waitFor(() => expect(getByTestId('status').props.children).toBe('success'));
    expect(getByTestId('name').props.children).toBe('Evening Wind Down');
  });

  it('recovers from errors when reloading', async () => {
    mockFetchProtocolById
      .mockRejectedValueOnce(new Error('network issue'))
      .mockResolvedValueOnce({
        id: 'protocol-2',
        name: 'Glucose Reset',
        description: 'Helps metabolic flexibility',
        citations: [],
      });

    const { getByTestId } = render(<Harness protocolId="protocol-2" />);

    await waitFor(() => expect(getByTestId('status').props.children).toBe('error'));
    expect(getByTestId('error').props.children).toBe('network issue');

    fireEvent.press(getByTestId('reload'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('success'));
    expect(getByTestId('name').props.children).toBe('Glucose Reset');
  });
});
