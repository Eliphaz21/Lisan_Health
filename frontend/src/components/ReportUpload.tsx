import React, { useRef } from 'react';

interface ReportUploadProps {
  onLoadSynthetic: (sampleType: 'cbc' | 'lipid' | 'malformed') => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const ReportUpload: React.FC<ReportUploadProps> = ({
  onLoadSynthetic,
  onFileUpload,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="upload-icon" aria-hidden="true">📋</div>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: '0.25rem' }}>
          Drop laboratory report here, or <span style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>browse</span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Supports medical laboratory PDFs and scanned images (PNG, JPEG up to 10MB)
        </p>
      </div>

      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          OR TEST INSTANTLY WITH SYNTHETIC CLINICAL SAMPLES:
        </span>
        <div className="sample-buttons">
          <button
            type="button"
            className="btn-sample"
            disabled={isLoading}
            onClick={() => onLoadSynthetic('cbc')}
          >
            <span>🩸</span> Complete Blood Count (Anemia)
          </button>
          <button
            type="button"
            className="btn-sample"
            disabled={isLoading}
            onClick={() => onLoadSynthetic('lipid')}
          >
            <span>🫀</span> Lipid Profile Panel
          </button>
          <button
            type="button"
            className="btn-sample"
            disabled={isLoading}
            onClick={() => onLoadSynthetic('malformed')}
          >
            <span>⚠️</span> Malformed Scan (Uncertainty)
          </button>
        </div>
      </div>
    </div>
  );
};
