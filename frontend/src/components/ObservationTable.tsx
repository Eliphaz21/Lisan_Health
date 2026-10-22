import React from 'react';
import type { LabObservation, ObservationFlag } from '../types/report';

interface ObservationTableProps {
  observations: LabObservation[];
  panelName: string;
  status: string;
  warnings?: string[];
}

export const ObservationTable: React.FC<ObservationTableProps> = ({
  observations,
  panelName,
  status,
  warnings = [],
}) => {
  const renderFlagPill = (flag: ObservationFlag) => {
    switch (flag) {
      case 'NORMAL':
        return <span className="status-pill normal">Normal</span>;
      case 'LOW':
        return <span className="status-pill low">Low</span>;
      case 'HIGH':
        return <span className="status-pill high">High</span>;
      case 'CRITICAL_LOW':
        return <span className="status-pill critical_low">Critical Low</span>;
      case 'CRITICAL_HIGH':
        return <span className="status-pill critical_high">Critical High</span>;
      case 'UNCERTAIN':
      default:
        return <span className="status-pill uncertain">Uncertain</span>;
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
            {observations.length} Analyte Measurements Extracted
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
          }}
        >
          <strong>Extraction Warnings:</strong>
          <ul style={{ margin: '0.25rem 0 0 1.25rem' }}>
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="table-wrapper">
        <table className="results-table" aria-label="Extracted Laboratory Results">
          <thead>
            <tr>
              <th scope="col">Test / Analyte</th>
              <th scope="col">Observed Value</th>
              <th scope="col">Unit</th>
              <th scope="col">Reference Interval</th>
              <th scope="col">Indicator</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((obs, idx) => (
              <tr key={idx} style={{ background: obs.needs_review ? '#FFFDF5' : undefined }}>
                <td>
                  <span className="test-name">{obs.test_name}</span>
                  {obs.code && <span className="test-code">({obs.code})</span>}
                  {obs.needs_review && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-status-flag)', marginTop: '2px' }}>
                      ⚠ {obs.review_reason || 'Requires physician verification'}
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
