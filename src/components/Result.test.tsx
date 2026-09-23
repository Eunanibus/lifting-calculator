import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Result, { ResultSkeleton } from './Result';
import { solve } from '../lib/plates';

describe('Result', () => {
  it('shows the total with the bar and delta badges either side', () => {
    render(<Result result={solve(100, { includeBar: true, rounding: 'over', bar: 'barbell' })} />);
    expect(screen.getByText('225')).toBeInTheDocument();
    expect(screen.getByText('(102.1 kg)')).toBeInTheDocument();
    expect(screen.getByText('100 kg is 220.5 lb')).toBeInTheDocument();

    const barBadge = within(screen.getByTestId('bar-badge'));
    expect(barBadge.getByText('Barbell')).toBeInTheDocument();
    expect(barBadge.getByText('45 lb')).toBeInTheDocument();
    expect(barBadge.getByText('(20.4 kg)')).toHaveClass('badge-kg');
    expect(barBadge.getByText('180 lb plates')).toBeInTheDocument();

    const deltaBadge = within(screen.getByTestId('delta-badge'));
    expect(deltaBadge.getByText('Closest over')).toBeInTheDocument();
    expect(deltaBadge.getByText('+4.5 lb')).toBeInTheDocument();
    expect(deltaBadge.getByText('(2.1 kg)')).toHaveClass('badge-kg');
    expect(deltaBadge.getByText('over target')).toBeInTheDocument();
  });

  it('lists each plate with a swatch and the count per side', () => {
    render(<Result result={solve(100, { includeBar: true, rounding: 'under', bar: 'barbell' })} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      '45 lb× 1 per side',
      '35 lb× 1 per side',
      '5 lb× 1 per side',
      '2.5 lb× 1 per side',
    ]);
    expect(within(rows[0] as HTMLElement).getByTestId('swatch')).toHaveClass('plate-blue');

    const deltaBadge = within(screen.getByTestId('delta-badge'));
    expect(deltaBadge.getByText('Closest under')).toBeInTheDocument();
    expect(deltaBadge.getByText('-0.5 lb')).toBeInTheDocument();
    expect(deltaBadge.getByText('(0.2 kg)')).toBeInTheDocument();
    expect(deltaBadge.getByText('under target')).toBeInTheDocument();
  });

  it('says when the bar is not counted', () => {
    render(<Result result={solve(100, { includeBar: false, rounding: 'over', bar: 'barbell' })} />);
    expect(screen.getByText('225')).toBeInTheDocument();
    const barBadge = within(screen.getByTestId('bar-badge'));
    expect(barBadge.getByText('Bar')).toBeInTheDocument();
    expect(barBadge.getByText('not counted')).toBeInTheDocument();
    expect(barBadge.queryByText(/kg\)/)).not.toBeInTheDocument();
    expect(barBadge.getByText('225 lb plates')).toBeInTheDocument();
  });

  it('describes the slinger plate as a single stack with no per-side wording', () => {
    render(<Result result={solve(50, { includeBar: true, rounding: 'under', bar: 'slinger' })} />);
    expect(screen.getByText('110')).toBeInTheDocument();
    const barBadge = within(screen.getByTestId('bar-badge'));
    expect(barBadge.getByText('Slinger plate')).toBeInTheDocument();
    expect(barBadge.getByText('single stack')).toBeInTheDocument();
    expect(barBadge.getByText('110 lb plates')).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(['45 lb× 2', '15 lb× 1', '5 lb× 1']);
  });

  it('explains a bar that outweighs the target', () => {
    render(<Result result={solve(10, { includeBar: true, rounding: 'under', bar: 'barbell' })} />);
    expect(screen.getByText('The barbell alone is heavier than the target.')).toBeInTheDocument();
    expect(screen.getByText('No plates loaded.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    const deltaBadge = within(screen.getByTestId('delta-badge'));
    expect(deltaBadge.getByText('+23 lb')).toBeInTheDocument();
    expect(deltaBadge.getByText('(10.4 kg)')).toBeInTheDocument();
    expect(deltaBadge.getByText('over target')).toBeInTheDocument();
  });
});

describe('ResultSkeleton', () => {
  it('is labelled for assistive tech', () => {
    render(<ResultSkeleton />);
    expect(screen.getByLabelText('Calculating')).toHaveClass('result-skeleton');
  });
});
