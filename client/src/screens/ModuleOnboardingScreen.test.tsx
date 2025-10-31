import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ModuleOnboardingScreen } from './ModuleOnboardingScreen';

jest.mock('../hooks/useCoreModules', () => ({
  useCoreModules: jest.fn(),
}));

jest.mock('../services/api', () => ({
  completeOnboarding: jest.fn(),
}));

const mockUseCoreModules = jest.requireMock('../hooks/useCoreModules').useCoreModules as jest.Mock;
const mockCompleteOnboarding = jest.requireMock('../services/api').completeOnboarding as jest.Mock;

describe('ModuleOnboardingScreen', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  it('requires module selection before continuing', () => {
    mockUseCoreModules.mockReturnValue({
      modules: [
        { id: 'module-1', name: 'Sleep Optimization', tier: 'core' as const },
      ],
      status: 'success',
      error: null,
      reload: jest.fn(),
    });

    const { getByText } = render(<ModuleOnboardingScreen />);

    fireEvent.press(getByText('Start my 14-day trial'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Choose a focus',
      'Please select your primary wellness goal to continue.'
    );
  });

  it('submits onboarding for the selected module', async () => {
    mockUseCoreModules.mockReturnValue({
      modules: [
        { id: 'module-1', name: 'Sleep Optimization', tier: 'core' as const },
        { id: 'module-2', name: 'Metabolic Fitness', tier: 'core' as const },
      ],
      status: 'success',
      error: null,
      reload: jest.fn(),
    });
    mockCompleteOnboarding.mockResolvedValue({ success: true });

    const { getByText } = render(<ModuleOnboardingScreen />);

    fireEvent.press(getByText('Sleep Optimization'));
    fireEvent.press(getByText('Start my 14-day trial'));

    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalledWith('module-1');
      expect(alertSpy).toHaveBeenCalledWith(
        "You're all set!",
        'Welcome to your tailored Wellness journey.'
      );
    });
  });

  it('surfaced onboarding errors to the user', async () => {
    mockUseCoreModules.mockReturnValue({
      modules: [
        { id: 'module-1', name: 'Sleep Optimization', tier: 'core' as const },
      ],
      status: 'success',
      error: null,
      reload: jest.fn(),
    });
    mockCompleteOnboarding.mockRejectedValue(new Error('network failure'));

    const { getByText } = render(<ModuleOnboardingScreen />);

    fireEvent.press(getByText('Sleep Optimization'));
    fireEvent.press(getByText('Start my 14-day trial'));

    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalledWith('module-1');
      expect(alertSpy).toHaveBeenCalledWith(
        'Something went wrong',
        'network failure',
        [
          { text: 'Try again', onPress: expect.any(Function) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    });
  });
});
