import { useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Crown,
  Download,
  FileText,
  Gem,
  LockKeyhole,
  Loader2,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  DashboardPlanBadge,
  PlanFeatureList,
  PremiumBenefits,
  UsageLimitBadge,
} from "../../components/dashboard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/Loader";
import {
  PLAN_DESCRIPTIONS,
  PLAN_NAMES,
  PRICING_PLANS,
} from "../../lib/constants";
import { ROUTES } from "../../lib/routes";
import {
  cn,
  formatDate,
  formatNumber,
} from "../../lib/utils";
import {
  getBillingStatusLabel,
  getPlanLabel,
  getRemainingUsageText,
  getUsagePercentage,
  getUserSummaryErrorMessage,
  useCreateBillingPortal,
  useCreateCheckout,
  useRefreshUserSummary,
  useUserSummary,
} from "../../hooks/useUserSummary";
import type { ToolType, UserPlan } from "../../lib/api";

const toolOrder: ToolType[] = [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
];

export default function Billing() {
  const summaryQuery = useUserSummary();
  const refreshUserSummary = useRefreshUserSummary();

  const createCheckoutMutation = useCreateCheckout();
  const createBillingPortalMutation = useCreateBillingPortal();

  const summary = summaryQuery.data;

  const plan = summary?.plan.current ?? "free";
  const billingStatus = summary?.plan.billingStatus ?? "free";
  const totalUsed = summary?.usage.usedThisMonth ?? 0;
  const totalLimit = summary?.usage.limit ?? 0;
  const usagePercentage = getUsagePercentage(summary);
  const remainingUsageText = getRemainingUsageText(summary);

  const usageByTool = useMemo(() => {
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

  const billingStats = useMemo(
    () => [
      {
        label: "Current Plan",
        value: getPlanLabel(plan),
        description:
          plan === "premium" ? "Premium access active" : "Upgrade anytime",
        icon: Crown,
        gradient: "from-amber-400 to-orange-500",
      },
      {
        label: "Monthly Usage",
        value: `${formatNumber(totalUsed)}/${formatNumber(totalLimit)}`,
        description: remainingUsageText,
        icon: Zap,
        gradient: "from-violet-600 to-fuchsia-500",
      },
      {
        label: "Premium Tools",
        value: plan === "premium" ? "Unlocked" : "Locked",
        description:
          plan === "premium" ? "All premium tools available" : "Locked on free plan",
        icon: LockKeyhole,
        gradient: "from-rose-500 to-fuchsia-600",
      },
      {
        label: "Billing Status",
        value: getBillingStatusLabel(billingStatus),
        description: "From backend user record",
        icon: CreditCard,
        gradient: "from-cyan-500 to-emerald-400",
      },
    ],
    [billingStatus, plan, remainingUsageText, totalLimit, totalUsed],
  );

  function handleUpgrade() {
    createCheckoutMutation.mutate(
      {
        planId: "premium",
        returnUrl: `${window.location.origin}${ROUTES.billing}`,
      },
      {
        onSuccess: (checkout) => {
          if (checkout.setupRequired) {
            toast.warning(checkout.message);
            return;
          }

          window.location.href = checkout.checkoutUrl;
        },
        onError: (error) => {
          toast.error(error.message || "Could not create checkout session.");
        },
      },
    );
  }

  function handleManageBilling() {
    createBillingPortalMutation.mutate(
      {
        returnUrl: `${window.location.origin}${ROUTES.billing}`,
      },
      {
        onSuccess: (portal) => {
          if (portal.setupRequired) {
            toast.warning(portal.message);
            return;
          }

          window.location.href = portal.portalUrl;
        },
        onError: (error) => {
          toast.error(error.message || "Could not open billing portal.");
        },
      },
    );
  }

  function handleDownloadInvoice() {
    toast.info("Invoice downloads will be available after billing is fully connected.");
  }

  async function handleRefresh() {
    await refreshUserSummary();
    toast.success("Billing summary refreshed.");
  }

  if (summaryQuery.isLoading) {
    return (
      <Card padding="xl">
        <div className="grid min-h-[30rem] place-items-center">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Loading billing...
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fetching your plan, usage, and billing status.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (summaryQuery.isError) {
    return (
      <Card padding="xl">
        <EmptyState
          variant="history"
          title="Could not load billing"
          description={getUserSummaryErrorMessage(summaryQuery.error)}
          primaryAction={{
            label: "Try Again",
            onClick: () => summaryQuery.refetch(),
            variant: "primary",
            icon: <RefreshCw size={17} />,
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10">
        <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge variant="premium" icon={<Gem className="h-3.5 w-3.5" />}>
              Billing & Subscription
            </Badge>

            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
              Manage your plan, usage, and premium access.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Your plan and usage are loaded from the backend. Checkout and
              customer portal links are handled by Netlify Functions.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {plan === "premium" ? (
                <Button
                  size="lg"
                  variant="secondary"
                  leftIcon={
                    createBillingPortalMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard size={18} />
                    )
                  }
                  onClick={handleManageBilling}
                  disabled={createBillingPortalMutation.isPending}
                  className="w-full border-white/10 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
                >
                  Manage Billing
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="premium"
                  rightIcon={
                    createCheckoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight size={18} />
                    )
                  }
                  onClick={handleUpgrade}
                  disabled={createCheckoutMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Upgrade to Premium
                </Button>
              )}

              <Link to={ROUTES.dashboard}>
                <Button
                  size="lg"
                  variant="secondary"
                  rightIcon={<ArrowRight size={18} />}
                  className="w-full border-white/10 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
                >
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-slate-300">Active Plan</p>

                <p className="mt-2 text-4xl font-black capitalize">
                  {PLAN_NAMES[plan]}
                </p>

                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400">
                  {PLAN_DESCRIPTIONS[plan]}
                </p>
              </div>

              <div className="grid h-16 w-16 place-items-center rounded-[1.5rem] bg-white/10 text-amber-300">
                {plan === "premium" ? <Crown size={32} /> : <Sparkles size={32} />}
              </div>
            </div>

            <div className="mt-6">
              <ProgressBar
                value={usagePercentage}
                label="Monthly usage"
                className="[&_*]:text-white"
              />

              <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-300">
                <span>{formatNumber(totalUsed)} used</span>
                <span>{formatNumber(totalLimit)} limit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {billingStats.map((stat) => (
          <BillingStatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <Card padding="xl" className="relative overflow-hidden">
            <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <Badge
                    variant={plan === "premium" ? "premium" : "primary"}
                    icon={
                      plan === "premium" ? (
                        <Crown className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    Current Plan
                  </Badge>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    {PLAN_NAMES[plan]} Plan
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {PLAN_DESCRIPTIONS[plan]}
                  </p>
                </div>

                <DashboardPlanBadge plan={plan} size="lg" />
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                  <h3 className="text-xl font-black text-slate-950 dark:text-white">
                    Plan Features
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    These features define the current access level for this account.
                  </p>

                  <PlanFeatureList plan={plan} className="mt-5" />
                </div>

                <div
                  className={cn(
                    "relative overflow-hidden rounded-[2rem] border p-5",
                    plan === "premium"
                      ? "border-amber-400/25 bg-slate-950 text-white"
                      : "border-violet-400/20 bg-violet-500/10 text-slate-950 dark:text-white",
                  )}
                >
                  {plan === "premium" && (
                    <>
                      <div className="pointer-events-none absolute left-[-5rem] top-[-5rem] h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
                      <div className="pointer-events-none absolute bottom-[-5rem] right-[-5rem] h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
                    </>
                  )}

                  <div className="relative">
                    <div
                      className={cn(
                        "grid h-16 w-16 place-items-center rounded-[1.5rem]",
                        plan === "premium"
                          ? "bg-white/10 text-amber-300"
                          : "bg-white text-violet-600 dark:bg-white/10 dark:text-violet-300",
                      )}
                    >
                      {plan === "premium" ? <Crown size={28} /> : <Zap size={28} />}
                    </div>

                    <h3 className="mt-5 text-2xl font-black">
                      {plan === "premium" ? "Premium active" : "Ready to upgrade?"}
                    </h3>

                    <p
                      className={cn(
                        "mt-2 text-sm leading-6",
                        plan === "premium"
                          ? "text-slate-300"
                          : "text-slate-600 dark:text-slate-300",
                      )}
                    >
                      {plan === "premium"
                        ? "You have access to all premium AI tools, higher limits, and full creation history."
                        : "Unlock image generation, background removal, object removal, resume review, and higher monthly limits."}
                    </p>

                    <Button
                      variant={plan === "premium" ? "secondary" : "premium"}
                      fullWidth
                      rightIcon={
                        createCheckoutMutation.isPending ||
                        createBillingPortalMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight size={17} />
                        )
                      }
                      onClick={plan === "premium" ? handleManageBilling : handleUpgrade}
                      disabled={
                        createCheckoutMutation.isPending ||
                        createBillingPortalMutation.isPending
                      }
                      className={cn(
                        "mt-6",
                        plan === "premium" &&
                          "border-white/10 bg-white/10 text-white hover:bg-white/15",
                      )}
                    >
                      {plan === "premium" ? "Manage Subscription" : "Upgrade Now"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <PricingComparison
            activePlan={plan}
            onUpgrade={handleUpgrade}
            onManageBilling={handleManageBilling}
            loading={
              createCheckoutMutation.isPending ||
              createBillingPortalMutation.isPending
            }
          />
        </section>

        <aside className="space-y-6">
          <PaymentMethodCard
            plan={plan}
            onManageBilling={handleManageBilling}
            loading={createBillingPortalMutation.isPending}
          />

          <UsageBreakdownCard plan={plan} usageByTool={usageByTool} />

          <InvoiceHistoryCard onDownloadInvoice={handleDownloadInvoice} />
        </aside>
      </div>

      {plan === "free" && <PremiumBenefits />}

      <Card padding="xl" className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge
              variant="success"
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
            >
              Backend billing functions connected
            </Badge>

            <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
              Checkout and portal are ready for real Clerk Billing URLs
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              The frontend now calls your backend billing endpoints. If
              CLERK_BILLING_CHECKOUT_URL or CLERK_BILLING_PORTAL_URL is empty,
              the backend safely returns a setup-required response instead of
              faking payment success.
            </p>
          </div>

          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={17} />}
            onClick={handleRefresh}
          >
            Refresh Billing
          </Button>
        </div>
      </Card>
    </div>
  );
}

function BillingStatCard({
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
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {stat.label}
          </p>

          <p className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {stat.value}
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {stat.description}
          </p>
        </div>

        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            stat.gradient,
          )}
        >
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

function PricingComparison({
  activePlan,
  onUpgrade,
  onManageBilling,
  loading,
}: {
  activePlan: UserPlan;
  onUpgrade: () => void;
  onManageBilling: () => void;
  loading: boolean;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      {PRICING_PLANS.map((plan) => {
        const planId = plan.id as UserPlan;
        const isPremium = planId === "premium";
        const isActive = activePlan === planId;

        return (
          <Card
            key={plan.id}
            padding="xl"
            className={cn(
              "relative overflow-hidden",
              isPremium && "border-amber-400/25",
              isActive && "ring-4 ring-violet-500/15",
            )}
          >
            {isPremium && (
              <>
                <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
                <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
              </>
            )}

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    variant={isPremium ? "premium" : "primary"}
                    icon={
                      isPremium ? (
                        <Crown className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {isActive ? "Active Plan" : plan.badge}
                  </Badge>

                  <h3 className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {plan.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "grid h-14 w-14 shrink-0 place-items-center rounded-3xl",
                    isPremium
                      ? "bg-amber-400/15 text-amber-600 dark:text-amber-300"
                      : "bg-violet-500/10 text-violet-600 dark:text-violet-300",
                  )}
                >
                  {isPremium ? <Crown size={25} /> : <WandSparkles size={25} />}
                </div>
              </div>

              <div className="mt-7 flex items-end gap-2">
                <p className="text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                  {plan.price}
                </p>

                <p className="pb-2 text-sm font-black text-slate-500 dark:text-slate-400">
                  {plan.priceSuffix}
                </p>
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-sm font-black text-slate-950 dark:text-white">
                  Included
                </p>

                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 grid gap-2">
                {plan.limits.map((limit) => (
                  <div
                    key={limit}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                  >
                    {isPremium ? (
                      <Crown className="h-4 w-4 text-amber-500" />
                    ) : (
                      <LockKeyhole className="h-4 w-4 text-violet-500" />
                    )}
                    {limit}
                  </div>
                ))}
              </div>

              <Button
                fullWidth
                size="lg"
                variant={
                  isActive ? "secondary" : isPremium ? "premium" : "primary"
                }
                rightIcon={
                  loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight size={18} />
                  )
                }
                onClick={
                  isActive
                    ? isPremium
                      ? onManageBilling
                      : () => toast.info("You are already on the Free plan.")
                    : isPremium
                      ? onUpgrade
                      : () => toast.info("Free plan is already available.")
                }
                disabled={loading}
                className="mt-7"
              >
                {isActive
                  ? isPremium
                    ? "Manage Plan"
                    : "Current Plan"
                  : isPremium
                    ? "Upgrade to Premium"
                    : "Start Free"}
              </Button>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

function PaymentMethodCard({
  plan,
  onManageBilling,
  loading,
}: {
  plan: UserPlan;
  onManageBilling: () => void;
  loading: boolean;
}) {
  return (
    <Card padding="xl">
      <Badge variant="primary" icon={<CreditCard className="h-3.5 w-3.5" />}>
        Payment Method
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Card payments
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Payment methods are managed by your billing provider through the
        customer portal.
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <Banknote size={22} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-950 dark:text-white">
              {plan === "premium"
                ? "Payment method active"
                : "No payment method yet"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {plan === "premium"
                ? "Use the billing portal to manage cards, invoices, and subscription changes."
                : "Users add card details during premium checkout."}
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        fullWidth
        rightIcon={
          loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={17} />
        }
        onClick={onManageBilling}
        disabled={loading}
        className="mt-5"
      >
        Open Billing Portal
      </Button>
    </Card>
  );
}

function UsageBreakdownCard({
  plan,
  usageByTool,
}: {
  plan: UserPlan;
  usageByTool: Record<ToolType, number>;
}) {
  return (
    <Card padding="xl">
      <Badge variant="success" icon={<Zap className="h-3.5 w-3.5" />}>
        Usage Limits
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Tool usage
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        These counts are loaded from backend usage logs.
      </p>

      <div className="mt-6 space-y-3">
        {toolOrder.map((toolType) => (
          <UsageLimitBadge
            key={toolType}
            toolType={toolType}
            plan={plan}
            used={usageByTool[toolType]}
          />
        ))}
      </div>
    </Card>
  );
}

function InvoiceHistoryCard({
  onDownloadInvoice,
}: {
  onDownloadInvoice: () => void;
}) {
  return (
    <Card padding="xl">
      <Badge variant="muted" icon={<ReceiptText className="h-3.5 w-3.5" />}>
        Invoices
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
        Billing history
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Real invoices will be available through the billing portal after Clerk
        Billing is connected.
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <FileText size={20} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-950 dark:text-white">
              No invoices from backend yet
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <CalendarClock size={13} />
              {formatDate(new Date().toISOString())}
              <span>•</span>
              Billing portal pending
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download size={15} />}
          onClick={onDownloadInvoice}
          className="mt-4"
        >
          Download Invoice
        </Button>
      </div>
    </Card>
  );
}