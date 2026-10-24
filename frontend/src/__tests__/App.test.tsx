import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

describe('App Component Integration Test', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input) => {
        const urlStr = typeof input === 'string' ? input : (input as any)?.url || String(input);
        if (urlStr.includes('/api/v1/health')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'healthy',
                version: '0.1.0',
                environment: 'test',
                timestamp: '2026-10-22T00:00:00Z',
              }),
          });
        }
        if (urlStr.includes('/api/v1/pipeline/upload') || urlStr.includes('/api/v1/pipeline/process')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                extracted: {
                  test_category: 'Complete Blood Count (CBC)',
                  raw_text: 'CBC Report text',
                  analytes: [
                    {
                      name: 'Hemoglobin (HGB)',
                      value: 9.8,
                      unit: 'g/dL',
                      reference_range_low: 12.0,
                      reference_range_high: 16.0,
                      flag: 'LOW',
                    },
                  ],
                },
                explanation_en: {
                  summary: 'Your hemoglobin is slightly lower than normal.',
                  findings: ['Hemoglobin 9.8 g/dL is low'],
                  questions_for_doctor: ['Could iron deficiency cause my low hemoglobin?'],
                },
                explanation_localized: {
                  language: 'am',
                  summary: 'የሄሞግሎቢን መጠንዎ ከመደበኛው በትንሹ ዝቅ ያለ ነው።',
                  findings: ['ሄሞግሎቢን 9.8 g/dL ዝቅተኛ ነው'],
                  questions_for_doctor: ['የብረት እጥረት ዝቅተኛ ሄሞግሎቢን ሊያስከትል ይችላል?'],
                },
                audio_url: 'https://example.com/audio.mp3',
              }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      })
    );
  });

  it('renders with official brand logo and default Amharic localization', async () => {
    render(<App />);
    const logo = screen.getByAltText('LisanHealth Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logo.png');

    // Default language is Amharic
    expect(
      screen.getByRole('heading', { level: 1, name: /የጤና ሪፖርትዎ፣ በቋንቋዎ/i })
    ).toBeInTheDocument();

    // Verify upload card dropzone is present
    expect(screen.getByText(/የላብራቶሪ ሪፖርትዎን እዚህ ያስቀምጡ/i)).toBeInTheDocument();
  });

  it('switches between Amharic, English, and Afaan Oromoo seamlessly', () => {
    render(<App />);
    const amharicBtn = screen.getByRole('radio', { name: 'አማርኛ' });
    const englishBtn = screen.getByRole('radio', { name: 'English' });
    const oromoBtn = screen.getByRole('radio', { name: 'Oromoo' });

    expect(amharicBtn).toHaveAttribute('aria-checked', 'true');

    // Switch to English
    fireEvent.click(englishBtn);
    expect(englishBtn).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('heading', { level: 1, name: /Your Health Report, in Your Language/i })
    ).toBeInTheDocument();

    // Switch to Afaan Oromoo
    fireEvent.click(oromoBtn);
    expect(oromoBtn).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('heading', { level: 1, name: /Gabaasa Fayyaa Keessanii, Afaan Keessaniin/i })
    ).toBeInTheDocument();
  });

  it('processes uploaded report and displays localized results, audio player, and doctor questions', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Switch to English
    const englishBtn = screen.getByRole('radio', { name: 'English' });
    await user.click(englishBtn);

    // Trigger file upload
    const uploadTrigger = screen.getByTestId('upload-trigger-btn');
    fireEvent.click(uploadTrigger);

    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
      expect(screen.getByText('Hemoglobin (HGB)')).toBeInTheDocument();
      expect(screen.getByText('9.8')).toBeInTheDocument();
      expect(screen.getByText(/Suggested Questions for Your Healthcare Provider/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Play Audio/i }).length).toBeGreaterThanOrEqual(1);
    });
  });
});
