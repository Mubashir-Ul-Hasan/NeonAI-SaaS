import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "premium"
  | "dark";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "icon";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  rounded?: "md" | "lg" | "xl" | "2xl" | "full";
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonBaseProps;

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonBaseProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:shadow-violet-500/30",

  secondary:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10",

  outline:
    "border border-violet-500/30 bg-violet-500/5 text-violet-700 hover:border-violet-500/50 hover:bg-violet-500/10 dark:text-violet-200",

  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",

  danger:
    "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 text-white shadow-xl shadow-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/30",

  success:
    "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30",

  premium:
    "bg-gradient-to-r from-amber-400 via-orange-500 to-fuchsia-600 text-white shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-orange-500/30",

  dark:
    "bg-slate-950 text-white shadow-xl shadow-slate-950/10 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs",
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-sm",
  xl: "h-14 px-7 text-base",
  icon: "h-11 w-11 p-0",
};

const roundedClasses = {
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[1.5rem]",
  full: "rounded-full",
};

function getButtonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  rounded = "lg",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  rounded?: ButtonBaseProps["rounded"];
  className?: string;
}) {
  return cn(
    "group inline-flex shrink-0 items-center justify-center gap-2 font-black tracking-tight transition duration-200 ease-out",
    "focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
    "active:scale-[0.98]",
    "hover:-translate-y-0.5",
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded ?? "lg"],
    fullWidth && "w-full",
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = "lg",
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={getButtonClasses({
          variant,
          size,
          fullWidth,
          rounded,
          className,
        })}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}

        {size !== "icon" && children}

        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = "lg",
      "aria-disabled": ariaDisabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(ariaDisabled) || isLoading;

    return (
      <a
        ref={ref}
        aria-disabled={isDisabled}
        className={getButtonClasses({
          variant,
          size,
          fullWidth,
          rounded,
          className: cn(isDisabled && "pointer-events-none opacity-55", className),
        })}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}

        {size !== "icon" && children}

        {!isLoading && rightIcon}
      </a>
    );
  },
);

ButtonLink.displayName = "ButtonLink";