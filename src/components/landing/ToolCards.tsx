import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";

import { toolCards } from "../../lib/routes";
import { cn, getToolDescription } from "../../lib/utils";
import { Badge, PremiumBadge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function ToolCards() {
  return (
    <section id="tools" className="relative px-5 py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-[-10rem] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="primary"
            icon={<Sparkles className="h-3.5 w-3.5" />}
          >
            AI Toolkit
          </Badge>

          <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Powerful tools packed inside one{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              creator dashboard
            </span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
            Users can jump directly into any AI tool from the landing page or
            continue from their dashboard with saved creation history.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {toolCards.map((tool, index) => {
            const Icon = tool.icon;
            const isPremium = tool.badge === "Premium";

            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
              >
                <Link
                  to={tool.href}
                  className="group relative block h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-950/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-black/30"
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                      tool.gradient,
                    )}
                  />

                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />
                  <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition group-hover:bg-cyan-400/20" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={cn(
                          "grid h-16 w-16 place-items-center rounded-[1.35rem] bg-gradient-to-br text-white shadow-xl transition group-hover:scale-105",
                          tool.gradient,
                        )}
                      >
                        <Icon size={26} />
                      </div>

                      {isPremium ? (
                        <PremiumBadge />
                      ) : (
                        <Badge
                          variant="success"
                          icon={<Zap className="h-3.5 w-3.5" />}
                        >
                          Free
                        </Badge>
                      )}
                    </div>

                    <h3 className="mt-7 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                      {tool.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {getToolDescription(tool.toolType)}
                    </p>

                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-2xl",
                            isPremium
                              ? "bg-amber-400/15 text-amber-600 dark:text-amber-300"
                              : "bg-emerald-400/15 text-emerald-600 dark:text-emerald-300",
                          )}
                        >
                          {isPremium ? (
                            <LockKeyhole size={18} />
                          ) : (
                            <Sparkles size={18} />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-white">
                            {isPremium ? "Premium access" : "Free access"}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {isPremium
                              ? "Unlock after subscription"
                              : "Available after login"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-300">
                        Open tool
                        <ArrowRight
                          size={17}
                          className="transition group-hover:translate-x-1"
                        />
                      </div>

                      {isPremium && (
                        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-400/15 text-amber-600 dark:text-amber-300">
                          <Crown size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10 dark:border-white/10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge
                variant="premium"
                icon={<Crown className="h-3.5 w-3.5" />}
              >
                Premium workflow
              </Badge>

              <h3 className="mt-4 text-3xl font-black tracking-tight">
                Free users can start instantly. Premium users unlock the full
                creative suite.
              </h3>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                This section is ready for Clerk authentication and billing
                integration. Later, premium buttons will check the user plan
                before opening locked tools.
              </p>
            </div>

            <Link to="/dashboard/billing">
              <Button
                variant="premium"
                size="xl"
                rightIcon={<ArrowRight size={19} />}
                className="w-full lg:w-auto"
              >
                View Premium
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}