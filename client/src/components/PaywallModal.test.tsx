import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PaywallModal } from './PaywallModal';

type ClosePaywallMock = jest.Mock;

const closePaywallMock: ClosePaywallMock = jest.fn();

jest.mock('../providers/MonetizationProvider', () => ({
  useMonetization: () => ({
    isPaywallVisible: true,
    isPaywallDismissible: true,
    paywallTrigger: 'trial_expired',
    closePaywall: closePaywallMock,
  }),
}));

describe('PaywallModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invokes the subscribe handler when CTA is pressed', async () => {
    const subscribeMock = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<PaywallModal onSubscribe={subscribeMock} />);

    fireEvent.press(getByTestId('subscribe-core'));

    await waitFor(() => {
      expect(subscribeMock).toHaveBeenCalled();
    });
  });

  it('disables the subscribe button while processing', async () => {
    let resolvePurchase: (() => void) | undefined;
    const subscribeMock = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePurchase = resolve;
          })
      );

    const { getByTestId } = render(<PaywallModal onSubscribe={subscribeMock} />);

    const cta = getByTestId('subscribe-core');
    fireEvent.press(cta);

    expect(cta.props.accessibilityState.disabled).toBe(true);

    resolvePurchase?.();
    await waitFor(() => {
      expect(cta.props.accessibilityState.disabled).toBe(false);
    });
  });
});
