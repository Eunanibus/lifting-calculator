import type { Bar, Plate, PlateCount } from "../lib/plates";
import type { LoadStatus } from "../hooks/useLoadResult";

type BarbellProps = { bar: Bar; perSide: PlateCount[]; status: LoadStatus };

type Side = "left" | "right";
type PlateSize = { width: number; height: number };

/** Drawing size per plate weight. Heavier plates are taller and thicker. */
const PLATE_SIZES: Record<number, PlateSize> = {
  45: { width: 26, height: 190 },
  35: { width: 22, height: 170 },
  25: { width: 20, height: 150 },
  15: { width: 16, height: 125 },
  10: { width: 14, height: 110 },
};
const FALLBACK_SIZE: PlateSize = { width: 14, height: 100 };

const HEIGHT = 220;
const CENTRE = HEIGHT / 2;
const SHAFT_HEIGHT = 12;
const COLLAR_WIDTH = 14;
const COLLAR_HEIGHT = 44;
const SLEEVE_HEIGHT = 24;
const MIN_SLEEVE = 140;
const PLATE_GAP = 2;
const SLEEVE_MARGIN = 16;
const SHAFT_LENGTH: Record<Bar["id"], number> = { barbell: 300, curl: 220 };

/** Silhouettes drawn while calculating: a 45, a 35 and a 25. */
const GHOST_WEIGHTS = [45, 35, 25];

function sizeOf(lbs: number): PlateSize {
  return PLATE_SIZES[lbs] ?? FALLBACK_SIZE;
}

function expand(perSide: PlateCount[]): Plate[] {
  return perSide.flatMap(({ plate, count }) =>
    Array.from({ length: count }, () => plate),
  );
}

function stackWidth(sizes: PlateSize[]): number {
  return sizes.reduce((width, size) => width + size.width + PLATE_GAP, 0);
}

/** Dark text on light plates, light text on dark plates. */
function labelColor(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.6 ? "#1c1c1e" : "#ffffff";
}

/** An EZ curl shaft: straight ends around a W-shaped middle. */
function curlPath(x: number, length: number): string {
  const point = (fraction: number, dy: number) =>
    `${(x + length * fraction).toFixed(1)},${CENTRE + dy}`;
  return [
    "M",
    point(0, 0),
    "L",
    point(0.18, 0),
    point(0.3, -18),
    point(0.42, 14),
    point(0.58, 14),
    point(0.7, -18),
    point(0.82, 0),
    point(1, 0),
  ].join(" ");
}

function describe(bar: Bar, perSide: PlateCount[], status: LoadStatus): string {
  if (status === "calculating") return "Loading plates";
  if (status === "empty" || perSide.length === 0)
    return `${bar.name} with no plates`;
  const plates = perSide
    .map(({ plate, count }) => `${count} × ${plate.lbs} lb`)
    .join(", ");
  return `${bar.name} with ${plates} per side`;
}

type Placed<T> = { item: T; x: number; size: PlateSize; index: number };

export default function Barbell({ bar, perSide, status }: BarbellProps) {
  const plates = status === "ready" ? expand(perSide) : [];
  const ghosts = status === "calculating" ? GHOST_WEIGHTS.map(sizeOf) : [];

  const loadWidth = Math.max(
    stackWidth(plates.map((plate) => sizeOf(plate.lbs))),
    stackWidth(ghosts),
  );
  const sleeve = Math.max(MIN_SLEEVE, loadWidth + SLEEVE_MARGIN);
  const shaft = SHAFT_LENGTH[bar.id];
  const width = 2 * sleeve + 2 * COLLAR_WIDTH + shaft;

  const leftCollarX = sleeve;
  const shaftX = leftCollarX + COLLAR_WIDTH;
  const rightCollarX = shaftX + shaft;
  const rightSleeveX = rightCollarX + COLLAR_WIDTH;

  /** Walks outward from the collar, so the first item sits against it. */
  function place<T>(
    items: T[],
    sizeFor: (item: T) => PlateSize,
    side: Side,
  ): Placed<T>[] {
    let cursor =
      side === "right" ? rightSleeveX + PLATE_GAP : leftCollarX - PLATE_GAP;
    return items.map((item, index) => {
      const size = sizeFor(item);
      const x = side === "right" ? cursor : cursor - size.width;
      cursor =
        side === "right"
          ? cursor + size.width + PLATE_GAP
          : cursor - size.width - PLATE_GAP;
      return { item, x, size, index };
    });
  }

  const renderPlates = (side: Side) =>
    place(plates, (plate) => sizeOf(plate.lbs), side).map(
      ({ item, x, size, index }) => {
        const centreX = x + size.width / 2;
        return (
          <g
            key={`${side}-${index}`}
            data-testid="plate"
            data-side={side}
            data-lbs={item.lbs}
          >
            <rect
              className={`plate plate-${item.name}`}
              x={x}
              y={CENTRE - size.height / 2}
              width={size.width}
              height={size.height}
              rx={3}
              fill={item.color}
            />
            <text
              className="plate-label"
              x={centreX}
              y={CENTRE}
              fill={labelColor(item.color)}
              transform={`rotate(-90 ${centreX} ${CENTRE})`}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {item.lbs}
            </text>
          </g>
        );
      },
    );

  const renderGhosts = (side: Side) =>
    place(ghosts, (size) => size, side).map(({ x, size, index }) => (
      <rect
        key={`${side}-ghost-${index}`}
        className="plate-ghost"
        x={x}
        y={CENTRE - size.height / 2}
        width={size.width}
        height={size.height}
        rx={3}
        style={{ animationDelay: `${index * 120}ms` }}
      />
    ));

  return (
    <svg
      className={`barbell barbell-${bar.id} is-${status}`}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-label={describe(bar, perSide, status)}
      data-testid="barbell"
      data-status={status}
    >
      <rect
        className="bar-sleeve"
        x={0}
        y={CENTRE - SLEEVE_HEIGHT / 2}
        width={sleeve}
        height={SLEEVE_HEIGHT}
        rx={4}
      />
      <rect
        className="bar-sleeve"
        x={rightSleeveX}
        y={CENTRE - SLEEVE_HEIGHT / 2}
        width={sleeve}
        height={SLEEVE_HEIGHT}
        rx={4}
      />
      {bar.id === "curl" ? (
        <path
          className="bar-shaft bar-shaft-curl"
          d={curlPath(shaftX, shaft)}
        />
      ) : (
        <rect
          className="bar-shaft"
          x={shaftX}
          y={CENTRE - SHAFT_HEIGHT / 2}
          width={shaft}
          height={SHAFT_HEIGHT}
        />
      )}
      <rect
        className="bar-collar"
        x={leftCollarX}
        y={CENTRE - COLLAR_HEIGHT / 2}
        width={COLLAR_WIDTH}
        height={COLLAR_HEIGHT}
        rx={3}
      />
      <rect
        className="bar-collar"
        x={rightCollarX}
        y={CENTRE - COLLAR_HEIGHT / 2}
        width={COLLAR_WIDTH}
        height={COLLAR_HEIGHT}
        rx={3}
      />
      {renderPlates("left")}
      {renderPlates("right")}
      {renderGhosts("left")}
      {renderGhosts("right")}
    </svg>
  );
}
