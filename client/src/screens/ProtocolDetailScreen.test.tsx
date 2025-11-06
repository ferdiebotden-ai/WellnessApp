import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ProtocolDetailScreen } from './ProtocolDetailScreen';

jest.mock('../hooks/useProtocolDetail', () => ({
  useProtocolDetail: jest.fn(),
}));

jest.mock('../services/protocolLogs', () => ({
  enqueueProtocolLog: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? <View accessibilityLabel="modal">{children}</View> : null;
});

const mockUseProtocolDetail = jest.requireMock('../hooks/useProtocolDetail').useProtocolDetail as jest.Mock;
const mockEnqueueProtocolLog = jest.requireMock('../services/protocolLogs').enqueueProtocolLog as jest.Mock;

describe('ProtocolDetailScreen', () => {
  const createProps = () => ({
    route: {
      params: {
        protocolId: 'protocol-1',
        protocolName: 'Fallback Name',
        moduleId: 'module-9',
        enrollmentId: 'enroll-1',
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders protocol name and bullet summary', () => {
    mockUseProtocolDetail.mockReturnValue({
      protocol: {
        id: 'protocol-1',
        name: 'Evening Wind Down',
        description: 'Supports rest\nImproves sleep latency',
        citations: ['https://doi.org/123'],
      },
      status: 'success',
      error: null,
      reload: jest.fn(),
    });

    const { getByText } = render(<ProtocolDetailScreen {...createProps()} />);

    expect(getByText('Evening Wind Down')).toBeTruthy();
    expect(getByText('Supports rest')).toBeTruthy();
    expect(getByText('Improves sleep latency')).toBeTruthy();
  });

  it('opens evidence list and handles citation taps', () => {
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce();

    mockUseProtocolDetail.mockReturnValue({
      protocol: {
        id: 'protocol-1',
        name: 'Metabolic Reset',
        description: ['Stabilizes glucose'],
        citations: ['https://pubmed.gov/abc123'],
      },
      status: 'success',
      error: null,
      reload: jest.fn(),
    });

    const { getByText } = render(<ProtocolDetailScreen {...createProps()} />);

    fireEvent.press(getByText('View Evidence'));
    const citation = getByText('https://pubmed.gov/abc123');
    expect(citation).toBeTruthy();

    fireEvent.press(citation);
    expect(openUrlSpy).toHaveBeenCalledWith('https://pubmed.gov/abc123');

    openUrlSpy.mockRestore();
  });

  it('surfaces reload action on error', () => {
    const reloadMock = jest.fn();
    mockUseProtocolDetail.mockReturnValue({
      protocol: null,
      status: 'error',
      error: 'network',
      reload: reloadMock,
    });

    const { getByText } = render(<ProtocolDetailScreen {...createProps()} />);

    fireEvent.press(getByText('Tap to retry'));
    expect(reloadMock).toHaveBeenCalled();
  });

  it('queues a protocol log when the CTA is pressed', async () => {
    mockUseProtocolDetail.mockReturnValue({
      protocol: {
        id: 'protocol-1',
        name: 'Evening Wind Down',
        description: 'Supports rest',
        citations: [],
      },
      status: 'success',
      error: null,
      reload: jest.fn(),
    });
    mockEnqueueProtocolLog.mockResolvedValueOnce('doc-1');

    const { getByTestId, findByText } = render(<ProtocolDetailScreen {...createProps()} />);

    fireEvent.press(getByTestId('log-complete-button'));

    await findByText('✓ Logged');
    expect(mockEnqueueProtocolLog).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: 'protocol-1',
        moduleId: 'module-9',
      }),
    );
  });

  it('shows an error message when logging fails', async () => {
    mockUseProtocolDetail.mockReturnValue({
      protocol: {
        id: 'protocol-1',
        name: 'Evening Wind Down',
        description: 'Supports rest',
        citations: [],
      },
      status: 'success',
      error: null,
      reload: jest.fn(),
    });
    mockEnqueueProtocolLog.mockRejectedValueOnce(new Error('offline'));

    const { getByTestId, findByText } = render(<ProtocolDetailScreen {...createProps()} />);

    fireEvent.press(getByTestId('log-complete-button'));

    await findByText('offline');
  });
});
