import React, { useState } from 'react';
import type { SupportedLanguage } from '../types/report';

interface AudioPlayerProps {
  language: SupportedLanguage;
  explanationText: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ language, explanationText }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);

  const languageLabels: Record<SupportedLanguage, string> = {
    en: 'English Spoken Explanation',
    am: 'የድምጽ ማብራሪያ (Amharic Audio)',
    om: 'Ibsa Sagalee (Afaan Oromoo Audio)',
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-card" role="region" aria-label="Audio Explanation Player">
      <div className="audio-info">
        <button
          type="button"
          className="audio-icon-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause audio explanation' : 'Play audio explanation'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{languageLabels[language]}</div>
          <div
            style={{ fontSize: '0.8rem', opacity: 0.9 }}
            title={explanationText ? `Explanation source: ${explanationText.slice(0, 100)}` : undefined}
          >
            Addis AI Natural Voice Synthesis • {isPlaying ? 'Playing...' : 'Ready to listen'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setSpeed(speed === 1.0 ? 0.9 : 1.0)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '0.3rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          title="Adjust speech playback speed for language clarity"
        >
          {speed}x Speed
        </button>
      </div>
    </div>
  );
};
