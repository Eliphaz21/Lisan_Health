import React from 'react';
import type { LabObservation, ObservationFlag, SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';
import { AlertShieldIcon } from './Icons';

interface ObservationTableProps {
  observations: LabObservation[];
  panelName: string;
  status: string;
  warnings?: string[];
  language: SupportedLanguage;
}

export const ObservationTable: React.FC<ObservationTableProps> = ({
  observations,
  panelName,
  status,
  warnings = [],
  language,
}) => {
  const t = translations[language];

  const renderFlagPill = (flag: ObservationFlag) => {
    const label = t.flagLabels[flag] || flag;
    switch (flag) {
      case 'NORMAL':
        return <span className="status-pill normal">{label}</span>;
      case 'LOW':
        return <span className="status-pill low">{label}</span>;
      case 'HIGH':
        return <span className="status-pill high">{label}</span>;
      case 'CRITICAL_LOW':
        return <span className="status-pill critical_low">{label}</span>;
      case 'CRITICAL_HIGH':
        return <span className="status-pill critical_high">{label}</span>;
      case 'UNCERTAIN':
      default:
        return <span className="status-pill uncertain">{label}</span>;
    }
  };

  const formatRefRange = (obs: LabObservation) => {
    const ref = obs.reference_interval;
    if (!ref) return '—';
    if (ref.text_representation) return ref.text_representation;
    if (ref.low != null && ref.high != null) {
      return `${ref.low} - ${ref.high} ${ref.unit || ''}`.trim();
    }
    if (ref.low != null) return `> ${ref.low} ${ref.unit || ''}`.trim();
    if (ref.high != null) return `< ${ref.high} ${ref.unit || ''}`.trim();
    return '—';
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            {panelName}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {observations.length} {t.measurementsExtracted}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span
            className="status-pill"
            style={{
              background: status === 'EXTRACTED' ? 'var(--color-primary-surface)' : 'var(--color-status-flag-bg)',
              color: status === 'EXTRACTED' ? 'var(--color-primary)' : 'var(--color-status-flag)',
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {warnings.length > 0 && (
        <div
          style={{
            background: 'var(--color-status-uncertain-bg)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            color: '#6D28D9',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}
        >
          <AlertShieldIcon size={20} color="#6D28D9" />
          <div>
            <strong>{t.warningsTitle}</strong>
            <ul style={{ margin: '0.25rem 0 0 1.25rem' }}>
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="results-table" aria-label={t.resultsTitle}>
          <thead>
            <tr>
              <th scope="col">{t.tableHeaderTest}</th>
              <th scope="col">{t.tableHeaderValue}</th>
              <th scope="col">{t.tableHeaderUnit}</th>
              <th scope="col">{t.tableHeaderRefRange}</th>
              <th scope="col">{t.tableHeaderStatus}</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((obs, idx) => (
              <tr key={idx} style={{ background: obs.needs_review ? '#FFFDF5' : undefined }}>
                <td>
                  <span className="test-name">{obs.test_name}</span>
                  {obs.code && <span className="test-code">({obs.code})</span>}
                  {obs.needs_review && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-status-flag)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertShieldIcon size={14} color="var(--color-status-flag)" />
                      <span>{obs.review_reason || t.reviewRequiredNotice}</span>
                    </div>
                  )}
                </td>
                <td className="test-value">
                  {obs.value != null ? obs.value : (obs.value_text || '—')}
                </td>
                <td style={{ color: 'var(--color-text-muted)' }}>{obs.unit || '—'}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{formatRefRange(obs)}</td>
                <td>{renderFlagPill(obs.flag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
