import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { TEST_AUTH_USER } from '@/features/auth/constants/testAuthUser';
import {
  clearAuthSession,
  getAuthSession,
} from '@/features/auth/services/authSession';
import { AuthGate } from './AuthGate';

describe('AuthGate', () => {
  it('seeds the test auth session when no session exists in test mode', () => {
    clearAuthSession();
    renderWithProviders(
      <AuthGate>
        <div>Dashboard content</div>
      </AuthGate>,
    );

    expect(getAuthSession()).toEqual(TEST_AUTH_USER);
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('renders dashboard content when an auth session already exists', () => {
    renderWithProviders(
      <AuthGate>
        <div>Dashboard content</div>
      </AuthGate>,
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
