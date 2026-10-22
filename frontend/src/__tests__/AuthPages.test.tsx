import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

describe('Dedicated Auth Pages Tests', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url, options) => {
        if (url === '/api/v1/auth/login') {
          const body = JSON.parse(options.body);
          if (body.email === 'test@example.com' && body.password === 'validPassword123') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  access_token: 'mock-jwt-token-123',
                  token_type: 'bearer',
                  user: {
                    id: 'usr-123',
                    email: 'test@example.com',
                    full_name: 'Test User',
                    role: 'USER',
                    is_active: true,
                    created_at: '2026-10-22T00:00:00Z',
                  },
                }),
            });
          }
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ detail: 'Invalid email or password.' }),
          });
        }

        if (url === '/api/v1/auth/register') {
          const body = JSON.parse(options.body);
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                access_token: 'mock-jwt-token-registered',
                token_type: 'bearer',
                user: {
                  id: 'usr-reg-456',
                  email: body.email,
                  full_name: body.full_name,
                  role: 'USER',
                  is_active: true,
                  created_at: '2026-10-22T00:00:00Z',
                },
              }),
          });
        }

        return Promise.reject(new Error('Unknown endpoint'));
      })
    );
  });

  describe('LoginPage Component', () => {
    it('renders with clean brand logo above form and only back arrow', () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <LoginPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      const logo = screen.getByAltText('LisanHealth Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.png');

      const backLink = screen.getByRole('link', { name: /Back/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('toggles password visibility with show/hide button', () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <LoginPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByRole('button', { name: /Show password/i });
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('submits valid credentials and triggers onLoginSuccess callback', async () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <LoginPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'validPassword123' },
      });

      const submitBtn = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'test@example.com', full_name: 'Test User' }),
          'mock-jwt-token-123'
        );
      });
    });

    it('displays error banner when authentication fails', async () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <LoginPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'wrongPass' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
      expect(mockSuccess).not.toHaveBeenCalled();
    });
  });

  describe('RegisterPage Component', () => {
    it('renders with clean brand logo above form and only back arrow', () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <RegisterPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      const logo = screen.getByAltText('LisanHealth Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.png');

      const backLink = screen.getByRole('link', { name: /Back/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Abebe Bekele')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    });

    it('validates password mismatch before submission', async () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <RegisterPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Abebe Bekele'), {
        target: { value: 'Abebe Bekele' },
      });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'abebe@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Create a password/i), {
        target: { value: 'ValidPass123!' },
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
        target: { value: 'DifferentPass123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('successfully registers normal account and triggers onLoginSuccess', async () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <RegisterPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Abebe Bekele'), {
        target: { value: 'Abebe Bekele' },
      });
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
        target: { value: 'abebe@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Create a password/i), {
        target: { value: 'ValidPass123!' },
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
        target: { value: 'ValidPass123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'abebe@example.com', full_name: 'Abebe Bekele' }),
          'mock-jwt-token-registered'
        );
      });
    });
  });
});
