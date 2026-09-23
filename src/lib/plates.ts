import { kgToLbs } from "./units";

export type Plate = { lbs: number; color: string; name: string };
export type BarId = 'barbell' | 'curl' | 'slinger';
/** stacks is 2 for a bar loaded on both sleeves, 1 for a single loading pin such as a slinger plate. */
export type Bar = { id: BarId; name: string; lbs: number; stacks: 1 | 2 };
export type Rounding = "over" | "under";
export type PlateCount = { plate: Plate; count: number };
export type SolveOptions = {
  includeBar: boolean;
  rounding: Rounding;
  bar: BarId;
};

export type LoadResult = {
  targetKg: number;
  targetLbs: number;
  bar: Bar;
  includeBar: boolean;
  rounding: Rounding;
  /** One stack: a side of a two-sleeve bar, or the whole load of a single-stack attachment. Heaviest first, no zero counts. */
  perSide: PlateCount[];
  /** Every stack together. */
  plateLbs: number;
  /** Plates plus the bar when the bar is included. */
  totalLbs: number;
  /** totalLbs minus targetLbs. Positive means over. */
  deltaLbs: number;
  /** The bar alone outweighs the target, so no loading can land under it. */
  barExceedsTarget: boolean;
};

/**
 * The gym's plates, heaviest first. Colours match the physical plates, so
 * `name` repeats across weights (the 45 and 5 are both blue, the 25 and 2.5
 * both green); it styles the swatch and is never used as an identifier.
 */
export const PLATES: readonly Plate[] = [
  { lbs: 45, color: "#1e63d0", name: "blue" },
  { lbs: 35, color: "#f2c00c", name: "yellow" },
  { lbs: 25, color: "#2e9e4f", name: "green" },
  { lbs: 15, color: "#1c1c1e", name: "black" },
  { lbs: 10, color: "#f4f4f2", name: "white" },
  { lbs: 5, color: "#1e63d0", name: "blue" },
  { lbs: 2.5, color: "#2e9e4f", name: "green" },
];

export const BARS: readonly Bar[] = [
  { id: 'barbell', name: 'Barbell', lbs: 45, stacks: 2 },
  { id: 'curl', name: 'Curl bar', lbs: 25, stacks: 2 },
  { id: 'slinger', name: 'Slinger plate', lbs: 0, stacks: 1 },
];

export function barById(id: BarId): Bar {
  const bar = BARS.find((candidate) => candidate.id === id);
  if (!bar) {
    throw new Error(`Unknown bar: ${id}`);
  }
  return bar;
}

/** Every plate weight is a whole number of these units, so sums can index an array. */
const UNIT_LBS = 0.25;

/**
 * A target that converts to an exactly loadable weight can land at 224.9999 lb.
 * Without this slack, "over" would push it a whole step to the next plate.
 */
const TOLERANCE_LBS = 0.01;

function toUnits(lbs: number): number {
  const units = lbs / UNIT_LBS;
  if (!Number.isInteger(units)) {
    throw new Error(`${lbs} lb is not a multiple of ${UNIT_LBS} lb`);
  }
  return units;
}

/** Parallel to PLATES, so an index into one is an index into the other. */
const PLATE_UNITS = PLATES.map((plate) => toUnits(plate.lbs));

type Table = {
  /** Minimum plate count for each sum in units; Infinity when unreachable. */
  minPlates: number[];
  /** Index into PLATES of the plate that achieves minPlates at each sum; -1 when unreachable. */
  lastPlate: number[];
};

/**
 * Coin-change table over the plate inventory. Plates are tried heaviest first
 * and only replace a strictly worse count, so walking the table back from a
 * sum yields the fewest plates, with heavier plates preferred on ties.
 */
function buildTable(maxUnits: number): Table {
  const minPlates = new Array<number>(maxUnits + 1).fill(
    Number.POSITIVE_INFINITY,
  );
  const lastPlate = new Array<number>(maxUnits + 1).fill(-1);
  minPlates[0] = 0;
  for (let sum = 1; sum <= maxUnits; sum += 1) {
    PLATE_UNITS.forEach((units, index) => {
      if (units > sum) return;
      const candidate =
        (minPlates[sum - units] ?? Number.POSITIVE_INFINITY) + 1;
      if (candidate < (minPlates[sum] ?? Number.POSITIVE_INFINITY)) {
        minPlates[sum] = candidate;
        lastPlate[sum] = index;
      }
    });
  }
  return { minPlates, lastPlate };
}

function isReachable(table: Table, sumUnits: number): boolean {
  return Number.isFinite(table.minPlates[sumUnits] ?? Number.POSITIVE_INFINITY);
}

function chooseSum(
  table: Table,
  budgetUnits: number,
  rounding: Rounding,
): number {
  if (rounding === "over") {
    for (
      let sum = Math.max(0, Math.ceil(budgetUnits));
      sum < table.minPlates.length;
      sum += 1
    ) {
      if (isReachable(table, sum)) return sum;
    }
    throw new Error("Plate table is too small for this target");
  }
  for (
    let sum = Math.min(Math.floor(budgetUnits), table.minPlates.length - 1);
    sum > 0;
    sum -= 1
  ) {
    if (isReachable(table, sum)) return sum;
  }
  return 0;
}

function reconstruct(table: Table, sumUnits: number): PlateCount[] {
  const counts = new Map<number, number>();
  let remaining = sumUnits;
  while (remaining > 0) {
    const index = table.lastPlate[remaining];
    const units = index === undefined ? undefined : PLATE_UNITS[index];
    if (index === undefined || index < 0 || units === undefined) {
      throw new Error(`${remaining} units is not a loadable sum`);
    }
    counts.set(index, (counts.get(index) ?? 0) + 1);
    remaining -= units;
  }
  return PLATES.flatMap((plate, index) => {
    const count = counts.get(index);
    return count ? [{ plate, count }] : [];
  });
}

export function solve(targetKg: number, options: SolveOptions): LoadResult {
  const bar = barById(options.bar);
  const targetLbs = kgToLbs(targetKg);
  const barLbs = options.includeBar ? bar.lbs : 0;
  const sideBudgetLbs = Math.max(0, targetLbs - barLbs) / bar.stacks;

  const toleranceUnits = TOLERANCE_LBS / UNIT_LBS;
  const rawBudgetUnits = sideBudgetLbs / UNIT_LBS;
  const budgetUnits =
    options.rounding === "over"
      ? rawBudgetUnits - toleranceUnits
      : rawBudgetUnits + toleranceUnits;

  // Every multiple of 5 lb from 10 lb up is reachable, so two of the heaviest
  // plate is far more headroom than "over" ever needs.
  const heaviestUnits = PLATE_UNITS[0] ?? 0;
  const table = buildTable(
    Math.ceil(Math.max(0, budgetUnits)) + heaviestUnits * 2,
  );

  const sideUnits = chooseSum(table, budgetUnits, options.rounding);
  const plateLbs = sideUnits * UNIT_LBS * bar.stacks;
  const totalLbs = barLbs + plateLbs;

  return {
    targetKg,
    targetLbs,
    bar,
    includeBar: options.includeBar,
    rounding: options.rounding,
    perSide: reconstruct(table, sideUnits),
    plateLbs,
    totalLbs,
    deltaLbs: totalLbs - targetLbs,
    barExceedsTarget: options.includeBar && bar.lbs > targetLbs + TOLERANCE_LBS,
  };
}
