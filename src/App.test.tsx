import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { RESULT_DELAY_MS } from "./hooks/useLoadResult";
import { SETTINGS_KEY } from "./lib/settings";

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function settle() {
    act(() => {
      vi.advanceTimersByTime(RESULT_DELAY_MS);
    });
  }

  it("shows the title, the sentence and an empty bar", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Lifting calculator",
    );
    expect(
      screen.getByRole("textbox", { name: /I want Eunan to lift/ }),
    ).toHaveValue("");
    expect(screen.getByTestId("barbell")).toHaveAttribute(
      "data-status",
      "empty",
    );
    expect(screen.queryAllByTestId("plate")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Clear bar" })).toBeDisabled();
  });

  it("shows a skeleton, then the loaded bar and key, then clears to empty", () => {
    render(<App />);
    const input = screen.getByRole("textbox", { name: /I want Eunan to lift/ });

    fireEvent.change(input, { target: { value: "100" } });
    expect(screen.getByLabelText("Calculating")).toBeInTheDocument();
    expect(screen.getByTestId("barbell")).toHaveAttribute(
      "data-status",
      "calculating",
    );

    settle();
    expect(screen.queryByLabelText("Calculating")).not.toBeInTheDocument();
    expect(screen.getByText("225")).toBeInTheDocument();
    expect(screen.getAllByTestId("plate")).toHaveLength(4);
    expect(screen.getByText("× 2 per side")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear bar" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.queryByText("225")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("plate")).toHaveLength(0);
    expect(screen.getByTestId("barbell")).toHaveAttribute(
      "data-status",
      "empty",
    );
  });

  it("applies a settings change to the open result and persists it", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "100" } });
    settle();

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("radio", { name: "Closest under" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    settle();

    expect(screen.getByText("220")).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}"),
    ).toMatchObject({ rounding: "under" });
  });

  it("starts from saved settings", () => {
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ includeBar: true, rounding: "over", bar: "curl" }),
    );
    render(<App />);
    expect(screen.getByTestId("barbell")).toHaveClass("barbell-curl");
  });

  it("shows the range hint for out-of-range input and keeps the bar empty", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "900" } });
    expect(
      screen.getByText("Enter a number from 0.5 to 500."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Calculating")).not.toBeInTheDocument();
    expect(screen.getByTestId("barbell")).toHaveAttribute(
      "data-status",
      "empty",
    );
    expect(screen.getByRole("button", { name: "Clear bar" })).toBeEnabled();
  });

  it('keeps one live region across calculating and ready', () => {
    render(<App />);
    const slot = screen.getByTestId('result-slot');
    expect(slot).toHaveAttribute('aria-live', 'polite');
    expect(slot).toHaveAttribute('aria-busy', 'false');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '100' } });
    expect(slot).toHaveAttribute('aria-busy', 'true');
    settle();
    expect(screen.getByTestId('result-slot')).toBe(slot);
    expect(slot).toHaveAttribute('aria-busy', 'false');
    expect(slot).toHaveTextContent('225');
  });

  it('is dark by default and applies a theme change to the document', () => {
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}')).toMatchObject({ theme: 'light' });
  });
});
