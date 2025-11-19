import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ChatModal } from './ChatModal';
import { sendChatQuery } from '../services/api';

jest.mock('../services/api', () => ({
  sendChatQuery: jest.fn(),
}));

describe('ChatModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(<ChatModal visible={true} onClose={jest.fn()} />);
    expect(getByText('AI Coach')).toBeTruthy();
  });

  it('sends a message and displays response', async () => {
    (sendChatQuery as jest.Mock).mockResolvedValue({
      response: 'Hello there!',
      conversationId: 'conv-1',
      citations: []
    });

    const { getByPlaceholderText, getByText } = render(<ChatModal visible={true} onClose={jest.fn()} />);
    
    const input = getByPlaceholderText('Ask your coach...');
    fireEvent.changeText(input, 'Hi');
    fireEvent.press(getByText('Send'));

    await waitFor(() => {
      expect(sendChatQuery).toHaveBeenCalledWith('Hi', undefined);
      expect(getByText('Hello there!')).toBeTruthy();
    });
  });

  it('handles errors gracefully', async () => {
    (sendChatQuery as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByPlaceholderText, getByText } = render(<ChatModal visible={true} onClose={jest.fn()} />);
    
    const input = getByPlaceholderText('Ask your coach...');
    fireEvent.changeText(input, 'Hi');
    fireEvent.press(getByText('Send'));

    await waitFor(() => {
      expect(getByText('Sorry, I encountered an error. Please try again.')).toBeTruthy();
    });
  });
});

