import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Cpu,
  Download,
  Filter,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  ServerCrash,
  Sparkles,
  Timer,
  Zap
} from "lucide-react";

import {
  AdminSectionHeader,
  AdminStatsGrid,
} from "../../components/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import {
  cn,
  copyToClipboard,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
  getToolGradient,
  getToolLabel,
} from "../../lib/utils";
import {
  getAdminStats,
  getApiErrorMessage,
  type AdminStatsResponse,
  type ToolType,
} from "../../lib/api";

type ApiStatus = "success" | "failed" | "pending";
type UsageSort = "newest" | "oldest" | "highest-cost" | "slowest";
type ToolFilter = "all" | ToolType;
type StatusFilter = "all" | ApiStatus;
type ProviderFilter = "all" | string;
type AdminPeriod = "day" | "week" | "month";

type ApiUsageEvent = {
  id: string;
  clerkUserId: string;
  userName: string;
  email: string;
  toolType: ToolType | null;
  provider: string;
  status: ApiStatus;
  tokens: number;
  cost: number;
  latencyMs: number;
  errorMessage: string | null;
  createdAt: string;
};

const toolOptions: ToolType[] = [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
];

export default function UsageAnalytics() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [period, setPeriod] = useState<AdminPeriod>("month");
  const [search, setSearch] = useState("");
  const [toolFilter, setToolFilter] = useState<ToolFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [sortBy, setSortBy] = useState<UsageSort>("newest");

  const adminStatsQuery = useQuery({
    queryKey: ["admin-usage-analytics", period],
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

  const statsResponse = adminStatsQuery.data;
  const overview = statsResponse?.overview;

  const events = useMemo(
    () => mapUsageEvents(statsResponse),
    [statsResponse],
  );

  const providerOptions = useMemo(() => {
    const providers = new Set<string>();

    for (const event of events) {
      if (event.provider) providers.add(event.provider);
    }

    return [...providers].sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    let list = events.filter((event) => {
      const matchesSearch =
        !cleanSearch ||
        event.id.toLowerCase().includes(cleanSearch) ||
        event.clerkUserId.toLowerCase().includes(cleanSearch) ||
        event.userName.toLowerCase().includes(cleanSearch) ||
        event.email.toLowerCase().includes(cleanSearch) ||
        event.provider.toLowerCase().includes(cleanSearch) ||
        (event.toolType &&
          getToolLabel(event.toolType).toLowerCase().includes(cleanSearch));

      const matchesTool =
        toolFilter === "all" || event.toolType === toolFilter;

      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;

      const matchesProvider =
        providerFilter === "all" || event.provider === providerFilter;

      return matchesSearch && matchesTool && matchesStatus && matchesProvider;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "highest-cost") return b.cost - a.cost;
      if (sortBy === "slowest") return b.latencyMs - a.latencyMs;

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [events, search, toolFilter, statusFilter, providerFilter, sortBy]);

  const totalCalls = getOverviewNumber(overview, "totalApiCalls");
  const successfulCalls = getOverviewNumber(overview, "successfulApiCalls");
  const failedCalls = getOverviewNumber(overview, "failedApiCalls");
  const pendingCalls = getOverviewNumber(overview, "pendingApiCalls");
  const totalTokens = getOverviewNumber(overview, "totalTokensUsed");
  const totalCost = getOverviewNumber(overview, "totalCostUsd");
  const averageLatency = getOverviewNumber(overview, "averageLatencyMs");
  const successRate = getOverviewNumber(overview, "successRate");

  const stats = [
    {
      title: "API Calls",
      value: formatNumber(totalCalls),
      description: `Tracked requests for selected ${period}`,
      icon: Zap,
      trend: "up" as const,
      trendValue: `${successfulCalls}`,
      trendLabel: "successful",
      gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
      badge: "Requests",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      description: "Completed requests",
      icon: CheckCircle2,
      trend: failedCalls > 0 ? ("down" as const) : ("up" as const),
      trendValue: failedCalls > 0 ? `${failedCalls} failed` : "0 failed",
      trendLabel: "error watch",
      gradient: "from-emerald-400 via-teal-500 to-cyan-500",
      badge: "Health",
    },
    {
      title: "Token Usage",
      value: formatNumber(totalTokens),
      description: "Gemini/resume text tokens",
      icon: BrainCircuit,
      trend: "up" as const,
      trendValue: `${pendingCalls}`,
      trendLabel: "pending",
      gradient: "from-cyan-500 via-blue-500 to-violet-600",
      badge: "AI",
    },
    {
      title: "API Cost",
      value: formatCurrency(totalCost),
      description: "Tracked provider cost",
      icon: Cpu,
      trend: "neutral" as const,
      trendValue: `${(averageLatency / 1000).toFixed(1)}s`,
      trendLabel: "avg latency",
      gradient: "from-amber-400 via-orange-500 to-fuchsia-600",
      badge: "Cost",
    },
  ];

  function handleResetFilters() {
    setSearch("");
    setToolFilter("all");
    setStatusFilter("all");
    setProviderFilter("all");
    setSortBy("newest");
  }

  async function handleExport() {
    if (!events.length) {
      toast.error("No usage logs to export.");
      return;
    }

    const csv = [
      [
        "ID",
        "Clerk User ID",
        "User",
        "Email",
        "Tool",
        "Provider",
        "Status",
        "Tokens",
        "Cost",
        "Latency",
        "Error",
        "Created At",
      ].join(","),
      ...events.map((event) =>
        [
          event.id,
          event.clerkUserId,
          event.userName,
          event.email,
          event.toolType ?? "",
          event.provider,
          event.status,
          event.tokens,
          event.cost,
          event.latencyMs,
          event.errorMessage ?? "",
          event.createdAt,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    await copyToClipboard(csv);
    toast.success("Usage CSV copied to clipboard.");
  }

  function handleViewDetails(event: ApiUsageEvent) {
    if (event.errorMessage) {
      toast.error(event.errorMessage);
      return;
    }

    toast.info(`${event.id} completed successfully.`);
  }

  if (adminStatsQuery.isLoading) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[30rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading usage analytics...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching real API usage logs from the backend.
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
          title="Could not load usage analytics"
          description={getApiErrorMessage(
            adminStatsQuery.error,
            "Usage analytics could not be loaded.",
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
        eyebrow="Usage Analytics"
        title="Track AI API calls, tool usage, cost, latency, and failures."
        description="This dashboard now reads real usage logs from your backend admin stats endpoint."
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
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
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

      <AdminStatsGrid stats={stats} />

      <ToolUsageOverview stats={statsResponse} />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card padding="xl" className="relative overflow-hidden">
          <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <Badge
                  variant="primary"
                  icon={<Activity className="h-3.5 w-3.5" />}
                >
                  Request Logs
                </Badge>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  AI request monitor
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Inspect recent AI tool calls, status, tokens, provider cost,
                  and response time.
                </p>
              </div>

              <Button
                variant="secondary"
                leftIcon={<Download size={17} />}
                onClick={handleExport}
              >
                Export
              </Button>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_12rem_12rem_12rem_13rem_auto]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search request, user, email, provider, or tool..."
                leftIcon={<Search className="h-4 w-4" />}
                variant="filled"
              />

              <select
                value={toolFilter}
                onChange={(event) =>
                  setToolFilter(event.target.value as ToolFilter)
                }
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                <option value="all">All tools</option>
                {toolOptions.map((toolType) => (
                  <option key={toolType} value={toolType}>
                    {getToolLabel(toolType)}
                  </option>
                ))}
              </select>

              <select
                value={providerFilter}
                onChange={(event) =>
                  setProviderFilter(event.target.value)
                }
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                <option value="all">All providers</option>
                {providerOptions.map((provider) => (
                  <option key={provider} value={provider}>
                    {formatProvider(provider)}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                <option value="all">All status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as UsageSort)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest-cost">Highest cost</option>
                <option value="slowest">Slowest first</option>
              </select>

              <Button
                variant="secondary"
                leftIcon={<RefreshCw size={17} />}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="muted" icon={<Filter className="h-3.5 w-3.5" />}>
                {filteredEvents.length} result
                {filteredEvents.length === 1 ? "" : "s"}
              </Badge>

              {toolFilter !== "all" && (
                <Badge variant="primary">{getToolLabel(toolFilter)}</Badge>
              )}

              {providerFilter !== "all" && (
                <Badge variant="info">{formatProvider(providerFilter)}</Badge>
              )}

              {statusFilter !== "all" && (
                <Badge variant={getStatusVariant(statusFilter)}>
                  {statusFilter}
                </Badge>
              )}
            </div>

            <div className="mt-6">
              {filteredEvents.length ? (
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[70rem]">
                      <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                        <tr>
                          <TableHead>Request</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Tool</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tokens</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Latency</TableHead>
                          <TableHead align="right">Actions</TableHead>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-transparent">
                        {filteredEvents.map((event) => (
                          <UsageEventRow
                            key={event.id}
                            event={event}
                            onView={() => handleViewDetails(event)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  variant="search"
                  title="No usage logs found"
                  description="Try changing the search text, tool filter, provider filter, or status filter."
                  primaryAction={{
                    label: "Clear Filters",
                    onClick: handleResetFilters,
                    variant: "secondary",
                    icon: <RefreshCw size={17} />,
                  }}
                />
              )}
            </div>
          </div>
        </Card>

        <UsageSidePanel
          totalCalls={totalCalls}
          successRate={successRate}
          averageLatency={averageLatency}
          totalCost={totalCost}
          failedCalls={failedCalls}
          pendingCalls={pendingCalls}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ProviderHealthCard events={events} />
        <RateLimitCard />
        <BackendChecklistCard />
      </section>
    </div>
  );
}

function ToolUsageOverview({ stats }: { stats?: AdminStatsResponse }) {
  const usageByTool = stats?.charts.usageByTool ?? [];
  const total = usageByTool.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card padding="xl">
      <Badge variant="success" icon={<BarChart3 className="h-3.5 w-3.5" />}>
        Tool Usage
      </Badge>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
        Usage by AI tool
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Successful usage grouped by tool type from backend usage logs.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {usageByTool.length ? (
          usageByTool.map((item) => (
            <ToolUsageCard
              key={item.toolType}
              toolType={item.toolType}
              count={item.count}
              tokensUsed={item.tokensUsed}
              costUsd={item.costUsd}
              total={total}
            />
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              variant="history"
              title="No successful usage yet"
              description="Generate articles or blog titles to populate usage analytics."
              size="sm"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function ToolUsageCard({
  toolType,
  count,
  tokensUsed,
  costUsd,
  total,
}: {
  toolType: ToolType;
  count: number;
  tokensUsed: number;
  costUsd: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <ToolBadge toolType={toolType} />

          <p className="mt-4 text-3xl font-black text-slate-950 dark:text-white">
            {formatNumber(count)}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatNumber(tokensUsed)} tokens • {formatCurrency(costUsd)}
          </p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", getToolGradient(toolType))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function UsageEventRow({
  event,
  onView,
}: {
  event: ApiUsageEvent;
  onView: () => void;
}) {
  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {event.id}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatRelativeTime(event.createdAt)}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {event.userName}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {event.email}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        {event.toolType ? <ToolBadge toolType={event.toolType} /> : <Badge variant="muted">System</Badge>}
      </td>

      <td className="px-5 py-4">
        <Badge variant="muted">{formatProvider(event.provider)}</Badge>
      </td>

      <td className="px-5 py-4">
        <ApiStatusBadge status={event.status} />
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-black text-slate-950 dark:text-white">
          {event.tokens ? formatNumber(event.tokens) : "—"}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-black text-slate-950 dark:text-white">
          {formatCurrency(event.cost)}
        </p>
      </td>

      <td className="px-5 py-4">
        <LatencyBadge latencyMs={event.latencyMs} />
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onView}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:text-violet-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-violet-300"
            title="View details"
            aria-label="View details"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function UsageSidePanel({
  totalCalls,
  successRate,
  averageLatency,
  totalCost,
  failedCalls,
  pendingCalls,
}: {
  totalCalls: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  failedCalls: number;
  pendingCalls: number;
}) {
  return (
    <div className="space-y-6">
      <Card padding="xl" className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative">
          <Badge
            variant="success"
            icon={<BadgeCheck className="h-3.5 w-3.5" />}
          >
            Performance
          </Badge>

          <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
            API performance snapshot
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Quick view of request quality, cost, and response speed.
          </p>

          <div className="mt-6 grid gap-4">
            <SnapshotRow
              icon={<Zap size={18} />}
              label="Total calls"
              value={formatNumber(totalCalls)}
              description="Tracked requests"
            />
            <SnapshotRow
              icon={<CheckCircle2 size={18} />}
              label="Success rate"
              value={`${successRate}%`}
              description="Completed successfully"
            />
            <SnapshotRow
              icon={<Timer size={18} />}
              label="Avg latency"
              value={`${(averageLatency / 1000).toFixed(1)}s`}
              description="Average response time"
            />
            <SnapshotRow
              icon={<Cpu size={18} />}
              label="Provider cost"
              value={formatCurrency(totalCost)}
              description="Tracked provider cost"
            />
            <SnapshotRow
              icon={<AlertTriangle size={18} />}
              label="Failed / pending"
              value={`${failedCalls} / ${pendingCalls}`}
              description="Failed and pending calls"
            />
          </div>
        </div>
      </Card>

      <Card padding="xl">
        <Badge
          variant="warning"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        >
          Cost Watch
        </Badge>

        <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
          Cost control ideas
        </h2>

        <div className="mt-6 grid gap-3">
          {[
            "Block premium tools before API call if plan is free",
            "Rate limit by user ID and tool type",
            "Store request logs with provider cost",
            "Retry failed requests carefully to avoid double cost",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
            >
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProviderHealthCard({ events }: { events: ApiUsageEvent[] }) {
  const providers = getProviderHealth(events);

  return (
    <Card padding="xl">
      <Badge
        variant="success"
        icon={<ServerCrash className="h-3.5 w-3.5" />}
      >
        Providers
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        API provider health
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Provider health is inferred from recent backend usage logs.
      </p>

      <div className="mt-6 space-y-3">
        {providers.length ? (
          providers.map((provider) => (
            <div
              key={provider.provider}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-slate-950 dark:text-white">
                    {formatProvider(provider.provider)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {provider.calls} calls • {(provider.averageLatency / 1000).toFixed(1)}s avg
                  </p>
                </div>

                <Badge variant={provider.failedCalls > 0 ? "warning" : "success"}>
                  {provider.failedCalls > 0 ? "Warnings" : "Operational"}
                </Badge>
              </div>

              <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                Cost: {formatCurrency(provider.cost)}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            variant="history"
            title="No provider logs"
            description="Run AI tools to populate provider health."
            size="sm"
          />
        )}
      </div>
    </Card>
  );
}

function RateLimitCard() {
  return (
    <Card padding="xl">
      <Badge
        variant="primary"
        icon={<Clock3 className="h-3.5 w-3.5" />}
      >
        Rate Limits
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Current limits
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        These are configured through your backend environment variables.
      </p>

      <div className="mt-6 grid gap-3">
        {[
          ["Free writing tools", "20/month"],
          ["Premium writing tools", "500/month"],
          ["Premium image tools", "Requires premium"],
          ["Resume reviews", "Requires premium"],
          ["Max upload size", "10MB"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {label}
            </span>
            <span className="text-sm font-black text-slate-950 dark:text-white">
              {value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BackendChecklistCard() {
  return (
    <Card padding="xl">
      <Badge
        variant="premium"
        icon={<Layers3 className="h-3.5 w-3.5" />}
      >
        Backend Setup
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        What is connected
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Usage analytics now reads real backend logs from Neon.
      </p>

      <div className="mt-6 grid gap-3">
        {[
          "API request log table exists in Neon",
          "User ID, tool type, status, latency, and cost are tracked",
          "Failed provider responses are stored",
          "Admin analytics endpoint is connected",
          "Next: add deeper per-user usage pagination",
          "Next: connect provider-specific cost rates",
        ].map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

function SnapshotRow({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          {icon}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ToolBadge({ toolType }: { toolType: ToolType }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-black text-white shadow-lg",
        getToolGradient(toolType),
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {getToolLabel(toolType)}
    </div>
  );
}

function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const icon =
    status === "success" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : status === "failed" ? (
      <AlertTriangle className="h-3.5 w-3.5" />
    ) : (
      <Clock3 className="h-3.5 w-3.5" />
    );

  return (
    <Badge variant={getStatusVariant(status)} icon={icon}>
      {status}
    </Badge>
  );
}

function LatencyBadge({ latencyMs }: { latencyMs: number }) {
  const seconds = latencyMs / 1000;
  const variant = seconds > 8 ? "danger" : seconds > 5 ? "warning" : "success";

  return <Badge variant={variant}>{seconds.toFixed(1)}s</Badge>;
}

function getStatusVariant(status: ApiStatus) {
  if (status === "success") return "success";
  if (status === "failed") return "danger";

  return "warning";
}

function TableHead({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function mapUsageEvents(stats: AdminStatsResponse | undefined): ApiUsageEvent[] {
  if (!stats) return [];

  const usersByClerkUserId = new Map<string, Record<string, unknown>>();

  for (const user of stats.recent.users) {
    const clerkUserId = getRecordString(user, "clerkUserId");

    if (clerkUserId) {
      usersByClerkUserId.set(clerkUserId, user);
    }
  }

  return stats.recent.usageLogs.map((record) => {
    const clerkUserId = getRecordString(record, "clerkUserId");
    const user = usersByClerkUserId.get(clerkUserId);
    const email = user ? getRecordString(user, "email") : "";
    const name = user
      ? getRecordString(user, "name") || getNameFromEmail(email)
      : clerkUserId || "Unknown User";

    return {
      id: getRecordString(record, "id") || "usage-log",
      clerkUserId,
      userName: name,
      email: email || "No email available",
      toolType: getRecordToolType(record),
      provider: getRecordString(record, "provider") || "system",
      status: getRecordStatus(record),
      tokens: getRecordNumber(record, "tokensUsed"),
      cost: getRecordNumber(record, "costUsd"),
      latencyMs: getRecordNumber(record, "latencyMs"),
      errorMessage: getRecordString(record, "errorMessage") || null,
      createdAt:
        getRecordString(record, "createdAt") || new Date().toISOString(),
    };
  });
}

function getProviderHealth(events: ApiUsageEvent[]) {
  const map = new Map<
    string,
    {
      provider: string;
      calls: number;
      failedCalls: number;
      totalLatency: number;
      cost: number;
    }
  >();

  for (const event of events) {
    const current =
      map.get(event.provider) ??
      {
        provider: event.provider,
        calls: 0,
        failedCalls: 0,
        totalLatency: 0,
        cost: 0,
      };

    current.calls += 1;
    current.failedCalls += event.status === "failed" ? 1 : 0;
    current.totalLatency += event.latencyMs;
    current.cost += event.cost;

    map.set(event.provider, current);
  }

  return [...map.values()].map((item) => ({
    ...item,
    averageLatency:
      item.calls > 0 ? Math.round(item.totalLatency / item.calls) : 0,
  }));
}

function getRecordString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === "string" ? value : "";
}

function getRecordNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getRecordStatus(record: Record<string, unknown>): ApiStatus {
  const value = getRecordString(record, "status");

  if (value === "success" || value === "failed" || value === "pending") {
    return value;
  }

  return "pending";
}

function getRecordToolType(record: Record<string, unknown>): ToolType | null {
  const value = getRecordString(record, "toolType");

  if (
    value === "article" ||
    value === "blog-title" ||
    value === "image" ||
    value === "background-removal" ||
    value === "object-removal" ||
    value === "resume-review"
  ) {
    return value;
  }

  return null;
}

function getOverviewNumber(
  overview: AdminStatsResponse["overview"] | undefined,
  key: string,
): number {
  const value = overview?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatProvider(provider: string): string {
  if (!provider) return "System";

  return provider
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getNameFromEmail(email: string): string {
  if (!email) return "Unknown User";

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}