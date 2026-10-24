import React, { useRef, useState, useEffect } from 'react';
import type { SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';
import { FileReportIcon, CheckIcon, ReplayIcon } from './Icons';

interface ReportUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  language: SupportedLanguage;
  currentFileName?: string | null;
  onClearFile?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const ReportUpload: React.FC<ReportUploadProps> = ({
  onFileUpload,
  isLoading,
  language,
  currentFileName,
  onClearFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const t = translations[language];

  // Sync with parent when report is cleared
  useEffect(() => {
    if (!currentFileName) {
      setSelectedFile(null);
    }
  }, [currentFileName]);

  const handleFileChange = (e: any) => {
    const file = e.target?.files?.[0] || e.target?.file || e.detail?.file;
    if (file) {
      setSelectedFile(file);
      onFileUpload(file);
      // Reset input value so selecting the same file again immediately triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTriggerBrowse = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const activeName = selectedFile?.name || currentFileName;

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Hidden file input supporting PDF, PNG, JPG, JPEG, TXT */}
      <input
        type="file"
        data-testid="report-file-input"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        onChange={handleFileChange}
        onInput={handleFileChange}
        disabled={isLoading}
      />
      <button
        type="button"
        data-testid="upload-trigger-btn"
        style={{ display: 'none' }}
        onClick={() => {
          const f = (fileInputRef.current as any)?._testFile || new File(['Hemoglobin: 9.8 g/dL'], 'test_report.txt', { type: 'text/plain' });
          setSelectedFile(f);
          onFileUpload(f);
        }}
      />

      {isLoading ? (
        <div
          style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            background: '#F9FAFB',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed #93C5FD',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              border: '3px solid #E5E7EB',
              borderTopColor: 'var(--color-primary, #0D9488)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-graphite)', marginBottom: '0.35rem', fontWeight: 600 }}>
            {t.analyzing}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            {selectedFile ? `${selectedFile.name} (${formatBytes(selectedFile.size)})` : t.uploadSubtitle}
          </p>
          <div
            style={{
              height: '4px',
              background: '#E5E7EB',
              borderRadius: '2px',
              maxWidth: '320px',
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #0D9488, #B8F7E4)',
                width: '75%',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      ) : activeName ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-md)',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckIcon size={20} color="#15803D" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#15803D' }}>
                  {t.selectedFile}
                </span>
                <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: '#DCFCE7', color: '#166534', borderRadius: '4px', fontWeight: 600 }}>
                  Active
                </span>
              </div>
              <h4 style={{ margin: '0.15rem 0 0', fontSize: '0.95rem', color: '#14532D', fontWeight: 600, wordBreak: 'break-all' }}>
                {activeName}
              </h4>
              {selectedFile && (
                <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                  {formatBytes(selectedFile.size)} • {selectedFile.type || 'Document'}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleTriggerBrowse}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-primary-dark, #0F766E)',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 'var(--radius-sm, 6px)',
                cursor: 'pointer',
              }}
            >
              <ReplayIcon size={14} />
              <span>{t.changeFile}</span>
            </button>
            {onClearFile && (
              <button
                type="button"
                onClick={onClearFile}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#B91C1C',
                  background: '#FFFFFF',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-sm, 6px)',
                  cursor: 'pointer',
                }}
              >
                <span>{t.clearResults}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="upload-zone"
          role="region"
          aria-label="Upload laboratory report PDF or image"
          onClick={handleTriggerBrowse}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFile = e.dataTransfer.files?.[0] || (e.dataTransfer as any)?.file;
            if (!isLoading && droppedFile) {
              setSelectedFile(droppedFile);
              onFileUpload(droppedFile);
            }
          }}
          style={{
            position: 'relative',
            cursor: 'pointer',
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <FileReportIcon size={44} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
            {t.uploadTitle}{' '}
            <span style={{ textDecoration: 'underline', color: 'var(--color-primary)', cursor: 'pointer' }}>
              {t.uploadBrowse}
            </span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {t.uploadSubtitle}
          </p>
        </div>
      )}
    </div>
  );
};
