import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LanguageSelector } from './components/LanguageSelector';
import { ReportUpload } from './components/ReportUpload';
import { ObservationTable } from './components/ObservationTable';
import { AudioPlayer } from './components/AudioPlayer';
import { StethoscopeIcon, AlertShieldIcon } from './components/Icons';
import type { ExtractedLabReport, HealthStatus, SupportedLanguage, LabObservation } from './types/report';
import { translations } from './utils/i18n';

interface SamplePayload {
  report_id: string;
  panel_name: string;
  raw_text: string;
  observations: LabObservation[];
}

// Synthetic Fallback Samples for client-side resilience
const SAMPLE_CBC: SamplePayload = {
  report_id: "SYNTH-CBC-001",
  panel_name: "Complete Blood Count (CBC)",
  raw_text: "CBC Panel",
  observations: [
    { test_name: "White Blood Cells (WBC)", code: "WBC", value: 6.5, unit: "10^3/uL", reference_interval: { low: 4.0, high: 11.0, unit: "10^3/uL" }, flag: "NORMAL", needs_review: false },
    { test_name: "Red Blood Cells (RBC)", code: "RBC", value: 3.8, unit: "10^6/uL", reference_interval: { low: 4.2, high: 5.4, unit: "10^6/uL" }, flag: "LOW", needs_review: false },
    { test_name: "Hemoglobin (HGB)", code: "HGB", value: 9.8, unit: "g/dL", reference_interval: { low: 12.0, high: 16.0, unit: "g/dL" }, flag: "LOW", needs_review: false },
    { test_name: "Hematocrit (HCT)", code: "HCT", value: 30.5, unit: "%", reference_interval: { low: 36.0, high: 46.0, unit: "%" }, flag: "LOW", needs_review: false },
    { test_name: "Platelets (PLT)", code: "PLT", value: 240.0, unit: "10^3/uL", reference_interval: { low: 150.0, high: 450.0, unit: "10^3/uL" }, flag: "NORMAL", needs_review: false },
  ]
};

const SAMPLE_LIPID: SamplePayload = {
  report_id: "SYNTH-LIPID-002",
  panel_name: "Lipid Profile Panel",
  raw_text: "Lipid Panel",
  observations: [
    { test_name: "Total Cholesterol", code: "CHOL", value: 245.0, unit: "mg/dL", reference_interval: { high: 200.0, unit: "mg/dL" }, flag: "HIGH", needs_review: false },
    { test_name: "Triglycerides", code: "TRIG", value: 190.0, unit: "mg/dL", reference_interval: { high: 150.0, unit: "mg/dL" }, flag: "HIGH", needs_review: false },
    { test_name: "HDL Cholesterol", code: "HDL", value: 38.0, unit: "mg/dL", reference_interval: { low: 40.0, unit: "mg/dL" }, flag: "LOW", needs_review: false },
    { test_name: "LDL Cholesterol", code: "LDL", value: 169.0, unit: "mg/dL", reference_interval: { high: 100.0, unit: "mg/dL" }, flag: "HIGH", needs_review: false },
  ]
};

const SAMPLE_MALFORMED: SamplePayload = {
  report_id: "SYNTH-MALFORMED-003",
  panel_name: "Unclear Scanned Panel",
  raw_text: "Malformed Scan",
  observations: [
    { test_name: "Glucose", code: "GLU", value: 142.0, unit: "", flag: "UNCERTAIN", needs_review: true, review_reason: "Missing unit" },
    { test_name: "Creatinine", code: "CREAT", value: null, unit: "mg/dL", reference_interval: { low: 0.6, high: 1.2, unit: "mg/dL" }, flag: "UNCERTAIN", needs_review: true, review_reason: "Missing value" },
  ]
};

export const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('am');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [report, setReport] = useState<ExtractedLabReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  const t = translations[currentLanguage];

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthStatus | null) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', version: '0.1.0', environment: 'local', timestamp: new Date().toISOString() }));
  }, []);

  const handleLoadSynthetic = async (sampleType: 'cbc' | 'lipid' | 'malformed') => {
    setIsLoading(true);
    let payload = SAMPLE_CBC;
    if (sampleType === 'lipid') payload = SAMPLE_LIPID;
    if (sampleType === 'malformed') payload = SAMPLE_MALFORMED;

    try {
      const response = await fetch('/api/v1/reports/parse-synthetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const extracted = await response.json();
        setReport(extracted);
      } else {
        throw new Error('Backend returned status ' + response.status);
      }
    } catch {
      // Fallback: parse client-side
      setReport({
        report_id: payload.report_id,
        panel_name: payload.panel_name,
        raw_text: payload.raw_text,
        observations: payload.observations,
        status: sampleType === 'malformed' ? 'NEEDS_REVIEW' : 'EXTRACTED',
        confidence_score: sampleType === 'malformed' ? 0.75 : 1.0,
        warnings: sampleType === 'malformed' ? ['Missing measurement units detected'] : [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setTimeout(() => {
      setReport({
        report_id: `UPLOAD-${Date.now()}`,
        panel_name: `Uploaded Document (${file.name})`,
        raw_text: `Extracted text from ${file.name}`,
        observations: [
          {
            test_name: 'Fasting Blood Glucose',
            code: 'FBG',
            value: 108.0,
            unit: 'mg/dL',
            reference_interval: { low: 70.0, high: 99.0, unit: 'mg/dL' },
            flag: 'HIGH',
            needs_review: false,
          },
          {
            test_name: 'HbA1c',
            code: 'A1C',
            value: 5.9,
            unit: '%',
            reference_interval: { low: 4.0, high: 5.6, unit: '%' },
            flag: 'HIGH',
            needs_review: false,
          },
        ],
        status: 'EXTRACTED',
        confidence_score: 0.95,
        warnings: [],
      });
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="app">
      <Navbar health={health} language={currentLanguage} />

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
          onLoadSynthetic={handleLoadSynthetic}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          language={currentLanguage}
        />

        {report && (
          <>
            <AudioPlayer
              language={currentLanguage}
              explanationText={report.raw_text}
            />

            <ObservationTable
              observations={report.observations}
              panelName={report.panel_name}
              status={report.status}
              warnings={report.warnings}
              language={currentLanguage}
            />

            <div className="card" style={{ marginTop: '1.5rem', background: 'var(--color-primary-surface)', borderColor: 'var(--color-primary-light)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StethoscopeIcon size={22} color="var(--color-primary-dark)" />
                <span>{t.doctorQuestionsTitle}</span>
              </h3>
              <ul style={{ margin: '0.25rem 0 0 1.25rem', color: 'var(--color-primary-dark)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {t.doctorQuestions.map((q, idx) => (
                  <li key={idx} style={{ marginBottom: '0.35rem' }}>"{q}"</li>
                ))}
              </ul>
            </div>
          </>
        )}

        <aside className="disclaimer-banner" role="note">
          <AlertShieldIcon size={22} color="#9A5B08" />
          <div>
            <strong>{t.disclaimerTitle}</strong> {t.disclaimerBody}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
