import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  Clock,
  Crown,
  Database,
  FileText,
  ImageIcon,
  Layers3,
  Loader2,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  AdminSectionHeader,
  AdminStatsGrid,
  type AdminStatCardProps,
} from "../../components/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ROUTES } from "../../lib/routes";
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
  getToolGradient,
  getToolLabel,
  truncateText,
} from "../../lib/utils";
import {
  getAdminStats,
  getApiErrorMessage,
  type AdminStatsResponse,
  type PublicCreation,
  type ToolType,
} from "../../lib/api";

type AdminPeriod = "day" | "week" | "month";

const quickActions = [
  {
    title: "Review Users",
    description: "Check registered users, plan status, and activity.",
    href: `${ROUTES.admin}/users`,
    icon: UserRound,
    gradient: "from-violet-600 to-fuchsia-500",
  },
  {
    title: "Track Revenue",
    description: "Monitor subscriptions, payments, refunds, and growth.",
    href: `${ROUTES.admin}/revenue`,
    icon: ReceiptText,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    title: "Inspect Usage",
    description: "Analyze AI tool usage, API calls, and success rates.",
    href: `${ROUTES.admin}/usage`,
    icon: BarChart3,
    gradient: "from-cyan-500 to-emerald-400",
  },
  {
    title: "Monitor Creations",
    description: "View user-generated articles, images, and resume reviews.",
    href: `${ROUTES.admin}/creations`,
    icon: Layers3,
    gradient: "from-rose-500 to-violet-600",
  },
];

export default function AdminOverview() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [period, setPeriod] = useState<AdminPeriod>("month");

  const adminStatsQuery = useQuery({
    queryKey: ["admin-stats", period],
    enabled: Boolean(isLoaded && isSignedIn),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const token = await getToken({
        skipCache: true,
      });

      return getAdminStats({
        token,
        period,
      });
    },
  });

  const stats = adminStatsQuery.data;

  const adminStatCards = useMemo<AdminStatCardProps[]>(() => {
    const overview = stats?.overview;

    return [
      {
        title: "Total Users",
        value: getOverviewNumber(overview, "totalUsers"),
        description: "All registered accounts",
        icon: Users,
        trend: "up",
        trendValue: `${getOverviewNumber(overview, "conversionRate")}%`,
        trendLabel: "conversion rate",
        gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
        badge: "Users",
      },
      {
        title: "Premium Users",
        value: getOverviewNumber(overview, "premiumUsers"),
        description: "Active paid subscribers",
        icon: Crown,
        trend: "up",
        trendValue: formatCurrency(
          getOverviewNumber(overview, "estimatedMonthlyRevenueUsd"),
        ),
        trendLabel: "estimated MRR",
        gradient: "from-amber-400 via-orange-500 to-fuchsia-600",
        badge: "Revenue",
      },
      {
        title: "Total Creations",
        value: getOverviewNumber(overview, "totalCreations"),
        description: "Generated outputs saved",
        icon: Sparkles,
        trend: "up",
        trendValue: `${getOverviewNumber(overview, "completedCreations")}`,
        trendLabel: "completed",
        gradient: "from-cyan-500 via-blue-500 to-violet-600",
        badge: "AI",
      },
      {
        title: "API Calls",
        value: formatNumber(getOverviewNumber(overview, "totalApiCalls")),
        description: "Gemini and image API requests",
        icon: Zap,
        trend: "up",
        trendValue: `${getOverviewNumber(overview, "successRate")}%`,
        trendLabel: "success rate",
        gradient: "from-emerald-400 via-teal-500 to-cyan-500",
        badge: "System",
      },
    ];
  }, [stats?.overview]);

  if (adminStatsQuery.isLoading) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[32rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-red-500/10 text-red-600 dark:text-red-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading admin overview...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching real users, creations, revenue, and usage stats.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (adminStatsQuery.isError) {
    return (
      <Card padding="xl">
        <EmptyState
          variant="history"
          title="Could not load admin stats"
          description={getApiErrorMessage(
            adminStatsQuery.error,
            "Admin analytics could not be loaded.",
          )}
          primaryAction={{
            label: "Try Again",
            onClick: () => adminStatsQuery.refetch(),
            variant: "primary",
            icon: <RefreshCw size={17} />,
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        eyebrow="Admin Overview"
        title="Application analytics and platform control."
        description="Monitor real users, revenue estimates, AI usage, saved creations, and system health from one secure admin dashboard."
        icon={BarChart3}
      />

      <div className="flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            Analytics period
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Current view: {period}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["day", "week", "month"] as AdminPeriod[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-black capitalize transition",
                period === item
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1]",
              )}
            >
              {item}
            </button>
          ))}

          <Button
            variant="secondary"
            leftIcon={
              adminStatsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )
            }
            onClick={() => adminStatsQuery.refetch()}
            disabled={adminStatsQuery.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      <AdminStatsGrid stats={adminStatCards} />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <AdminControlCenter />
        <SystemHealthCard stats={stats} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <RevenueOverviewCard stats={stats} />
        <RecentActivityCard stats={stats} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <ToolUsageOverview stats={stats} />
        <UsersOverviewCard stats={stats} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminRoadmapCard />
        <AdminDataPreviewCard stats={stats} />
      </section>
    </div>
  );
}

function AdminControlCenter() {
  return (
    <Card padding="xl" className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <Badge
              variant="danger"
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
            >
              Control Center
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Admin quick actions
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Jump into key admin areas connected to your backend analytics and
              saved user data.
            </p>
          </div>

          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] bg-gradient-to-br from-red-500 via-fuchsia-600 to-violet-600 text-white shadow-xl shadow-red-500/20">
            <WandSparkles size={28} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} action={action} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function QuickActionCard({
  action,
}: {
  action: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    gradient: string;
  };
}) {
  const Icon = action.icon;

  return (
    <Link
      to={action.href}
      className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          action.gradient,
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-105",
            action.gradient,
          )}
        >
          <Icon size={21} />
        </div>

        <ArrowRight
          size={18}
          className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-red-500"
        />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">
        {action.title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {action.description}
      </p>
    </Link>
  );
}

function SystemHealthCard({ stats }: { stats?: AdminStatsResponse }) {
  const overview = stats?.overview;

  const systemChecks = [
    {
      label: "Authentication",
      value: "Healthy",
      description: "Clerk backend auth verified admin access.",
      icon: ShieldCheck,
      status: "success",
    },
    {
      label: "Database",
      value: "Healthy",
      description: "Admin stats loaded from Neon via Netlify Function.",
      icon: Database,
      status: "success",
    },
    {
      label: "AI APIs",
      value:
        getOverviewNumber(overview, "failedApiCalls") > 0
          ? "Warnings"
          : "Healthy",
      description: `${formatNumber(
        getOverviewNumber(overview, "totalApiCalls"),
      )} tracked API calls in selected period.`,
      icon: BrainCircuit,
      status:
        getOverviewNumber(overview, "failedApiCalls") > 0
          ? "warning"
          : "success",
    },
    {
      label: "Storage",
      value: "Partial",
      description: "Cloudinary is required for premium image tools.",
      icon: ImageIcon,
      status: "warning",
    },
  ] as const;

  return (
    <Card padding="xl">
      <Badge variant="success" icon={<Activity className="h-3.5 w-3.5" />}>
        System Health
      </Badge>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        Backend status
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Health is inferred from successful admin API response and usage records.
      </p>

      <div className="mt-7 space-y-3">
        {systemChecks.map((item) => (
          <SystemCheckRow key={item.label} item={item} />
        ))}
      </div>
    </Card>
  );
}

function SystemCheckRow({
  item,
}: {
  item: {
    label: string;
    value: string;
    description: string;
    icon: LucideIcon;
    status: "success" | "warning" | "danger";
  };
}) {
  const Icon = item.icon;

  return (
    <div className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
          item.status === "success" &&
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
          item.status === "warning" &&
            "bg-amber-500/10 text-amber-600 dark:text-amber-300",
          item.status === "danger" &&
            "bg-rose-500/10 text-rose-600 dark:text-rose-300",
        )}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-black text-slate-950 dark:text-white">
            {item.label}
          </h3>

          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em]",
              item.status === "success" &&
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
              item.status === "warning" &&
                "bg-amber-500/10 text-amber-600 dark:text-amber-300",
              item.status === "danger" &&
                "bg-rose-500/10 text-rose-600 dark:text-rose-300",
            )}
          >
            {item.value}
          </span>
        </div>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function RevenueOverviewCard({ stats }: { stats?: AdminStatsResponse }) {
  const overview = stats?.overview;

  const premiumUsers = getOverviewNumber(overview, "premiumUsers");
  const totalUsers = getOverviewNumber(overview, "totalUsers");
  const estimatedMonthlyRevenueUsd = getOverviewNumber(
    overview,
    "estimatedMonthlyRevenueUsd",
  );
  const conversionRate = getOverviewNumber(overview, "conversionRate");

  return (
    <Card padding="xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <Badge variant="premium" icon={<Crown className="h-3.5 w-3.5" />}>
            Revenue
          </Badge>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Estimated monthly revenue
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Revenue is estimated from premium user count until real billing
            webhook data is connected.
          </p>
        </div>

        <div className="grid h-16 w-16 place-items-center rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/20">
          <ReceiptText size={28} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MiniMetric
          label="Estimated MRR"
          value={formatCurrency(estimatedMonthlyRevenueUsd)}
          icon={<TrendingUp size={17} />}
        />

        <MiniMetric
          label="Premium Users"
          value={formatNumber(premiumUsers)}
          icon={<Crown size={17} />}
        />

        <MiniMetric
          label="Conversion"
          value={`${conversionRate}%`}
          icon={<BadgeCheck size={17} />}
        />
      </div>

      <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-black text-slate-950 dark:text-white">
            Premium ratio
          </span>

          <span className="text-sm font-black text-violet-600 dark:text-violet-300">
            {premiumUsers}/{totalUsers}
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500"
            style={{
              width: `${Math.min(conversionRate, 100)}%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
}

function RecentActivityCard({ stats }: { stats?: AdminStatsResponse }) {
  const recentCreations = stats?.recent.creations ?? [];
  const recentUsers = stats?.recent.users ?? [];
  const recentUsageLogs = stats?.recent.usageLogs ?? [];

  const activities = [
    ...recentCreations.slice(0, 4).map((creation) => ({
      title: getToolLabel(creation.toolType),
      description: truncateText(creation.prompt, 90),
      time: formatRelativeTime(creation.createdAt),
      icon: creation.resultImageUrl ? ImageIcon : FileText,
      color: creation.status === "failed" ? "text-rose-500" : "text-violet-500",
    })),
    ...recentUsers.slice(0, 2).map((user) => ({
      title: "New user account",
      description: getRecordString(user, "email") || "Registered user",
      time: getRecordString(user, "createdAt")
        ? formatRelativeTime(getRecordString(user, "createdAt"))
        : "Recently",
      icon: UserRound,
      color: "text-cyan-500",
    })),
    ...recentUsageLogs.slice(0, 2).map((log) => ({
      title: `${getRecordString(log, "provider") || "API"} usage`,
      description:
        getRecordString(log, "toolType") || getRecordString(log, "status"),
      time: getRecordString(log, "createdAt")
        ? formatRelativeTime(getRecordString(log, "createdAt"))
        : "Recently",
      icon: Zap,
      color:
        getRecordString(log, "status") === "failed"
          ? "text-rose-500"
          : "text-emerald-500",
    })),
  ].slice(0, 6);

  return (
    <Card padding="xl">
      <Badge variant="primary" icon={<Clock className="h-3.5 w-3.5" />}>
        Recent Activity
      </Badge>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        Latest platform events
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Recent creations, users, and usage logs from your backend.
      </p>

      <div className="mt-7 space-y-3">
        {activities.length ? (
          activities.map((activity, index) => (
            <RecentActivityItem
              key={`${activity.title}-${index}`}
              activity={activity}
            />
          ))
        ) : (
          <EmptyState
            variant="history"
            title="No activity yet"
            description="Generate content or add users to see activity here."
            size="sm"
          />
        )}
      </div>
    </Card>
  );
}

function RecentActivityItem({
  activity,
}: {
  activity: {
    title: string;
    description: string;
    time: string;
    icon: LucideIcon;
    color: string;
  };
}) {
  const Icon = activity.icon;

  return (
    <div className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white shadow-sm dark:bg-white/10">
        <Icon size={19} className={activity.color} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">
            {activity.title}
          </h3>

          <span className="shrink-0 text-xs font-bold text-slate-400">
            {activity.time}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          {activity.description}
        </p>
      </div>
    </div>
  );
}

function ToolUsageOverview({ stats }: { stats?: AdminStatsResponse }) {
  const usageByTool = stats?.charts.usageByTool ?? [];
  const total = usageByTool.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card padding="xl">
      <Badge variant="success" icon={<Zap className="h-3.5 w-3.5" />}>
        AI Usage
      </Badge>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        Usage by tool
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Successful API usage grouped by tool type.
      </p>

      <div className="mt-7 space-y-4">
        {usageByTool.length ? (
          usageByTool.map((item) => (
            <ToolUsageBar
              key={item.toolType}
              toolType={item.toolType}
              count={item.count}
              total={total}
              tokensUsed={item.tokensUsed}
              costUsd={item.costUsd}
            />
          ))
        ) : (
          <EmptyState
            variant="history"
            title="No usage yet"
            description="Run AI tools to populate usage analytics."
            size="sm"
          />
        )}
      </div>
    </Card>
  );
}

function ToolUsageBar({
  toolType,
  count,
  total,
  tokensUsed,
  costUsd,
}: {
  toolType: ToolType;
  count: number;
  total: number;
  tokensUsed: number;
  costUsd: number;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {getToolLabel(toolType)}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatNumber(tokensUsed)} tokens • {formatCurrency(costUsd)}
          </p>
        </div>

        <p className="text-sm font-black text-violet-600 dark:text-violet-300">
          {formatNumber(count)}
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", getToolGradient(toolType))}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function UsersOverviewCard({ stats }: { stats?: AdminStatsResponse }) {
  const overview = stats?.overview;

  const totalUsers = getOverviewNumber(overview, "totalUsers");
  const premiumUsers = getOverviewNumber(overview, "premiumUsers");
  const adminUsers = getOverviewNumber(overview, "adminUsers");
  const freeUsers = Math.max(totalUsers - premiumUsers, 0);

  return (
    <Card padding="xl">
      <Badge variant="primary" icon={<Users className="h-3.5 w-3.5" />}>
        Users
      </Badge>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        User distribution
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Real counts from the users table.
      </p>

      <div className="mt-7 grid gap-4">
        <MiniMetric
          label="Total users"
          value={formatNumber(totalUsers)}
          icon={<Users size={17} />}
        />

        <MiniMetric
          label="Free users"
          value={formatNumber(freeUsers)}
          icon={<Sparkles size={17} />}
        />

        <MiniMetric
          label="Premium users"
          value={formatNumber(premiumUsers)}
          icon={<Crown size={17} />}
        />

        <MiniMetric
          label="Admins"
          value={formatNumber(adminUsers)}
          icon={<ShieldCheck size={17} />}
        />
      </div>
    </Card>
  );
}

function AdminRoadmapCard() {
  const roadmap = [
    "Connect full billing webhooks",
    "Add user management actions",
    "Add admin creation deletion",
    "Add exportable analytics reports",
  ];

  return (
    <Card padding="xl">
      <Badge
        variant="premium"
        icon={<Sparkles className="h-3.5 w-3.5" />}
      >
        Next Admin Features
      </Badge>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        Admin roadmap
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        These improvements will make the admin panel production-ready.
      </p>

      <div className="mt-7 space-y-3">
        {roadmap.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-500" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {item}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminDataPreviewCard({ stats }: { stats?: AdminStatsResponse }) {
  const recentCreations = stats?.recent.creations ?? [];

  return (
    <Card padding="xl">
      <Badge variant="success" icon={<Database className="h-3.5 w-3.5" />}>
        Data Preview
      </Badge>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        Recent saved creations
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        These records are returned by the admin stats function.
      </p>

      <div className="mt-7 space-y-3">
        {recentCreations.length ? (
          recentCreations.slice(0, 5).map((creation) => (
            <CreationPreviewRow key={creation.id} creation={creation} />
          ))
        ) : (
          <EmptyState
            variant="history"
            title="No creation records yet"
            description="Generate user content to populate this preview."
            size="sm"
          />
        )}
      </div>
    </Card>
  );
}

function CreationPreviewRow({ creation }: { creation: PublicCreation }) {
  return (
    <div className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white",
          getToolGradient(creation.toolType),
        )}
      >
        {creation.resultImageUrl ? <ImageIcon size={18} /> : <FileText size={18} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950 dark:text-white">
          {getToolLabel(creation.toolType)}
        </p>

        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          {truncateText(creation.prompt, 120)}
        </p>

        <p className="mt-2 text-xs font-bold text-slate-400">
          {formatDate(creation.createdAt)}
        </p>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function getOverviewNumber(
  overview: AdminStatsResponse["overview"] | undefined,
  key: string,
): number {
  const value = overview?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getRecordString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === "string" ? value : "";
}