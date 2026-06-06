import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Crown,
  Download,
  Globe2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { cn, formatNumber } from "../../lib/utils";

type UserRange = "today" | "7d" | "30d";

type UserSegment = {
  label: string;
  value: number;
  description: string;
  color: string;
  badgeVariant: "primary" | "success" | "premium" | "warning" | "muted";
  icon: LucideIcon;
};

type UserMetric = {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  gradient: string;
};

const userData: Record<UserRange, UserSegment[]> = {
  today: [
    {
      label: "Free Users",
      value: 84,
      description: "Users on limited access",
      color: "#7c3aed",
      badgeVariant: "primary",
      icon: Users,
    },
    {
      label: "Premium Users",
      value: 26,
      description: "Paid subscribers",
      color: "#f59e0b",
      badgeVariant: "premium",
      icon: Crown,
    },
    {
      label: "New Signups",
      value: 18,
      description: "Joined today",
      color: "#06b6d4",
      badgeVariant: "success",
      icon: UserPlus,
    },
    {
      label: "Inactive Users",
      value: 9,
      description: "No recent activity",
      color: "#94a3b8",
      badgeVariant: "muted",
      icon: Activity,
    },
  ],
  "7d": [
    {
      label: "Free Users",
      value: 642,
      description: "Users on limited access",
      color: "#7c3aed",
      badgeVariant: "primary",
      icon: Users,
    },
    {
      label: "Premium Users",
      value: 186,
      description: "Paid subscribers",
      color: "#f59e0b",
      badgeVariant: "premium",
      icon: Crown,
    },
    {
      label: "New Signups",
      value: 124,
      description: "Joined this week",
      color: "#06b6d4",
      badgeVariant: "success",
      icon: UserPlus,
    },
    {
      label: "Inactive Users",
      value: 71,
      description: "No recent activity",
      color: "#94a3b8",
      badgeVariant: "muted",
      icon: Activity,
    },
  ],
  "30d": [
    {
      label: "Free Users",
      value: 2840,
      description: "Users on limited access",
      color: "#7c3aed",
      badgeVariant: "primary",
      icon: Users,
    },
    {
      label: "Premium Users",
      value: 794,
      description: "Paid subscribers",
      color: "#f59e0b",
      badgeVariant: "premium",
      icon: Crown,
    },
    {
      label: "New Signups",
      value: 518,
      description: "Joined this month",
      color: "#06b6d4",
      badgeVariant: "success",
      icon: UserPlus,
    },
    {
      label: "Inactive Users",
      value: 326,
      description: "No recent activity",
      color: "#94a3b8",
      badgeVariant: "muted",
      icon: Activity,
    },
  ],
};

export function UsersPieChart() {
  const [range, setRange] = useState<UserRange>("30d");

  const data = userData[range];

  const totalUsers = useMemo(
    () => data.reduce((total, item) => total + item.value, 0),
    [data],
  );

  const premiumUsers = data.find((item) => item.label === "Premium Users")?.value ?? 0;
  const freeUsers = data.find((item) => item.label === "Free Users")?.value ?? 0;
  const newUsers = data.find((item) => item.label === "New Signups")?.value ?? 0;

  const premiumRate = Math.round((premiumUsers / Math.max(totalUsers, 1)) * 100);
  const signupRate = Math.round((newUsers / Math.max(totalUsers, 1)) * 100);

  const metrics: UserMetric[] = [
    {
      label: "Total Users",
      value: totalUsers,
      description: "All tracked accounts",
      icon: Users,
      gradient: "from-violet-600 to-fuchsia-500",
    },
    {
      label: "Premium Rate",
      value: `${premiumRate}%`,
      description: "Paid conversion share",
      icon: Crown,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      label: "New Signups",
      value: newUsers,
      description: "Fresh user growth",
      icon: UserPlus,
      gradient: "from-cyan-500 to-emerald-400",
    },
    {
      label: "Free Users",
      value: freeUsers,
      description: "Potential upgrades",
      icon: Sparkles,
      gradient: "from-blue-500 to-violet-600",
    },
  ];

  return (
    <Card padding="xl" className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <Badge
              variant="primary"
              icon={<Users className="h-3.5 w-3.5" />}
            >
              User Analytics
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              User distribution overview
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Monitor free users, premium users, new signups, and inactive
              accounts from one admin view. Later this will load real user data
              from Neon and Clerk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RangeButton
              active={range === "today"}
              onClick={() => setRange("today")}
            >
              Today
            </RangeButton>

            <RangeButton active={range === "7d"} onClick={() => setRange("7d")}>
              7 Days
            </RangeButton>

            <RangeButton
              active={range === "30d"}
              onClick={() => setRange("30d")}
            >
              30 Days
            </RangeButton>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={() => alert("User export will be connected later.")}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <UserMetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/50">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">
                Account mix
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Visual split by user segment
              </p>
            </div>

            <div className="grid place-items-center">
              <PieRing data={data} total={totalUsers} />
            </div>

            <div className="mt-6 grid gap-3">
              {data.map((item) => (
                <PieLegendItem key={item.label} item={item} total={totalUsers} />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  User segments
                </h3>

                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Detailed breakdown of user categories
                </p>
              </div>

              <Badge
                variant="success"
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              >
                {signupRate}% new users
              </Badge>
            </div>

            <div className="space-y-4">
              {data.map((item) => (
                <UserSegmentRow key={item.label} item={item} total={totalUsers} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <UserInsight
            icon={ShieldCheck}
            title="Clerk user sync"
            description="Admin user metrics can be synchronized from Clerk user metadata and Neon records."
          />

          <UserInsight
            icon={Crown}
            title="Premium conversion"
            description="Track how many free users convert after using writing tools and viewing premium gates."
          />

          <UserInsight
            icon={Globe2}
            title="Global SaaS ready"
            description="This chart is ready for growth analytics, user geography, and retention data later."
          />
        </div>
      </div>
    </Card>
  );
}

function PieRing({
  data,
  total,
}: {
  data: UserSegment[];
  total: number;
}) {
  const gradient = buildConicGradient(data, total);

  return (
    <div
      className="relative grid h-72 w-72 place-items-center rounded-full p-5 shadow-2xl shadow-slate-950/10"
      style={{ background: gradient }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-inner dark:bg-slate-950">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <Users size={25} />
          </div>

          <p className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            {formatNumber(total)}
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Total users
          </p>
        </div>
      </div>
    </div>
  );
}

function PieLegendItem({
  item,
  total,
}: {
  item: UserSegment;
  total: number;
}) {
  const percentage = Math.round((item.value / Math.max(total, 1)) * 100);
  const Icon = item.icon;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />

        <Icon size={17} className="text-slate-500 dark:text-slate-400" />

        <p className="text-sm font-black text-slate-950 dark:text-white">
          {item.label}
        </p>
      </div>

      <p className="text-sm font-black text-violet-600 dark:text-violet-300">
        {percentage}%
      </p>
    </div>
  );
}

function UserSegmentRow({
  item,
  total,
}: {
  item: UserSegment;
  total: number;
}) {
  const Icon = item.icon;
  const percentage = Math.round((item.value / Math.max(total, 1)) * 100);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg"
            style={{ backgroundColor: item.color }}
          >
            <Icon size={21} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-slate-950 dark:text-white">
                {item.label}
              </p>

              <Badge variant={item.badgeVariant} size="sm">
                {percentage}%
              </Badge>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {item.description}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xl font-black text-slate-950 dark:text-white">
            {formatNumber(item.value)}
          </p>

          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            accounts
          </p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: item.color,
          }}
        />
      </div>
    </div>
  );
}

function UserMetricCard({ metric }: { metric: UserMetric }) {
  const Icon = metric.icon;

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {metric.label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {typeof metric.value === "number"
              ? formatNumber(metric.value)
              : metric.value}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {metric.description}
          </p>
        </div>

        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            metric.gradient,
          )}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function UserInsight({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
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

function buildConicGradient(data: UserSegment[], total: number) {
  let start = 0;

  const parts = data.map((item) => {
    const degrees = (item.value / Math.max(total, 1)) * 360;
    const end = start + degrees;
    const segment = `${item.color} ${start}deg ${end}deg`;

    start = end;

    return segment;
  });

  return `conic-gradient(from 180deg, ${parts.join(", ")})`;
}