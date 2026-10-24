import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  FileReportIcon,
  AlertShieldIcon,
  SoundWaveIcon,
  CalendarIcon,
  SearchIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ReplayIcon,
  CheckIcon,
  LabFlaskIcon,
  StethoscopeIcon,
} from '../components/Icons';
import type { User, SavedReportItem } from '../types/auth';

interface HistoryPageProps {
  currentUser: User | null;
  token: string;
  onLoadReportIntoHome: (report: any) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  currentUser,
  token,
  onLoadReportIntoHome,
}) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<SavedReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'flagged' | 'normal' | 'audio'>('all');

  // Inspection Drawer/Modal State
  const [selectedReport, setSelectedReport] = useState<SavedReportItem | null>(null);
  const [inspectionLang, setInspectionLang] = useState<'am' | 'en' | 'om'>('am');

  // Inline audio playback state for selected report
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !currentUser) return;
    loadHistory();
  }, [token, currentUser]);

  // Clean up audio on unmount or report change
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json();
        setError(err.detail || 'Unable to retrieve clinical history records.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to history endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setSuccessMessage('Medical report permanently removed from your history.');
        setConfirmDeleteId(null);
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        const err = await res.json();
        setError(err.detail || 'Failed to delete report.');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAudioToggle = (audioUrl: string) => {
    if (!audioUrl) return;

    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (audioElement && audioElement.src.includes(audioUrl)) {
      audioElement.play().catch(console.error);
      setIsPlayingAudio(true);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => {
      setIsPlayingAudio(false);
      setError('Could not stream audio narration. Please verify audio endpoint availability.');
    };
    audio.play().catch((e) => {
      console.error(e);
      setIsPlayingAudio(false);
    });
    setAudioElement(audio);
    setIsPlayingAudio(true);
  };

  const handleLoadAndOpen = (r: SavedReportItem) => {
    onLoadReportIntoHome({
      extracted: r.extracted_json,
      explanation_en: r.explanation_json,
      explanation_localized:
        r.localized_amharic || r.localized_oromo || r.explanation_json,
      audio_url: r.audio_amharic_url || r.audio_oromo_url,
    });
    navigate('/');
  };

  // Auth Guard
  if (!currentUser || !token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F9FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '2.5rem 2rem',
            maxWidth: '440px',
            textAlign: 'center',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#F3F4F6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <AlertShieldIcon size={32} color="#4B5563" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0', color: '#111827' }}>
            Personal History Access Required
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            To inspect your saved medical reports, clinical summaries, and localized audio narrations, please sign in to your LisanHealth account.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                padding: '0.65rem 1.25rem',
                backgroundColor: '#25272C',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                display: 'inline-block',
                padding: '0.65rem 1.25rem',
                backgroundColor: '#B8F7E4',
                color: '#15171B',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Metrics & Telemetry
  const totalReportsCount = reports.length;
  let totalAbnormalFlags = 0;
  let totalAudioAvailable = 0;

  reports.forEach((r) => {
    if (r.audio_amharic_url || r.audio_oromo_url) {
      totalAudioAvailable++;
    }
    const analytes = r.extracted_json?.analytes || [];
    analytes.forEach((a: any) => {
      if (a.flag && a.flag !== 'NORMAL') {
        totalAbnormalFlags++;
      }
    });
  });

  const latestReport = reports[0];
  const latestDateFormatted = latestReport
    ? new Date(latestReport.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'None';

  // Search & Filter Logic
  const filteredReports = reports.filter((r) => {
    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cat = (r.extracted_json?.test_category || '').toLowerCase();
      const fn = (r.original_file_name || '').toLowerCase();
      const sum = (r.explanation_json?.summary || '').toLowerCase();
      const sumAm = (r.localized_amharic?.summary || '').toLowerCase();
      const analytesStr = (r.extracted_json?.analytes || [])
        .map((a: any) => a.name)
        .join(' ')
        .toLowerCase();

      const matchesQuery =
        cat.includes(q) ||
        fn.includes(q) ||
        sum.includes(q) ||
        sumAm.includes(q) ||
        analytesStr.includes(q);

      if (!matchesQuery) return false;
    }

    // 2. Filter mode
    const analytes = r.extracted_json?.analytes || [];
    const hasFlags = analytes.some((a: any) => a.flag && a.flag !== 'NORMAL');
    const hasAudio = Boolean(r.audio_amharic_url || r.audio_oromo_url);

    if (filterMode === 'flagged' && !hasFlags) return false;
    if (filterMode === 'normal' && hasFlags) return false;
    if (filterMode === 'audio' && !hasAudio) return false;

    return true;
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        color: '#15171B',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Link
              to="/"
              aria-label="Back to explainer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#F8F9FA',
                border: '1px solid #E5E7EB',
                color: '#1F2937',
                textDecoration: 'none',
              }}
            >
              <ArrowLeftIcon size={18} color="#1F2937" />
            </Link>

            <img
              src="/logo.png"
              alt="LisanHealth Logo"
              style={{ width: '38px', height: '38px', objectFit: 'contain' }}
            />

            <div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                My Clinical History
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280' }}>
                  (የህክምና ምርመራ ታሪክ)
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: '#E8FBF4',
                    color: '#0D6E54',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    border: '1px solid #89E6CB',
                  }}
                >
                  Encrypted
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Secure Clinical Archive • Stage A/B Reasoning & Addis AI Speech Telemetry
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#374151',
                backgroundColor: '#F3F4F6',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                border: '1px solid #E5E7EB',
              }}
            >
              {currentUser.email}
            </div>
            <Link
              to="/"
              style={{
                fontSize: '0.8rem',
                color: '#6B7280',
                textDecoration: 'none',
                fontWeight: 600,
                padding: '0.35rem 0.65rem',
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          padding: '1.75rem 1.25rem 3rem',
          flex: 1,
        }}
      >
        {/* Alerts Banner */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #6EE7B7',
              color: '#065F46',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckIcon size={16} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Top KPI Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          {/* Card 1: Total Reports */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Saved Reports
              </div>
              <div
                data-testid="kpi-total-reports"
                style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginTop: '0.25rem' }}
              >
                {totalReportsCount}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                Laboratory runs saved
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileReportIcon size={22} color="#2563EB" />
            </div>
          </div>

          {/* Card 2: Abnormal Flags */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Out-of-Range Flags
              </div>
              <div
                data-testid="kpi-flags"
                style={{ fontSize: '1.75rem', fontWeight: 800, color: totalAbnormalFlags > 0 ? '#DC2626' : '#059669', marginTop: '0.25rem' }}
              >
                {totalAbnormalFlags}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                Requires clinical review
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: totalAbnormalFlags > 0 ? '#FEF2F2' : '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertShieldIcon size={22} color={totalAbnormalFlags > 0 ? '#DC2626' : '#059669'} />
            </div>
          </div>

          {/* Card 3: Audio Available */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Localized Audio
              </div>
              <div
                data-testid="kpi-audio"
                style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0D9488', marginTop: '0.25rem' }}
              >
                {totalAudioAvailable}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                Amharic & Oromo speech
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#E8FBF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SoundWaveIcon size={22} color="#0D9488" />
            </div>
          </div>

          {/* Card 4: Most Recent Test */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Latest Visit / Test
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', marginTop: '0.45rem' }}>
                {latestDateFormatted}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                Most recent upload
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarIcon size={20} color="#4B5563" />
            </div>
          </div>
        </div>

        {/* Search, Filter Tabs & Actions */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              flex: '1 1 280px',
              maxWidth: '420px',
            }}
          >
            <SearchIcon size={16} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search by panel, file, analyte or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.875rem',
                color: '#111827',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Reports (${reports.length})` },
              { id: 'flagged', label: 'Attention Needed' },
              { id: 'normal', label: 'All Normal' },
              { id: 'audio', label: 'Has Voice Audio' },
            ].map((tab) => {
              const active = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterMode(tab.id as any)}
                  style={{
                    backgroundColor: active ? '#25272C' : '#F3F4F6',
                    color: active ? '#FFFFFF' : '#4B5563',
                    border: '1px solid',
                    borderColor: active ? '#25272C' : '#E5E7EB',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}

            <button
              onClick={loadHistory}
              title="Refresh reports"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#4B5563',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <ReplayIcon size={14} color="#6B7280" /> Refresh
            </button>
          </div>
        </div>

        {/* Reports Content List */}
        {loading ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: '#6B7280',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading your medical report history...</div>
            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.35rem' }}>
              Fetching verified records from PostgreSQL 17...
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <LabFlaskIcon size={32} color="#9CA3AF" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
              {searchQuery ? 'No reports matched your search criteria' : 'No Saved Medical Reports Yet'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              {searchQuery
                ? 'Try adjusting your search query or reset filters to see all available medical records.'
                : 'Whenever you upload a PDF, image, or lab test document to LisanHealth, it is automatically organized and preserved here with full translations and audio.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                }}
                style={{
                  backgroundColor: '#25272C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear Search & Filters
              </button>
            ) : (
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#B8F7E4',
                  color: '#15171B',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(184, 247, 228, 0.25)',
                }}
              >
                <StethoscopeIcon size={18} color="#15171B" />
                Analyze a Medical Report Now
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredReports.map((reportItem) => {
              const analytes = reportItem.extracted_json?.analytes || [];
              const abnormalAnalytes = analytes.filter((a: any) => a.flag && a.flag !== 'NORMAL');
              const hasFlags = abnormalAnalytes.length > 0;
              const hasAudio = Boolean(reportItem.audio_amharic_url || reportItem.audio_oromo_url);
              const summarySnippet =
                reportItem.explanation_json?.summary ||
                reportItem.localized_amharic?.summary ||
                'Clinical analysis record ready for inspection.';

              const formattedDate = new Date(reportItem.created_at).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={reportItem.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '14px',
                    padding: '1.25rem 1.5rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      borderBottom: '1px solid #F3F4F6',
                      paddingBottom: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                          {reportItem.extracted_json?.test_category || 'Clinical Laboratory Report'}
                        </span>

                        {/* Status Badge */}
                        {hasFlags ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: '#FEF2F2',
                              color: '#B91C1C',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid #FECACA',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            ⚠️ {abnormalAnalytes.length} Out of Range
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: '#E8FBF4',
                              color: '#0D6E54',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid #89E6CB',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <CheckIcon size={12} color="#0D6E54" /> All In Range
                          </span>
                        )}

                        {/* Audio Badge */}
                        {hasAudio && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(184, 247, 228, 0.35)',
                              color: '#0F766E',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid #B8F7E4',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <SoundWaveIcon size={12} color="#0F766E" /> Audio Ready
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.75rem',
                          color: '#6B7280',
                          marginTop: '0.35rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CalendarIcon size={13} color="#9CA3AF" />
                          {formattedDate}
                        </span>
                        {reportItem.original_file_name && (
                          <span>
                            • File: <strong style={{ color: '#374151' }}>{reportItem.original_file_name}</strong>
                          </span>
                        )}
                        <span>• Analytes Extracted: {analytes.length}</span>
                      </div>
                    </div>

                    {/* Language Pills */}
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          backgroundColor: '#F3F4F6',
                          color: '#4B5563',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                        }}
                      >
                        EN
                      </span>
                      {reportItem.localized_amharic && (
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            backgroundColor: '#E8FBF4',
                            color: '#0D6E54',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                          }}
                        >
                          አማርኛ (AM)
                        </span>
                      )}
                      {reportItem.localized_oromo && (
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            backgroundColor: '#E8FBF4',
                            color: '#0D6E54',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                          }}
                        >
                          Afaan Oromoo (OM)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '0.85rem 0' }}>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#374151',
                        lineHeight: 1.5,
                        margin: '0 0 0.75rem',
                      }}
                    >
                      {summarySnippet.length > 220 ? `${summarySnippet.substring(0, 220)}...` : summarySnippet}
                    </p>

                    {/* Quick Analyte Badges */}
                    {analytes.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {analytes.slice(0, 6).map((a: any, idx: number) => {
                          const isAbnormal = a.flag && a.flag !== 'NORMAL';
                          return (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.725rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                backgroundColor: isAbnormal ? '#FEF2F2' : '#F9FAFB',
                                border: '1px solid',
                                borderColor: isAbnormal ? '#FCA5A5' : '#E5E7EB',
                                color: isAbnormal ? '#991B1B' : '#4B5563',
                                fontWeight: isAbnormal ? 700 : 500,
                              }}
                            >
                              {a.name}: <strong>{a.value} {a.unit}</strong> {isAbnormal && `(${a.flag})`}
                            </span>
                          );
                        })}
                        {analytes.length > 6 && (
                          <span
                            style={{
                              fontSize: '0.725rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              backgroundColor: '#F3F4F6',
                              color: '#6B7280',
                              fontWeight: 600,
                            }}
                          >
                            +{analytes.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      borderTop: '1px solid #F3F4F6',
                      paddingTop: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {/* Inspect Findings */}
                      <button
                        onClick={() => {
                          setSelectedReport(reportItem);
                          setInspectionLang(reportItem.localized_amharic ? 'am' : 'en');
                        }}
                        style={{
                          backgroundColor: '#25272C',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.45rem 0.95rem',
                          borderRadius: '8px',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        Inspect Findings
                      </button>

                      {/* Load into Explainer */}
                      <button
                        onClick={() => handleLoadAndOpen(reportItem)}
                        style={{
                          backgroundColor: '#F3F4F6',
                          color: '#15171B',
                          border: '1px solid #E5E7EB',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        Load in Explainer
                      </button>

                      {/* Quick Audio Stream */}
                      {(reportItem.audio_amharic_url || reportItem.audio_oromo_url) && (
                        <button
                          onClick={() =>
                            handleAudioToggle(
                              (reportItem.audio_amharic_url || reportItem.audio_oromo_url)!
                            )
                          }
                          style={{
                            backgroundColor: '#E8FBF4',
                            color: '#0D6E54',
                            border: '1px solid #89E6CB',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          {isPlayingAudio ? (
                            <>
                              <PauseIcon size={14} color="#0D6E54" /> Pause Narration
                            </>
                          ) : (
                            <>
                              <PlayIcon size={14} color="#0D6E54" /> Listen Audio
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Delete Action */}
                    <div>
                      {confirmDeleteId === reportItem.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                            Confirm delete?
                          </span>
                          <button
                            disabled={deletingId === reportItem.id}
                            onClick={() => handleDelete(reportItem.id)}
                            style={{
                              backgroundColor: '#DC2626',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {deletingId === reportItem.id ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              backgroundColor: '#F3F4F6',
                              color: '#4B5563',
                              border: '1px solid #E5E7EB',
                              padding: '0.3rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(reportItem.id)}
                          title="Delete report"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9CA3AF',
                            padding: '0.4rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.8rem',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = '#DC2626';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
                          }}
                        >
                          <TrashIcon size={16} color="currentColor" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Deep Dive Inspection Slide-Over / Modal */}
      {selectedReport && (
        <div
          data-testid="inspection-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReport(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              border: '1px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                backgroundColor: '#FFFFFF',
                zIndex: 10,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                    {selectedReport.extracted_json?.test_category || 'Clinical Findings Inspection'}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      backgroundColor: '#E8FBF4',
                      color: '#0D6E54',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      border: '1px solid #89E6CB',
                    }}
                  >
                    Verified Stage A/B
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', color: '#6B7280', marginTop: '0.25rem' }}>
                  Saved on {new Date(selectedReport.created_at).toLocaleString()}
                  {selectedReport.original_file_name && ` • Source: ${selectedReport.original_file_name}`}
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: '#4B5563',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Language Switcher Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid #E5E7EB',
                  paddingBottom: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <button
                  onClick={() => setInspectionLang('am')}
                  disabled={!selectedReport.localized_amharic}
                  style={{
                    backgroundColor: inspectionLang === 'am' ? '#25272C' : '#F3F4F6',
                    color: inspectionLang === 'am' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: selectedReport.localized_amharic ? 'pointer' : 'not-allowed',
                    opacity: selectedReport.localized_amharic ? 1 : 0.45,
                  }}
                >
                  አማርኛ (Amharic)
                </button>
                <button
                  onClick={() => setInspectionLang('om')}
                  disabled={!selectedReport.localized_oromo}
                  style={{
                    backgroundColor: inspectionLang === 'om' ? '#25272C' : '#F3F4F6',
                    color: inspectionLang === 'om' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: selectedReport.localized_oromo ? 'pointer' : 'not-allowed',
                    opacity: selectedReport.localized_oromo ? 1 : 0.45,
                  }}
                >
                  Afaan Oromoo
                </button>
                <button
                  onClick={() => setInspectionLang('en')}
                  style={{
                    backgroundColor: inspectionLang === 'en' ? '#25272C' : '#F3F4F6',
                    color: inspectionLang === 'en' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  English (Clinical Base)
                </button>
              </div>

              {/* Localized Audio Bar */}
              {(selectedReport.audio_amharic_url || selectedReport.audio_oromo_url) && (
                <div
                  style={{
                    backgroundColor: '#E8FBF4',
                    border: '1px solid #89E6CB',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SoundWaveIcon size={18} color="#0D6E54" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0D6E54' }}>
                        Addis AI Speech Audio Stream
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#047857' }}>
                        Natural voice narration in Ethiopian languages
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleAudioToggle(
                        (inspectionLang === 'om' && selectedReport.audio_oromo_url)
                          ? selectedReport.audio_oromo_url
                          : (selectedReport.audio_amharic_url || selectedReport.audio_oromo_url)!
                      )
                    }
                    style={{
                      backgroundColor: '#0D6E54',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.45rem 1rem',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    {isPlayingAudio ? (
                      <>
                        <PauseIcon size={14} color="#FFFFFF" /> Pause Narration
                      </>
                    ) : (
                      <>
                        <PlayIcon size={14} color="#FFFFFF" /> Play Localized Narration
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Clinical Summary Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
                  {inspectionLang === 'am'
                    ? 'አጠቃላይ የህክምና ማብራሪያ (Clinical Summary)'
                    : inspectionLang === 'om'
                    ? 'Ibsa Waliigalaa (Clinical Summary)'
                    : 'Evidence-Grounded Clinical Summary'}
                </h4>
                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontSize: '0.875rem',
                    color: '#374151',
                    lineHeight: 1.6,
                  }}
                >
                  {inspectionLang === 'am'
                    ? selectedReport.localized_amharic?.summary || selectedReport.explanation_json?.summary
                    : inspectionLang === 'om'
                    ? selectedReport.localized_oromo?.summary || selectedReport.explanation_json?.summary
                    : selectedReport.explanation_json?.summary}
                </div>
              </div>

              {/* Detailed Analytes Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
                  Extracted Analytes & Reference Intervals
                </h4>
                <div
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#4B5563' }}>Test Analyte</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#4B5563' }}>Measured Value</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#4B5563' }}>Reference Interval</th>
                        <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#4B5563' }}>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReport.extracted_json?.analytes || []).map((a: any, i: number) => {
                        const isAbnormal = a.flag && a.flag !== 'NORMAL';
                        return (
                          <tr
                            key={i}
                            style={{
                              borderBottom: i < (selectedReport.extracted_json?.analytes?.length || 0) - 1 ? '1px solid #F3F4F6' : 'none',
                              backgroundColor: isAbnormal ? '#FEF2F2' : '#FFFFFF',
                            }}
                          >
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: '#111827' }}>
                              {a.name}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: isAbnormal ? '#991B1B' : '#111827' }}>
                              {a.value} {a.unit}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#6B7280' }}>
                              {a.reference_range_low !== undefined && a.reference_range_high !== undefined
                                ? `${a.reference_range_low} – ${a.reference_range_high} ${a.unit || ''}`
                                : 'Standard clinical baseline'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem' }}>
                              {isAbnormal ? (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: '#FEE2E2',
                                    color: '#991B1B',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {a.flag}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: '#E8FBF4',
                                    color: '#0D6E54',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                  }}
                                >
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctor Consultation Questions */}
              {((inspectionLang === 'am' && selectedReport.localized_amharic?.questions_for_doctor) ||
                (inspectionLang === 'om' && selectedReport.localized_oromo?.questions_for_doctor) ||
                selectedReport.explanation_json?.questions_for_doctor) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
                    {inspectionLang === 'am'
                      ? 'ለሐኪምዎ የሚጠይቋቸው ጥያቄዎች (Doctor Questions)'
                      : inspectionLang === 'om'
                      ? 'Gaaffilee Ogeessa Fayyaa Gaafatamuu Qaban'
                      : 'Recommended Questions for Your Healthcare Provider'}
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      fontSize: '0.85rem',
                      color: '#4B5563',
                      lineHeight: 1.6,
                    }}
                  >
                    {(
                      (inspectionLang === 'am' && selectedReport.localized_amharic?.questions_for_doctor) ||
                      (inspectionLang === 'om' && selectedReport.localized_oromo?.questions_for_doctor) ||
                      selectedReport.explanation_json?.questions_for_doctor ||
                      []
                    ).map((q: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medical Disclaimer Banner */}
              <div
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.775rem',
                  color: '#92400E',
                  lineHeight: 1.5,
                }}
              >
                <strong>Educational Safety Notice:</strong> This clinical explanation is designed solely for patient health literacy and educational understanding. It does not constitute a diagnostic impression or clinical prescription. Please consult your licensed physician with these results.
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderRadius: '0 0 16px 16px',
              }}
            >
              <button
                onClick={() => handleLoadAndOpen(selectedReport)}
                style={{
                  backgroundColor: '#B8F7E4',
                  color: '#15171B',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(184, 247, 228, 0.25)',
                }}
              >
                Open in Main Clinical Explainer
              </button>

              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#4B5563',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
