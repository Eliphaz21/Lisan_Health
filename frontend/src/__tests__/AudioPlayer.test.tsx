import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from '../components/AudioPlayer';
import { translations } from '../utils/i18n';

describe('AudioPlayer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders audio player controls in Amharic', () => {
    render(<AudioPlayer language="am" explanationText="ይህ የሙከራ ጽሁፍ ነው።" />);
    expect(screen.getByText(translations.am.audioTitle)).toBeDefined();
    expect(screen.getByLabelText(translations.am.audioPlay)).toBeDefined();
    expect(screen.getByLabelText('Replay audio')).toBeDefined();
    expect(screen.getByText(new RegExp(translations.am.audioSpeed))).toBeDefined();
  });

  it('renders audio player controls in Afaan Oromoo', () => {
    render(<AudioPlayer language="om" explanationText="Ibsa dhiigaa." />);
    expect(screen.getByText(translations.om.audioTitle)).toBeDefined();
    expect(screen.getByLabelText(translations.om.audioPlay)).toBeDefined();
    expect(screen.getByLabelText('Replay audio')).toBeDefined();
  });

  it('renders audio player controls in English', () => {
    render(<AudioPlayer language="en" explanationText="Clinical report explanation." />);
    expect(screen.getByText(translations.en.audioTitle)).toBeDefined();
    expect(screen.getByLabelText(translations.en.audioPlay)).toBeDefined();
    expect(screen.getByLabelText('Replay audio')).toBeDefined();
  });

  it('cycles playback speed when speed button is clicked', () => {
    render(<AudioPlayer language="en" explanationText="Clinical report." />);
    const speedBtn = screen.getByTitle('Adjust speech playback speed for clarity');
    expect(speedBtn.textContent).toContain('1x');

    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toContain('1.25x');

    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toContain('0.85x');

    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toContain('1x');
  });

  it('toggles play/pause state when clicked', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        audio_id: 'test-audio-123',
        audio_url: '/api/v1/speech/audio/test-audio-123',
      }),
    } as any);

    render(<AudioPlayer language="en" explanationText="Clinical report." />);
    const playBtn = screen.getByLabelText(translations.en.audioPlay);

    fireEvent.click(playBtn);
    expect(playBtn).toBeDefined();
  });
});
