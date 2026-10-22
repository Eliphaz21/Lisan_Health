import React from 'react';
import type { HealthStatus, SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';

interface NavbarProps {
  health: HealthStatus | null;
  language: SupportedLanguage;
}

export const Navbar: React.FC<NavbarProps> = ({ health, language }) => {
  const t = translations[language];

  return (
    <header className="navbar" role="banner">
      <div className="container navbar-inner">
        <a href="/" className="brand-wrapper" aria-label="LisanHealth Home">
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
            <span className="brand-subtitle">{t.tagline}</span>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {health ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-base)',
                padding: '0.35rem 0.75rem',
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
                fontSize: '0.8rem',
                color: 'var(--color-status-flag)',
                background: 'var(--color-status-flag-bg)',
                padding: '0.35rem 0.75rem',
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
        </div>
      </div>
    </header>
  );
};
