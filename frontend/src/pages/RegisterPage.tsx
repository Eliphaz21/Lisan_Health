import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon } from '../components/Icons';
import type { User, AuthResponse } from '../types/auth';

interface RegisterPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter them.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanName,
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Unable to register account.');
      }

      const authData = data as AuthResponse;
      localStorage.setItem('lisan_token', authData.access_token);
      localStorage.setItem('lisan_user', JSON.stringify(authData.user));

      onLoginSuccess(authData.user, authData.access_token);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      color: '#1F2937',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 1.5rem',
      position: 'relative',
    }}>
      {/* Top Bar with ONLY Back Arrow */}
      <div style={{
        maxWidth: '960px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        paddingBottom: '0.75rem',
      }}>
        <Link
          to="/"
          aria-label="Back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            color: '#1F2937',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            transition: 'background-color 0.2s',
          }}
        >
          <ArrowLeftIcon size={18} color="#1F2937" />
        </Link>
      </div>

      {/* Main Centered Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 0 2.5rem',
      }}>
        {/* Logo OUTSIDE the Card */}
        <Link
          to="/"
          aria-label="LisanHealth Home"
          style={{
            display: 'inline-block',
            marginBottom: '0.85rem',
            marginTop: '-1rem',
            textDecoration: 'none',
          }}
        >
          <img
            src="/logo.png"
            alt="LisanHealth Logo"
            style={{
              width: '68px',
              height: '68px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Link>

        {/* Compact Proportional White Card */}
        <div style={{
          width: '100%',
          maxWidth: '390px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '14px',
          padding: '1.75rem 1.75rem',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        }}>
          {/* Card Title & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '1.35rem' }}>
            <h1 style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#111827',
              margin: '0 0 0.35rem',
              letterSpacing: '-0.01em',
            }}>
              Create Account
            </h1>
            <p style={{
              fontSize: '0.825rem',
              color: '#6B7280',
              margin: 0,
            }}>
              Sign up to get started with LisanHealth
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1rem',
              color: '#DC2626',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.35rem',
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Abebe Bekele"
                required
                autoComplete="name"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  color: '#111827',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#25272C';
                  e.target.style.boxShadow = '0 0 0 2px rgba(37, 39, 44, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.35rem',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  color: '#111827',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#25272C';
                  e.target.style.boxShadow = '0 0 0 2px rgba(37, 39, 44, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.35rem',
              }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.4rem 0.65rem 0.85rem',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    color: '#111827',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#25272C';
                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 39, 44, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOffIcon size={16} color="#6B7280" /> : <EyeIcon size={16} color="#6B7280" />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.35rem',
              }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  color: '#111827',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#25272C';
                  e.target.style.boxShadow = '0 0 0 2px rgba(37, 39, 44, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.7rem',
                backgroundColor: loading ? '#9CA3AF' : '#25272C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Switch to Login */}
          <div style={{
            marginTop: '1.25rem',
            textAlign: 'center',
            fontSize: '0.825rem',
            color: '#6B7280',
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#25272C',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
