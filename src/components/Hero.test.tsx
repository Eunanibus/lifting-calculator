import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import Hero from "./Hero";

describe("Hero", () => {
  it("renders the sentence around a decimal text input", () => {
    render(<Hero value="" onChange={() => {}} invalid={false} />);
    const input = screen.getByRole("textbox", { name: /I want Eunan to lift/ });
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByText(/kgs/)).toBeInTheDocument();
  });

  it("reports typed text unchanged", () => {
    const onChange = vi.fn();
    render(<Hero value="" onChange={onChange} invalid={false} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "62,5" },
    });
    expect(onChange).toHaveBeenCalledWith("62,5");
  });

  it("widens with the value", () => {
    const { rerender } = render(
      <Hero value="1" onChange={() => {}} invalid={false} />,
    );
    const narrow = screen.getByRole("textbox").style.width;
    rerender(<Hero value="123.5" onChange={() => {}} invalid={false} />);
    const wide = screen.getByRole("textbox").style.width;
    expect(parseFloat(wide)).toBeGreaterThan(parseFloat(narrow));
  });

  it("shows the accepted range only when the value is invalid", () => {
    const { rerender } = render(
      <Hero value="900" onChange={() => {}} invalid />,
    );
    expect(
      screen.getByText("Enter a number from 0.5 to 500."),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    rerender(<Hero value="100" onChange={() => {}} invalid={false} />);
    expect(screen.queryByText(/Enter a number/)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("exposes the input through inputRef", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Hero value="" onChange={() => {}} invalid={false} inputRef={ref} />,
    );
    expect(ref.current).toBe(screen.getByRole("textbox"));
  });
});
