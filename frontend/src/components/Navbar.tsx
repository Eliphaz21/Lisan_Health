import React from 'react';
import type { HealthStatus } from '../types/report';

interface NavbarProps {
  health: HealthStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ health }) => {
  return (
    <header className="navbar" role="banner">
      <div className="container navbar-inner">
        <a href="/" className="brand-wrapper" aria-label="LisanHealth Home">
          <div className="brand-logo" aria-hidden="true">ል</div>
          <div className="brand-title">
            <span>LisanHealth <span style={{ fontWeight: 400, color: 'var(--color-primary-light)' }}>(ልሳን ጤና)</span></span>
            <span className="brand-subtitle">Your Health Report, in Your Language</span>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {health ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-base)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
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
              <span>API v{health.version} Online</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--color-status-flag)',
                background: 'var(--color-status-flag-bg)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
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
              <span>Connecting API...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
