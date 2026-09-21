import type { LoadResult } from '../lib/plates';
import { describeDelta, formatWeight, lbsToKg } from '../lib/units';

type ResultProps = { result: LoadResult };

export default function Result({ result }: ResultProps) {
  const { totalLbs, targetKg, targetLbs, deltaLbs, bar, includeBar, rounding, plateLbs, perSide, barExceedsTarget } =
    result;
  const delta = describeDelta(deltaLbs);

  return (
    <section className="result">
      <div className="result-row">
        <div className="badge" data-testid="bar-badge">
          <span className="badge-title">{includeBar ? bar.name : 'Bar'}</span>
          <span className="badge-value">{includeBar ? `${formatWeight(bar.lbs)} lb` : 'not counted'}</span>
          <span className="badge-sub">{formatWeight(plateLbs)} lb plates</span>
        </div>
        <p className="result-total">
          <span className="result-lbs">{formatWeight(totalLbs)}</span> <span className="result-unit">lb</span>
          <span className="result-kg">({formatWeight(lbsToKg(totalLbs))} kg)</span>
        </p>
        <div className="badge" data-testid="delta-badge">
          <span className="badge-title">Closest {rounding}</span>
          <span className="badge-value">{delta.value}</span>
          <span className="badge-sub">{delta.label}</span>
        </div>
      </div>
      <p className="result-line">
        {formatWeight(targetKg)} kg is {formatWeight(targetLbs)} lb
      </p>
      {barExceedsTarget && (
        <p className="result-note">The {bar.name.toLowerCase()} alone is heavier than the target.</p>
      )}
      {perSide.length === 0 ? (
        <p className="result-empty">No plates loaded.</p>
      ) : (
        <ul className="key">
          {perSide.map(({ plate, count }) => (
            <li key={plate.lbs} className="key-row">
              <span
                className={`key-swatch plate-${plate.name}`}
                style={{ background: plate.color }}
                data-testid="swatch"
                aria-hidden="true"
              />
              <span className="key-weight">{plate.lbs} lb</span>
              <span className="key-count">× {count} per side</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ResultSkeleton() {
  return (
    <section className="result result-skeleton" aria-label="Calculating">
      <div className="result-row">
        <div className="skeleton skeleton-badge" />
        <div className="skeleton skeleton-total" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line is-short" />
    </section>
  );
}
