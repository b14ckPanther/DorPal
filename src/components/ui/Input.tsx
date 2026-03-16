"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, startIcon, endIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dp-text-primary mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-dp-error ms-1">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-dp-text-muted">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "w-full border border-dp-border rounded-card-sm px-4 py-3 text-base bg-dp-surface text-dp-text-primary",
              "placeholder:text-dp-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-brand-iris focus:border-brand-iris",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-dp-surface-alt",
              "transition-all duration-150",
              startIcon && "ps-10",
              endIcon && "pe-10",
              error && "border-dp-error focus:ring-dp-error focus:border-dp-error",
              className
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 text-dp-text-muted">
              {endIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-dp-error">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-dp-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
