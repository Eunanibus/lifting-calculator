import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Barbell from "./Barbell";
import { PLATES, barById, type PlateCount } from "../lib/plates";

const plate = (lbs: number) => {
  const found = PLATES.find((p) => p.lbs === lbs);
  if (!found) throw new Error(`no ${lbs} lb plate`);
  return found;
};

const load: PlateCount[] = [
  { plate: plate(45), count: 2 },
  { plate: plate(25), count: 1 },
];

function sideLbs(side: "left" | "right"): number[] {
  return Array.from(
    document.querySelectorAll(`[data-testid="plate"][data-side="${side}"]`),
  ).map((g) => Number(g.getAttribute("data-lbs")));
}

function sideX(side: "left" | "right"): number[] {
  return Array.from(
    document.querySelectorAll(
      `[data-testid="plate"][data-side="${side}"] rect`,
    ),
  ).map((rect) => Number(rect.getAttribute("x")));
}

function viewBoxWidth(): number {
  const viewBox = screen.getByTestId("barbell").getAttribute("viewBox") ?? "";
  return Number(viewBox.split(" ")[2]);
}

describe("Barbell", () => {
  it("draws a bare bar when empty", () => {
    render(<Barbell bar={barById("barbell")} perSide={[]} status="empty" />);
    expect(screen.queryAllByTestId("plate")).toHaveLength(0);
    expect(document.querySelectorAll(".plate-ghost")).toHaveLength(0);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Barbell with no plates",
    );
  });

  it("draws pulsing silhouettes while calculating", () => {
    render(
      <Barbell bar={barById("barbell")} perSide={[]} status="calculating" />,
    );
    expect(screen.queryAllByTestId("plate")).toHaveLength(0);
    expect(document.querySelectorAll(".plate-ghost").length).toBeGreaterThan(0);
    expect(screen.getByRole("img")).toHaveAccessibleName("Loading plates");
  });

  it("draws every plate on both sides, heaviest against the collar", () => {
    render(<Barbell bar={barById("barbell")} perSide={load} status="ready" />);
    expect(screen.getAllByTestId("plate")).toHaveLength(6);
    expect(sideLbs("right")).toEqual([45, 45, 25]);
    expect(sideLbs("left")).toEqual([45, 45, 25]);

    const right = sideX("right");
    expect(right[0]).toBeLessThan(right[1] ?? Number.NaN);
    expect(right[1]).toBeLessThan(right[2] ?? Number.NaN);

    const left = sideX("left");
    expect(left[0]).toBeGreaterThan(left[1] ?? Number.NaN);
    expect(left[1]).toBeGreaterThan(left[2] ?? Number.NaN);

    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Barbell with 2 × 45 lb, 1 × 25 lb per side",
    );
  });

  it("colours and labels each plate", () => {
    render(
      <Barbell
        bar={barById("barbell")}
        perSide={[{ plate: plate(10), count: 1 }]}
        status="ready"
      />,
    );
    const rect = document.querySelector('[data-side="right"] rect');
    expect(rect).toHaveClass("plate", "plate-white");
    expect(rect).toHaveAttribute("fill", plate(10).color);
    expect(
      document.querySelector('[data-side="right"] text'),
    ).toHaveTextContent("10");
  });

  it("draws the curl bar with a zigzag shaft and the barbell with a straight one", () => {
    const { rerender } = render(
      <Barbell bar={barById("barbell")} perSide={[]} status="empty" />,
    );
    expect(document.querySelector("rect.bar-shaft")).not.toBeNull();
    expect(document.querySelector(".bar-shaft-curl")).toBeNull();
    expect(screen.getByTestId("barbell")).toHaveClass("barbell-barbell");

    rerender(<Barbell bar={barById("curl")} perSide={[]} status="empty" />);
    expect(document.querySelector("path.bar-shaft-curl")).not.toBeNull();
    expect(document.querySelector("rect.bar-shaft")).toBeNull();
    expect(screen.getByTestId("barbell")).toHaveClass("barbell-curl");
  });

  it("widens the drawing when the load outgrows the sleeve", () => {
    const { rerender } = render(
      <Barbell bar={barById("barbell")} perSide={load} status="ready" />,
    );
    const normal = viewBoxWidth();
    rerender(
      <Barbell
        bar={barById("barbell")}
        perSide={[{ plate: plate(45), count: 12 }]}
        status="ready"
      />,
    );
    expect(viewBoxWidth()).toBeGreaterThan(normal);
    expect(screen.getAllByTestId("plate")).toHaveLength(24);
  });
});
