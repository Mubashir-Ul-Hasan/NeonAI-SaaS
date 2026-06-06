import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { APP_NAME } from "../../lib/constants";
import { ROUTES } from "../../lib/routes";

const ADMIN_SESSION_KEY = "quickai-admin-auth";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminCredentials = useMemo(() => {
    return {
      username: import.meta.env.VITE_ADMIN_USERNAME || "admin",
      password: import.meta.env.VITE_ADMIN_PASSWORD || "quickai-admin",
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      toast.error("Please enter admin username and password.");
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      const isValid =
        cleanUsername === adminCredentials.username &&
        cleanPassword === adminCredentials.password;

      if (!isValid) {
        setIsSubmitting(false);
        toast.error("Invalid admin credentials.");
        return;
      }

      sessionStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({
          authenticated: true,
          loggedInAt: new Date().toISOString(),
        }),
      );

      toast.success("Admin access granted.");
      navigate(ROUTES.admin);
    }, 650);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-5 py-12 text-slate-950 dark:bg-[#050816] dark:text-white">
      <AdminLoginBackground />

      <section className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="hidden lg:block">
          <Badge
            variant="premium"
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          >
            Hidden Admin Route
          </Badge>

          <h1 className="mt-6 max-w-2xl text-6xl font-black tracking-tight">
            Secure control center for your{" "}
            <span className="bg-gradient-to-r from-red-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
              AI SaaS platform
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Admin access is separated from the normal website navigation. Later,
            this should be protected by backend validation, encrypted secrets,
            and role-based access control.
          </p>

          <div className="mt-8 grid max-w-xl gap-4 md:grid-cols-3">
            {[
              "Users",
              "Revenue",
              "AI Usage",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-4 text-center text-sm font-black shadow-xl shadow-slate-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card
          padding="xl"
          className="relative overflow-hidden border-red-500/20"
        >
          <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-red-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <Link to={ROUTES.home} className="inline-flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
                <Sparkles size={22} />
              </div>

              <div>
                <p className="text-xl font-black text-slate-950 dark:text-white">
                  {APP_NAME}
                </p>
                <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Admin Access
                </p>
              </div>
            </Link>

            <div className="mt-10">
              <div className="grid h-18 w-18 place-items-center rounded-[1.75rem] bg-gradient-to-br from-red-500 via-fuchsia-600 to-violet-600 text-white shadow-2xl shadow-red-500/20">
                <LockKeyhole size={32} />
              </div>

              <Badge
                variant="danger"
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                className="mt-6"
              >
                Restricted Area
              </Badge>

              <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                Admin Login
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Enter the admin username and password to access analytics,
                platform data, user monitoring, and creation activity.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label="Admin Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter admin username"
                leftIcon={<UserRound className="h-4 w-4" />}
                inputSize="lg"
                variant="glass"
                autoComplete="username"
              />

              <div>
                <Input
                  label="Admin Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-slate-400 transition hover:text-violet-600 dark:hover:text-violet-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  inputSize="lg"
                  variant="glass"
                  autoComplete="current-password"
                />

                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Demo default: username{" "}
                  <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-900 dark:bg-white/10 dark:text-white">
                    admin
                  </code>{" "}
                  and password{" "}
                  <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-900 dark:bg-white/10 dark:text-white">
                    quickai-admin
                  </code>
                </p>
              </div>

              <Button
                type="submit"
                size="xl"
                variant="danger"
                fullWidth
                isLoading={isSubmitting}
                rightIcon={<ArrowRight size={19} />}
              >
                {isSubmitting ? "Checking Access..." : "Enter Admin Dashboard"}
              </Button>
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-amber-400/25 bg-amber-400/10 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-600 dark:text-amber-300">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    Important security note
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    This is frontend demo protection only. Before production,
                    admin login must be verified through a secure backend, not
                    only React state or browser storage.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to={ROUTES.home}
              className="mt-7 inline-flex items-center gap-2 text-sm font-black text-violet-600 transition hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
            >
              Back to public website
              <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}

function AdminLoginBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-12rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-red-500/15 blur-3xl dark:bg-red-500/20" />
      <div className="absolute right-[-14rem] top-32 h-[34rem] w-[34rem] rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/20" />
      <div className="absolute bottom-[-16rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/15" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-20" />
    </div>
  );
}

export { ADMIN_SESSION_KEY };