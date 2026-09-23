import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BarPicker from './BarPicker';

describe('BarPicker', () => {
  it('offers the three bars with their weights and marks the current one', () => {
    render(<BarPicker value="curl" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Barbell 45 lb' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Curl bar 25 lb' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Slinger plate single stack' })).not.toBeChecked();
  });

  it('reports the chosen bar', () => {
    const onChange = vi.fn();
    render(<BarPicker value="barbell" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Slinger plate single stack' }));
    expect(onChange).toHaveBeenCalledWith('slinger');
  });
});
