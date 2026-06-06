import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CreditCard,
  Crown,
  DollarSign,
  Download,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { cn, formatNumber } from "../../lib/utils";

type RevenuePoint = {
  month: string;
  revenue: number;
  subscriptions: number;
  refunds: number;
};

type RevenueRange = "6m" | "12m";

const revenueData: RevenuePoint[] = [
  { month: "Jan", revenue: 920, subscriptions: 42, refunds: 2 },
  { month: "Feb", revenue: 1280, subscriptions: 58, refunds: 3 },
  { month: "Mar", revenue: 1640, subscriptions: 74, refunds: 4 },
  { month: "Apr", revenue: 1890, subscriptions: 82, refunds: 2 },
  { month: "May", revenue: 2380, subscriptions: 101, refunds: 5 },
  { month: "Jun", revenue: 2860, subscriptions: 124, refunds: 4 },
  { month: "Jul", revenue: 3180, subscriptions: 139, refunds: 6 },
  { month: "Aug", revenue: 3620, subscriptions: 157, refunds: 3 },
  { month: "Sep", revenue: 4120, subscriptions: 181, refunds: 5 },
  { month: "Oct", revenue: 4680, subscriptions: 208, refunds: 7 },
  { month: "Nov", revenue: 5340, subscriptions: 236, refunds: 4 },
  { month: "Dec", revenue: 6120, subscriptions: 271, refunds: 5 },
];

export function RevenueChart() {
  const [range, setRange] = useState<RevenueRange>("12m");

  const visibleData = useMemo(() => {
    return range === "6m" ? revenueData.slice(-6) : revenueData;
  }, [range]);

  const maxRevenue = Math.max(...visibleData.map((item) => item.revenue));
  const totalRevenue = visibleData.reduce((total, item) => total + item.revenue, 0);
  const totalSubscriptions = visibleData.reduce(
    (total, item) => total + item.subscriptions,
    0,
  );
  const totalRefunds = visibleData.reduce((total, item) => total + item.refunds, 0);

  const firstRevenue = visibleData[0]?.revenue ?? 0;
  const lastRevenue = visibleData[visibleData.length - 1]?.revenue ?? 0;
  const growth =
    firstRevenue > 0
      ? Math.round(((lastRevenue - firstRevenue) / firstRevenue) * 100)
      : 0;

  return (
    <Card padding="xl" className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <Badge
              variant="success"
              icon={<DollarSign className="h-3.5 w-3.5" />}
            >
              Revenue Analytics
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Monthly revenue overview
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Demo revenue data for admin analytics. Later this will connect to
              Clerk Billing, Stripe payments, and Neon database records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RangeButton active={range === "6m"} onClick={() => setRange("6m")}>
              6 Months
            </RangeButton>

            <RangeButton active={range === "12m"} onClick={() => setRange("12m")}>
              12 Months
            </RangeButton>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={() => alert("Revenue export will be connected later.")}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RevenueMetric
            label="Total Revenue"
            value={`$${formatNumber(totalRevenue)}`}
            description={`${range === "6m" ? "Last 6 months" : "Last 12 months"}`}
            icon={DollarSign}
            gradient="from-emerald-400 to-teal-500"
          />

          <RevenueMetric
            label="Growth"
            value={`${growth}%`}
            description="Revenue increase"
            icon={growth >= 0 ? ArrowUpRight : ArrowDownRight}
            gradient={growth >= 0 ? "from-cyan-500 to-emerald-400" : "from-rose-500 to-orange-500"}
          />

          <RevenueMetric
            label="Subscriptions"
            value={formatNumber(totalSubscriptions)}
            description="Premium purchases"
            icon={Crown}
            gradient="from-amber-400 to-orange-500"
          />

          <RevenueMetric
            label="Refunds"
            value={formatNumber(totalRefunds)}
            description="Demo refund count"
            icon={ReceiptText}
            gradient="from-violet-600 to-fuchsia-500"
          />
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white">
                Revenue trend
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Monthly subscription revenue in USD
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
              <TrendingUp size={15} />
              {growth >= 0 ? "+" : ""}
              {growth}% growth
            </div>
          </div>

          <div className="flex h-80 items-end gap-3 overflow-x-auto rounded-[1.5rem] bg-white p-5 dark:bg-white/[0.04]">
            {visibleData.map((item) => {
              const height = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));

              return (
                <div
                  key={item.month}
                  className="group flex min-w-14 flex-1 flex-col items-center justify-end gap-3"
                >
                  <div className="pointer-events-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center opacity-0 shadow-xl transition group-hover:opacity-100 dark:border-white/10 dark:bg-slate-950">
                    <p className="text-xs font-black text-slate-950 dark:text-white">
                      ${formatNumber(item.revenue)}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] font-semibold text-slate-500 dark:text-slate-400">
                      {item.subscriptions} subs
                    </p>
                  </div>

                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-500 via-teal-500 to-cyan-400 shadow-lg shadow-emerald-500/15 transition group-hover:scale-x-105"
                    style={{ height: `${height}%` }}
                  />

                  <p className="text-xs font-black text-slate-500 dark:text-slate-400">
                    {item.month}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <RevenueInsight
            icon={CreditCard}
            title="Payment tracking"
            description="Real payment totals will be read from Clerk Billing and Stripe-backed transactions."
          />

          <RevenueInsight
            icon={CalendarDays}
            title="Monthly reports"
            description="Admin can review subscription growth, refunds, upgrades, and churn by month."
          />

          <RevenueInsight
            icon={BarChart3}
            title="Business analytics"
            description="These cards are ready for real SaaS metrics after backend integration."
          />
        </div>
      </div>
    </Card>
  );
}

function RangeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-2xl px-4 text-sm font-black transition hover:-translate-y-0.5",
        active
          ? "bg-slate-950 text-white shadow-xl shadow-slate-950/10 dark:bg-white dark:text-slate-950"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]",
      )}
    >
      {children}
    </button>
  );
}

function RevenueMetric({
  label,
  value,
  description,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof DollarSign;
  gradient: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            gradient,
          )}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function RevenueInsight({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CreditCard;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
          <Icon size={20} />
        </div>

        <div>
          <p className="font-black text-slate-950 dark:text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}