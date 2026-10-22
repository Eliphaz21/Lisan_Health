import React, { useState, useEffect } from 'react';
import type { SavedReportItem } from '../types/auth';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSelectReport: (report: any) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  token,
  onSelectReport,
}) => {
  const [reports, setReports] = useState<SavedReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports(await res.json());
      } else {
        const data = await res.json();
        setError(data.detail || 'Could not fetch history');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this report record?')) return;
    try {
      const res = await fetch(`/api/v1/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports(reports.filter((r) => r.id !== id));
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(21, 23, 27, 0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#25272C',
          border: '1px solid #363940',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '750px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '2rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #363940',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              My Medical Report History
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#8A8F98' }}>
              Past lab tests, clinical explanations, and localized audio
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A8F98',
              cursor: 'pointer',
              fontSize: '1.35rem',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8A8F98' }}>
            Loading your clinical history...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#8A8F98' }}>
            No saved reports found. Explain a lab report on the home screen to automatically save it!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  background: '#1D1E22',
                  border: '1px solid #363940',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#B8F7E4' }}>
                    {r.extracted_json?.test_category || 'Clinical Lab Report'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginTop: '0.2rem' }}>
                    Saved on {new Date(r.created_at).toLocaleString()}
                    {r.original_file_name && ` • File: ${r.original_file_name}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#A0A6B1', marginTop: '0.35rem' }}>
                    {r.explanation_json?.summary?.substring(0, 90)}...
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      onSelectReport({
                        extracted: r.extracted_json,
                        explanation_en: r.explanation_json,
                        explanation_localized: r.localized_amharic || r.localized_oromo || r.explanation_json,
                        audio_url: r.audio_amharic_url || r.audio_oromo_url,
                      });
                      onClose();
                    }}
                    style={{
                      background: '#B8F7E4',
                      color: '#15171B',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Load Report
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#FCA5A5',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
