import { BARS, type BarId, type Rounding } from "./plates";

export type Settings = { includeBar: boolean; rounding: Rounding; bar: BarId };

export const DEFAULT_SETTINGS: Settings = {
  includeBar: true,
  rounding: "over",
  bar: "barbell",
};

export const SETTINGS_KEY = "serg-to-eunan.settings";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function isRounding(value: unknown): value is Rounding {
  return value === "over" || value === "under";
}

function isBarId(value: unknown): value is BarId {
  return BARS.some((bar) => bar.id === value);
}

/** Reads settings, falling back to defaults field by field. Never throws. */
export function loadSettings(
  storage: StorageLike | undefined = defaultStorage(),
): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_SETTINGS;
    const record = parsed as Record<string, unknown>;
    return {
      includeBar:
        typeof record.includeBar === "boolean"
          ? record.includeBar
          : DEFAULT_SETTINGS.includeBar,
      rounding: isRounding(record.rounding)
        ? record.rounding
        : DEFAULT_SETTINGS.rounding,
      bar: isBarId(record.bar) ? record.bar : DEFAULT_SETTINGS.bar,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Persists settings. A blocked or full store is ignored so the page keeps working. */
export function saveSettings(
  settings: Settings,
  storage: StorageLike | undefined = defaultStorage(),
): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or a full quota must not break the calculator.
  }
}
