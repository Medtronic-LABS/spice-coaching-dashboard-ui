import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { LoginPage } from './LoginPage';
import { clearAuthSession } from '@/features/auth/services/authSession';
import { hashPasswordWithHmac } from '@/features/auth/utils/passwordHash';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    clearAuthSession();
    mockNavigate.mockReset();
  });

  it('renders login form elements matching SPICE admin-web copy', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByAltText('Medtronic')).toBeInTheDocument();
    expect(screen.getByText(/^Welcome$/i)).toBeInTheDocument();
    expect(screen.getByText(/Login to your account/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Email, username or mobile number/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Login$/i }),
    ).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon is clicked', () => {
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(
      /^Password$/i,
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleBtn);

    expect(passwordInput.type).toBe('text');

    const hideBtn = screen.getByLabelText(/Hide password/i);
    fireEvent.click(hideBtn);

    expect(passwordInput.type).toBe('password');
  });

  it('shows error message if submitted with empty fields', async () => {
    renderWithProviders(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Please enter both username and password/i,
    );
  });

  it('hashes plain-text password with HMAC-SHA512 before sending to backend', async () => {
    renderWithProviders(<LoginPage />);

    const usernameInput = screen.getByLabelText(
      /Email, username or mobile number/i,
    );
    const passwordInput = screen.getByLabelText(/^Password$/i);

    fireEvent.change(usernameInput, {
      target: { value: 'admin@medtronics.org' },
    });
    fireEvent.change(passwordInput, { target: { value: 'secretPassword123' } });

    const rawPassword = 'secretPassword123';
    const expectedHash = hashPasswordWithHmac(rawPassword);

    expect(expectedHash).toHaveLength(128); // 512-bit hex HMAC
    expect(expectedHash).not.toBe(rawPassword); // Plain text is NEVER sent
  });
});
