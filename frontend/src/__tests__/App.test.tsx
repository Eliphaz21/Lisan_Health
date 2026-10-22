import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

describe('App Component Integration Test', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url === '/api/v1/health') {
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
        if (url === '/api/v1/reports/parse-synthetic') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                report_id: 'SYNTH-CBC-001',
                panel_name: 'Complete Blood Count (CBC)',
                raw_text: 'CBC Report',
                observations: [
                  {
                    test_name: 'Hemoglobin (HGB)',
                    code: 'HGB',
                    value: 9.8,
                    unit: 'g/dL',
                    flag: 'LOW',
                    needs_review: false,
                  },
                ],
                status: 'EXTRACTED',
                confidence_score: 1.0,
                warnings: [],
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

    await waitFor(() => {
      expect(screen.getByText(/ሲስተም ዝግጁ ነው \(v0.1.0\)/i)).toBeInTheDocument();
    });
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

  it('loads synthetic CBC data and displays localized results and doctor questions', async () => {
    render(<App />);

    // Switch to English for deterministic button text lookup
    const englishBtn = screen.getByRole('radio', { name: 'English' });
    fireEvent.click(englishBtn);

    const cbcBtn = screen.getByRole('button', { name: /Complete Blood Count \(Anemia\)/i });
    fireEvent.click(cbcBtn);

    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
      expect(screen.getByText('Hemoglobin (HGB)')).toBeInTheDocument();
      expect(screen.getByText('9.8')).toBeInTheDocument();
      expect(screen.getByText(/Suggested Questions for Your Healthcare Provider/i)).toBeInTheDocument();
    });
  });
});
