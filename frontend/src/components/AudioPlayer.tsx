import React, { useState } from 'react';
import type { SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';
import { PlayIcon, PauseIcon, SoundWaveIcon } from './Icons';

interface AudioPlayerProps {
  language: SupportedLanguage;
  explanationText: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ language, explanationText }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const t = translations[language];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-card" role="region" aria-label={t.audioTitle}>
      <div className="audio-info">
        <button
          type="button"
          className="audio-icon-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? t.audioPause : t.audioPlay}
        >
          {isPlaying ? <PauseIcon size={20} color="var(--color-primary-dark)" /> : <PlayIcon size={20} color="var(--color-primary-dark)" />}
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{t.audioTitle}</span>
            <SoundWaveIcon size={18} color="rgba(255, 255, 255, 0.85)" />
          </div>
          <div
            style={{ fontSize: '0.8rem', opacity: 0.9 }}
            title={explanationText ? `Source: ${explanationText.slice(0, 100)}` : undefined}
          >
            {isPlaying ? t.audioSubtitlePlaying : t.audioSubtitleReady}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setSpeed(speed === 1.0 ? 0.9 : 1.0)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--color-skymint)',
            border: '1px solid var(--color-skymint)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          title="Adjust speech playback speed for clarity"
        >
          {speed}x {t.audioSpeed}
        </button>
      </div>
    </div>
  );
};
