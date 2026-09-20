import { describe, expect, it } from "vitest";
import {
  LBS_PER_KG,
  describeDelta,
  formatWeight,
  kgToLbs,
  lbsToKg,
} from "./units";

describe("units", () => {
  it("uses 2.20462 lb per kg", () => {
    expect(LBS_PER_KG).toBe(2.20462);
    expect(kgToLbs(100)).toBeCloseTo(220.462, 3);
  });

  it("converts pounds back to kilograms", () => {
    expect(lbsToKg(225)).toBeCloseTo(102.06, 2);
  });

  it("formats to one decimal place and drops a trailing .0", () => {
    expect(formatWeight(220.462)).toBe("220.5");
    expect(formatWeight(225)).toBe("225");
    expect(formatWeight(224.96)).toBe("225");
    expect(formatWeight(0)).toBe("0");
    expect(formatWeight(102.0584)).toBe("102.1");
  });

  it("describes how far a total landed from the target", () => {
    expect(describeDelta(4.538)).toBe("4.5 lb over target");
    expect(describeDelta(-5.462)).toBe("5.5 lb under target");
    expect(describeDelta(0.01)).toBe("exactly on target");
    expect(describeDelta(-0.04)).toBe("exactly on target");
  });
});
