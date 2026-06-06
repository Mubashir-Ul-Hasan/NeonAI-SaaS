import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Crown,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Gem,
  LineChart,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards
} from "lucide-react";

import { AdminSectionHeader, AdminStatsGrid } from "../../components/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import {
  cn,
  copyToClipboard,
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "../../lib/utils";
import {
  getAdminStats,
  getApiErrorMessage,
  type AdminStatsResponse,
  type UserPlan,
} from "../../lib/api";

type RevenueStatus = "estimated" | "free" | "setup-required";
type RevenueFilter = "all" | RevenueStatus;
type RevenueSort = "newest" | "oldest" | "highest" | "lowest";

type RevenueRecord = {
  id: string;
  customer: string;
  email: string;
  plan: UserPlan;
  amount: number;
  status: RevenueStatus;
  createdAt: string;
  billingStatus: string;
  note: string;
};

const premiumPlanPriceUsd = 29;
const mrrTargetUsd = 1000;

export default function RevenueAnalytics() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RevenueFilter>("all");
  const [sortBy, setSortBy] = useState<RevenueSort>("newest");

  const adminStatsQuery = useQuery({
    queryKey: ["admin-revenue-analytics"],
    enabled: Boolean(isLoaded && isSignedIn),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const token = await getToken({
        skipCache: true,
      });

      return getAdminStats({
        token,
        period: "month",
      });
    },
  });

  const statsResponse = adminStatsQuery.data;
  const overview = statsResponse?.overview;

  const records = useMemo(
    () => mapRevenueRecords(statsResponse),
    [statsResponse],
  );

  const filteredRecords = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    let list = records.filter((record) => {
      const matchesSearch =
        !cleanSearch ||
        record.id.toLowerCase().includes(cleanSearch) ||
        record.customer.toLowerCase().includes(cleanSearch) ||
        record.email.toLowerCase().includes(cleanSearch) ||
        record.billingStatus.toLowerCase().includes(cleanSearch);

      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "highest") return b.amount - a.amount;
      if (sortBy === "lowest") return a.amount - b.amount;

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [records, search, statusFilter, sortBy]);

  const totalUsers = getOverviewNumber(overview, "totalUsers");
  const premiumUsers = getOverviewNumber(overview, "premiumUsers");
  const conversionRate = getOverviewNumber(overview, "conversionRate");
  const estimatedMonthlyRevenueUsd = getOverviewNumber(
    overview,
    "estimatedMonthlyRevenueUsd",
  );
  const estimatedAnnualRevenueUsd = estimatedMonthlyRevenueUsd * 12;
  const freeUsers = Math.max(totalUsers - premiumUsers, 0);
  const targetProgress =
    mrrTargetUsd > 0
      ? Math.min(Math.round((estimatedMonthlyRevenueUsd / mrrTargetUsd) * 100), 100)
      : 0;

  const stats = [
    {
      title: "Estimated MRR",
      value: formatCurrency(estimatedMonthlyRevenueUsd),
      description: "Based on premium user count",
      icon: DollarSign,
      trend: "up" as const,
      trendValue: `${conversionRate}%`,
      trendLabel: "conversion",
      gradient: "from-emerald-400 via-teal-500 to-cyan-500",
      badge: "Revenue",
    },
    {
      title: "Premium Users",
      value: premiumUsers,
      description: "Paid-plan accounts",
      icon: Crown,
      trend: "up" as const,
      trendValue: formatCurrency(premiumPlanPriceUsd),
      trendLabel: "per user",
      gradient: "from-amber-400 via-orange-500 to-fuchsia-600",
      badge: "Plans",
    },
    {
      title: "Annual Run Rate",
      value: formatCurrency(estimatedAnnualRevenueUsd),
      description: "Estimated yearly revenue",
      icon: LineChart,
      trend: "up" as const,
      trendValue: "12x",
      trendLabel: "MRR",
      gradient: "from-violet-600 via-fuchsia-600 to-cyan-500",
      badge: "ARR",
    },
    {
      title: "Free Users",
      value: freeUsers,
      description: "Upgrade opportunity",
      icon: Users,
      trend: "neutral" as const,
      trendValue: `${freeUsers}`,
      trendLabel: "potential",
      gradient: "from-rose-500 via-red-500 to-orange-500",
      badge: "Growth",
    },
  ];

  function handleResetFilters() {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  }

  async function handleExport() {
    if (!records.length) {
      toast.error("No revenue records to export.");
      return;
    }

    const csv = [
      [
        "Record ID",
        "Customer",
        "Email",
        "Plan",
        "Amount",
        "Status",
        "Billing Status",
        "Created At",
        "Note",
      ].join(","),
      ...records.map((record) =>
        [
          record.id,
          record.customer,
          record.email,
          record.plan,
          record.amount,
          record.status,
          record.billingStatus,
          record.createdAt,
          record.note,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    await copyToClipboard(csv);
    toast.success("Revenue CSV copied to clipboard.");
  }

  function handleBillingAction(record: RevenueRecord) {
    toast.info(
      `${record.id} is an estimated billing record. Connect Clerk Billing webhooks before enabling payment actions.`,
    );
  }

  if (adminStatsQuery.isLoading) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[30rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading revenue analytics...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching admin revenue estimates from the backend.
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
          title="Could not load revenue analytics"
          description={getApiErrorMessage(
            adminStatsQuery.error,
            "Revenue analytics could not be loaded.",
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
        eyebrow="Revenue Analytics"
        title="Track subscriptions, estimated MRR, and billing readiness."
        description="This page now reads real admin stats from the backend. Revenue is estimated from premium users until full Clerk Billing webhooks are connected."
        icon={LineChart}
      />

      <AdminStatsGrid stats={stats} />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <RevenueTrendCard
          estimatedMonthlyRevenueUsd={estimatedMonthlyRevenueUsd}
          premiumUsers={premiumUsers}
          conversionRate={conversionRate}
        />

        <RevenueSidePanel
          estimatedMonthlyRevenueUsd={estimatedMonthlyRevenueUsd}
          premiumUsers={premiumUsers}
          totalUsers={totalUsers}
          targetProgress={targetProgress}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card padding="xl" className="relative overflow-hidden">
          <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <Badge
                  variant="success"
                  icon={<WalletCards className="h-3.5 w-3.5" />}
                >
                  Revenue Records
                </Badge>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Estimated customer revenue
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Records are generated from real recent users returned by
                  `/api/admin-stats`. Full invoice records require Clerk Billing
                  webhook data.
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

            <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_13rem_13rem_auto]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user, email, plan, or billing status..."
                leftIcon={<Search className="h-4 w-4" />}
                variant="filled"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as RevenueFilter)
                }
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                <option value="all">All status</option>
                <option value="estimated">Estimated paid</option>
                <option value="free">Free</option>
                <option value="setup-required">Setup required</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as RevenueSort)
                }
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
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
                {filteredRecords.length} result
                {filteredRecords.length === 1 ? "" : "s"}
              </Badge>

              {statusFilter !== "all" && (
                <Badge variant={getRevenueStatusVariant(statusFilter)}>
                  {formatStatusLabel(statusFilter)}
                </Badge>
              )}
            </div>

            <div className="mt-6">
              {filteredRecords.length ? (
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[62rem]">
                      <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                        <tr>
                          <TableHead>Record</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead align="right">Actions</TableHead>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-transparent">
                        {filteredRecords.map((record) => (
                          <RevenueRecordRow
                            key={record.id}
                            record={record}
                            onAction={() => handleBillingAction(record)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  variant="search"
                  title="No revenue records found"
                  description="Try changing the search text, status filter, or sorting option."
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

        <BillingReadinessCard />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <RevenueGoalCard
          estimatedMonthlyRevenueUsd={estimatedMonthlyRevenueUsd}
          targetProgress={targetProgress}
        />
        <PaymentProviderCard />
        <WebhookChecklistCard />
      </section>
    </div>
  );
}

function RevenueTrendCard({
  estimatedMonthlyRevenueUsd,
  premiumUsers,
  conversionRate,
}: {
  estimatedMonthlyRevenueUsd: number;
  premiumUsers: number;
  conversionRate: number;
}) {
  const bars = getRevenueBars(estimatedMonthlyRevenueUsd);

  return (
    <Card padding="xl" className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-[-7rem] top-[-7rem] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <Badge
              variant="success"
              icon={<LineChart className="h-3.5 w-3.5" />}
            >
              Revenue Trend
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Estimated MRR curve
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              This visual is generated from your current estimated monthly
              revenue until real billing timeseries data is connected.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
              Estimated MRR
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
              {formatCurrency(estimatedMonthlyRevenueUsd)}
            </p>
          </div>
        </div>

        <div className="mt-8 flex h-72 items-end gap-3 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
          {bars.map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <div
                className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-500 via-cyan-500 to-violet-500 shadow-lg shadow-emerald-500/10"
                style={{ height: `${height}%` }}
              />
              <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-400">
                W{index + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MiniMetric
            label="Premium users"
            value={formatNumber(premiumUsers)}
            icon={<Crown size={17} />}
          />
          <MiniMetric
            label="Conversion"
            value={`${conversionRate}%`}
            icon={<TrendingUp size={17} />}
          />
          <MiniMetric
            label="Price / user"
            value={formatCurrency(premiumPlanPriceUsd)}
            icon={<DollarSign size={17} />}
          />
        </div>
      </div>
    </Card>
  );
}

function RevenueRecordRow({
  record,
  onAction,
}: {
  record: RevenueRecord;
  onAction: () => void;
}) {
  return (
    <tr className="transition hover:bg-slate-50 dark:hover:bg-white/[0.04]">
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {record.id}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {record.note}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {record.customer}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {record.email}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <Badge
          variant={record.plan === "premium" ? "premium" : "primary"}
          icon={
            record.plan === "premium" ? (
              <Crown className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )
          }
        >
          {record.plan}
        </Badge>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-black text-slate-950 dark:text-white">
          {formatCurrency(record.amount)}
        </p>
      </td>

      <td className="px-5 py-4">
        <RevenueStatusBadge status={record.status} />
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {formatDate(record.createdAt)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatRelativeTime(record.createdAt)}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onAction}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:text-violet-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-violet-300"
            title="View billing note"
            aria-label="View billing note"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function RevenueSidePanel({
  estimatedMonthlyRevenueUsd,
  premiumUsers,
  totalUsers,
  targetProgress,
}: {
  estimatedMonthlyRevenueUsd: number;
  premiumUsers: number;
  totalUsers: number;
  targetProgress: number;
}) {
  const targets = [
    {
      label: "MRR Target",
      value: formatCurrency(mrrTargetUsd),
      current: formatCurrency(estimatedMonthlyRevenueUsd),
      percentage: targetProgress,
      trend: "up",
    },
    {
      label: "Premium Users",
      value: "50",
      current: formatNumber(premiumUsers),
      percentage: Math.min(Math.round((premiumUsers / 50) * 100), 100),
      trend: "up",
    },
    {
      label: "Total Users",
      value: "250",
      current: formatNumber(totalUsers),
      percentage: Math.min(Math.round((totalUsers / 250) * 100), 100),
      trend: "up",
    },
  ];

  return (
    <div className="space-y-6">
      <Card padding="xl" className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative">
          <Badge variant="premium" icon={<Gem className="h-3.5 w-3.5" />}>
            Targets
          </Badge>

          <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
            Monthly goals
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Track estimated revenue and premium conversion goals.
          </p>

          <div className="mt-6 space-y-4">
            {targets.map((target) => (
              <TargetRow key={target.label} target={target} />
            ))}
          </div>
        </div>
      </Card>

      <Card padding="xl">
        <Badge
          variant="success"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        >
          Revenue Insights
        </Badge>

        <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
          Business snapshot
        </h2>

        <div className="mt-6 grid gap-3">
          {[
            "Revenue is currently estimated from premium user count.",
            "Connect Clerk Billing webhooks to replace estimates with invoices.",
            "Premium image tools will likely be the strongest upgrade driver.",
            "Keep upgrade CTAs visible near free usage limits.",
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

function BillingReadinessCard() {
  return (
    <Card padding="xl">
      <Badge variant="primary" icon={<CreditCard className="h-3.5 w-3.5" />}>
        Billing Readiness
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Setup checklist
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Complete these before calling revenue production-ready.
      </p>

      <div className="mt-6 space-y-3">
        <ChecklistRow
          done={false}
          label="Add real Clerk Billing checkout URL"
        />
        <ChecklistRow
          done={false}
          label="Add real Clerk Billing portal URL"
        />
        <ChecklistRow
          done={false}
          label="Handle billing webhooks into Neon"
        />
        <ChecklistRow
          done
          label="Protect admin endpoint with requireAdmin"
        />
        <ChecklistRow
          done
          label="Estimate MRR from premium users"
        />
      </div>
    </Card>
  );
}

function TargetRow({
  target,
}: {
  target: {
    label: string;
    value: string;
    current: string;
    percentage: number;
    trend: string;
  };
}) {
  const isUp = target.trend === "up";

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {target.label}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {target.current} / {target.value}
          </p>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black",
            isUp
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
          )}
        >
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {target.percentage}%
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            isUp
              ? "from-emerald-400 to-cyan-500"
              : "from-rose-500 to-orange-500",
          )}
          style={{ width: `${Math.min(target.percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RevenueGoalCard({
  estimatedMonthlyRevenueUsd,
  targetProgress,
}: {
  estimatedMonthlyRevenueUsd: number;
  targetProgress: number;
}) {
  return (
    <Card padding="xl">
      <Badge variant="success" icon={<LineChart className="h-3.5 w-3.5" />}>
        Growth Plan
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Revenue roadmap
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Current estimated MRR is{" "}
        <span className="font-black text-slate-950 dark:text-white">
          {formatCurrency(estimatedMonthlyRevenueUsd)}
        </span>
        , which is {targetProgress}% of the current target.
      </p>

      <div className="mt-6 space-y-3">
        {[
          "Protect image tools behind premium access",
          "Show upgrade CTAs after free users hit limits",
          "Use resume review as a premium feature",
          "Send billing reminders after webhook support is added",
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

function PaymentProviderCard() {
  return (
    <Card padding="xl">
      <Badge variant="primary" icon={<CreditCard className="h-3.5 w-3.5" />}>
        Provider Setup
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Clerk Billing pending
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Checkout and portal functions already exist. Add real Clerk Billing URLs
        to move from estimated revenue to live billing.
      </p>

      <Button
        variant="secondary"
        fullWidth
        rightIcon={<ArrowRight size={17} />}
        onClick={() =>
          toast.info("Add CLERK_BILLING_CHECKOUT_URL and CLERK_BILLING_PORTAL_URL in .env.local.")
        }
        className="mt-6"
      >
        View Setup Note
      </Button>
    </Card>
  );
}

function WebhookChecklistCard() {
  return (
    <Card padding="xl">
      <Badge variant="premium" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        Webhooks
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Events to handle
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        These billing events should update Neon user plan and billing status.
      </p>

      <div className="mt-6 space-y-3">
        {[
          "subscription.created",
          "subscription.updated",
          "subscription.cancelled",
          "invoice.paid",
          "invoice.payment_failed",
        ].map((eventName) => (
          <div
            key={eventName}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
          >
            {eventName}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
      <CheckCircle2
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          done ? "text-emerald-500" : "text-slate-400",
        )}
      />
      {label}
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
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
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

function RevenueStatusBadge({ status }: { status: RevenueStatus }) {
  return (
    <Badge variant={getRevenueStatusVariant(status)}>
      {formatStatusLabel(status)}
    </Badge>
  );
}

function getRevenueStatusVariant(status: RevenueStatus) {
  if (status === "estimated") return "success";
  if (status === "setup-required") return "warning";

  return "muted";
}

function formatStatusLabel(status: RevenueStatus) {
  if (status === "setup-required") return "Setup Required";
  if (status === "estimated") return "Estimated Paid";

  return "Free";
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
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

function mapRevenueRecords(
  stats: AdminStatsResponse | undefined,
): RevenueRecord[] {
  if (!stats) return [];

  return stats.recent.users.map((record, index) => {
    const id = getRecordString(record, "id");
    const email = getRecordString(record, "email");
    const name = getRecordString(record, "name") || getNameFromEmail(email);
    const plan = getRecordPlan(record);
    const billingStatus = getRecordString(record, "billingStatus") || "free";
    const createdAt =
      getRecordString(record, "createdAt") || new Date().toISOString();

    const isPremium = plan === "premium";
    const status: RevenueStatus = isPremium
      ? billingStatus === "active" || billingStatus === "trialing"
        ? "estimated"
        : "setup-required"
      : "free";

    return {
      id: `REV-${String(index + 1).padStart(4, "0")}-${id.slice(0, 6) || "USER"}`,
      customer: name,
      email: email || "No email available",
      plan,
      amount: status === "estimated" ? premiumPlanPriceUsd : 0,
      status,
      createdAt,
      billingStatus,
      note:
        status === "estimated"
          ? "Estimated premium revenue"
          : status === "setup-required"
            ? "Premium plan needs billing verification"
            : "Free plan account",
    };
  });
}

function getRevenueBars(estimatedMonthlyRevenueUsd: number): number[] {
  if (estimatedMonthlyRevenueUsd <= 0) {
    return [8, 10, 12, 14, 16, 18, 20, 22];
  }

  const maxValue = Math.max(estimatedMonthlyRevenueUsd, 1);

  return Array.from({ length: 8 }, (_, index) => {
    const growthRatio = (index + 1) / 8;
    const value = Math.max(maxValue * growthRatio, 1);

    return Math.min(Math.max(Math.round((value / maxValue) * 88), 12), 96);
  });
}

function getRecordString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === "string" ? value : "";
}

function getRecordPlan(record: Record<string, unknown>): UserPlan {
  return getRecordString(record, "plan") === "premium" ? "premium" : "free";
}

function getNameFromEmail(email: string): string {
  if (!email) return "Unknown User";

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOverviewNumber(
  overview: AdminStatsResponse["overview"] | undefined,
  key: string,
): number {
  const value = overview?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}