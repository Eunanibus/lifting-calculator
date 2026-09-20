import { useCallback, useEffect, useRef, useState } from 'react';
import Barbell from "./components/Barbell";
import Hero from "./components/Hero";
import Result, { ResultSkeleton } from "./components/Result";
import SettingsDialog from "./components/SettingsDialog";
import { parseKg, useLoadResult } from "./hooks/useLoadResult";
import { barById } from "./lib/plates";
import { loadSettings, saveSettings, type Settings } from "./lib/settings";

/** Feather "settings" icon (MIT). */
function CogIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { status, result } = useLoadResult(input, settings);
  const bar = barById(settings.bar);
  const invalid = input.trim() !== "" && parseKg(input) === null;

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', settings.theme === 'dark' ? '#0f1115' : '#f6f7f9');
  }, [settings.theme]);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const clearBar = () => {
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <main className="page">
      <header className="header">
        <h1 className="title">Serg to Eunan calculator</h1>
        <button
          type="button"
          className="icon-button"
          aria-label="Settings"
          onClick={() => setDialogOpen(true)}
        >
          <CogIcon />
        </button>
      </header>

      <Hero
        value={input}
        onChange={setInput}
        invalid={invalid}
        inputRef={inputRef}
      />

      <Barbell bar={bar} perSide={result?.perSide ?? []} status={status} />

      <div className="result-slot" aria-live="polite" aria-busy={status === 'calculating'} data-testid="result-slot">
        {status === "calculating" && <ResultSkeleton />}
        {status === "ready" && result && <Result result={result} />}
      </div>

      <div className="actions">
        <button
          type="button"
          className="button"
          onClick={clearBar}
          disabled={input === ""}
        >
          Clear bar
        </button>
      </div>

      <SettingsDialog
        open={dialogOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={closeDialog}
      />
    </main>
  );
}
