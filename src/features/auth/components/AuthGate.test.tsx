import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { DEFAULT_AUTH_USER } from '@/features/auth/constants/defaultAuthUser';
import {
  clearAuthSession,
  getAuthSession,
} from '@/features/auth/services/authSession';
import { AuthGate } from './AuthGate';

describe('AuthGate', () => {
  it('seeds the default auth session when no SSO params are present', () => {
    clearAuthSession();
    renderWithProviders(
      <AuthGate>
        <div>Dashboard content</div>
      </AuthGate>,
    );

    expect(getAuthSession()).toEqual(DEFAULT_AUTH_USER);
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('renders dashboard content when an SSO session already exists', () => {
    renderWithProviders(
      <AuthGate>
        <div>Dashboard content</div>
      </AuthGate>,
    );

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
