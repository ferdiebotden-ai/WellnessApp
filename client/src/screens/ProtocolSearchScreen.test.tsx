import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ProtocolSearchScreen } from './ProtocolSearchScreen';

jest.mock('../hooks/useProtocolSearch', () => ({
  useProtocolSearch: jest.fn(),
}));

const mockUseProtocolSearch = jest.requireMock('../hooks/useProtocolSearch').useProtocolSearch as jest.Mock;

describe('ProtocolSearchScreen', () => {
  const navigation = { navigate: jest.fn() as jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    navigation.navigate = jest.fn();
  });

  it('triggers a search when the button is pressed', () => {
    const searchMock = jest.fn();
    mockUseProtocolSearch.mockReturnValue({
      query: 'sleep',
      setQuery: jest.fn(),
      results: [],
      status: 'idle',
      error: null,
      search: searchMock,
    });

    const { getByText } = render(<ProtocolSearchScreen navigation={navigation} />);

    fireEvent.press(getByText('Search'));
    expect(searchMock).toHaveBeenCalledWith('sleep');
  });

  it('navigates to the protocol detail screen on selection', () => {
    mockUseProtocolSearch.mockReturnValue({
      query: 'sleep',
      setQuery: jest.fn(),
      results: [
        { id: 'protocol-1', name: 'Evening Wind Down', description: 'Supports rest' },
        { id: 'protocol-2', name: 'Metabolic Reset', description: 'Supports glucose balance' },
      ],
      status: 'success',
      error: null,
      search: jest.fn(),
    });

    const { getByText } = render(<ProtocolSearchScreen navigation={navigation} />);

    fireEvent.press(getByText('Evening Wind Down'));

    expect(navigation.navigate).toHaveBeenCalledWith('ProtocolDetail', {
      protocolId: 'protocol-1',
      protocolName: 'Evening Wind Down',
    });
  });
});
