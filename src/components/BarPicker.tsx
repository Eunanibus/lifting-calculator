import { BARS, type BarId } from '../lib/plates';

type BarPickerProps = { value: BarId; onChange: (bar: BarId) => void };

/** The bar choice lives on the page because it changes between exercises, not between gyms. */
export default function BarPicker({ value, onChange }: BarPickerProps) {
  return (
    <fieldset className="bar-picker">
      <legend className="visually-hidden">Bar</legend>
      <div className="segmented">
        {BARS.map((bar) => (
          <label key={bar.id} className="segment">
            <input
              type="radio"
              name="bar"
              value={bar.id}
              checked={value === bar.id}
              onChange={() => onChange(bar.id)}
            />
            <span>
              {bar.name} <small>{bar.stacks === 2 ? `${bar.lbs} lb` : 'single stack'}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
