import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "../../lib/utils";

type CardVariant =
  | "default"
  | "glass"
  | "dark"
  | "gradient"
  | "premium"
  | "soft"
  | "danger"
  | "success";

type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  glow?: boolean;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04] dark:text-white",

  glass:
    "border-slate-200/70 bg-white/75 text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/60 dark:text-white",

  dark:
    "border-slate-900 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 dark:border-white/10",

  gradient:
    "border-transparent bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-2xl shadow-violet-500/25",

  premium:
    "border-amber-400/30 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white shadow-2xl shadow-violet-500/25",

  soft:
    "border-slate-200 bg-slate-50 text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white",

  danger:
    "border-rose-500/20 bg-rose-500/10 text-rose-800 shadow-xl shadow-rose-500/5 dark:text-rose-200",

  success:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 shadow-xl shadow-emerald-500/5 dark:text-emerald-200",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  xl: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "lg",
      hover = false,
      glow = false,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-[2rem] border transition duration-200",
          variantClasses[variant],
          paddingClasses[padding],
          hover && "hover:-translate-y-1 hover:shadow-2xl",
          glow && "premium-glow",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-black tracking-tight text-slate-950 dark:text-white", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card hover className={className}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-5 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-300">
          {trend}
        </div>
      )}
    </Card>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  badge?: string;
  gradient?: string;
  href?: string;
  className?: string;
};

export function FeatureCard({
  title,
  description,
  icon,
  badge,
  gradient = "from-violet-600 via-fuchsia-600 to-cyan-500",
  href,
  className,
}: FeatureCardProps) {
  const content = (
    <Card hover className={cn("group", className)}>
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", gradient)} />

      <div className="flex items-start justify-between gap-4">
        {icon && (
          <div
            className={cn(
              "grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-lg",
              gradient,
            )}
          >
            {icon}
          </div>
        )}

        {badge && (
          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-700 dark:text-violet-200">
            {badge}
          </span>
        )}
      </div>

      <h3 className="mt-6 text-xl font-black tracking-tight text-slate-950 dark:text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {href && (
        <div className="mt-6 flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">
          Open
          <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </div>
      )}
    </Card>
  );

  if (!href) return content;

  return (
    <a href={href} className="block">
      {content}
    </a>
  );
}

type EmptyCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyCard({
  title,
  description,
  icon,
  action,
  className,
}: EmptyCardProps) {
  return (
    <Card
      variant="soft"
      className={cn(
        "grid min-h-[18rem] place-items-center border-dashed text-center",
        className,
      )}
    >
      <div>
        {icon && (
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            {icon}
          </div>
        )}

        <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">
          {title}
        </h3>

        {description && (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}

        {action && <div className="mt-6">{action}</div>}
      </div>
    </Card>
  );
}