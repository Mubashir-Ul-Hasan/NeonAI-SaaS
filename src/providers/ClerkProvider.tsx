import { ClerkProvider as BaseClerkProvider } from "@clerk/clerk-react";
import { AlertTriangle, ArrowRight, KeyRound, Sparkles } from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { APP_NAME } from "../lib/constants";

type AppClerkProviderProps = {
  children: React.ReactNode;
};

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AppClerkProvider({ children }: AppClerkProviderProps) {
  if (!isValidClerkPublishableKey(publishableKey)) {
    return <MissingClerkKeyScreen />;
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: "#7c3aed",
          colorText: "#0f172a",
          colorBackground: "#ffffff",
          borderRadius: "1rem",
        },
        elements: {
          card: "rounded-[2rem] shadow-2xl border border-slate-200",
          headerTitle: "text-2xl font-black",
          headerSubtitle: "text-sm text-slate-500",
          socialButtonsBlockButton:
            "rounded-2xl border border-slate-200 font-bold",
          formButtonPrimary:
            "rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 font-black shadow-lg shadow-violet-500/25 hover:opacity-95",
          formFieldInput:
            "rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20",
          footerActionLink: "text-violet-600 font-black",
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}

function MissingClerkKeyScreen() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-5 py-12 text-slate-950 dark:bg-[#050816] dark:text-white">
      <div className="pointer-events-none absolute left-[-10rem] top-[-10rem] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-10rem] h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />

      <Card
        padding="xl"
        className="relative w-full max-w-xl overflow-hidden text-center"
      >
        <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />

        <div className="relative">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-rose-500 via-fuchsia-600 to-violet-600 text-white shadow-2xl shadow-rose-500/20">
            <AlertTriangle size={34} />
          </div>

          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">
            <KeyRound className="h-3.5 w-3.5" />
            Clerk Setup Required
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Add your Clerk publishable key
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
            {APP_NAME} needs a valid Clerk key before authentication pages and
            protected dashboard routes can work.
          </p>

          <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-sm font-black text-slate-950 dark:text-white">
              Add this inside your root `.env` file:
            </p>

            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm font-bold text-cyan-200">
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_real_key_here
            </pre>

            <p className="mt-4 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              After adding it, stop the dev server and run{" "}
              <code className="rounded-md bg-white px-1.5 py-0.5 font-black text-slate-950 dark:bg-slate-950 dark:text-white">
                npm run dev
              </code>{" "}
              again.
            </p>
          </div>

          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-block"
          >
            <Button rightIcon={<ArrowRight size={17} />}>
              Open Clerk Dashboard
            </Button>
          </a>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Use your real key, not the placeholder.
          </div>
        </div>
      </Card>
    </main>
  );
}

function isValidClerkPublishableKey(key: unknown) {
  if (typeof key !== "string") return false;

  const cleanKey = key.trim();

  if (!cleanKey) return false;
  if (cleanKey.includes("your_")) return false;
  if (cleanKey.includes("placeholder")) return false;

  return cleanKey.startsWith("pk_test_") || cleanKey.startsWith("pk_live_");
}