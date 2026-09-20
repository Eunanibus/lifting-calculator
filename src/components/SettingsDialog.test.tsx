import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SettingsDialog from "./SettingsDialog";
import { DEFAULT_SETTINGS } from "../lib/settings";

function dialog(): HTMLDialogElement {
  const element = document.querySelector("dialog");
  if (!element) throw new Error("no dialog rendered");
  return element;
}

describe("SettingsDialog", () => {
  it("opens and closes with the open prop", () => {
    const { rerender } = render(
      <SettingsDialog
        open={false}
        settings={DEFAULT_SETTINGS}
        onChange={() => {}}
        onClose={() => {}}
      />,
    );
    expect(dialog()).not.toHaveAttribute("open");
    rerender(
      <SettingsDialog
        open
        settings={DEFAULT_SETTINGS}
        onChange={() => {}}
        onClose={() => {}}
      />,
    );
    expect(dialog()).toHaveAttribute("open");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Settings",
    );
  });

  it("reflects the current settings", () => {
    render(
      <SettingsDialog
        open
        settings={DEFAULT_SETTINGS}
        onChange={() => {}}
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByRole("switch", { name: "Include bar weight" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Closest over" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Closest under" }),
    ).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Barbell 45 lb" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Curl bar 25 lb" }),
    ).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
  });

  it("reports each change as a whole settings object", () => {
    const onChange = vi.fn();
    render(
      <SettingsDialog
        open
        settings={DEFAULT_SETTINGS}
        onChange={onChange}
        onClose={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Include bar weight" }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...DEFAULT_SETTINGS,
      includeBar: false,
    });

    fireEvent.click(screen.getByText('Include bar weight'));
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, includeBar: false });

    fireEvent.click(screen.getByRole("radio", { name: "Closest under" }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...DEFAULT_SETTINGS,
      rounding: "under",
    });

    fireEvent.click(screen.getByRole("radio", { name: "Curl bar 25 lb" }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...DEFAULT_SETTINGS,
      bar: "curl",
    });

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, theme: 'light' });
  });

  it("closes on Done, on a backdrop click and on the native close event", () => {
    const onClose = vi.fn();
    render(
      <SettingsDialog
        open
        settings={DEFAULT_SETTINGS}
        onChange={() => {}}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(dialog());
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("heading", { level: 2 }));
    expect(onClose).toHaveBeenCalledTimes(2);

    dialog().dispatchEvent(new Event("close"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
