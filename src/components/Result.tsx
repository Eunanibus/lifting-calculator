import type { LoadResult } from "../lib/plates";
import { describeDelta, formatWeight, lbsToKg } from "../lib/units";

type ResultProps = { result: LoadResult };

export default function Result({ result }: ResultProps) {
  const {
    totalLbs,
    targetKg,
    targetLbs,
    deltaLbs,
    bar,
    includeBar,
    rounding,
    plateLbs,
    perSide,
    barExceedsTarget,
  } = result;

  const breakdown = includeBar
    ? `${bar.name} ${formatWeight(bar.lbs)} lb + ${formatWeight(plateLbs)} lb of plates`
    : `${formatWeight(plateLbs)} lb of plates, bar not counted`;

  return (
    <section className="result">
      <p className="result-total">
        <span className="result-lbs">{formatWeight(totalLbs)}</span>{" "}
        <span className="result-unit">lb</span>{" "}
        <span className="result-kg">
          ({formatWeight(lbsToKg(totalLbs))} kg)
        </span>
      </p>
      <p className="result-line">
        {formatWeight(targetKg)} kg is {formatWeight(targetLbs)} lb
      </p>
      <p className="result-line">
        Closest {rounding}: {describeDelta(deltaLbs)}
      </p>
      <p className="result-line">{breakdown}</p>
      {barExceedsTarget && (
        <p className="result-note">
          The {bar.name.toLowerCase()} alone is heavier than the target.
        </p>
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
    <section
      className="result result-skeleton"
      aria-label="Calculating"
    >
      <div className="skeleton skeleton-total" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line is-short" />
      <div className="skeleton skeleton-line" />
    </section>
  );
}
