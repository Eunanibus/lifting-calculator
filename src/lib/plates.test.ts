import { describe, expect, it } from 'vitest';
import { LBS_PER_KG } from './units';
import { BARS, PLATES, barById, solve, type LoadResult, type SolveOptions } from './plates';

const base: SolveOptions = { includeBar: true, rounding: 'over', bar: 'barbell' };

/** [lbs, count] per side, in the order the solver returns them. */
function side(result: LoadResult): Array<[number, number]> {
  return result.perSide.map(({ plate, count }) => [plate.lbs, count]);
}

describe('inventory', () => {
  it('is the seven gym plates, heaviest first', () => {
    expect(PLATES.map((p) => p.lbs)).toEqual([45, 35, 25, 15, 10, 5, 2.5]);
    expect(PLATES.map((p) => p.name)).toEqual(['blue', 'yellow', 'green', 'black', 'white', 'blue', 'green']);
  });

  it('has a 45 lb barbell and a 25 lb curl bar', () => {
    expect(BARS.map((b) => [b.id, b.lbs, b.stacks])).toEqual([
      ['barbell', 45, 2],
      ['curl', 25, 2],
      ['slinger', 0, 1],
    ]);
    expect(barById('curl').name).toBe('Curl bar');
  });
});

describe('solve', () => {
  it('100 kg with the bar included, closest over, is 225 lb as two 45s per side', () => {
    const result = solve(100, base);
    expect(result.totalLbs).toBe(225);
    expect(result.plateLbs).toBe(180);
    expect(side(result)).toEqual([[45, 2]]);
    expect(result.deltaLbs).toBeCloseTo(4.538, 3);
    expect(result.barExceedsTarget).toBe(false);
    expect(result.rounding).toBe('over');
  });

  it('100 kg closest under is 220 lb as 45 + 35 + 5 + 2.5 per side', () => {
    const result = solve(100, { ...base, rounding: 'under' });
    expect(result.totalLbs).toBe(220);
    expect(side(result)).toEqual([
      [45, 1],
      [35, 1],
      [5, 1],
      [2.5, 1],
    ]);
    expect(result.deltaLbs).toBeCloseTo(-0.462, 3);
  });

  it('prefers the heaviest plates among equal counts: a 50 lb side is 45 + 5, not 35 + 15', () => {
    const result = solve(145 / LBS_PER_KG, base);
    expect(result.totalLbs).toBe(145);
    expect(side(result)).toEqual([
      [45, 1],
      [5, 1],
    ]);
  });

  it('prefers fewer plates over heavier ones: a 40 lb side is 35 + 5, not 25 + 10 + 5', () => {
    const result = solve(125 / LBS_PER_KG, base);
    expect(result.totalLbs).toBe(125);
    expect(side(result)).toEqual([
      [35, 1],
      [5, 1],
    ]);
  });

  it('does not push an exactly loadable target a step because of floating-point noise', () => {
    const kg = 225 / LBS_PER_KG;
    expect(solve(kg, base).totalLbs).toBe(225);
    expect(solve(kg, { ...base, rounding: 'under' }).totalLbs).toBe(225);
  });

  it('with the bar excluded the plates alone reach the target and the total excludes the bar', () => {
    const result = solve(100, { ...base, includeBar: false });
    expect(result.totalLbs).toBe(225);
    expect(result.plateLbs).toBe(225);
    expect(result.includeBar).toBe(false);
    expect(side(result)).toEqual([
      [45, 2],
      [15, 1],
      [5, 1],
      [2.5, 1],
    ]);
  });

  it('uses 25 lb for the curl bar', () => {
    const result = solve(100, { ...base, bar: 'curl' });
    expect(result.bar.lbs).toBe(25);
    expect(result.totalLbs).toBe(225);
    expect(side(result)).toEqual([
      [45, 2],
      [10, 1],
    ]);
  });

  it('the slinger plate loads one stack with no bar weight: 50 kg closest over is 112.5 lb', () => {
    const result = solve(50, { ...base, bar: 'slinger' });
    expect(result.bar.stacks).toBe(1);
    expect(result.totalLbs).toBe(112.5);
    expect(result.plateLbs).toBe(112.5);
    expect(side(result)).toEqual([
      [45, 2],
      [15, 1],
      [5, 1],
      [2.5, 1],
    ]);
    expect(result.barExceedsTarget).toBe(false);
  });

  it('the slinger plate, 50 kg closest under, is 110 lb as 45 + 45 + 15 + 5', () => {
    const result = solve(50, { ...base, bar: 'slinger', rounding: 'under' });
    expect(result.totalLbs).toBe(110);
    expect(side(result)).toEqual([
      [45, 2],
      [15, 1],
      [5, 1],
    ]);
  });

  it('target below the bar, closest over, is the bare bar', () => {
    const result = solve(10, base);
    expect(result.perSide).toEqual([]);
    expect(result.totalLbs).toBe(45);
    expect(result.barExceedsTarget).toBe(true);
  });

  it('target below the bar, closest under, is the bare bar and flagged', () => {
    const result = solve(10, { ...base, rounding: 'under' });
    expect(result.perSide).toEqual([]);
    expect(result.totalLbs).toBe(45);
    expect(result.barExceedsTarget).toBe(true);
  });

  it('bar excluded with a target under the smallest pair of plates, closest under, loads nothing', () => {
    const result = solve(2, { ...base, includeBar: false, rounding: 'under' });
    expect(result.totalLbs).toBe(0);
    expect(result.perSide).toEqual([]);
    expect(result.barExceedsTarget).toBe(false);
  });

  it('bar excluded with a small target uses the small plates', () => {
    const result = solve(6.8, { ...base, includeBar: false, rounding: 'under' });
    expect(result.totalLbs).toBe(15);
    expect(side(result)).toEqual([
      [5, 1],
      [2.5, 1],
    ]);
  });

  it('lists plates heaviest first with no zero counts', () => {
    const result = solve(200, { ...base, rounding: 'under' });
    expect(result.totalLbs).toBe(440);
    expect(side(result)).toEqual([
      [45, 4],
      [15, 1],
      [2.5, 1],
    ]);
    const weights = result.perSide.map((p) => p.plate.lbs);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
    expect(result.perSide.every((p) => p.count > 0)).toBe(true);
  });

  it('handles the maximum input without blowing up', () => {
    const result = solve(500, base);
    expect(result.totalLbs).toBeGreaterThanOrEqual(1102);
    expect(result.totalLbs).toBeLessThan(1115);
  });
});
