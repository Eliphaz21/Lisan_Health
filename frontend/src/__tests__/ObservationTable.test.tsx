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

  it('renders panel name and observation count in English', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="EXTRACTED"
        language="en"
      />
    );

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('2 Analyte measurements extracted')).toBeInTheDocument();
  });

  it('renders observation rows with test values and units in English', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="EXTRACTED"
        language="en"
      />
    );

    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('9.8')).toBeInTheDocument();
    expect(screen.getByText('g/dL')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('renders observation rows localized in Amharic', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="EXTRACTED"
        language="am"
      />
    );

    expect(screen.getByText('2 የተተነተኑ የላብራቶሪ ውጤቶች')).toBeInTheDocument();
    expect(screen.getByText('ዝቅተኛ')).toBeInTheDocument(); // Low
    expect(screen.getByText('መደበኛ')).toBeInTheDocument(); // Normal
  });

  it('renders observation rows localized in Afaan Oromoo', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="EXTRACTED"
        language="om"
      />
    );

    expect(screen.getByText('2 Safartuuwwan qorannoo argaman')).toBeInTheDocument();
    expect(screen.getByText('Gadi-aanaa')).toBeInTheDocument(); // Low
    expect(screen.getByText('Idilee')).toBeInTheDocument(); // Normal
  });

  it('displays extraction warnings when provided', () => {
    render(
      <ObservationTable
        observations={sampleObservations}
        panelName="Complete Blood Count"
        status="NEEDS_REVIEW"
        warnings={['Uncertain reference interval on source report']}
        language="en"
      />
    );

    expect(screen.getByText('Extraction Notice:')).toBeInTheDocument();
    expect(screen.getByText('Uncertain reference interval on source report')).toBeInTheDocument();
  });
});
