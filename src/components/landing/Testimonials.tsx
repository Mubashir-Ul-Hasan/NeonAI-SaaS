import { motion } from "framer-motion";
import {
  Quote,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  WandSparkles,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";

const testimonials = [
  {
    name: "Sarah Khan",
    role: "Content Creator",
    quote:
      "QuickAI feels like a complete creative workspace. I can draft articles, create titles, and keep everything organized without jumping between tools.",
    rating: 5,
    gradient: "from-violet-600 via-fuchsia-500 to-cyan-400",
  },
  {
    name: "Nabil Rahman",
    role: "Startup Founder",
    quote:
      "The dashboard experience is clean and premium. The free-to-premium flow makes sense, and the image tools are exactly what a SaaS like this needs.",
    rating: 5,
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
  },
  {
    name: "Ayesha Islam",
    role: "Job Applicant",
    quote:
      "The resume review idea is powerful. Having writing tools and resume feedback in the same product makes the platform feel genuinely useful.",
    rating: 5,
    gradient: "from-amber-400 via-orange-500 to-rose-500",
  },
];

const trustStats = [
  {
    label: "Creator-friendly workflow",
    value: "Fast",
    icon: WandSparkles,
  },
  {
    label: "Built for SaaS growth",
    value: "Scalable",
    icon: TrendingUp,
  },
  {
    label: "User-focused dashboard",
    value: "Simple",
    icon: Users,
  },
];

export function Testimonials() {
  return (
    <section id="reviews" className="relative px-5 py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-12rem] top-10 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-[-12rem] h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="primary"
            icon={<Sparkles className="h-3.5 w-3.5" />}
          >
            User Experience
          </Badge>

          <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Designed to feel like a{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              polished premium SaaS
            </span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
            These testimonial cards are placeholder content for now. Later you
            can replace them with real user feedback after deployment.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.45,
                delay: index * 0.08,
                ease: "easeOut",
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                  testimonial.gradient,
                )}
              />

              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={cn(
                      "grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-xl",
                      testimonial.gradient,
                    )}
                  >
                    <Quote size={24} />
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-7 text-base font-semibold leading-8 text-slate-700 dark:text-slate-200">
                  “{testimonial.quote}”
                </p>

                <div className="mt-7 flex items-center gap-4 border-t border-slate-200 pt-5 dark:border-white/10">
                  <div
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-sm font-black text-white",
                      testimonial.gradient,
                    )}
                  >
                    {testimonial.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>

                  <div>
                    <p className="font-black text-slate-950 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {trustStats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.4,
                  delay: 0.15 + index * 0.06,
                  ease: "easeOut",
                }}
                className="rounded-[2rem] border border-slate-200 bg-white/75 p-6 shadow-xl shadow-slate-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-13 w-13 place-items-center rounded-3xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Icon size={23} />
                  </div>

                  <div>
                    <p className="text-2xl font-black text-slate-950 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}