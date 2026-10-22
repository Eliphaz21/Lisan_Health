import React from 'react';
import { LanguageSelector } from '../components/LanguageSelector';
import { ReportUpload } from '../components/ReportUpload';
import { ObservationTable } from '../components/ObservationTable';
import { AudioPlayer } from '../components/AudioPlayer';
import { StethoscopeIcon, AlertShieldIcon } from '../components/Icons';
import type { ExtractedLabReport, SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';

interface HomePageProps {
  currentLanguage: SupportedLanguage;
  setCurrentLanguage: (lang: SupportedLanguage) => void;
  report: ExtractedLabReport | null;
  explanationData: any;
  isLoading: boolean;
  error: string | null;
  onLoadSynthetic: (sampleType: 'cbc' | 'lipid' | 'malformed') => void;
  onFileUpload: (file: File) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentLanguage,
  setCurrentLanguage,
  report,
  explanationData,
  isLoading,
  error,
  onLoadSynthetic,
  onFileUpload,
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
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <ReportUpload
        onLoadSynthetic={onLoadSynthetic}
        onFileUpload={onFileUpload}
        isLoading={isLoading}
        language={currentLanguage}
      />

      {report && (
        <>
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

          <div className="card card-doctor-questions" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StethoscopeIcon size={22} color="var(--color-graphite)" />
              <span>{t.doctorQuestionsTitle}</span>
            </h3>
            <ul style={{ margin: '0.25rem 0 0 1.25rem', color: 'var(--color-graphite)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {t.doctorQuestions.map((q, idx) => (
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
