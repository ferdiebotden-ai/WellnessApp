import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text, TextInput, View } from 'react-native';
import { useProtocolSearch } from './useProtocolSearch';

jest.mock('../services/api', () => ({
  searchProtocols: jest.fn(),
}));

const mockSearchProtocols = jest.requireMock('../services/api').searchProtocols as jest.Mock;

const Harness: React.FC = () => {
  const { query, setQuery, results, status, error, search } = useProtocolSearch();

  return (
    <View>
      <TextInput testID="query" value={query} onChangeText={setQuery} />
      <Text testID="status">{status}</Text>
      <Text testID="results">{results.length}</Text>
      <Text testID="error">{error ?? ''}</Text>
      <Text testID="search" onPress={() => search(query)}>
        search
      </Text>
    </View>
  );
};

describe('useProtocolSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches protocols successfully', async () => {
    mockSearchProtocols.mockResolvedValueOnce([
      { id: 'protocol-1', name: 'Evening Wind Down', description: 'Supports rest' },
    ]);

    const { getByTestId } = render(<Harness />);

    fireEvent.changeText(getByTestId('query'), 'sleep');
    fireEvent.press(getByTestId('search'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('success'));
    expect(mockSearchProtocols).toHaveBeenCalledWith('sleep');
    expect(getByTestId('results').props.children).toBe(1);
  });

  it('clears results when the query is empty', async () => {
    mockSearchProtocols.mockResolvedValueOnce([
      { id: 'protocol-1', name: 'Evening Wind Down', description: 'Supports rest' },
    ]);

    const { getByTestId } = render(<Harness />);

    fireEvent.changeText(getByTestId('query'), 'sleep');
    fireEvent.press(getByTestId('search'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('success'));
    expect(getByTestId('results').props.children).toBe(1);

    fireEvent.changeText(getByTestId('query'), '   ');
    fireEvent.press(getByTestId('search'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('idle'));
    expect(getByTestId('results').props.children).toBe(0);
    expect(getByTestId('error').props.children).toBe('');
  });

  it('surfaces search errors', async () => {
    mockSearchProtocols.mockRejectedValueOnce(new Error('timeout'));

    const { getByTestId } = render(<Harness />);

    fireEvent.changeText(getByTestId('query'), 'recovery');
    fireEvent.press(getByTestId('search'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('error'));
    expect(getByTestId('error').props.children).toBe('timeout');
  });
});
