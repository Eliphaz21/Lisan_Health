import React from 'react';
import { Link } from 'react-router-dom';
import type { HealthStatus, SupportedLanguage } from '../types/report';
import type { User } from '../types/auth';
import { translations } from '../utils/i18n';

interface NavbarProps {
  health: HealthStatus | null;
  language: SupportedLanguage;
  user: User | null;
  onOpenAdmin: () => void;
  onOpenHistory: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  language,
  user,
  onOpenAdmin,
  onOpenHistory,
  onLogout,
}) => {
  const t = translations[language];

  return (
    <header className="navbar" role="banner">
      <div className="container navbar-inner">
        <Link to="/" className="brand-wrapper" aria-label="LisanHealth Home">
          <img
            src="/logo.png"
            alt="LisanHealth Logo"
            className="brand-logo-img"
            width="42"
            height="42"
          />
          <div className="brand-title">
            <span className="brand-primary-text">
              LisanHealth{' '}
              <span className="brand-native-text">
                (ልሳን ጤና)
              </span>
            </span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Health Status Badge */}
          {health ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-base)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                fontWeight: 600,
              }}
              title={`API Version ${health.version} - ${health.environment}`}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-status-normal)',
                  display: 'inline-block',
                }}
              />
              <span>{t.apiOnline} (v{health.version})</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.75rem',
                color: 'var(--color-status-flag)',
                background: 'var(--color-status-flag-bg)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-status-flag)',
                  display: 'inline-block',
                }}
              />
              <span>{t.apiConnecting}</span>
            </div>
          )}

          {/* User Logged In Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={onOpenHistory}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                My History
              </button>

              {user.role === 'ADMIN' && (
                <button
                  onClick={onOpenAdmin}
                  style={{
                    background: 'rgba(184, 247, 228, 0.15)',
                    border: '1px solid #B8F7E4',
                    color: '#B8F7E4',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Admin Panel
                </button>
              )}

              <span style={{ fontSize: '0.8rem', color: '#A0A6B1', fontWeight: 600, marginLeft: '0.25rem' }}>
                {user.full_name.split(' ')[0]}
              </span>

              <button
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8A8F98',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  background: 'transparent',
                  color: 'var(--color-text-main)',
                  border: '1px solid var(--color-border)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  background: '#B8F7E4',
                  color: '#15171B',
                  border: 'none',
                  padding: '0.4rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 6px rgba(184, 247, 228, 0.25)',
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
