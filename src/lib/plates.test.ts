import { describe, expect, it } from "vitest";
import { LBS_PER_KG } from "./units";
import {
  BARS,
  PLATES,
  barById,
  solve,
  type LoadResult,
  type SolveOptions,
} from "./plates";

const base: SolveOptions = {
  includeBar: true,
  rounding: "over",
  bar: "barbell",
};

/** [lbs, count] per side, in the order the solver returns them. */
function side(result: LoadResult): Array<[number, number]> {
  return result.perSide.map(({ plate, count }) => [plate.lbs, count]);
}

describe("inventory", () => {
  it("is exactly the five gym plates, heaviest first", () => {
    expect(PLATES.map((p) => p.lbs)).toEqual([45, 35, 25, 15, 10]);
    expect(PLATES.map((p) => p.name)).toEqual([
      "blue",
      "yellow",
      "green",
      "black",
      "white",
    ]);
  });

  it("has a 45 lb barbell and a 25 lb curl bar", () => {
    expect(BARS.map((b) => [b.id, b.lbs])).toEqual([
      ["barbell", 45],
      ["curl", 25],
    ]);
    expect(barById("curl").name).toBe("Curl bar");
  });
});

describe("solve", () => {
  it("100 kg with the bar included, closest over, is 225 lb as two 45s per side", () => {
    const result = solve(100, base);
    expect(result.totalLbs).toBe(225);
    expect(result.plateLbs).toBe(180);
    expect(side(result)).toEqual([[45, 2]]);
    expect(result.deltaLbs).toBeCloseTo(4.538, 3);
    expect(result.barExceedsTarget).toBe(false);
    expect(result.rounding).toBe("over");
  });

  it("100 kg closest under is 215 lb as 45 + 25 + 15 per side", () => {
    const result = solve(100, { ...base, rounding: "under" });
    expect(result.totalLbs).toBe(215);
    expect(side(result)).toEqual([
      [45, 1],
      [25, 1],
      [15, 1],
    ]);
    expect(result.deltaLbs).toBeCloseTo(-5.462, 3);
  });

  it("loads a 50 lb side as 35 + 15, not greedily as 45", () => {
    const result = solve(145 / LBS_PER_KG, base);
    expect(result.totalLbs).toBe(145);
    expect(side(result)).toEqual([
      [35, 1],
      [15, 1],
    ]);
  });

  it("does not push an exactly loadable target a step because of floating-point noise", () => {
    const kg = 225 / LBS_PER_KG;
    expect(solve(kg, base).totalLbs).toBe(225);
    expect(solve(kg, { ...base, rounding: "under" }).totalLbs).toBe(225);
  });

  it("with the bar excluded the plates alone reach the target and the total excludes the bar", () => {
    const result = solve(100, { ...base, includeBar: false });
    expect(result.totalLbs).toBe(230);
    expect(result.plateLbs).toBe(230);
    expect(result.includeBar).toBe(false);
    expect(side(result)).toEqual([
      [45, 2],
      [25, 1],
    ]);
  });

  it("uses 25 lb for the curl bar", () => {
    const result = solve(100, { ...base, bar: "curl" });
    expect(result.bar.lbs).toBe(25);
    expect(result.totalLbs).toBe(225);
    expect(side(result)).toEqual([
      [45, 2],
      [10, 1],
    ]);
  });

  it("target below the bar, closest over, is the bare bar", () => {
    const result = solve(10, base);
    expect(result.perSide).toEqual([]);
    expect(result.totalLbs).toBe(45);
    expect(result.barExceedsTarget).toBe(true);
  });

  it("target below the bar, closest under, is the bare bar and flagged", () => {
    const result = solve(10, { ...base, rounding: "under" });
    expect(result.perSide).toEqual([]);
    expect(result.totalLbs).toBe(45);
    expect(result.barExceedsTarget).toBe(true);
  });

  it("bar excluded with a tiny target, closest under, loads nothing", () => {
    const result = solve(6.8, {
      ...base,
      includeBar: false,
      rounding: "under",
    });
    expect(result.totalLbs).toBe(0);
    expect(result.perSide).toEqual([]);
    expect(result.barExceedsTarget).toBe(false);
  });

  it("lists plates heaviest first with no zero counts", () => {
    const result = solve(200, { ...base, rounding: "under" });
    expect(result.totalLbs).toBe(435);
    expect(side(result)).toEqual([
      [45, 4],
      [15, 1],
    ]);
    const weights = result.perSide.map((p) => p.plate.lbs);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
    expect(result.perSide.every((p) => p.count > 0)).toBe(true);
  });

  it("handles the maximum input without blowing up", () => {
    const result = solve(500, base);
    expect(result.totalLbs).toBeGreaterThanOrEqual(1102);
    expect(result.totalLbs).toBeLessThan(1115);
  });
});
