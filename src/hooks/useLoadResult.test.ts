import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_SETTINGS, type Settings } from "../lib/settings";
import {
  MAX_KG,
  MIN_KG,
  RESULT_DELAY_MS,
  parseKg,
  useLoadResult,
} from "./useLoadResult";

describe("parseKg", () => {
  it("accepts whole and decimal numbers inside the range", () => {
    expect(parseKg("100")).toBe(100);
    expect(parseKg(" 62.5 ")).toBe(62.5);
    expect(parseKg(String(MIN_KG))).toBe(MIN_KG);
    expect(parseKg(String(MAX_KG))).toBe(MAX_KG);
  });

  it("accepts a comma as the decimal separator", () => {
    expect(parseKg("62,5")).toBe(62.5);
  });

  it("rejects empty, garbage, negative, zero and out-of-range input", () => {
    expect(parseKg("")).toBeNull();
    expect(parseKg(".")).toBeNull();
    expect(parseKg("abc")).toBeNull();
    expect(parseKg("1e3")).toBeNull();
    expect(parseKg("-5")).toBeNull();
    expect(parseKg("0")).toBeNull();
    expect(parseKg("0.4")).toBeNull();
    expect(parseKg("500.5")).toBeNull();
  });
});

describe("useLoadResult", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(input: string, settings: Settings = DEFAULT_SETTINGS) {
    return renderHook(
      (props: { input: string; settings: Settings }) =>
        useLoadResult(props.input, props.settings),
      {
        initialProps: { input, settings },
      },
    );
  }

  it("is empty for blank input", () => {
    const { result } = setup("");
    expect(result.current).toEqual({ status: "empty", result: null });
  });

  it("shows calculating immediately, then the result after the delay", () => {
    const { result, rerender } = setup("");
    rerender({ input: "100", settings: DEFAULT_SETTINGS });
    expect(result.current.status).toBe("calculating");
    expect(result.current.result).toBeNull();

    act(() => {
      vi.advanceTimersByTime(RESULT_DELAY_MS - 1);
    });
    expect(result.current.status).toBe("calculating");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.status).toBe("ready");
    expect(result.current.result?.totalLbs).toBe(225);
  });

  it("restarts the delay when the input changes mid-way", () => {
    const { result, rerender } = setup("100");
    act(() => {
      vi.advanceTimersByTime(RESULT_DELAY_MS / 2);
    });
    rerender({ input: "10", settings: DEFAULT_SETTINGS });
    act(() => {
      vi.advanceTimersByTime(RESULT_DELAY_MS - 1);
    });
    expect(result.current.status).toBe("calculating");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.result?.totalLbs).toBe(45);
  });

  it("recalculates when settings change", () => {
    const { result, rerender } = setup("100");
    act(() => {
      vi.advanceTimersByTime(RESULT_DELAY_MS);
    });
    expect(result.current.result?.totalLbs).toBe(225);

    rerender({
      input: "100",
      settings: { ...DEFAULT_SETTINGS, rounding: "under" },
    });
    expect(result.current.status).toBe("calculating");
    act(() => {
      vi.advanceTimersByTime(RESULT_DELAY_MS);
    });
    expect(result.current.result?.totalLbs).toBe(215);
  });

  it("returns to empty when the input becomes invalid", () => {
    const { result, rerender } = setup("100");
    act(() => {
      vi.advanceTimersByTime(RESULT_DELAY_MS);
    });
    rerender({ input: "", settings: DEFAULT_SETTINGS });
    expect(result.current).toEqual({ status: "empty", result: null });
  });
});
