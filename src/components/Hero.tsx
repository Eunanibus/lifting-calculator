import type { RefObject } from "react";
import { MAX_KG, MIN_KG } from "../hooks/useLoadResult";

type HeroProps = {
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
};

export default function Hero({
  value,
  onChange,
  invalid,
  inputRef,
}: HeroProps) {
  // Sized in characters so the blank hugs the number as it grows.
  const width = `${Math.max(3, value.length + 1)}ch`;

  return (
    <div className="hero">
      <label className="hero-sentence" htmlFor="kg-input">
        I want Eunan to lift{" "}
        <input
          id="kg-input"
          ref={inputRef}
          className="hero-input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          placeholder="0"
          value={value}
          style={{ width }}
          aria-describedby="kg-hint"
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        />{" "}
        kgs
      </label>
      <p id="kg-hint" className="hero-hint" aria-live="polite">
        {invalid ? `Enter a number from ${MIN_KG} to ${MAX_KG}.` : ""}
      </p>
    </div>
  );
}
