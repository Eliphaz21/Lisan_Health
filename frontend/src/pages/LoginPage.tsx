import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, ShieldCheckIcon, AlertShieldIcon } from '../components/Icons';
import type { User, AuthResponse } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Read return URL if user was redirected from a protected action
  const returnTo = (location.state as any)?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid email address or password.');
      }

      const authData = data as AuthResponse;
      if (rememberMe) {
        localStorage.setItem('lisan_token', authData.access_token);
        localStorage.setItem('lisan_user', JSON.stringify(authData.user));
      } else {
        sessionStorage.setItem('lisan_token', authData.access_token);
        sessionStorage.setItem('lisan_user', JSON.stringify(authData.user));
        localStorage.setItem('lisan_token', authData.access_token);
        localStorage.setItem('lisan_user', JSON.stringify(authData.user));
      }

      onLoginSuccess(authData.user, authData.access_token);
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #191B1F 0%, #25272C 100%)',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      position: 'relative',
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        maxWidth: '1080px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1.5rem',
      }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#B8F7E4',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            background: 'rgba(184, 247, 228, 0.08)',
            border: '1px solid rgba(184, 247, 228, 0.2)',
            transition: 'all 0.2s',
          }}
        >
          <ArrowLeftIcon size={16} color="#B8F7E4" />
          <span>Back to Explainer</span>
        </Link>

        <div style={{
          fontSize: '0.75rem',
          color: '#8A8F98',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <ShieldCheckIcon size={16} color="#0D6E54" />
          <span>TLS 1.3 End-to-End Encrypted</span>
        </div>
      </div>

      {/* Main Card Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#25272C',
          border: '1px solid #363940',
          borderRadius: '18px',
          padding: '2.5rem 2rem',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.65)',
        }}>
          {/* Brand Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(184, 247, 228, 0.15) 0%, transparent 70%)',
              marginBottom: '0.75rem',
            }}>
              <img
                src="/logo.png"
                alt="LisanHealth Brand Logo"
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  background: '#191B1F',
                  border: '2px solid #89E6CB',
                  boxShadow: '0 4px 16px rgba(184, 247, 228, 0.25)',
                }}
              />
            </div>
            
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 0.25rem',
              letterSpacing: '-0.02em',
            }}>
              Sign In to LisanHealth
            </h1>
            
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#B8F7E4',
              marginBottom: '0.4rem',
            }}>
              የልሳን ጤና መግቢያ (ልሳን ጤና)
            </div>

            <p style={{
              fontSize: '0.825rem',
              color: '#94A3B8',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Access your saved medical reports, Addis AI localized translations, and speech audio.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#FCA5A5',
              fontSize: '0.85rem',
            }}>
              <AlertShieldIcon size={20} color="#F87171" />
              <div style={{ flex: 1 }}>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#CBD5E1',
                marginBottom: '0.45rem',
              }}>
                Email Address
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <MailIcon size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem 0.7rem 2.5rem',
                    background: '#191B1F',
                    border: '1px solid #363940',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B8F7E4'}
                  onBlur={(e) => e.target.style.borderColor = '#363940'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.45rem',
              }}>
                <label style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#CBD5E1',
                }}>
                  Password
                </label>
              </div>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <LockIcon size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.6rem 0.7rem 2.5rem',
                    background: '#191B1F',
                    border: '1px solid #363940',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B8F7E4'}
                  onBlur={(e) => e.target.style.borderColor = '#363940'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#94A3B8',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#B8F7E4', cursor: 'pointer' }}
                />
                Remember this device
              </label>

              <span style={{ color: '#64748B', fontSize: '0.75rem' }}>
                Encrypted Session
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: loading ? '#4B5563' : '#B8F7E4',
                color: loading ? '#D1D5DB' : '#15171B',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(184, 247, 228, 0.25)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                <span>Authenticating with AletCloud...</span>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #363940',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#94A3B8',
          }}>
            Don't have an account yet?{' '}
            <Link
              to="/register"
              style={{
                color: '#B8F7E4',
                fontWeight: 700,
                textDecoration: 'none',
                marginLeft: '0.25rem',
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        textAlign: 'center',
        paddingTop: '1.5rem',
        fontSize: '0.75rem',
        color: '#64748B',
      }}>
        LisanHealth Educational Explainer • HIPAA Aligned Privacy • Addis AI Localization
      </div>
    </div>
  );
};
