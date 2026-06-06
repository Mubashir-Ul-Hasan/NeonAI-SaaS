import {
  forwardRef,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "../../lib/utils";

type TextareaVariant = "default" | "filled" | "glass" | "error";

type TextareaSize = "sm" | "md" | "lg";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  variant?: TextareaVariant;
  textareaSize?: TextareaSize;
  fullWidth?: boolean;
  showCount?: boolean;
};

const variantClasses: Record<TextareaVariant, string> = {
  default:
    "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-500/15 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500",

  filled:
    "border-transparent bg-slate-100 text-slate-950 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-violet-500/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950/80",

  glass:
    "border-slate-200/70 bg-white/70 text-slate-950 placeholder:text-slate-400 backdrop-blur-xl focus:border-violet-400 focus:ring-violet-500/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-500",

  error:
    "border-rose-400 bg-rose-50 text-rose-950 placeholder:text-rose-300 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-400/60 dark:bg-rose-500/10 dark:text-white dark:placeholder:text-rose-300/60",
};

const sizeClasses: Record<TextareaSize, string> = {
  sm: "min-h-28 rounded-2xl px-4 py-3 text-sm",
  md: "min-h-36 rounded-3xl px-5 py-4 text-sm",
  lg: "min-h-44 rounded-[1.75rem] px-6 py-5 text-base",
};

const iconPaddingClasses: Record<TextareaSize, string> = {
  sm: "pl-10",
  md: "pl-12",
  lg: "pl-14",
};

const iconSizeClasses: Record<TextareaSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-5 w-5",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightElement,
      variant = "default",
      textareaSize = "md",
      fullWidth = true,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const textareaId = id || props.name;
    const hasError = Boolean(error);
    const activeVariant = hasError ? "error" : variant;

    const currentLength =
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
          ? defaultValue.length
          : 0;

    return (
      <div className={cn(fullWidth && "w-full")}>
        {(label || rightElement) && (
          <div className="mb-2 flex items-center justify-between gap-4">
            {label && (
              <label
                htmlFor={textareaId}
                className="block text-sm font-black text-slate-800 dark:text-slate-100"
              >
                {label}
              </label>
            )}

            {rightElement && <div className="shrink-0">{rightElement}</div>}
          </div>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                "pointer-events-none absolute left-4 top-4 text-slate-400 dark:text-slate-500",
                iconSizeClasses[textareaSize],
              )}
            >
              {leftIcon}
            </div>
          )}

          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            className={cn(
              "w-full resize-none border font-semibold leading-7 outline-none transition duration-200",
              "focus:ring-4",
              "disabled:cursor-not-allowed disabled:opacity-60",
              sizeClasses[textareaSize],
              variantClasses[activeVariant],
              leftIcon && iconPaddingClasses[textareaSize],
              className,
            )}
            {...props}
          />
        </div>

        {(error || helperText || showCount) && (
          <div className="mt-2 flex items-start justify-between gap-4">
            <div
              className={cn(
                "flex items-start gap-2 text-xs font-semibold leading-5",
                error
                  ? "text-rose-600 dark:text-rose-300"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {error && (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}

              <span>{error || helperText}</span>
            </div>

            {showCount && maxLength && (
              <p
                className={cn(
                  "shrink-0 text-xs font-bold",
                  currentLength >= maxLength
                    ? "text-rose-600 dark:text-rose-300"
                    : "text-slate-400 dark:text-slate-500",
                )}
              >
                {currentLength}/{maxLength}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export type PromptTextareaProps = Omit<
  TextareaProps,
  "variant" | "textareaSize" | "showCount"
>;

export const PromptTextarea = forwardRef<
  HTMLTextAreaElement,
  PromptTextareaProps
>(
  (
    {
      label = "Prompt",
      placeholder = "Describe what you want the AI to create...",
      maxLength = 2500,
      ...props
    },
    ref,
  ) => {
    return (
      <Textarea
        ref={ref}
        label={label}
        placeholder={placeholder}
        maxLength={maxLength}
        showCount
        variant="glass"
        textareaSize="md"
        {...props}
      />
    );
  },
);

PromptTextarea.displayName = "PromptTextarea";