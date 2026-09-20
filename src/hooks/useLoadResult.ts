import { useEffect, useState } from "react";
import { solve, type LoadResult } from "../lib/plates";
import type { Settings } from "../lib/settings";

export const MIN_KG = 0.5;

/** About 1102 lb, twelve plates a side, the most the drawing stays readable at. */
export const MAX_KG = 500;

/**
 * Time from the last keystroke to the result. The skeleton shows for the whole
 * window, so this single number is both the debounce and the loading state.
 */
export const RESULT_DELAY_MS = 400;

export type LoadStatus = "empty" | "calculating" | "ready";
export type LoadState = { status: LoadStatus; result: LoadResult | null };

const DECIMAL = /^\d*\.?\d*$/;

/** Accepts "100", "62.5" or "62,5" between MIN_KG and MAX_KG; anything else is null. */
export function parseKg(input: string): number | null {
  const normalised = input.trim().replace(",", ".");
  if (normalised === "" || !DECIMAL.test(normalised)) return null;
  const value = Number(normalised);
  if (!Number.isFinite(value) || value < MIN_KG || value > MAX_KG) return null;
  return value;
}

export function useLoadResult(input: string, settings: Settings): LoadState {
  const [state, setState] = useState<LoadState>({
    status: "empty",
    result: null,
  });
  const { includeBar, rounding, bar } = settings;

  useEffect(() => {
    const kg = parseKg(input);
    if (kg === null) {
      setState({ status: "empty", result: null });
      return undefined;
    }
    setState({ status: "calculating", result: null });
    const timer = window.setTimeout(() => {
      setState({
        status: "ready",
        result: solve(kg, { includeBar, rounding, bar }),
      });
    }, RESULT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [input, includeBar, rounding, bar]);

  return state;
}
