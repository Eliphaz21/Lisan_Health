import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AdminModal } from './components/AdminModal';
import { HistoryModal } from './components/HistoryModal';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import type { ExtractedLabReport, HealthStatus, SupportedLanguage, LabObservation } from './types/report';
import type { User } from './types/auth';

interface SamplePayload {
  report_id: string;
  panel_name: string;
  raw_text: string;
  observations: LabObservation[];
}

const SAMPLE_CBC: SamplePayload = {
  report_id: "SYNTH-CBC-001",
  panel_name: "Complete Blood Count (CBC)",
  raw_text: "Hemoglobin: 11.2 g/dL\nWhite Blood Cells: 6.8 10^3/uL\nPlatelets: 210 10^3/uL",
  observations: [
    { test_name: "Hemoglobin (HGB)", code: "HGB", value: 11.2, unit: "g/dL", reference_interval: { low: 13.5, high: 17.5, unit: "g/dL" }, flag: "LOW", needs_review: false },
    { test_name: "White Blood Cells (WBC)", code: "WBC", value: 6.8, unit: "10^3/uL", reference_interval: { low: 4.5, high: 11.0, unit: "10^3/uL" }, flag: "NORMAL", needs_review: false },
    { test_name: "Platelets (PLT)", code: "PLT", value: 210.0, unit: "10^3/uL", reference_interval: { low: 150.0, high: 450.0, unit: "10^3/uL" }, flag: "NORMAL", needs_review: false },
  ]
};

const SAMPLE_LIPID: SamplePayload = {
  report_id: "SYNTH-LIPID-002",
  panel_name: "Lipid Profile Panel",
  raw_text: "Total Cholesterol: 245.0 mg/dL\nTriglycerides: 190.0 mg/dL\nHDL Cholesterol: 38.0 mg/dL\nLDL Cholesterol: 169.0 mg/dL",
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
  const [explanationData, setExplanationData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication & Modals State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    // Check saved user session
    const savedToken = localStorage.getItem('lisan_token');
    const savedUser = localStorage.getItem('lisan_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('lisan_token');
        localStorage.removeItem('lisan_user');
      }
    }

    // Health check
    fetch('/api/v1/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthStatus | null) => {
        if (data) {
          setHealth(data);
        }
      })
      .catch(() => setHealth({ status: 'offline', version: '1.0.0', environment: 'local', timestamp: new Date().toISOString() }));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lisan_token');
    localStorage.removeItem('lisan_user');
    setUser(null);
    setToken('');
  };

  const handleLoginSuccess = (loggedUser: User, loggedToken: string) => {
    setUser(loggedUser);
    setToken(loggedToken);
  };

  const handleProcessText = async (text: string, panelName: string, fileName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/pipeline/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          target_language: currentLanguage === 'om' ? 'om' : 'am',
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Pipeline processing failed');
      }

      const data = await response.json();
      setExplanationData(data);

      const obs: LabObservation[] = data.extracted.analytes.map((a: any) => ({
        test_name: a.name,
        code: a.name.substring(0, 4).toUpperCase(),
        value: a.value,
        unit: a.unit,
        reference_interval: {
          low: a.reference_range_low,
          high: a.reference_range_high,
          unit: a.unit,
        },
        flag: a.flag,
        needs_review: a.flag === 'CRITICAL',
      }));

      const finalReport: ExtractedLabReport = {
        report_id: `REP-${Date.now()}`,
        panel_name: data.extracted.test_category || panelName,
        raw_text: data.explanation_localized?.summary || data.explanation_en?.summary || text,
        observations: obs,
        status: 'EXTRACTED',
        confidence_score: 1.0,
        warnings: [],
      };
      setReport(finalReport);

      // Auto-save to user history if logged in
      if (token && user) {
        fetch('/api/v1/history/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            original_file_name: fileName,
            report_text: text,
            extracted_json: data.extracted,
            explanation_json: data.explanation_en,
            localized_amharic: currentLanguage === 'am' ? data.explanation_localized : undefined,
            localized_oromo: currentLanguage === 'om' ? data.explanation_localized : undefined,
            audio_amharic_url: currentLanguage === 'am' ? data.audio_url : undefined,
            audio_oromo_url: currentLanguage === 'om' ? data.audio_url : undefined,
          }),
        }).catch((err) => console.warn('Could not auto-save to history:', err));
      }
    } catch (err: any) {
      console.warn("Pipeline processing fallback:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = (e.target?.result as string) || `Uploaded medical report: ${file.name}`;
      await handleProcessText(text, `Report (${file.name})`, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar
                  health={health}
                  language={currentLanguage}
                  user={user}
                  onOpenAdmin={() => setIsAdminOpen(true)}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                  onLogout={handleLogout}
                />
                <HomePage
                  currentLanguage={currentLanguage}
                  setCurrentLanguage={setCurrentLanguage}
                  report={report}
                  explanationData={explanationData}
                  isLoading={isLoading}
                  error={error}
                  onLoadSynthetic={handleLoadSynthetic}
                  onFileUpload={handleFileUpload}
                />
              </>
            }
          />

          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <RegisterPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Admin and History Modals */}
        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          token={token}
        />

        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          token={token}
          onSelectReport={(loaded) => {
            setExplanationData(loaded);
            const obs: LabObservation[] = loaded.extracted.analytes.map((a: any) => ({
              test_name: a.name,
              code: a.name.substring(0, 4).toUpperCase(),
              value: a.value,
              unit: a.unit,
              reference_interval: {
                low: a.reference_range_low,
                high: a.reference_range_high,
                unit: a.unit,
              },
              flag: a.flag,
              needs_review: a.flag === 'CRITICAL',
            }));

            setReport({
              report_id: `HISTORY-${Date.now()}`,
              panel_name: loaded.extracted.test_category,
              raw_text: loaded.explanation_localized?.summary || loaded.explanation_en?.summary || '',
              observations: obs,
              status: 'EXTRACTED',
              confidence_score: 1.0,
              warnings: [],
            });
          }}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
