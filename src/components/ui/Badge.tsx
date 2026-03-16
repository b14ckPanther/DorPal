"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-brand-iris/10 text-brand-iris border border-brand-iris/20",
        plum:
          "bg-brand-plum/10 text-brand-plum border border-brand-plum/20",
        success:
          "bg-dp-success-bg text-dp-success border border-dp-success/20",
        warning:
          "bg-dp-warning-bg text-dp-warning border border-dp-warning/20",
        error:
          "bg-dp-error-bg text-dp-error border border-dp-error/20",
        info:
          "bg-dp-info-bg text-dp-info border border-dp-info/20",
        muted:
          "bg-dp-surface-alt text-dp-text-secondary border border-dp-border",
        featured:
          "bg-gradient-iris text-white border-0",
        cyan:
          "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-full",
        md: "px-2.5 py-1 text-xs rounded-full",
        lg: "px-3 py-1 text-sm rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
