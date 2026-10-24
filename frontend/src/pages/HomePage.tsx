import React from 'react';
import { LanguageSelector } from '../components/LanguageSelector';
import { ReportUpload } from '../components/ReportUpload';
import { ObservationTable } from '../components/ObservationTable';
import { AudioPlayer } from '../components/AudioPlayer';
import { StethoscopeIcon, AlertShieldIcon, TrashIcon, HeartPulseIcon, ShieldCheckIcon } from '../components/Icons';
import type { ExtractedLabReport, SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';

interface HomePageProps {
  currentLanguage: SupportedLanguage;
  setCurrentLanguage: (lang: SupportedLanguage) => void;
  report: ExtractedLabReport | null;
  explanationData: any;
  isLoading: boolean;
  error: string | null;
  onFileUpload: (file: File) => void;
  onClearReport?: () => void;
  currentFileName?: string | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentLanguage,
  setCurrentLanguage,
  report,
  explanationData,
  isLoading,
  error,
  onFileUpload,
  onClearReport,
  currentFileName,
}) => {
  const t = translations[currentLanguage];

  return (
    <main className="container" style={{ paddingBottom: '3rem' }}>
      <section className="hero">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
          />
        </div>
        <h1 className="hero-title">{t.heroTitle}</h1>
        <p className="hero-tagline">{t.heroTagline}</p>
      </section>

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
            <strong>Notice:</strong> {error}
          </div>
          {onClearReport && (
            <button
              type="button"
              onClick={onClearReport}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#991B1B',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <ReportUpload
        onFileUpload={onFileUpload}
        isLoading={isLoading}
        language={currentLanguage}
        currentFileName={currentFileName}
        onClearFile={onClearReport}
      />

      {report && (
        <>
          {/* Action Bar with Report summary and Clear Results button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '1.5rem 0 1rem',
              padding: '0.75rem 1rem',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'var(--color-primary, #0D9488)',
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                }}
              >
                {report.status || 'EXTRACTED'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-graphite)' }}>
                {t.resultsTitle}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                ({report.observations.length} {t.measurementsExtracted})
              </span>
            </div>

            {onClearReport && (
              <button
                type="button"
                onClick={onClearReport}
                data-testid="clear-dashboard-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#B91C1C',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-sm, 6px)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE2E2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FEF2F2')}
              >
                <TrashIcon size={14} color="#B91C1C" />
                <span>{t.clearResults}</span>
              </button>
            )}
          </div>

          <AudioPlayer
            language={currentLanguage}
            explanationText={explanationData?.explanation_localized?.summary || report.raw_text}
          />

          <ObservationTable
            observations={report.observations}
            panelName={report.panel_name}
            status={report.status}
            warnings={report.warnings}
            language={currentLanguage}
          />

          {/* Detailed Clinical Analysis Card */}
          <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--color-primary, #0D9488)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-dark)' }}>
              <HeartPulseIcon size={22} color="var(--color-primary)" />
              <span>{t.detailedExplanationTitle}</span>
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-graphite)', margin: 0 }}>
              {explanationData?.explanation_localized?.detailed_explanation || explanationData?.explanation_localized?.summary || report.raw_text}
            </p>
          </div>

          {/* Cultural Nutrition & Dietary Wellness Card */}
          {explanationData?.explanation_localized?.cultural_wellness_recommendations && explanationData.explanation_localized.cultural_wellness_recommendations.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#14532D' }}>
                <ShieldCheckIcon size={20} color="#16A34A" />
                <span>{t.culturalWellnessTitle}</span>
              </h3>
              <ul style={{ margin: '0.25rem 0 0 1.25rem', color: '#166534', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {explanationData.explanation_localized.cultural_wellness_recommendations.map((rec: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>{rec}</li>
                ))}
              </ul>
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#15803D', fontStyle: 'italic' }}>
                * ማስታወሻ: ማንኛውንም ባህላዊ መድኃኒት ወይም የዕፅዋት ቅመሞች ከመውሰድዎ በፊት ሁልጊዜ ከባለሙያ ሐኪም ጋር ይማከሩ።
              </div>
            </div>
          )}

          <div className="card card-doctor-questions" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StethoscopeIcon size={22} color="var(--color-graphite)" />
              <span>{t.doctorQuestionsTitle}</span>
            </h3>
            <ul style={{ margin: '0.25rem 0 0 1.25rem', color: 'var(--color-graphite)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {(explanationData?.explanation_localized?.suggested_questions_for_doctor || t.doctorQuestions).map((q: string, idx: number) => (
                <li key={idx} style={{ marginBottom: '0.35rem' }}>"{q}"</li>
              ))}
            </ul>
          </div>
        </>
      )}

      <aside className="disclaimer-banner" role="note">
        <AlertShieldIcon size={22} color="var(--color-graphite)" />
        <div>
          <strong style={{ color: 'var(--color-graphite)' }}>{t.disclaimerTitle}</strong> {t.disclaimerBody}
        </div>
      </aside>
    </main>
  );
};
