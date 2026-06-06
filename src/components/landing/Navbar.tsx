import { useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  Crown,
  LayoutDashboard,
  Menu,
  Moon,
  Sparkles,
  Sun,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import { landingNavItems, ROUTES } from "../../lib/routes";
import { APP_NAME, APP_TAGLINE } from "../../lib/constants";
import { cn, getInitials } from "../../lib/utils";
import { useTheme } from "../../hooks/useTheme";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

type NavbarProps = {
  className?: string;
};

export function Navbar({ className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, isSignedIn } = useUser();

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Creator";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-2xl transition-colors dark:border-white/10 dark:bg-slate-950/65",
          className,
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to={ROUTES.home} className="group flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25 transition group-hover:-translate-y-0.5">
              <div className="absolute inset-0 rounded-2xl bg-white/15" />
              <Sparkles className="relative h-5 w-5" />
            </div>

            <div>
              <p className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                {APP_NAME}
              </p>
              <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                {APP_TAGLINE}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {landingNavItems.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <SignedOut>
              <Link
                to={ROUTES.signIn}
                className="rounded-2xl px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Log in
              </Link>

              <Link to={ROUTES.signUp}>
                <Button
                  size="md"
                  rightIcon={<ArrowRight size={17} />}
                  className="shadow-violet-500/20"
                >
                  Start Free
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link to={ROUTES.dashboard}>
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<LayoutDashboard size={17} />}
                >
                  Dashboard
                </Button>
              </Link>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="hidden text-right xl:block">
                  <p className="max-w-32 truncate text-sm font-black text-slate-950 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Signed in
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
            </SignedIn>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-md dark:bg-black/70"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <Link
                to={ROUTES.home}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white">
                  <Sparkles size={20} />
                </div>

                <div>
                  <p className="text-lg font-black text-slate-950 dark:text-white">
                    {APP_NAME}
                  </p>
                  <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    AI SaaS
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                aria-label="Close navigation menu"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-cyan-400/10 p-5">
              <Badge
                variant="premium"
                icon={<Crown className="h-3.5 w-3.5" />}
              >
                AI Creator Suite
              </Badge>

              <h3 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">
                Build faster with professional AI tools.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Articles, blog titles, image tools, resume review, and saved
                history in one dashboard.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              {landingNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {item.label}
                  <ArrowRight size={16} className="text-slate-400" />
                </a>
              ))}
            </div>

            <div className="mt-auto border-t border-slate-200 pt-5 dark:border-white/10">
              <SignedOut>
                <div className="grid gap-3">
                  <Link
                    to={ROUTES.signIn}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="secondary" fullWidth>
                      Log in
                    </Button>
                  </Link>

                  <Link
                    to={ROUTES.signUp}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button fullWidth rightIcon={<ArrowRight size={17} />}>
                      Start Free
                    </Button>
                  </Link>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={displayName}
                      className="h-11 w-11 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/10 text-sm font-black text-violet-600 dark:text-violet-300">
                      {isSignedIn ? getInitials(displayName) : <UserRound size={18} />}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                      {displayName}
                    </p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Ready to create
                    </p>
                  </div>

                  <div className="ml-auto">
                    <UserButton
                      afterSignOutUrl={ROUTES.home}
                      appearance={{
                        elements: {
                          avatarBox: "h-9 w-9 rounded-xl",
                        },
                      }}
                    />
                  </div>
                </div>

                <Link
                  to={ROUTES.dashboard}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    fullWidth
                    leftIcon={<Zap size={17} />}
                    rightIcon={<ArrowRight size={17} />}
                  >
                    Open Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}