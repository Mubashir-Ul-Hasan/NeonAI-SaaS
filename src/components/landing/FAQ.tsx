import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  CreditCard,
  Database,
  HelpCircle,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";

const faqs = [
  {
    question: "Will this project be Netlify-friendly?",
    answer:
      "Yes. We are building the frontend with React, TypeScript, and Vite, and the backend will use Netlify Functions. That means the project can be deployed directly on Netlify with clean API routes.",
    icon: ServerCog,
  },
  {
    question: "Will users be able to log in with Google and email?",
    answer:
      "Yes. Clerk will handle Google login and email verification code login. After login, the user's name and profile image will appear in the app.",
    icon: ShieldCheck,
  },
  {
    question: "Will generated articles, titles, and images be saved?",
    answer:
      "Yes. We will save user creations in Neon PostgreSQL. Images and uploaded assets will be stored through Cloudinary, while the database will keep URLs and metadata.",
    icon: Database,
  },
  {
  question: "How will premium features be protected?",
  answer:
    "Premium tools like image generation, background removal, object removal, and resume review will be protected on both the frontend and backend. The UI will show premium gates, and the Netlify Functions will verify user access before processing.",
  icon: LockKeyhole,
},
  {
    question: "Will real card payments work?",
    answer:
      "Yes. The pricing and billing sections are being prepared for Clerk Billing and Stripe-backed card payments. Later, we will connect the payment flow and update the user plan after successful payment.",
    icon: CreditCard,
  },
  {
    question: "Can we improve or change features later?",
    answer:
      "Absolutely. The project is being structured in a clean modular way, so we can add more AI tools, change layouts, update pricing, improve the admin dashboard, and connect more APIs without breaking the whole app.",
    icon: WandSparkles,
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="relative px-5 py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-[-10rem] h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="primary"
            icon={<HelpCircle className="h-3.5 w-3.5" />}
          >
            FAQ
          </Badge>

          <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Clear answers before we connect the{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              real backend
            </span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
            This section helps users understand the SaaS flow, premium system,
            AI tools, database storage, and deployment plan.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10"
          >
            <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 shadow-xl shadow-violet-500/25">
                <Sparkles size={28} />
              </div>

              <h3 className="mt-7 text-3xl font-black tracking-tight">
                Built like a real production SaaS.
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                We are not only making pages. We are building the foundation for
                authentication, payments, AI generation, image storage, usage
                limits, creation history, and admin analytics.
              </p>

              <div className="mt-7 grid gap-3">
                {[
                  "Professional landing page",
                  "Protected dashboard",
                  "Premium-only AI tools",
                  "Admin analytics dashboard",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-slate-200"
                  >
                    <div className="grid h-7 w-7 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300">
                      <Sparkles size={14} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              const isOpen = openIndex === index;

              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "overflow-hidden rounded-[2rem] border bg-white shadow-xl shadow-slate-950/5 transition dark:bg-white/[0.04]",
                    isOpen
                      ? "border-violet-500/30 dark:border-violet-400/30"
                      : "border-slate-200 dark:border-white/10",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <div
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition",
                        isOpen
                          ? "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                          : "bg-violet-500/10 text-violet-600 dark:text-violet-300",
                      )}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-950 dark:text-white">
                        {faq.question}
                      </h3>
                    </div>

                    <ChevronDown
                      size={20}
                      className={cn(
                        "shrink-0 text-slate-400 transition duration-200",
                        isOpen && "rotate-180 text-violet-500",
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-6 pl-[5.75rem] text-sm leading-7 text-slate-500 dark:text-slate-400">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}