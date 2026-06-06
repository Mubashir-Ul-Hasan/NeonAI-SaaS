import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Crown,
  FileText,
  ImageIcon,
  Layers3,
  Loader2,
  PenLine,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  DashboardPlanBadge,
  PlanSummaryCard,
  PremiumToolPreview,
  UpgradeStrip,
  UsageMeter,
} from "../../components/dashboard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/Loader";
import {
  getCreationPreview,
  getCreationTitle,
  useRecentCreations,
} from "../../hooks/useCreations";
import {
  getBillingStatusLabel,
  getPlanLabel,
  getRemainingUsageText,
  getUsagePercentage,
  getUserSummaryErrorMessage,
  useUserDisplayName,
  useUserSummary,
} from "../../hooks/useUserSummary";
import type { PublicCreation, ToolType, UserPlan } from "../../lib/api";
import { ROUTES, toolCards } from "../../lib/routes";
import {
  cn,
  formatDate,
  formatRelativeTime,
  getGreeting,
  getInitials,
  getToolGradient,
  getToolLabel,
  truncateText,
} from "../../lib/utils";


export default function DashboardHome() {
  const navigate = useNavigate();

  const userSummaryQuery = useUserSummary();
  const recentCreationsQuery = useRecentCreations(5);
  const userDisplay = useUserDisplayName();

  const summary = userSummaryQuery.data;
  const recentCreations = recentCreationsQuery.data?.creations ?? [];

  const plan = summary?.plan.current ?? "free";
  const totalUsed = summary?.usage.usedThisMonth ?? 0;
  const usageLimit = summary?.usage.limit ?? 0;
  const usagePercentage = getUsagePercentage(summary);
  const remainingUsageText = getRemainingUsageText(summary);

  const usageRecord = useMemo(() => {
    const usage: Record<ToolType, number> = {
      article: 0,
      "blog-title": 0,
      image: 0,
      "background-removal": 0,
      "object-removal": 0,
      "resume-review": 0,
    };

    for (const item of summary?.usageByTool ?? []) {
      usage[item.toolType] = item.count;
    }

    return usage;
  }, [summary?.usageByTool]);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Total Creations",
        value: String(summary?.creations.total ?? 0),
        description: "Saved AI outputs",
        icon: Layers3,
        gradient: "from-violet-600 to-fuchsia-500",
      },
      {
        label: "Monthly Usage",
        value: `${totalUsed}/${usageLimit || "∞"}`,
        description: remainingUsageText,
        icon: FileText,
        gradient: "from-blue-500 to-cyan-400",
      },
      {
        label: "Premium Tools",
        value: plan === "premium" ? "Unlocked" : "Locked",
        description:
          plan === "premium" ? "Premium access active" : "Upgrade to unlock",
        icon: Crown,
        gradient: "from-amber-400 to-orange-500",
      },
      {
        label: "Completed",
        value: String(summary?.creations.counts.completed ?? 0),
        description: "Successful creations",
        icon: TrendingUp,
        gradient: "from-emerald-400 to-teal-500",
      },
    ],
    [
      plan,
      remainingUsageText,
      summary?.creations.counts.completed,
      summary?.creations.total,
      totalUsed,
      usageLimit,
    ],
  );

  function handleOpenCreation(creation: PublicCreation) {
    navigate(`${ROUTES.creations}/${creation.id}`);
  }

  if (userSummaryQuery.isLoading) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[32rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading your dashboard...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching your account, usage, and creation summary.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (userSummaryQuery.isError) {
    return (
      <Card padding="xl">
        <EmptyState
          variant="history"
          title="Could not load dashboard"
          description={getUserSummaryErrorMessage(userSummaryQuery.error)}
          primaryAction={{
            label: "Try Again",
            onClick: () => userSummaryQuery.refetch(),
            variant: "primary",
            icon: <RefreshCw size={17} />,
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <WelcomeSection
        displayName={userDisplay.name}
        plan={plan}
        usagePercentage={usagePercentage}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AccountOverviewCard
          displayName={userDisplay.name}
          email={userDisplay.email || summary?.user.email || "No email found"}
          imageUrl={userDisplay.imageUrl ?? undefined}
          plan={plan}
          role={summary?.user.role ?? "user"}
          billingStatus={summary?.plan.billingStatus ?? "free"}
          joinedAt={
            summary?.account.createdAt
              ? formatDate(summary.account.createdAt)
              : "Recently"
          }
        />

        <PlanSummaryCard plan={plan} totalUsed={totalUsed} />
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <DashboardStatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <QuickToolsSection plan={plan} />

        <UsageMeter plan={plan} usage={usageRecord} compact />
      </section>

      <UpgradeStrip plan={plan} />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <RecentCreationsSection
          creations={recentCreations}
          isLoading={recentCreationsQuery.isLoading}
          isError={recentCreationsQuery.isError}
          onOpenCreation={handleOpenCreation}
          onRetry={() => recentCreationsQuery.refetch()}
        />

        <RightColumn plan={plan} />
      </section>
    </div>
  );
}

function WelcomeSection({
  displayName,
  plan,
  usagePercentage,
}: {
  displayName: string;
  plan: UserPlan;
  usagePercentage: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10 lg:p-8">
      <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Badge
            variant="premium"
            icon={<Sparkles className="h-3.5 w-3.5" />}
          >
            {getGreeting()}, {displayName}
          </Badge>

          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Your AI creator workspace is ready.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Choose a tool, generate content, save your creations, and manage
            your usage from one backend-connected dashboard.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to={ROUTES.writeArticle}>
              <Button
                size="lg"
                rightIcon={<ArrowRight size={18} />}
                className="w-full sm:w-auto"
              >
                Start Writing
              </Button>
            </Link>

            <Link to={ROUTES.creations}>
              <Button
                size="lg"
                variant="secondary"
                leftIcon={<Layers3 size={18} />}
                className="w-full border-white/10 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
              >
                View History
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center justify-between gap-5">
            <div>
              <p className="text-sm font-bold text-slate-300">Current Plan</p>
              <p className="mt-1 text-3xl font-black">
                {getPlanLabel(plan)}
              </p>
            </div>

            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-amber-300">
              {plan === "premium" ? <Crown size={28} /> : <Zap size={28} />}
            </div>
          </div>

          <div className="mt-5">
            <ProgressBar
              value={usagePercentage}
              label="Monthly usage"
              className="[&_*]:text-white"
            />
          </div>

          <Link to={ROUTES.billing} className="mt-5 block">
            <Button
              variant={plan === "premium" ? "secondary" : "premium"}
              fullWidth
              rightIcon={<ArrowRight size={17} />}
              className={
                plan === "premium"
                  ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
                  : undefined
              }
            >
              {plan === "premium" ? "Manage Plan" : "Upgrade"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function AccountOverviewCard({
  displayName,
  email,
  imageUrl,
  plan,
  role,
  billingStatus,
  joinedAt,
}: {
  displayName: string;
  email: string;
  imageUrl?: string;
  plan: UserPlan;
  role: string;
  billingStatus: string;
  joinedAt: string;
}) {
  return (
    <Card className="relative overflow-hidden" padding="xl">
      <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={displayName}
                className="h-18 w-18 rounded-[1.5rem] object-cover shadow-xl shadow-slate-950/10"
              />
            ) : (
              <div className="grid h-18 w-18 place-items-center rounded-[1.5rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-xl font-black text-white shadow-xl shadow-violet-500/20">
                {getInitials(displayName) || <UserRound size={28} />}
              </div>
            )}

            <div>
              <DashboardPlanBadge plan={plan} />

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                {displayName}
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {email}
              </p>
            </div>
          </div>

          <Link to={ROUTES.settings}>
            <Button variant="secondary" rightIcon={<ArrowRight size={17} />}>
              Account Settings
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <InfoTile
            icon={ShieldCheck}
            label="Role"
            value={capitalize(role)}
            description="Account permission"
          />

          <InfoTile
            icon={CalendarClock}
            label="Joined"
            value={joinedAt}
            description="Account created"
          />

          <InfoTile
            icon={BadgeCheck}
            label="Billing"
            value={getBillingStatusLabel(billingStatus)}
            description="Subscription status"
          />
        </div>
      </div>
    </Card>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Icon size={18} />
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

      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DashboardStatCard({
  stat,
}: {
  stat: {
    label: string;
    value: string;
    description: string;
    icon: LucideIcon;
    gradient: string;
  };
}) {
  const Icon = stat.icon;

  return (
    <Card hover>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {stat.label}
          </p>

          <p className="mt-4 truncate text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {stat.value}
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {stat.description}
          </p>
        </div>

        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            stat.gradient,
          )}
        >
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

function QuickToolsSection({ plan }: { plan: UserPlan }) {
  return (
    <Card padding="xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Badge
            variant="primary"
            icon={<WandSparkles className="h-3.5 w-3.5" />}
          >
            Quick Access
          </Badge>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Choose an AI tool
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Jump directly into writing tools or premium AI features.
          </p>
        </div>

        <Link to={ROUTES.creations}>
          <Button variant="secondary" rightIcon={<ArrowRight size={17} />}>
            View All History
          </Button>
        </Link>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {toolCards.map((tool) => {
          const Icon = tool.icon;
          const locked = tool.badge === "Premium" && plan !== "premium";

          return (
            <Link
              key={tool.title}
              to={tool.href}
              className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                  tool.gradient,
                )}
              />

              <div className="flex items-start justify-between gap-4">
                <div
                  className={cn(
                    "grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-105",
                    tool.gradient,
                  )}
                >
                  <Icon size={22} />
                </div>

                <Badge
                  variant={
                    locked
                      ? "warning"
                      : tool.badge === "Premium"
                        ? "premium"
                        : "success"
                  }
                  icon={
                    locked ? (
                      <Crown className="h-3.5 w-3.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {locked ? "Locked" : tool.badge}
                </Badge>
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">
                {tool.title}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {tool.shortDescription}
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">
                Open tool
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function RecentCreationsSection({
  creations,
  isLoading,
  isError,
  onOpenCreation,
  onRetry,
}: {
  creations: PublicCreation[];
  isLoading: boolean;
  isError: boolean;
  onOpenCreation: (creation: PublicCreation) => void;
  onRetry: () => void;
}) {
  return (
    <Card padding="xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Badge
            variant="primary"
            icon={<Layers3 className="h-3.5 w-3.5" />}
          >
            Recent Activity
          </Badge>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Latest creations
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your newest saved outputs loaded from Neon.
          </p>
        </div>

        <Link to={ROUTES.creations}>
          <Button variant="secondary" rightIcon={<ArrowRight size={17} />}>
            Open History
          </Button>
        </Link>
      </div>

      <div className="mt-7 space-y-3">
        {isLoading ? (
          <div className="grid min-h-[14rem] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600 dark:text-violet-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Loading recent creations...
              </p>
            </div>
          </div>
        ) : isError ? (
          <EmptyState
            variant="history"
            title="Could not load recent creations"
            description="Try refreshing this section."
            size="sm"
            primaryAction={{
              label: "Retry",
              onClick: onRetry,
              variant: "secondary",
              icon: <RefreshCw size={16} />,
            }}
          />
        ) : creations.length ? (
          creations.map((creation) => (
            <RecentCreationItem
              key={creation.id}
              creation={creation}
              onOpen={() => onOpenCreation(creation)}
            />
          ))
        ) : (
          <EmptyState
            variant="history"
            title="No creations yet"
            description="Generate an article or blog title, then your recent work will appear here."
            size="sm"
            primaryAction={{
              label: "Create Article",
              onClick: () => undefined,
              variant: "primary",
              icon: <PenLine size={16} />,
            }}
          />
        )}
      </div>
    </Card>
  );
}

function RecentCreationItem({
  creation,
  onOpen,
}: {
  creation: PublicCreation;
  onOpen: () => void;
}) {
  const isImage = Boolean(creation.resultImageUrl);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            getToolGradient(creation.toolType),
          )}
        >
          {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-slate-950 dark:text-white">
              {getCreationTitle(creation)}
            </p>

            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
              {getToolLabel(creation.toolType)}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
            {truncateText(getCreationPreview(creation), 130)}
          </p>

          <p className="mt-2 text-xs font-bold text-slate-400">
            {formatRelativeTime(creation.createdAt)}
          </p>
        </div>

        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </button>
  );
}

function RightColumn({ plan }: { plan: UserPlan }) {
  return (
    <div className="space-y-6">
      <Card padding="xl">
        <Badge variant="premium" icon={<Crown className="h-3.5 w-3.5" />}>
          Premium Preview
        </Badge>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
          Advanced tools
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Premium users unlock image generation, background removal, object
          removal, and resume review.
        </p>

        <div className="mt-6 grid gap-4">
          <PremiumToolPreview toolType="image" />

          {plan === "free" && (
            <Link to={ROUTES.billing}>
              <Button
                variant="premium"
                fullWidth
                rightIcon={<ArrowRight size={17} />}
              >
                Unlock Premium
              </Button>
            </Link>
          )}
        </div>
      </Card>

      <Card padding="xl">
        <Badge variant="success" icon={<PenLine className="h-3.5 w-3.5" />}>
          Recommended
        </Badge>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
          Start with an article
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          The article writer is already connected to Gemini, Neon, usage
          tracking, and creation history.
        </p>

        <Link to={ROUTES.writeArticle} className="mt-6 block">
          <Button fullWidth rightIcon={<ArrowRight size={17} />}>
            Generate Article
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}