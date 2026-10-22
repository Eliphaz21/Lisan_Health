import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ObservationTable } from '../components/ObservationTable';
import type { LabObservation } from '../types/report';

describe('ObservationTable Component', () => {
  const sampleObservations: LabObservation[] = [
    {
      test_name: 'Hemoglobin',
      code: 'HGB',
      value: 9.8,
      unit: 'g/dL',
      reference_interval: { low: 12.0, high: 16.0, unit: 'g/dL', text_representation: '12.0 - 16.0 g/dL' },
      flag: 'LOW',
      needs_review: false,
    },
    {
      test_name: 'Platelets',
      code: 'PLT',
      value: 240.0,
      unit: '10^3/uL',
      reference_interval: { low: 150.0, high: 450.0, unit: '10^3/uL' },
      flag: 'NORMAL',
      needs_review: false,
    },
  ];

  it('renders panel name and observation count', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="EXTRACTED"
      />
    );

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('2 Analyte Measurements Extracted')).toBeInTheDocument();
  });

  it('renders observation rows with test values and units', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="EXTRACTED"
      />
    );

    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('9.8')).toBeInTheDocument();
    expect(screen.getByText('g/dL')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('displays extraction warnings when provided', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="NEEDS_REVIEW"
        warnings={['Uncertain reference interval on source report']}
      />
    );

    expect(screen.getByText('Extraction Warnings:')).toBeInTheDocument();
    expect(screen.getByText('Uncertain reference interval on source report')).toBeInTheDocument();
  });
});
