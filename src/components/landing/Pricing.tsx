import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Crown,
  Gem,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";

import { PRICING_PLANS } from "../../lib/constants";
import { ROUTES } from "../../lib/routes";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function Pricing() {
  return (
    <section id="pricing" className="relative px-5 py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-10 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="premium"
            icon={<Gem className="h-3.5 w-3.5" />}
          >
            Flexible Pricing
          </Badge>

          <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Start free, then unlock the{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              complete AI creator suite
            </span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
            Your SaaS will support limited free access and premium-only tools.
            Later we’ll connect this section to Clerk Billing and real card
            payments.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {PRICING_PLANS.map((plan, index) => {
            const isPremium = plan.id === "premium";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                className={cn(
                  "relative overflow-hidden rounded-[2.5rem] border p-7 shadow-2xl transition duration-300 hover:-translate-y-1",
                  isPremium
                    ? "border-violet-400/30 bg-slate-950 text-white shadow-violet-500/20"
                    : "border-slate-200 bg-white text-slate-950 shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                )}
              >
                {isPremium && (
                  <>
                    <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                  </>
                )}

                {!isPremium && (
                  <>
                    <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
                  </>
                )}

                <div className="relative">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div>
                      <Badge
                        variant={isPremium ? "premium" : "primary"}
                        icon={
                          isPremium ? (
                            <Crown className="h-3.5 w-3.5" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )
                        }
                      >
                        {plan.badge}
                      </Badge>

                      <h3 className="mt-5 text-3xl font-black tracking-tight">
                        {plan.name}
                      </h3>

                      <p
                        className={cn(
                          "mt-3 max-w-md text-sm leading-6",
                          isPremium
                            ? "text-slate-300"
                            : "text-slate-500 dark:text-slate-400",
                        )}
                      >
                        {plan.description}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "grid h-16 w-16 shrink-0 place-items-center rounded-3xl",
                        isPremium
                          ? "bg-white/10 text-amber-300"
                          : "bg-violet-500/10 text-violet-600 dark:text-violet-300",
                      )}
                    >
                      {isPremium ? <Crown size={28} /> : <Zap size={28} />}
                    </div>
                  </div>

                  <div className="mt-8 flex items-end gap-2">
                    <p className="text-6xl font-black tracking-tight">
                      {plan.price}
                    </p>
                    <p
                      className={cn(
                        "pb-3 text-sm font-black",
                        isPremium
                          ? "text-slate-300"
                          : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {plan.priceSuffix}
                    </p>
                  </div>

                  <SignedOut>
                    <Link to={isPremium ? ROUTES.signUp : ROUTES.signUp}>
                      <Button
                        fullWidth
                        size="xl"
                        variant={isPremium ? "premium" : "primary"}
                        rightIcon={<ArrowRight size={19} />}
                        className="mt-8"
                      >
                        {isPremium ? "Upgrade After Signup" : "Start Free"}
                      </Button>
                    </Link>
                  </SignedOut>

                  <SignedIn>
                    <Link to={isPremium ? ROUTES.billing : ROUTES.dashboard}>
                      <Button
                        fullWidth
                        size="xl"
                        variant={isPremium ? "premium" : "primary"}
                        rightIcon={<ArrowRight size={19} />}
                        className="mt-8"
                      >
                        {isPremium ? "Upgrade to Premium" : "Open Dashboard"}
                      </Button>
                    </Link>
                  </SignedIn>

                  <div
                    className={cn(
                      "mt-8 rounded-[2rem] border p-5",
                      isPremium
                        ? "border-white/10 bg-white/[0.06]"
                        : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]",
                    )}
                  >
                    <p className="text-sm font-black">Included features</p>

                    <ul className="mt-5 space-y-4">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className={cn(
                            "flex items-start gap-3 text-sm font-bold leading-6",
                            isPremium
                              ? "text-slate-200"
                              : "text-slate-700 dark:text-slate-300",
                          )}
                        >
                          <CheckCircle2
                            className={cn(
                              "mt-0.5 h-5 w-5 shrink-0",
                              isPremium
                                ? "text-cyan-300"
                                : "text-emerald-500",
                            )}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {plan.limits.map((limit) => (
                      <div
                        key={limit}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-black",
                          isPremium
                            ? "border-white/10 bg-white/[0.06] text-slate-300"
                            : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",
                        )}
                      >
                        {isPremium ? (
                          <BadgeCheck className="h-4 w-4 text-amber-300" />
                        ) : (
                          <LockKeyhole className="h-4 w-4 text-violet-500" />
                        )}
                        {limit}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white/75 p-6 shadow-xl shadow-slate-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                Payment system will be real, not demo-only.
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                We’ll connect Clerk Billing with Stripe-backed card payments,
                protect premium APIs, and update user access automatically after
                successful subscription.
              </p>
            </div>

            <Link to={ROUTES.billing}>
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
                className="w-full lg:w-auto"
              >
                Billing Preview
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}