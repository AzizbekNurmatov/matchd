import { STAR_EMPTY, STAR_FILL } from "@/lib/ratings";

const STAR_PATH =
  "M12 2.15l2.76 5.59 6.17.9-4.46 4.35 1.05 6.13L12 16.22l-5.52 2.9 1.05-6.13-4.46-4.35 6.17-.9L12 2.15z";

type StarIconProps = {
  fill: number;
  size?: number;
  fillColor?: string;
  emptyColor?: string;
  interactive?: boolean;
};

export function StarIcon({
  fill,
  size = 24,
  fillColor = STAR_FILL,
  emptyColor = STAR_EMPTY,
  interactive = false,
}: StarIconProps) {
  const clamped = Math.min(1, Math.max(0, fill));

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <StarSvg
        size={size}
        color={interactive ? "none" : emptyColor}
        stroke={interactive ? emptyColor : undefined}
      />
      <span
        className={
          interactive
            ? "absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none"
            : "absolute inset-y-0 left-0 overflow-hidden"
        }
        style={{ width: `${clamped * 100}%` }}
      >
        <StarSvg
          size={size}
          color={fillColor}
          stroke={interactive ? fillColor : undefined}
        />
      </span>
    </span>
  );
}

function StarSvg({
  size,
  color,
  stroke,
}: {
  size: number;
  color: string;
  stroke?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="absolute top-0 left-0 block"
    >
      <path
        d={STAR_PATH}
        fill={color}
        stroke={stroke}
        strokeWidth={stroke ? 1.25 : undefined}
        strokeLinejoin="round"
      />
    </svg>
  );
}
