import React, { useRef } from 'react';
import type { SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';
import { FileReportIcon, LabFlaskIcon, HeartPulseIcon, AlertShieldIcon } from './Icons';

interface ReportUploadProps {
  onLoadSynthetic: (sampleType: 'cbc' | 'lipid' | 'malformed') => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  language: SupportedLanguage;
}

export const ReportUpload: React.FC<ReportUploadProps> = ({
  onLoadSynthetic,
  onFileUpload,
  isLoading,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="card">
      <div
        className="upload-zone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileUpload(e.dataTransfer.files[0]);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload laboratory report PDF or image"
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
        />
        <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <FileReportIcon size={44} />
        </div>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
          {t.uploadTitle}{' '}
          <span style={{ textDecoration: 'underline', color: 'var(--color-primary)', cursor: 'pointer' }}>
            {t.uploadBrowse}
          </span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {t.uploadSubtitle}
        </p>
      </div>

      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
          {t.sampleSectionTitle}
        </span>
        <div className="sample-buttons">
          <button
            type="button"
            className="btn-sample"
            disabled={isLoading}
            onClick={() => onLoadSynthetic('cbc')}
          >
            <LabFlaskIcon size={18} />
            <span>{t.sampleCbc}</span>
          </button>
          <button
            type="button"
            className="btn-sample"
            disabled={isLoading}
            onClick={() => onLoadSynthetic('lipid')}
          >
            <HeartPulseIcon size={18} />
            <span>{t.sampleLipid}</span>
          </button>
          <button
            type="button"
            className="btn-sample"
            disabled={isLoading}
            onClick={() => onLoadSynthetic('malformed')}
          >
            <AlertShieldIcon size={18} />
            <span>{t.sampleMalformed}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
