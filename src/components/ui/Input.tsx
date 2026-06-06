import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { cn } from "../../lib/utils";

type InputVariant = "default" | "filled" | "glass" | "error";

type InputSize = "sm" | "md" | "lg";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: InputVariant;
  inputSize?: InputSize;
  fullWidth?: boolean;
};

const variantClasses: Record<InputVariant, string> = {
  default:
    "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-500/15 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500",

  filled:
    "border-transparent bg-slate-100 text-slate-950 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-violet-500/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950/80",

  glass:
    "border-slate-200/70 bg-white/70 text-slate-950 placeholder:text-slate-400 backdrop-blur-xl focus:border-violet-400 focus:ring-violet-500/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-500",

  error:
    "border-rose-400 bg-rose-50 text-rose-950 placeholder:text-rose-300 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-400/60 dark:bg-rose-500/10 dark:text-white dark:placeholder:text-rose-300/60",
};

const sizeClasses: Record<InputSize, string> = {
  sm: "h-10 rounded-2xl px-4 text-sm",
  md: "h-12 rounded-2xl px-4 text-sm",
  lg: "h-14 rounded-3xl px-5 text-base",
};

const iconPaddingClasses: Record<InputSize, string> = {
  sm: "pl-10",
  md: "pl-11",
  lg: "pl-12",
};

const rightIconPaddingClasses: Record<InputSize, string> = {
  sm: "pr-10",
  md: "pr-11",
  lg: "pr-12",
};

const iconSizeClasses: Record<InputSize, string> = {
  sm: "h-4 w-4",
  md: "h-4.5 w-4.5",
  lg: "h-5 w-5",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      variant = "default",
      inputSize = "md",
      fullWidth = true,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || props.name;
    const hasError = Boolean(error);
    const activeVariant = hasError ? "error" : variant;

    return (
      <div className={cn(fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500",
                iconSizeClasses[inputSize],
              )}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              "w-full border font-semibold outline-none transition duration-200",
              "focus:ring-4",
              "disabled:cursor-not-allowed disabled:opacity-60",
              sizeClasses[inputSize],
              variantClasses[activeVariant],
              leftIcon && iconPaddingClasses[inputSize],
              rightIcon && rightIconPaddingClasses[inputSize],
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <div
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500",
                iconSizeClasses[inputSize],
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div
            className={cn(
              "mt-2 flex items-start gap-2 text-xs font-semibold leading-5",
              error
                ? "text-rose-600 dark:text-rose-300"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            {error && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            <span>{error || helperText}</span>
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export type PasswordInputProps = Omit<InputProps, "type" | "rightIcon"> & {
  showPassword: boolean;
  onTogglePassword: () => void;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPassword, onTogglePassword, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        rightIcon={
          <button
            type="button"
            onClick={onTogglePassword}
            className="rounded-lg text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" />
            ) : (
              <Eye className="h-4.5 w-4.5" />
            )}
          </button>
        }
        {...props}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export type SearchInputProps = Omit<InputProps, "type">;

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = "Search...", inputSize = "md", variant = "filled", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        inputSize={inputSize}
        variant={variant}
        {...props}
      />
    );
  },
);

SearchInput.displayName = "SearchInput";