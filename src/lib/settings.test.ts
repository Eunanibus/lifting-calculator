import { describe, expect, it } from "vitest";
import indexHtml from '../../index.html?raw';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  loadSettings,
  saveSettings,
  type Settings,
} from "./settings";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    data,
  };
}

describe("settings", () => {
  it("defaults to bar included, closest over, barbell", () => {
    expect(DEFAULT_SETTINGS).toEqual({ includeBar: true, rounding: 'over', bar: 'barbell', theme: 'dark' });
  });

  it("returns defaults when nothing is stored", () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips through storage", () => {
    const storage = memoryStorage();
    const saved: Settings = { includeBar: false, rounding: 'under', bar: 'curl', theme: 'light' };
    saveSettings(saved, storage);
    expect(storage.data.get(SETTINGS_KEY)).toBe(JSON.stringify(saved));
    expect(loadSettings(storage)).toEqual(saved);
  });

  it("falls back to defaults on corrupt JSON", () => {
    expect(
      loadSettings(memoryStorage({ [SETTINGS_KEY]: "{not json" })),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back field by field on wrong types', () => {
    const stored = JSON.stringify({ includeBar: 'yes', rounding: 'sideways', bar: 'curl', theme: 'sepia' });
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: stored }))).toEqual({
      includeBar: true,
      rounding: 'over',
      bar: 'curl',
      theme: 'dark',
    });
  });

  it("tolerates a storage that throws", () => {
    const angry = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadSettings(angry)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, angry)).not.toThrow();
  });

  it("uses window.localStorage by default", () => {
    saveSettings({ includeBar: true, rounding: "under", bar: "barbell", theme: 'dark' });
    expect(
      JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}"),
    ).toMatchObject({ rounding: "under" });
    expect(loadSettings().rounding).toBe("under");
  });

  it('is the key the pre-mount script in index.html reads', () => {
    expect(indexHtml).toContain(`'${SETTINGS_KEY}'`);
  });
});
