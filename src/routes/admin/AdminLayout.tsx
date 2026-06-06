import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_SESSION_KEY } from "./AdminLogin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { adminNavItems, ROUTES } from "../../lib/routes";
import { APP_NAME } from "../../lib/constants";
import { cn, formatDate } from "../../lib/utils";
import { useTheme } from "../../hooks/useTheme";

type AdminSession = {
  authenticated: boolean;
  loggedInAt: string;
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(() =>
    getAdminSession(),
  );

  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const currentPageTitle = useMemo(() => {
    const currentItem = adminNavItems.find(
      (item) => item.href === location.pathname,
    );

    return currentItem?.label ?? "Admin Dashboard";
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setSession(null);
    navigate(ROUTES.adminLogin);
  }

  if (!session?.authenticated) {
    return <Navigate to={ROUTES.adminLogin} replace />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-950 dark:bg-[#050816] dark:text-white">
      <AdminBackground />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-slate-200 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-950/90 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Link to={ROUTES.admin} className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-500 via-fuchsia-600 to-violet-600 text-white shadow-lg shadow-red-500/20">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Admin Panel
              </p>
              <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                {APP_NAME} Control Center
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <Card padding="md" className="mt-8 border-red-500/20">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-300">
              <UserRound size={21} />
            </div>

            <div className="min-w-0 flex-1">
              <Badge
                variant="danger"
                size="sm"
                icon={<ShieldCheck className="h-3 w-3" />}
              >
                Admin
              </Badge>

              <p className="mt-2 truncate text-sm font-black text-slate-950 dark:text-white">
                Platform Administrator
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Logged in {formatDate(session.loggedInAt)}
              </p>
            </div>
          </div>
        </Card>

        <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
          {adminNavItems.map((item) => (
            <AdminSidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon as LucideIcon}
            />
          ))}
        </nav>

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
          <Link to={ROUTES.home}>
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Home size={17} />}
              rightIcon={<ArrowRight size={17} />}
            >
              Back to App
            </Button>
          </Link>

          <Button
            variant="danger"
            fullWidth
            leftIcon={<LogOut size={17} />}
            onClick={handleLogout}
          >
            Log Out Admin
          </Button>
        </div>
      </aside>

      <section className="min-h-screen lg:pl-80">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 px-5 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
                aria-label="Open admin sidebar"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 sm:flex">
                  <Link
                    to={ROUTES.admin}
                    className="transition hover:text-red-600 dark:hover:text-red-300"
                  >
                    Admin
                  </Link>

                  <ChevronRight size={14} />

                  <span className="text-slate-800 dark:text-slate-200">
                    {currentPageTitle}
                  </span>
                </div>

                <h1 className="mt-0.5 truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  {currentPageTitle}
                </h1>

                <p className="mt-1 hidden text-sm font-semibold text-slate-500 dark:text-slate-400 md:block">
                  Monitor users, payments, AI usage, and saved creations.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                className="hidden h-11 min-w-64 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-400 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:bg-white/10 xl:flex"
              >
                <span className="flex items-center gap-2">
                  <Search size={17} />
                  Search admin data...
                </span>

                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.65rem] font-black text-slate-400 dark:border-white/10 dark:bg-white/5">
                  Ctrl K
                </span>
              </button>

              <button
                type="button"
                className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                aria-label="Admin notifications"
              >
                <Bell size={18} />

                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[0.65rem] font-black text-white ring-2 ring-white dark:ring-slate-950">
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950 sm:inline-flex"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          <div className="mx-auto max-w-[96rem] animate-fade-up">
            <Outlet />
          </div>
        </div>
      </section>
    </main>
  );
}

function AdminSidebarLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <NavLink
      to={href}
      end={href === ROUTES.admin}
      className={({ isActive }) =>
        cn(
          "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition",
          isActive
            ? "bg-slate-950 text-white shadow-xl shadow-slate-950/10 dark:bg-white dark:text-slate-950"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-2xl transition",
                isActive
                  ? "bg-white/12 text-white dark:bg-slate-950/10 dark:text-slate-950"
                  : "bg-slate-100 text-slate-500 group-hover:bg-white dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-white/10",
              )}
            >
              <Icon size={18} />
            </span>

            {label}
          </span>

          {isActive && <ChevronRight size={16} />}
        </>
      )}
    </NavLink>
  );
}

function AdminBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[18rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-red-500/10 blur-3xl dark:bg-red-500/16" />
      <div className="absolute right-[-12rem] top-36 h-[32rem] w-[32rem] rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/16" />
      <div className="absolute bottom-[-16rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl dark:bg-cyan-400/14" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 dark:opacity-15" />
    </div>
  );
}

function getAdminSession(): AdminSession | null {
  try {
    const storedSession = sessionStorage.getItem(ADMIN_SESSION_KEY);

    if (!storedSession) return null;

    const parsedSession = JSON.parse(storedSession) as AdminSession;

    if (!parsedSession?.authenticated) return null;

    return parsedSession;
  } catch {
    return null;
  }
}