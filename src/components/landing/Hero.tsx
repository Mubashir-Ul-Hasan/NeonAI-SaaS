import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Crown,
  ImageIcon,
  Layers3,
  MousePointerClick,
  PenLine,
  Play,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";

import { ROUTES } from "../../lib/routes";
import { APP_DESCRIPTION } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

const heroStats = [
  {
    value: "6+",
    label: "AI tools",
  },
  {
    value: "24/7",
    label: "Cloud access",
  },
  {
    value: "Pro",
    label: "SaaS UI",
  },
];


export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-20 pt-16 sm:pt-20 lg:pb-28 lg:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/30" />
        <div className="absolute right-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/20" />
        <div className="absolute bottom-[-18rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl dark:bg-fuchsia-500/20" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-white/70 px-4 py-2 text-sm font-black text-violet-700 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:bg-white/5 dark:text-violet-200">
            <Zap size={16} />
            All-in-one AI creator workspace
          </div>

          <h1 className="max-w-5xl text-balance text-5xl font-black tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
            Build content faster with a{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              beautiful AI SaaS platform
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {APP_DESCRIPTION} Everything feels fast, polished, and ready for a
            real production workflow.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <SignedOut>
              <Link to={ROUTES.signUp}>
                <Button
                  size="xl"
                  rightIcon={<ArrowRight size={19} />}
                  className="w-full sm:w-auto"
                >
                  Start Creating Free
                </Button>
              </Link>

              <Link to={ROUTES.signIn}>
                <Button
                  size="xl"
                  variant="secondary"
                  leftIcon={<MousePointerClick size={19} />}
                  className="w-full sm:w-auto"
                >
                  Log in
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link to={ROUTES.dashboard}>
                <Button
                  size="xl"
                  rightIcon={<ArrowRight size={19} />}
                  className="w-full sm:w-auto"
                >
                  Open Dashboard
                </Button>
              </Link>

              <a href="#tools">
                <Button
                  size="xl"
                  variant="secondary"
                  leftIcon={<Play size={19} />}
                  className="w-full sm:w-auto"
                >
                  Explore Tools
                </Button>
              </a>
            </SignedIn>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-2xl font-black text-slate-950 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {[
              "Google login",
              "Email code auth",
              "Premium gates",
              "Creation history",
            ].map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-xs font-black text-slate-700 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <BadgeCheck size={14} className="text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-xl"
        >
          

          <div className="absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-violet-600/20 via-fuchsia-500/20 to-cyan-400/20 blur-2xl" />

          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]">
            <div className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl dark:bg-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>

                <Badge
                  variant="premium"
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  Live Preview
                </Badge>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-sm font-bold text-slate-400">
                      AI Command Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      Generate smarter outputs
                    </h2>
                  </div>

                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 shadow-xl shadow-violet-500/25">
                    <WandSparkles size={24} />
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <PreviewRow
                    icon={<PenLine size={18} />}
                    title="Article Writer"
                    description="Long-form content"
                    value="92%"
                    gradient="from-violet-500 to-fuchsia-500"
                  />

                  <PreviewRow
                    icon={<ImageIcon size={18} />}
                    title="Image Generator"
                    description="Premium visual creation"
                    value="78%"
                    gradient="from-emerald-400 to-cyan-500"
                  />

                  <PreviewRow
                    icon={<BrainCircuit size={18} />}
                    title="Resume Review"
                    description="Career improvement report"
                    value="64%"
                    gradient="from-amber-400 to-orange-500"
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricCard
                    icon={<Layers3 size={18} />}
                    value="1.2k"
                    label="Saved creations"
                  />

                  <MetricCard
                    icon={<Crown size={18} />}
                    value="326"
                    label="Premium users"
                  />
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">
                        One-click generation
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Prompt → AI → Save → Reuse
                      </p>
                    </div>

                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-950">

                      <Link to={ROUTES.dashboard}>
                           <ArrowRight size={18} />
                      </Link>

                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {["Fast", "Secure", "Premium"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-center text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PreviewRow({
  icon,
  title,
  description,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  gradient: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-cyan-200">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-black">{title}</p>
            <p className="text-xs font-bold text-slate-400">{value}</p>
          </div>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {description}
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
              style={{ width: value }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-cyan-200">{icon}</div>
        <Sparkles size={15} className="text-violet-300" />
      </div>

      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}