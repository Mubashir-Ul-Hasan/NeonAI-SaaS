import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Crown,
  Download,
  FileText,
  ImageIcon,
  Layers3,
  PieChart,
  Sparkles,
  TrendingUp,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import {
  cn,
  formatNumber,
  getToolGradient,
  getToolLabel,
  isPremiumTool,
  type ToolType,
} from "../../lib/utils";

type ToolUsagePoint = {
  toolType: ToolType;
  usage: number;
  users: number;
  successRate: number;
  averageTime: string;
  icon: LucideIcon;
};

type UsageRange = "today" | "7d" | "30d";

const usageData: Record<UsageRange, ToolUsagePoint[]> = {
  today: [
    {
      toolType: "article",
      usage: 128,
      users: 64,
      successRate: 98,
      averageTime: "2.4s",
      icon: FileText,
    },
    {
      toolType: "blog-title",
      usage: 96,
      users: 51,
      successRate: 99,
      averageTime: "1.8s",
      icon: Sparkles,
    },
    {
      toolType: "image",
      usage: 42,
      users: 23,
      successRate: 94,
      averageTime: "8.9s",
      icon: ImageIcon,
    },
    {
      toolType: "background-removal",
      usage: 35,
      users: 18,
      successRate: 96,
      averageTime: "5.1s",
      icon: WandSparkles,
    },
    {
      toolType: "object-removal",
      usage: 21,
      users: 13,
      successRate: 91,
      averageTime: "7.4s",
      icon: Layers3,
    },
    {
      toolType: "resume-review",
      usage: 18,
      users: 11,
      successRate: 97,
      averageTime: "4.6s",
      icon: Activity,
    },
  ],
  "7d": [
    {
      toolType: "article",
      usage: 842,
      users: 310,
      successRate: 98,
      averageTime: "2.5s",
      icon: FileText,
    },
    {
      toolType: "blog-title",
      usage: 715,
      users: 284,
      successRate: 99,
      averageTime: "1.9s",
      icon: Sparkles,
    },
    {
      toolType: "image",
      usage: 316,
      users: 142,
      successRate: 94,
      averageTime: "9.2s",
      icon: ImageIcon,
    },
    {
      toolType: "background-removal",
      usage: 251,
      users: 119,
      successRate: 96,
      averageTime: "5.3s",
      icon: WandSparkles,
    },
    {
      toolType: "object-removal",
      usage: 184,
      users: 82,
      successRate: 92,
      averageTime: "7.7s",
      icon: Layers3,
    },
    {
      toolType: "resume-review",
      usage: 147,
      users: 73,
      successRate: 97,
      averageTime: "4.8s",
      icon: Activity,
    },
  ],
  "30d": [
    {
      toolType: "article",
      usage: 3620,
      users: 924,
      successRate: 98,
      averageTime: "2.6s",
      icon: FileText,
    },
    {
      toolType: "blog-title",
      usage: 2970,
      users: 801,
      successRate: 99,
      averageTime: "1.9s",
      icon: Sparkles,
    },
    {
      toolType: "image",
      usage: 1385,
      users: 433,
      successRate: 94,
      averageTime: "9.4s",
      icon: ImageIcon,
    },
    {
      toolType: "background-removal",
      usage: 1178,
      users: 392,
      successRate: 96,
      averageTime: "5.5s",
      icon: WandSparkles,
    },
    {
      toolType: "object-removal",
      usage: 806,
      users: 247,
      successRate: 92,
      averageTime: "7.9s",
      icon: Layers3,
    },
    {
      toolType: "resume-review",
      usage: 692,
      users: 218,
      successRate: 97,
      averageTime: "4.9s",
      icon: Activity,
    },
  ],
};

export function ToolUsageChart() {
  const [range, setRange] = useState<UsageRange>("30d");

  const data = usageData[range];

  const totalUsage = useMemo(
    () => data.reduce((total, item) => total + item.usage, 0),
    [data],
  );

  const totalUsers = useMemo(
    () => data.reduce((total, item) => total + item.users, 0),
    [data],
  );

  const averageSuccessRate = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.successRate, 0);

    return Math.round(total / data.length);
  }, [data]);

  const topTool = useMemo(() => {
    return [...data].sort((a, b) => b.usage - a.usage)[0];
  }, [data]);

  const maxUsage = Math.max(...data.map((item) => item.usage));

  return (
    <Card padding="xl" className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <Badge
              variant="primary"
              icon={<BarChart3 className="h-3.5 w-3.5" />}
            >
              Tool Usage
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              AI tool performance
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Track which tools users use most, which premium tools drive
              upgrades, and how successful each AI workflow is.
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
              onClick={() => alert("Tool usage export will be connected later.")}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <UsageMetric
            label="Total Runs"
            value={formatNumber(totalUsage)}
            description="AI generations and edits"
            icon={Sparkles}
            gradient="from-violet-600 to-fuchsia-500"
          />

          <UsageMetric
            label="Active Users"
            value={formatNumber(totalUsers)}
            description="Users across selected range"
            icon={Activity}
            gradient="from-cyan-500 to-emerald-400"
          />

          <UsageMetric
            label="Success Rate"
            value={`${averageSuccessRate}%`}
            description="Average completion rate"
            icon={TrendingUp}
            gradient="from-emerald-400 to-teal-500"
          />

          <UsageMetric
            label="Top Tool"
            value={getToolLabel(topTool.toolType)}
            description={`${formatNumber(topTool.usage)} runs`}
            icon={topTool.icon}
            gradient={getToolGradient(topTool.toolType)}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  Usage by tool
                </h3>

                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Horizontal comparison of total tool runs
                </p>
              </div>

              <Badge
                variant="success"
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              >
                Live-ready UI
              </Badge>
            </div>

            <div className="space-y-4">
              {data.map((item) => (
                <ToolUsageRow
                  key={item.toolType}
                  item={item}
                  maxUsage={maxUsage}
                  totalUsage={totalUsage}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <ToolDistributionCard data={data} totalUsage={totalUsage} />

            <PremiumToolsCard data={data} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <UsageInsight
            icon={FileText}
            title="Writing tools lead adoption"
            description="Article writing and blog titles are strong free tools for onboarding new users."
          />

          <UsageInsight
            icon={Crown}
            title="Premium tools drive upgrades"
            description="Image and editing tools should be protected by backend plan checks before API use."
          />

          <UsageInsight
            icon={PieChart}
            title="Admin monitoring ready"
            description="This component is prepared for real analytics from Neon and payment metadata."
          />
        </div>
      </div>
    </Card>
  );
}

function ToolUsageRow({
  item,
  maxUsage,
  totalUsage,
}: {
  item: ToolUsagePoint;
  maxUsage: number;
  totalUsage: number;
}) {
  const Icon = item.icon;
  const width = Math.max(8, Math.round((item.usage / maxUsage) * 100));
  const percentage = Math.round((item.usage / totalUsage) * 100);
  const premium = isPremiumTool(item.toolType);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
              getToolGradient(item.toolType),
            )}
          >
            <Icon size={19} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-slate-950 dark:text-white">
                {getToolLabel(item.toolType)}
              </p>

              {premium && (
                <Badge
                  variant="premium"
                  size="sm"
                  icon={<Crown className="h-3 w-3" />}
                >
                  Premium
                </Badge>
              )}
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {formatNumber(item.users)} users • {item.successRate}% success •{" "}
              {item.averageTime} avg
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-lg font-black text-slate-950 dark:text-white">
            {formatNumber(item.usage)}
          </p>

          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {percentage}% share
          </p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            getToolGradient(item.toolType),
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ToolDistributionCard({
  data,
  totalUsage,
}: {
  data: ToolUsagePoint[];
  totalUsage: number;
}) {
  const topThree = [...data].sort((a, b) => b.usage - a.usage).slice(0, 3);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-950 dark:text-white">
            Distribution
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Top tool share
          </p>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <PieChart size={22} />
        </div>
      </div>

      <div className="mt-6 grid place-items-center">
        <div className="relative grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(from_180deg,#7c3aed_0deg,#7c3aed_130deg,#06b6d4_130deg,#06b6d4_235deg,#f59e0b_235deg,#f59e0b_310deg,#e2e8f0_310deg,#e2e8f0_360deg)] p-4 dark:bg-[conic-gradient(from_180deg,#8b5cf6_0deg,#8b5cf6_130deg,#22d3ee_130deg,#22d3ee_235deg,#fbbf24_235deg,#fbbf24_310deg,#334155_310deg,#334155_360deg)]">
          <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-inner dark:bg-slate-950">
            <div>
              <p className="text-3xl font-black text-slate-950 dark:text-white">
                {formatNumber(totalUsage)}
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                total runs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {topThree.map((item) => {
          const percentage = Math.round((item.usage / totalUsage) * 100);
          const Icon = item.icon;

          return (
            <div
              key={item.toolType}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white",
                    getToolGradient(item.toolType),
                  )}
                >
                  <Icon size={16} />
                </div>

                <p className="text-sm font-black text-slate-950 dark:text-white">
                  {getToolLabel(item.toolType)}
                </p>
              </div>

              <p className="text-sm font-black text-violet-600 dark:text-violet-300">
                {percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PremiumToolsCard({ data }: { data: ToolUsagePoint[] }) {
  const premiumTools = data.filter((item) => isPremiumTool(item.toolType));
  const premiumUsage = premiumTools.reduce((total, item) => total + item.usage, 0);
  const freeUsage = data
    .filter((item) => !isPremiumTool(item.toolType))
    .reduce((total, item) => total + item.usage, 0);

  const premiumRatio = Math.round(
    (premiumUsage / Math.max(premiumUsage + freeUsage, 1)) * 100,
  );

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-amber-400/25 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/10">
      <div className="pointer-events-none absolute left-[-5rem] top-[-5rem] h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] right-[-5rem] h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative">
        <Badge
          variant="premium"
          icon={<Crown className="h-3.5 w-3.5" />}
        >
          Premium Tools
        </Badge>

        <h3 className="mt-4 text-2xl font-black">
          {formatNumber(premiumUsage)} premium runs
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Premium tools represent {premiumRatio}% of selected usage. This helps
          measure upgrade value and API cost.
        </p>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-fuchsia-600"
            style={{ width: `${premiumRatio}%` }}
          />
        </div>

        <div className="mt-5 grid gap-3">
          {premiumTools.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.toolType}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className="text-amber-300" />

                  <span className="text-sm font-black">
                    {getToolLabel(item.toolType)}
                  </span>
                </div>

                <span className="text-sm font-black text-cyan-200">
                  {formatNumber(item.usage)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UsageMetric({
  label,
  value,
  description,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
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

function UsageInsight({
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