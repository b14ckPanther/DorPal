import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
  showValue = false,
  className,
}: StarRatingProps) {
  const sizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;

        return (
          <div key={i} className="relative">
            <Star
              className={cn(sizes[size], "star-empty")}
              strokeWidth={1.5}
            />
            {(filled || partial) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: partial ? `${(rating % 1) * 100}%` : "100%" }}
              >
                <Star
                  className={cn(sizes[size], "star-filled")}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
      {showValue && (
        <span className="text-sm font-semibold text-dp-text-primary ms-1 num">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
