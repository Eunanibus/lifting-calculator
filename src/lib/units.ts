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

/** Reads the signed difference between a loaded total and the target. */
export function describeDelta(deltaLbs: number): string {
  if (Math.abs(deltaLbs) < 0.05) {
    return "exactly on target";
  }
  const direction = deltaLbs > 0 ? "over" : "under";
  return `${formatWeight(Math.abs(deltaLbs))} lb ${direction} target`;
}
