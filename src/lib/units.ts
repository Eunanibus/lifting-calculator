export const LBS_PER_KG = 2.20462;

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

/** One decimal place with a trailing ".0" dropped: 220.462 is "220.5", 225 is "225". */
export function formatWeight(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export type DeltaDescription = { value: string; kg: string | null; label: string };

/**
 * Splits the signed difference between a loaded total and the target into a
 * short pound value, its unsigned kilogram equivalent, and a label.
 */
export function describeDelta(deltaLbs: number): DeltaDescription {
  if (Math.abs(deltaLbs) < 0.05) {
    return { value: 'Exact', kg: null, label: 'on target' };
  }
  const sign = deltaLbs > 0 ? '+' : '-';
  const direction = deltaLbs > 0 ? 'over' : 'under';
  const size = Math.abs(deltaLbs);
  return { value: `${sign}${formatWeight(size)} lb`, kg: `${formatWeight(lbsToKg(size))} kg`, label: `${direction} target` };
}
