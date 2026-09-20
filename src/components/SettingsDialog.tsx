import { useEffect, useRef } from "react";
import { BARS } from "../lib/plates";
import type { Settings } from "../lib/settings";

type SettingsDialogProps = {
  open: boolean;
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
};

const ROUNDINGS = [
  { value: "over", label: "Closest over" },
  { value: "under", label: "Closest under" },
] as const;

export default function SettingsDialog({
  open,
  settings,
  onChange,
  onClose,
}: SettingsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const isOpen = dialog.hasAttribute("open");
    if (open && !isOpen) dialog.showModal();
    if (!open && isOpen) dialog.close();
  }, [open]);

  // Escape closes a modal dialog natively and fires "close"; this keeps the
  // open prop in step with what the browser did.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  const update = (patch: Partial<Settings>) =>
    onChange({ ...settings, ...patch });

  return (
    <dialog
      ref={ref}
      className="settings"
      aria-labelledby="settings-title"
      onClick={(event) => {
        // Clicks on the backdrop land on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="settings-body">
        <h2 id="settings-title" className="settings-title">
          Settings
        </h2>

        <div className="setting">
          <span className="setting-label" id="include-bar-label">
            Include bar weight
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.includeBar}
            aria-labelledby="include-bar-label"
            className="switch"
            onClick={() => update({ includeBar: !settings.includeBar })}
          >
            <span className="switch-knob" />
          </button>
        </div>

        <fieldset className="setting setting-stacked">
          <legend className="setting-label">Round to</legend>
          <div className="segmented">
            {ROUNDINGS.map(({ value, label }) => (
              <label key={value} className="segment">
                <input
                  type="radio"
                  name="rounding"
                  value={value}
                  checked={settings.rounding === value}
                  onChange={() => update({ rounding: value })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="setting setting-stacked">
          <legend className="setting-label">Bar</legend>
          <div className="segmented">
            {BARS.map((bar) => (
              <label key={bar.id} className="segment">
                <input
                  type="radio"
                  name="bar"
                  value={bar.id}
                  checked={settings.bar === bar.id}
                  onChange={() => update({ bar: bar.id })}
                />
                <span>
                  {bar.name} <small>{bar.lbs} lb</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className="button settings-done"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </dialog>
  );
}
