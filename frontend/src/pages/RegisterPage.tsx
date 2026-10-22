import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon, ArrowLeftIcon, ShieldCheckIcon, AlertShieldIcon, CheckIcon } from '../components/Icons';
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
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: '#363940' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
    if (score === 3) return { score: 3, label: 'Good', color: '#10B981' };
    return { score: 4, label: 'Strong', color: '#B8F7E4' };
  };

  const strength = getPasswordStrength(password);

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
      setError('Passwords do not match. Please re-enter them carefully.');
      return;
    }

    if (!acceptDisclaimer) {
      setError('Please confirm that you understand this system is an educational explainer and not a medical diagnosis tool.');
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
          <span>HIPAA & Data Privacy Aligned</span>
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
          maxWidth: '500px',
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
              Create Patient Account
            </h1>
            
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#B8F7E4',
              marginBottom: '0.4rem',
            }}>
              አዲስ የታካሚ መለያ ይፍጠሩ (ልሳን ጤና)
            </div>

            <p style={{
              fontSize: '0.825rem',
              color: '#94A3B8',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Join Ethiopia's premier medical report explainer. Save explanations, view blood lab histories, and stream localized voice audio.
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
            {/* Full Name */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#CBD5E1',
                marginBottom: '0.45rem',
              }}>
                Full Name
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
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Abebe Bekele / Sara Tadesse"
                  required
                  autoComplete="name"
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

            {/* Email Field */}
            <div style={{ marginBottom: '1.15rem' }}>
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
                  placeholder="abebe@example.com"
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
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#CBD5E1',
                marginBottom: '0.45rem',
              }}>
                Password
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
                  <LockIcon size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {password && (
                <div style={{ marginTop: '0.45rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.7rem',
                    color: '#94A3B8',
                    marginBottom: '0.25rem',
                  }}>
                    <span>Password Strength</span>
                    <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                  </div>
                  <div style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: '#191B1F',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                      transition: 'all 0.3s ease',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#CBD5E1',
                marginBottom: '0.45rem',
              }}>
                Confirm Password
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
                  <LockIcon size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
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

            {/* Medical Disclaimer Checkbox */}
            <div style={{
              background: '#191B1F',
              border: '1px solid #363940',
              borderRadius: '10px',
              padding: '0.85rem',
              marginBottom: '1.5rem',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '0.775rem',
                color: '#94A3B8',
                cursor: 'pointer',
                lineHeight: 1.45,
              }}>
                <input
                  type="checkbox"
                  checked={acceptDisclaimer}
                  onChange={(e) => setAcceptDisclaimer(e.target.checked)}
                  style={{
                    accentColor: '#B8F7E4',
                    marginTop: '2px',
                    cursor: 'pointer',
                  }}
                />
                <span>
                  I understand that <strong style={{ color: '#FFFFFF' }}>LisanHealth is an educational tool</strong> to help patients understand lab results, and is not a medical diagnosis or prescription. Always consult a qualified Ethiopian physician for clinical decisions.
                </span>
              </label>
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
                <span>Registering Account with AletCloud...</span>
              ) : (
                <>
                  <CheckIcon size={18} color="#15171B" />
                  <span>Create Account & Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #363940',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#94A3B8',
          }}>
            Already have a patient or clinician account?{' '}
            <Link
              to="/login"
              style={{
                color: '#B8F7E4',
                fontWeight: 700,
                textDecoration: 'none',
                marginLeft: '0.25rem',
              }}
            >
              Sign In
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
