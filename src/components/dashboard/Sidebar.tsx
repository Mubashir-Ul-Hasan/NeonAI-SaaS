import { Link, NavLink } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  Crown,
  LayoutDashboard,
  LogIn,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import {
  dashboardBottomNavItems,
  dashboardNavItems,
  ROUTES,
} from "../../lib/routes";
import { APP_NAME } from "../../lib/constants";
import {
  cn,
  getInitials,
  getPlanLabel,
  type UserPlan,
} from "../../lib/utils";
import { Badge, PlanBadge } from "../ui/Badge";
import { Button } from "../ui/Button";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  plan?: UserPlan;
  className?: string;
};

export function Sidebar({
  open = false,
  onClose,
  plan = "free",
  className,
}: SidebarProps) {
  const { user, isSignedIn } = useUser();

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Demo User";

  const email = user?.primaryEmailAddress?.emailAddress || "demo@quickai.app";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-slate-200 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-950/90 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        <SidebarHeader onClose={onClose} />

        <UserPanel
          displayName={displayName}
          email={email}
          imageUrl={user?.imageUrl}
          isSignedIn={Boolean(isSignedIn)}
          plan={plan}
        />

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {dashboardNavItems.map((item) => (
              <SidebarNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                description={item.description}
                icon={item.icon}
                isPremium={item.isPremium}
                onClick={onClose}
              />
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
            <p className="mb-3 px-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Account
            </p>

            <div className="space-y-2">
              {dashboardBottomNavItems.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        </div>

        <UpgradeCard plan={plan} />

        <SignedOut>
          <Link to={ROUTES.signIn} onClick={onClose} className="mt-4">
            <Button
              variant="dark"
              fullWidth
              leftIcon={<LogIn size={17} />}
              rightIcon={<ArrowRight size={17} />}
            >
              Log in
            </Button>
          </Link>
        </SignedOut>
      </aside>
    </>
  );
}

function SidebarHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Link to={ROUTES.home} className="group flex items-center gap-3">
        <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25 transition group-hover:-translate-y-0.5">
          <div className="absolute inset-0 rounded-2xl bg-white/15" />
          <Sparkles className="relative h-5 w-5" />
        </div>

        <div>
          <p className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
            {APP_NAME}
          </p>
          <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            Creator Dashboard
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={onClose}
        className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white lg:hidden"
        aria-label="Close sidebar"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function UserPanel({
  displayName,
  email,
  imageUrl,
  isSignedIn,
  plan,
}: {
  displayName: string;
  email: string;
  imageUrl?: string;
  isSignedIn: boolean;
  plan: UserPlan;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-cyan-400/10 p-4">
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-slate-950/10"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-sm font-black text-violet-600 shadow-sm dark:bg-white/10 dark:text-violet-300">
            {isSignedIn ? getInitials(displayName) : <UserRound size={20} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-slate-950 dark:text-white">
            {displayName}
          </p>
          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            {email}
          </p>
        </div>

        <SignedIn>
          <UserButton
            afterSignOutUrl={ROUTES.home}
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 rounded-xl",
              },
            }}
          />
        </SignedIn>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <PlanBadge plan={plan} />

        <span className="text-xs font-black text-slate-500 dark:text-slate-400">
          {getPlanLabel(plan)} Plan
        </span>
      </div>
    </div>
  );
}

function SidebarNavLink({
  href,
  label,
  description,
  icon: Icon,
  isPremium,
  onClick,
}: {
  href: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  isPremium?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      end={href === ROUTES.dashboard}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-2xl px-4 py-3 transition duration-200",
          isActive
            ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 text-white shadow-xl shadow-violet-500/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition",
              isActive
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-white dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-white/10",
            )}
          >
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "truncate text-sm font-black",
                  isActive ? "text-white" : "",
                )}
              >
                {label}
              </p>

              {isPremium && (
                <Crown
                  size={14}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-amber-300" : "text-amber-500",
                  )}
                />
              )}
            </div>

            {description && (
              <p
                className={cn(
                  "mt-0.5 truncate text-xs font-semibold",
                  isActive
                    ? "text-white/75"
                    : "text-slate-400 dark:text-slate-500",
                )}
              >
                {description}
              </p>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

function UpgradeCard({ plan }: { plan: UserPlan }) {
  if (plan === "premium") {
    return (
      <div className="mt-5 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-600 dark:text-emerald-300">
            <Crown size={18} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-950 dark:text-white">
              Premium active
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              You have access to all AI tools and higher usage limits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-[2rem] border border-amber-400/25 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/10 dark:border-amber-400/20">
      <div className="pointer-events-none absolute" />

      <Badge
        variant="premium"
        icon={<Crown className="h-3.5 w-3.5" />}
      >
        Upgrade
      </Badge>

      <h3 className="mt-4 text-lg font-black">
        Unlock premium AI tools
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-300">
        Generate images, remove backgrounds, erase objects, review resumes, and
        increase monthly limits.
      </p>

      <Link to={ROUTES.billing} className="mt-4 block">
        <Button
          variant="premium"
          size="sm"
          fullWidth
          rightIcon={<ArrowRight size={16} />}
        >
          View Premium
        </Button>
      </Link>
    </div>
  );
}

export function SidebarMiniBrand() {
  return (
    <Link
      to={ROUTES.dashboard}
      className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white">
        <LayoutDashboard size={18} />
      </div>

      <div>
        <p className="text-sm font-black text-slate-950 dark:text-white">
          Dashboard
        </p>
        <p className="-mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Workspace
        </p>
      </div>
    </Link>
  );
}