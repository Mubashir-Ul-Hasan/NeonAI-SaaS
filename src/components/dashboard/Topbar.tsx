import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import {
  Bell,
  Crown,
  LogIn,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  UserRound,
  Zap,
} from "lucide-react";

import { ROUTES, getBreadcrumbs, getRouteTitle } from "../../lib/routes";
import { getGreeting, getInitials, type UserPlan } from "../../lib/utils";
import { useTheme } from "../../hooks/useTheme";
import { Button } from "../ui/Button";
import { Badge, PlanBadge } from "../ui/Badge";
import { cn } from "../../lib/utils";

type TopbarProps = {
  onMenuClick?: () => void;
  plan?: UserPlan;
  notificationCount?: number;
  className?: string;
};

export function Topbar({
  onMenuClick,
  plan = "free",
  notificationCount = 0,
  className,
}: TopbarProps) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, isSignedIn } = useUser();

  const title = getRouteTitle(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Creator";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 px-5 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 sm:flex">
              {breadcrumbs.map((item, index) => (
                <div key={`${item.href}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}

                  <Link
                    to={item.href}
                    className={cn(
                      "transition hover:text-violet-600 dark:hover:text-violet-300",
                      index === breadcrumbs.length - 1 &&
                        "pointer-events-none text-slate-800 dark:text-slate-200",
                    )}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-0.5 flex items-center gap-3">
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {title}
              </h1>

              <PlanBadge plan={plan} className="hidden sm:inline-flex" />
            </div>

            <p className="mt-1 hidden text-sm font-semibold text-slate-500 dark:text-slate-400 md:block">
              {getGreeting()}, {isSignedIn ? displayName : "welcome"} — your AI workspace is ready.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <SearchBox />

          <button
            type="button"
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell size={18} />

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-black text-white ring-2 ring-white dark:ring-slate-950">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <SignedOut>
            <Link to={ROUTES.signIn} className="hidden sm:block">
              <Button
                variant="dark"
                size="md"
                leftIcon={<LogIn size={17} />}
              >
                Log in
              </Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <UserProfileMenu displayName={displayName} plan={plan} />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

function SearchBox() {
  return (
    <button
      type="button"
      className="hidden h-11 min-w-64 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-400 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:bg-white/10 xl:flex"
    >
      <span className="flex items-center gap-2">
        <Search size={17} />
        Search creations...
      </span>

      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.65rem] font-black text-slate-400 dark:border-white/10 dark:bg-white/5">
        Ctrl K
      </span>
    </button>
  );
}

function UserProfileMenu({
  displayName,
  plan,
}: {
  displayName: string;
  plan: UserPlan;
}) {
  const { user } = useUser();

  return (
    <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 md:flex">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-sm font-black text-violet-600 dark:text-violet-300">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={displayName}
            className="h-10 w-10 rounded-xl object-cover"
          />
        ) : (
          getInitials(displayName) || <UserRound size={18} />
        )}
      </div>

      <div className="hidden min-w-0 lg:block">
        <div className="flex items-center gap-2">
          <p className="max-w-32 truncate text-sm font-black text-slate-950 dark:text-white">
            {displayName}
          </p>

          {plan === "premium" ? (
            <Crown size={14} className="text-amber-500" />
          ) : (
            <Sparkles size={14} className="text-violet-500" />
          )}
        </div>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {plan === "premium" ? "Premium Creator" : "Free Creator"}
        </p>
      </div>

      <UserButton
        afterSignOutUrl={ROUTES.home}
        appearance={{
          elements: {
            avatarBox: "h-9 w-9 rounded-xl",
          },
        }}
      />
    </div>
  );
}

export function MobileTopbarBrand() {
  return (
    <Link
      to={ROUTES.dashboard}
      className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white">
        <Zap size={18} />
      </div>

      <div>
        <p className="text-sm font-black text-slate-950 dark:text-white">
          QuickAI
        </p>
        <p className="-mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Dashboard
        </p>
      </div>
    </Link>
  );
}

export function TopbarNotice({
  message,
  type = "info",
}: {
  message: string;
  type?: "info" | "premium" | "success";
}) {
  return (
    <div
      className={cn(
        "border-b px-5 py-2 text-center text-xs font-black",
        type === "premium" &&
          "border-amber-400/20 bg-amber-400/10 text-amber-700 dark:text-amber-300",
        type === "success" &&
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
        type === "info" &&
          "border-violet-400/20 bg-violet-400/10 text-violet-700 dark:text-violet-300",
      )}
    >
      <Badge
        variant={
          type === "premium" ? "premium" : type === "success" ? "success" : "primary"
        }
        size="sm"
        icon={<Sparkles className="h-3 w-3" />}
      >
        {message}
      </Badge>
    </div>
  );
}