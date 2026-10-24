import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AdminModal } from './components/AdminModal';
import { HistoryModal } from './components/HistoryModal';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { HistoryPage } from './pages/HistoryPage';
import type { ExtractedLabReport, HealthStatus, SupportedLanguage, LabObservation } from './types/report';
import type { User } from './types/auth';
import { Footer } from './components/Footer';
import { PolicyPage } from './pages/PolicyPage';

export const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('am');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [report, setReport] = useState<ExtractedLabReport | null>(null);
  const [explanationData, setExplanationData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  // Authentication & Modals State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleClearReport = () => {
    setReport(null);
    setExplanationData(null);
    setError(null);
    setCurrentFileName(null);
  };

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
    if (!token || !user) {
      setError('Please sign in before processing a medical report.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/pipeline/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text,
          target_language: currentLanguage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Pipeline processing failed');
      }

      const data = await response.json();
      setExplanationData(data);

      const obs: LabObservation[] = (data.extracted?.analytes || []).map((a: any) => ({
        test_name: a.name,
        code: (a.name || '').substring(0, 4).toUpperCase(),
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

  const handleFileUpload = async (file: File) => {
    if (!token || !user) {
      setError('Please sign in before uploading a medical report.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 1. Try multipart file upload to backend pipeline (supports PDF, PNG, JPG, TXT)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_language', currentLanguage);

      const response = await fetch('/api/v1/pipeline/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setExplanationData(data);

        const obs: LabObservation[] = (data.extracted?.analytes || []).map((a: any) => ({
          test_name: a.name,
          code: (a.name || '').substring(0, 4).toUpperCase(),
          value: a.value,
          unit: a.unit,
          reference_interval: {
            low: a.reference_range_low,
            high: a.reference_range_high,
            unit: a.unit,
          },
          flag: a.flag,
          needs_review: a.flag === 'CRITICAL' || a.flag === 'UNCERTAIN',
        }));

        const finalReport: ExtractedLabReport = {
          report_id: `REP-${Date.now()}`,
          panel_name: data.extracted.test_category || `Report (${file.name})`,
          raw_text: data.explanation_localized?.summary || data.explanation_en?.summary || `Report: ${file.name}`,
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
              original_file_name: file.name,
              report_text: data.extracted.raw_text,
              extracted_json: data.extracted,
              explanation_json: data.explanation_en,
              localized_amharic: currentLanguage === 'am' ? data.explanation_localized : undefined,
              localized_oromo: currentLanguage === 'om' ? data.explanation_localized : undefined,
              audio_amharic_url: currentLanguage === 'am' ? data.audio_url : undefined,
              audio_oromo_url: currentLanguage === 'om' ? data.audio_url : undefined,
            }),
          }).catch((err) => console.warn('Could not auto-save to history:', err));
        }
        return;
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || 'Could not extract laboratory values. For image uploads, please configure Gemini API Key in the Admin Panel.');
        setCurrentFileName(null);
        return;
      }
    } catch (err: any) {
      console.warn("Multipart upload fallback to text reader:", err.message);
      // Fallback: read text file directly via file.text() or FileReader
      try {
        if (typeof file.text === 'function') {
          const text = await file.text();
          await handleProcessText(text, `Report (${file.name})`, file.name);
          return;
        }
      } catch (readErr: any) {
        console.warn("file.text() fallback error:", readErr.message);
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = (e.target?.result as string) || `Uploaded medical report: ${file.name}`;
        await handleProcessText(text, `Report (${file.name})`, file.name);
      };
      reader.readAsText(file);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadReport = (loaded: any) => {
    setExplanationData(loaded);
    setCurrentFileName(loaded.original_file_name || loaded.extracted?.test_category || 'Saved Report');
    const obs: LabObservation[] = (loaded.extracted?.analytes || []).map((a: any) => ({
      test_name: a.name,
      code: (a.name || '').substring(0, 4).toUpperCase(),
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
      panel_name: loaded.extracted?.test_category || 'Clinical Lab Report',
      raw_text: loaded.explanation_localized?.summary || loaded.explanation_en?.summary || '',
      observations: obs,
      status: 'EXTRACTED',
      confidence_score: 1.0,
      warnings: [],
    });
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
                  onFileUpload={handleFileUpload}
                  onClearReport={handleClearReport}
                  currentFileName={currentFileName}
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

          <Route
            path="/history"
            element={
              <HistoryPage
                currentUser={user}
                token={token}
                onLoadReportIntoHome={handleLoadReport}
              />
            }
          />

          <Route
            path="/admin"
            element={<AdminPage currentUser={user} token={token} />}
          />

          <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
          <Route path="/terms" element={<PolicyPage kind="terms" />} />
          <Route path="/medical-safety" element={<PolicyPage kind="medical" />} />
          <Route path="/data-deletion" element={<PolicyPage kind="deletion" />} />
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
          onSelectReport={handleLoadReport}
        />
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
