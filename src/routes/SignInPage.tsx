import { Link, Navigate } from "react-router-dom";
import {
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  SignedIn,
} from "@clerk/clerk-react";
import {
  ArrowLeft,
  BadgeCheck,
  BrainCircuit,
  Crown,
  Loader2,
  MailCheck,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";

import { ROUTES } from "../lib/routes";
import { APP_NAME } from "../lib/constants";
import { Badge } from "../components/ui/Badge";

const benefits = [
  {
    title: "Google or email login",
    description: "Users can enter with Google or email verification code.",
    icon: MailCheck,
  },
  {
    title: "Secure AI workspace",
    description: "Protected dashboard access after successful authentication.",
    icon: ShieldCheck,
  },
  {
    title: "Saved creation history",
    description: "Generated content will be connected to each user account.",
    icon: BrainCircuit,
  },
];

export default function SignInPage() {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  const hasClerkKey =
    typeof clerkKey === "string" &&
    clerkKey.trim().startsWith("pk_") &&
    !clerkKey.includes("your_") &&
    !clerkKey.includes("placeholder");

  if (!hasClerkKey) {
    return <ClerkMissingState />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white">
      <AuthBackground />

      <div className="grid min-h-screen lg:grid-cols-[1fr_0.95fr]">
        <section className="relative hidden border-r border-slate-200/70 px-8 py-8 dark:border-white/10 lg:flex lg:flex-col">
          <Link
            to={ROUTES.home}
            className="inline-flex w-fit items-center gap-3"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
              <Sparkles size={23} />
            </div>

            <div>
              <p className="text-xl font-black tracking-tight">{APP_NAME}</p>
              <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                AI SaaS Workspace
              </p>
            </div>
          </Link>

          <div className="flex flex-1 items-center">
            <div className="mx-auto max-w-xl">
              <Badge
                variant="premium"
                icon={<Crown className="h-3.5 w-3.5" />}
              >
                Welcome back
              </Badge>

              <h1 className="mt-6 text-balance text-5xl font-black tracking-tight xl:text-6xl">
                Continue building with your{" "}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                  AI creator dashboard
                </span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                Sign in to access your tools, previous creations, premium
                features, billing, and account dashboard.
              </p>

              <div className="mt-10 grid gap-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="rounded-[2rem] border border-slate-200 bg-white/75 p-5 shadow-xl shadow-slate-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <Icon size={22} />
                        </div>

                        <div>
                          <h3 className="font-black text-slate-950 dark:text-white">
                            {benefit.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Fast", "Secure", "Premium"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-center text-xs font-black text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link
                to={ROUTES.home}
                className="inline-flex items-center gap-3"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white">
                  <Sparkles size={20} />
                </div>

                <div>
                  <p className="text-lg font-black">{APP_NAME}</p>
                  <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                    AI SaaS
                  </p>
                </div>
              </Link>
            </div>

            <Link
              to={ROUTES.home}
              className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300"
            >
              <ArrowLeft size={17} />
              Back to home
            </Link>

            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/80 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05]">
              <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
              <div className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />

              <div className="relative mb-5 px-3 pt-3 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-xl shadow-violet-500/25">
                  <WandSparkles size={28} />
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Sign in to QuickAI
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Use Google or your email verification code to continue.
                </p>
              </div>

              <SignedIn>
                <Navigate to={ROUTES.dashboard} replace />
              </SignedIn>

              <ClerkLoading>
                <div className="grid min-h-[28rem] place-items-center rounded-[2rem] border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/60">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600 dark:text-violet-300" />
                    <p className="mt-4 text-sm font-black text-slate-600 dark:text-slate-300">
                      Loading secure sign in...
                    </p>
                  </div>
                </div>
              </ClerkLoading>

              <ClerkLoaded>
                <SignIn
                  routing="path"
                  path={ROUTES.signIn}
                  signUpUrl={ROUTES.signUp}
                  fallbackRedirectUrl={ROUTES.dashboard}
                  forceRedirectUrl={ROUTES.dashboard}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card:
                        "w-full border-0 bg-transparent p-0 shadow-none dark:bg-transparent",
                      header: "hidden",
                      socialButtonsBlockButton:
                        "rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800",
                      socialButtonsBlockButtonText: "font-black",
                      dividerLine: "bg-slate-200 dark:bg-white/10",
                      dividerText:
                        "text-slate-500 dark:text-slate-400 font-bold",
                      formFieldLabel:
                        "text-slate-800 dark:text-slate-100 font-black",
                      formFieldInput:
                        "rounded-2xl border-slate-200 bg-white/90 px-4 py-3 font-semibold text-slate-950 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-900/80 dark:text-white",
                      formButtonPrimary:
                        "rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 py-3 font-black text-white shadow-xl shadow-violet-500/20 transition hover:scale-[1.01]",
                      footerActionText:
                        "text-slate-500 dark:text-slate-400 font-semibold",
                      footerActionLink:
                        "text-violet-600 hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200 font-black",
                      identityPreviewEditButton:
                        "text-violet-600 dark:text-violet-300",
                      formResendCodeLink:
                        "text-violet-600 dark:text-violet-300 font-black",
                      otpCodeFieldInput:
                        "rounded-2xl border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900 dark:text-white",
                    },
                    variables: {
                      colorPrimary: "#7c3aed",
                      borderRadius: "1rem",
                    },
                  }}
                />
              </ClerkLoaded>
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white/75 p-4 shadow-xl shadow-slate-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <BadgeCheck size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    Secure authentication
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Clerk handles Google sign-in, email verification code, and
                    session management for the SaaS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-12rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/30" />
      <div className="absolute right-[-12rem] top-32 h-[32rem] w-[32rem] rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-400/20" />
      <div className="absolute bottom-[-16rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl dark:bg-fuchsia-500/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-20" />
    </div>
  );
}

function ClerkMissingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 dark:bg-[#050816]">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
          <Zap size={28} />
        </div>

        <h1 className="mt-6 text-3xl font-black text-slate-950 dark:text-white">
          Clerk key is missing
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Add your real Clerk publishable key inside{" "}
          <code className="rounded-lg bg-slate-100 px-2 py-1 text-slate-900 dark:bg-white/10 dark:text-white">
            .env.local
          </code>{" "}
          and restart the dev server.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-950 p-4 text-sm font-semibold text-slate-200">
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_real_key
        </div>

        <Link
          to={ROUTES.home}
          className="mt-6 inline-flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>
      </div>
    </main>
  );
}