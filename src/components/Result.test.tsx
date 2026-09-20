import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Result, { ResultSkeleton } from "./Result";
import { solve } from "../lib/plates";

describe("Result", () => {
  it("shows the total in pounds and kilograms with the breakdown", () => {
    render(
      <Result
        result={solve(100, {
          includeBar: true,
          rounding: "over",
          bar: "barbell",
        })}
      />,
    );
    expect(screen.getByText("225")).toBeInTheDocument();
    expect(screen.getByText("(102.1 kg)")).toBeInTheDocument();
    expect(screen.getByText("100 kg is 220.5 lb")).toBeInTheDocument();
    expect(
      screen.getByText("Closest over: 4.5 lb over target"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Barbell 45 lb + 180 lb of plates"),
    ).toBeInTheDocument();
  });

  it("lists each plate with a swatch and the count per side", () => {
    render(
      <Result
        result={solve(100, {
          includeBar: true,
          rounding: "under",
          bar: "barbell",
        })}
      />,
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "45 lb× 1 per side",
      "25 lb× 1 per side",
      "15 lb× 1 per side",
    ]);
    expect(within(rows[0] as HTMLElement).getByTestId("swatch")).toHaveClass(
      "plate-blue",
    );
    expect(
      screen.getByText("Closest under: 5.5 lb under target"),
    ).toBeInTheDocument();
  });

  it("says when the bar is not counted", () => {
    render(
      <Result
        result={solve(100, {
          includeBar: false,
          rounding: "over",
          bar: "barbell",
        })}
      />,
    );
    expect(screen.getByText("230")).toBeInTheDocument();
    expect(
      screen.getByText("230 lb of plates, bar not counted"),
    ).toBeInTheDocument();
  });

  it("explains a bar that outweighs the target", () => {
    render(
      <Result
        result={solve(10, {
          includeBar: true,
          rounding: "under",
          bar: "barbell",
        })}
      />,
    );
    expect(
      screen.getByText("The barbell alone is heavier than the target."),
    ).toBeInTheDocument();
    expect(screen.getByText("No plates loaded.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

});

describe("ResultSkeleton", () => {
  it('is labelled for assistive tech', () => {
    render(<ResultSkeleton />);
    expect(screen.getByLabelText('Calculating')).toHaveClass('result-skeleton');
  });
});
