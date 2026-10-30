import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  badge?: React.ReactNode;
  error?: string;
  helperText?: React.ReactNode;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      badge,
      error,
      helperText,
      icon,
      rightElement,
      id,
      type,
      style,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left group">
        {(label || badge) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="block text-xs font-bold text-slate-800 tracking-tight"
              >
                {label}
                {props.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
              </label>
            )}
            {badge && <div>{badge}</div>}
          </div>
        )}
        <div className="relative rounded-xl shadow-2xs">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors group-focus-within:text-blue-600">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            style={{ backgroundColor: "#ffffff", color: "#0f172a", ...style }}
            className={cn(
              "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal transition-all duration-200 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 shadow-2xs",
              icon ? "pl-10" : "",
              rightElement ? "pr-10" : "",
              error
                ? "border-rose-400 focus:border-rose-600 focus:ring-rose-500/15"
                : "hover:border-slate-400",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
            <span>•</span> {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

