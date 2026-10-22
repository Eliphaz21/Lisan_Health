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
                    full_name: 'Test Patient',
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
    it('renders with prominent brand logo above form and security indicators', () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <LoginPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      const logo = screen.getByAltText('LisanHealth Brand Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.png');

      expect(screen.getByRole('heading', { name: /Sign In to LisanHealth/i })).toBeInTheDocument();
      expect(screen.getByText(/የልሳን ጤና መግቢያ/i)).toBeInTheDocument();
      expect(screen.getByText(/TLS 1.3 End-to-End Encrypted/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('patient@example.com')).toBeInTheDocument();
    });

    it('toggles password visibility with show/hide button', () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <LoginPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText('Enter your secure password');
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

      fireEvent.change(screen.getByPlaceholderText('patient@example.com'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your secure password'), {
        target: { value: 'validPassword123' },
      });

      const submitBtn = screen.getByRole('button', { name: /Sign In to Portal/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'test@example.com', full_name: 'Test Patient' }),
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

      fireEvent.change(screen.getByPlaceholderText('patient@example.com'), {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your secure password'), {
        target: { value: 'wrongPass' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Sign In to Portal/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
      expect(mockSuccess).not.toHaveBeenCalled();
    });
  });

  describe('RegisterPage Component', () => {
    it('renders with brand logo and password strength meter', () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <RegisterPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      const logo = screen.getByAltText('LisanHealth Brand Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.png');

      expect(screen.getByRole('heading', { name: /Create Patient Account/i })).toBeInTheDocument();
      expect(screen.getByText(/አዲስ የታካሚ መለያ ይፍጠሩ/i)).toBeInTheDocument();

      const passInput = screen.getByPlaceholderText('Minimum 6 characters');
      fireEvent.change(passInput, { target: { value: 'Secret123!' } });

      expect(screen.getByText(/Password Strength/i)).toBeInTheDocument();
      expect(screen.getByText(/Strong/i)).toBeInTheDocument();
    });

    it('validates password mismatch and medical disclaimer acceptance', async () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <RegisterPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Dr. Abebe Bekele/i), {
        target: { value: 'Abebe Bekele' },
      });
      fireEvent.change(screen.getByPlaceholderText('abebe@example.com'), {
        target: { value: 'abebe@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Minimum 6 characters'), {
        target: { value: 'Pass1234' },
      });
      fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
        target: { value: 'DifferentPass' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Account & Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });

      // Fix confirm password but do not accept disclaimer yet
      fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
        target: { value: 'Pass1234' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Create Account & Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText(/Please confirm that you understand this system is an educational explainer/i)).toBeInTheDocument();
      });
    });

    it('successfully registers account and triggers onLoginSuccess', async () => {
      const mockSuccess = vi.fn();
      render(
        <MemoryRouter>
          <RegisterPage onLoginSuccess={mockSuccess} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Dr. Abebe Bekele/i), {
        target: { value: 'Abebe Bekele' },
      });
      fireEvent.change(screen.getByPlaceholderText('abebe@example.com'), {
        target: { value: 'abebe@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Minimum 6 characters'), {
        target: { value: 'ValidPass123' },
      });
      fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
        target: { value: 'ValidPass123' },
      });

      // Check disclaimer
      const disclaimerCheckbox = screen.getByRole('checkbox');
      fireEvent.click(disclaimerCheckbox);

      fireEvent.click(screen.getByRole('button', { name: /Create Account & Sign In/i }));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'abebe@example.com', full_name: 'Abebe Bekele' }),
          'mock-jwt-token-registered'
        );
      });
    });
  });
});
