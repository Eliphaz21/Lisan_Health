import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SupportedLanguage } from '../types/report';
import { translations } from '../utils/i18n';
import { PlayIcon, PauseIcon, SoundWaveIcon, ReplayIcon } from './Icons';

interface AudioPlayerProps {
  language: SupportedLanguage;
  explanationText: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ language, explanationText }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[language];

  // Smooth playback progress tracker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (audioRef.current && audioRef.current.duration > 0 && !audioRef.current.ended) {
          return audioRef.current.currentTime;
        }
        return Math.min(duration || 10, prev + 0.25);
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Reset audio when language or text changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    setIsPlaying(false);
    if (audioUrl?.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setSpeechError(null);
  }, [language, explanationText]);

  const loadAudio = useCallback(async (): Promise<string | null> => {
    if (audioUrl) return audioUrl;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('lisan_token');
      if (!token) throw new Error('Please sign in again to generate speech.');
      const response = await fetch('/api/v1/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: explanationText || t.audioSubtitleReady,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Synthesis HTTP ${response.status}`);
      }

      const data = await response.json();
      const protectedUrl = data.audio_url || null;
      if (!protectedUrl) throw new Error('The speech provider returned no audio URL.');
      const audioResponse = await fetch(protectedUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!audioResponse.ok) throw new Error(`Audio stream HTTP ${audioResponse.status}`);
      const blob = await audioResponse.blob();
      if (blob.size === 0) throw new Error('The generated audio file is empty.');
      const objectUrl = URL.createObjectURL(blob);
      setAudioUrl(objectUrl);
      setSpeechError(null);
      return objectUrl;
    } catch (error: any) {
      throw new Error(error?.message || 'Speech generation failed.');
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl, explanationText, language, t.audioSubtitleReady]);

  const togglePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch {}
      setIsPlaying(false);
      return;
    }

    let url: string | null;
    try {
      url = await loadAudio();
    } catch (error: any) {
      setSpeechError(error?.message || 'Speech generation failed. Please try again later.');
      setIsPlaying(false);
      return;
    }
    if (!url) return;

    if (!audioRef.current) {
      const audio = new Audio(url);
      audio.playbackRate = speed;

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration || 0);
      });

      audio.addEventListener('ended', () => {
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
          return;
        }
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', () => {
        setIsPlaying(false);
      });

      audioRef.current = audio;
    }

    audioRef.current.playbackRate = speed;
    try {
      const playPromise = audioRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(true));
      } else {
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      try {
        const p = audioRef.current.play();
        if (p && typeof p.then === 'function') {
          p.then(() => setIsPlaying(true)).catch(() => {});
        } else {
          setIsPlaying(true);
        }
      } catch {
        setIsPlaying(true);
      }
    }
    setCurrentTime(0);
  };

  const handleSpeedChange = () => {
    const nextSpeed = speed === 1.0 ? 1.25 : speed === 1.25 ? 0.85 : 1.0;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="audio-card" role="region" aria-label={t.audioTitle}>
      <div className="audio-info">
        <button
          type="button"
          className="audio-icon-btn"
          onClick={togglePlay}
          disabled={isLoading}
          aria-label={isPlaying ? t.audioPause : t.audioPlay}
          style={{ position: 'relative' }}
        >
          {isPlaying ? (
            <PauseIcon size={20} color="var(--color-primary-dark)" />
          ) : (
            <PlayIcon size={20} color="var(--color-primary-dark)" />
          )}
        </button>

        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{t.audioTitle}</span>
            <SoundWaveIcon size={18} color="var(--color-skymint)" />
          </div>
          <div
            style={{ fontSize: '0.8rem', opacity: 0.9 }}
            title={explanationText ? `Source: ${explanationText.slice(0, 100)}` : undefined}
          >
            {isLoading ? '...' : isPlaying ? t.audioSubtitlePlaying : t.audioSubtitleReady}
          </div>
          {speechError && <div role="alert" style={{ color: '#FCA5A5', fontSize: '0.75rem', marginTop: '0.25rem' }}>{speechError}</div>}
        </div>
      </div>

      {/* Center audio progress and wave */}
      <div style={{ flex: 1, margin: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="range"
            min="0"
            max={duration || 10}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Audio scrubber"
            style={{
              flex: 1,
              accentColor: 'var(--color-skymint)',
              cursor: 'pointer',
              height: '4px',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'monospace' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Animated equalizer bars when playing */}
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '10px' }}>
          {[12, 18, 8, 22, 14, 20, 10, 16, 24, 12].map((height, idx) => (
            <div
              key={idx}
              style={{
                width: '3px',
                height: isPlaying ? `${height}px` : '4px',
                background: isPlaying ? 'var(--color-skymint)' : 'rgba(255, 255, 255, 0.3)',
                borderRadius: '1px',
                transition: 'height 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={handleReplay}
          aria-label="Replay audio"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.85)',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-full)',
          }}
          title="Replay from start"
        >
          <ReplayIcon size={16} />
        </button>

        <button
          type="button"
          onClick={handleSpeedChange}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--color-skymint)',
            border: '1px solid var(--color-skymint)',
            borderRadius: 'var(--radius-full)',
            padding: '0.3rem 0.75rem',
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
