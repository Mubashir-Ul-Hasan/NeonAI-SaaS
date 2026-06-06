import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  useUser,
} from "@clerk/clerk-react";
import {
  ArrowRight,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Sidebar, Topbar, TopbarNotice } from "../../components/dashboard";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ROUTES } from "../../lib/routes";
import { APP_NAME } from "../../lib/constants";
import { cn, type UserPlan } from "../../lib/utils";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();

  const plan = useMemo<UserPlan>(() => {
    const publicPlan = user?.publicMetadata?.plan;

    return publicPlan === "premium" ? "premium" : "free";
  }, [user?.publicMetadata?.plan]);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white">
      <DashboardBackground />

      <ClerkLoading>
        <DashboardLoading />
      </ClerkLoading>

      <ClerkLoaded>
        <SignedOut>
          <DashboardAuthRequired />
        </SignedOut>

        <SignedIn>
          <div className="min-h-screen">
            {plan === "free" && (
              <TopbarNotice
                type="premium"
                message="Free plan active — premium image tools and resume review unlock after upgrade."
              />
            )}

            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              plan={plan}
            />

            <div className="min-h-screen lg:pl-80">
              <Topbar
                onMenuClick={() => setSidebarOpen(true)}
                plan={plan}
                notificationCount={2}
              />

              <section className="relative p-5 lg:p-8">
                <div className="mx-auto max-w-[96rem] animate-fade-up">
                  <Outlet />
                </div>
              </section>
            </div>
          </div>
        </SignedIn>
      </ClerkLoaded>
    </main>
  );
}

function DashboardBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[18rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-violet-500/12 blur-3xl dark:bg-violet-500/20" />
      <div className="absolute right-[-12rem] top-36 h-[32rem] w-[32rem] rounded-full bg-cyan-400/12 blur-3xl dark:bg-cyan-400/18" />
      <div className="absolute bottom-[-16rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-fuchsia-500/8 blur-3xl dark:bg-fuchsia-500/14" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 dark:opacity-15" />
    </div>
  );
}

function DashboardLoading() {
  return (
    <section className="grid min-h-screen place-items-center px-5">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 text-center shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05]">
        <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative">
          <div className="mx-auto grid h-18 w-18 place-items-center rounded-[1.75rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-2xl shadow-violet-500/25">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>

          <h1 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">
            Loading dashboard
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Preparing your secure AI workspace...
          </p>
        </div>
      </div>
    </section>
  );
}

function DashboardAuthRequired() {
  return (
    <section className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-8 text-center shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05]">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-2xl shadow-violet-500/25">
          <LockKeyhole size={34} />
        </div>

        <Badge
          variant="primary"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          className="mt-6"
        >
          Protected Dashboard
        </Badge>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          Sign in to access your AI workspace
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
          Your dashboard contains AI tools, saved creations, premium access,
          billing, and account information. Please sign in first.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={ROUTES.signIn}>
            <Button
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              className="w-full sm:w-auto"
            >
              Sign In
            </Button>
          </Link>

          <Link to={ROUTES.signUp}>
            <Button
              size="lg"
              variant="secondary"
              rightIcon={<Sparkles size={18} />}
              className="w-full sm:w-auto"
            >
              Create Account
            </Button>
          </Link>
        </div>

        <Link
          to={ROUTES.home}
          className={cn(
            "mt-8 inline-flex items-center gap-2 text-sm font-black",
            "text-slate-500 transition hover:text-violet-600",
            "dark:text-slate-400 dark:hover:text-violet-300",
          )}
        >
          Back to {APP_NAME} home
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}