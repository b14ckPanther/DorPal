"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-iris focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-iris text-white hover:bg-brand-iris-dark shadow-raised hover:shadow-card active:scale-[0.98]",
        secondary:
          "bg-dp-surface-alt text-dp-text-primary hover:bg-dp-border border border-dp-border",
        ghost:
          "bg-transparent text-brand-iris hover:bg-brand-iris/8",
        outline:
          "border border-dp-border bg-dp-surface text-dp-text-primary hover:bg-dp-surface-alt",
        danger:
          "bg-dp-error text-white hover:bg-dp-error/90 shadow-raised",
        "danger-ghost":
          "bg-transparent text-dp-error hover:bg-dp-error-bg border border-dp-error/30",
        plum:
          "bg-brand-plum text-white hover:bg-brand-plum-dark shadow-raised hover:shadow-card",
        "plum-ghost":
          "bg-transparent text-brand-plum hover:bg-brand-plum/8",
        link:
          "text-brand-iris underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-7 px-3 text-xs rounded-md",
        sm: "h-9 px-4 text-sm rounded-card-sm",
        md: "h-11 px-5 text-sm rounded-card-sm",
        lg: "h-12 px-6 text-base rounded-card",
        xl: "h-14 px-8 text-base rounded-card",
        icon: "h-10 w-10 rounded-card-sm",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-card",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
