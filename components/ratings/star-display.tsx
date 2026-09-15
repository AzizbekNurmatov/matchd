import { StarIcon } from "@/components/ratings/star-icon";
import { STAR_COUNT, formatRating } from "@/lib/ratings";
import { cn } from "@/lib/utils";

type StarDisplayProps = {
  value: number;
  size?: number;
  className?: string;
};

export function StarDisplay({ value, size = 18, className }: StarDisplayProps) {
  const clamped = Math.min(STAR_COUNT, Math.max(0, value));

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${formatRating(clamped)} out of 5 stars`}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <StarIcon key={index} size={size} fill={clamped - index} />
      ))}
    </div>
  );
}
