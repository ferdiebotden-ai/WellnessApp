import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import type { DashboardTask } from '../types/dashboard';

const mockTasks: DashboardTask[] = [
  {
    id: 'task-1',
    title: 'Hydration Protocol',
    status: 'pending',
    source: 'schedule',
    scheduledAt: new Date('2024-01-01T08:00:00Z'),
  },
];

jest.mock('../hooks/useTaskFeed', () => ({
  useTaskFeed: () => ({
    tasks: mockTasks,
    loading: false,
  }),
}));

jest.mock('../services/firebase', () => ({
  firebaseAuth: { currentUser: { uid: 'user-123' } },
}));

describe('HomeScreen', () => {
  it('renders health metrics and tasks', () => {
    const { getByText, getByTestId } = render(
      <HomeScreen navigation={{ navigate: jest.fn() } as never} route={{ key: 'Home', name: 'Home' } as never} />
    );
    expect(getByText('Health Outcomes')).toBeTruthy();
    expect(getByText('Active Protocols')).toBeTruthy();
    expect(getByText('Unlock Next-Level Modules')).toBeTruthy();
    expect(getByText('Stress & Emotional Regulation')).toBeTruthy();
    expect(getByText("Today's Plan")).toBeTruthy();
    expect(getByText('Hydration Protocol')).toBeTruthy();
    expect(getByTestId('task-list')).toBeTruthy();
  });
});
