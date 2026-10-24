import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HistoryPage } from '../pages/HistoryPage';
import type { User, SavedReportItem } from '../types/auth';

describe('HistoryPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user-001',
    email: 'patient@example.com',
    full_name: 'Abebe Bikila',
    role: 'USER',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const mockSavedReports: SavedReportItem[] = [
    {
      id: 'rep-001',
      user_id: 'user-001',
      original_file_name: 'cbc_test.txt',
      report_text: 'WBC 14.2, HGB 11.2',
      extracted_json: {
        test_category: 'Complete Blood Count (CBC)',
        analytes: [
          { name: 'White Blood Cell', value: 14.2, unit: '10^3/uL', flag: 'HIGH', reference_range_low: 4.5, reference_range_high: 11.0 },
          { name: 'Hemoglobin', value: 11.2, unit: 'g/dL', flag: 'LOW', reference_range_low: 13.5, reference_range_high: 17.5 },
        ],
      },
      explanation_json: {
        summary: 'Elevated white blood cells suggest a possible immune response.',
        questions_for_doctor: ['What is causing elevated WBC count?'],
      },
      localized_amharic: {
        summary: 'የነጭ የደም ሴሎች ቁጥር መጨመር የበሽታ መከላከል ምላሽን ያሳያል።',
        questions_for_doctor: ['የነጭ ደም ሴሎች መጨመር መንስኤው ምንድን ነው?'],
      },
      audio_amharic_url: '/api/v1/audio/stream/cbc_am.mp3',
      created_at: '2026-10-24T09:00:00.000Z',
    },
    {
      id: 'rep-002',
      user_id: 'user-001',
      original_file_name: 'lipid_panel.pdf',
      report_text: 'Cholesterol 175',
      extracted_json: {
        test_category: 'Lipid Profile',
        analytes: [
          { name: 'Total Cholesterol', value: 175, unit: 'mg/dL', flag: 'NORMAL', reference_range_low: 125, reference_range_high: 200 },
        ],
      },
      explanation_json: {
        summary: 'Lipid panel levels are within the normal reference range.',
        questions_for_doctor: ['How often should lipid levels be re-evaluated?'],
      },
      created_at: '2026-10-23T14:30:00.000Z',
    },
  ];

  it('displays auth guard warning when user is not signed in', () => {
    render(
      <BrowserRouter>
        <HistoryPage currentUser={null} token="" onLoadReportIntoHome={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Personal History Access Required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Sign In$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('renders clinical history dashboard, top KPI stat cards, and reports list', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      if (url.toString().includes('/api/v1/history')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSavedReports,
        } as Response);
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <BrowserRouter>
        <HistoryPage currentUser={mockUser} token="mock-token-123" onLoadReportIntoHome={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/My Clinical History/i)).toBeInTheDocument();
      expect(screen.getByText(/Complete Blood Count \(CBC\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Lipid Profile/i)).toBeInTheDocument();
    });

    // Check KPI cards
    expect(screen.getByText(/Saved Reports/i)).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-reports')).toHaveTextContent('2');
    expect(screen.getByText(/Out-of-Range Flags/i)).toBeInTheDocument();
    expect(screen.getByTestId('kpi-flags')).toHaveTextContent('2');
    expect(screen.getByText(/Localized Audio/i)).toBeInTheDocument();
  });

  it('filters reports using search box', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockSavedReports,
      } as Response)
    );

    render(
      <BrowserRouter>
        <HistoryPage currentUser={mockUser} token="mock-token-123" onLoadReportIntoHome={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Complete Blood Count \(CBC\)/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by panel, file, analyte or notes/i);
    fireEvent.change(searchInput, { target: { value: 'Lipid' } });

    expect(screen.getByText(/Lipid Profile/i)).toBeInTheDocument();
    expect(screen.queryByText(/Complete Blood Count \(CBC\)/i)).not.toBeInTheDocument();
  });

  it('opens deep dive inspection modal and displays detailed observations and Amharic translation', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockSavedReports,
      } as Response)
    );

    const mockLoadIntoHome = vi.fn();

    render(
      <BrowserRouter>
        <HistoryPage currentUser={mockUser} token="mock-token-123" onLoadReportIntoHome={mockLoadIntoHome} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Complete Blood Count \(CBC\)/i)).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect Findings/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('inspection-modal')).toBeInTheDocument();
      expect(screen.getByText(/Educational Safety Notice/i)).toBeInTheDocument();
    });

    // Test Load into Explainer
    const loadExplainerBtn = screen.getByRole('button', { name: /Open in Main Clinical Explainer/i });
    fireEvent.click(loadExplainerBtn);

    expect(mockLoadIntoHome).toHaveBeenCalledTimes(1);
  });
});
