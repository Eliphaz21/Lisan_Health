import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types/auth';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
}) => {
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
          {/* User Logged In Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to="/history"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                My History
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  style={{
                    background: 'rgba(184, 247, 228, 0.15)',
                    border: '1px solid #B8F7E4',
                    color: '#B8F7E4',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  Admin Panel
                </Link>
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
