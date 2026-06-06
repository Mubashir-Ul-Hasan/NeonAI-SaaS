import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cloud,
  Code2,
  CreditCard,
  Database,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  FAQ,
  Footer,
  Hero,
  Navbar,
  Pricing,
  Testimonials,
  ToolCards,
} from "../components/landing";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../lib/routes";

const workflowSteps = [
  {
    title: "Sign in securely",
    description:
      "Users log in with Google or email verification before accessing the creator dashboard.",
    icon: ShieldCheck,
    gradient: "from-violet-600 to-fuchsia-500",
  },
  {
    title: "Choose an AI tool",
    description:
      "Free users can use writing tools, while premium tools are clearly locked behind upgrade prompts.",
    icon: WandSparkles,
    gradient: "from-fuchsia-500 to-cyan-500",
  },
  {
    title: "Generate content",
    description:
      "Gemini, image APIs, and image-processing services will power the actual AI results.",
    icon: Zap,
    gradient: "from-cyan-500 to-emerald-400",
  },
  {
    title: "Save everything",
    description:
      "Generated text, images, resume reviews, and metadata will be saved for future access.",
    icon: Database,
    gradient: "from-emerald-400 to-violet-600",
  },
];

const stackItems = [
  {
    title: "Clerk Auth",
    description: "Google login, email code verification, profile, and billing.",
    icon: LockKeyhole,
  },
  {
    title: "Netlify Functions",
    description: "Serverless backend APIs ready for Netlify deployment.",
    icon: ServerCog,
  },
  {
    title: "Neon Database",
    description: "PostgreSQL storage for users, creations, usage, and plans.",
    icon: Database,
  },
  {
    title: "Cloudinary Storage",
    description: "Image upload, storage, optimization, and delivery.",
    icon: Cloud,
  },
  {
    title: "AI APIs",
    description: "Gemini and professional image APIs for real AI generation.",
    icon: Sparkles,
  },
  {
    title: "Modern React",
    description: "React, TypeScript, Tailwind, Framer Motion, and clean routing.",
    icon: Code2,
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white">
      <BackgroundGlow />

      <Navbar />
      <Hero />
      <ToolCards />
      <WorkflowSection />
      <Pricing />
      <IntegrationStackSection />
      <Testimonials />
      <FAQ />
      <FinalCTASection />
      <Footer />
    </main>
  );
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-14rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/25" />
      <div className="absolute right-[-16rem] top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-400/20" />
      <div className="absolute bottom-[-18rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl dark:bg-fuchsia-500/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-20" />
    </div>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="relative px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Badge
              variant="primary"
              icon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Product Workflow
            </Badge>

            <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              A smooth SaaS journey from{" "}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                login to generation
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              The app will guide users naturally: authenticate, choose a tool,
              generate with AI, save the result, and upgrade when they need
              premium tools.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={ROUTES.dashboard}>
                <Button
                  size="lg"
                  rightIcon={<ArrowRight size={18} />}
                  className="w-full sm:w-auto"
                >
                  View Dashboard
                </Button>
              </Link>

              <a href="#pricing">
                <Button
                  size="lg"
                  variant="secondary"
                  leftIcon={<CreditCard size={18} />}
                  className="w-full sm:w-auto"
                >
                  See Pricing
                </Button>
              </a>
            </div>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {workflowSteps.map((step, index) => (
              <WorkflowCard key={step.title} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowCard({
  step,
  index,
}: {
  step: {
    title: string;
    description: string;
    icon: LucideIcon;
    gradient: string;
  };
  index: number;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.45,
        delay: index * 0.07,
        ease: "easeOut",
      }}
      className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div
            className={`grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br ${step.gradient} text-white shadow-xl`}
          >
            <Icon size={24} />
          </div>

          <span className="text-sm font-black text-slate-300 dark:text-white/20">
            0{index + 1}
          </span>
        </div>

        <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">
          {step.title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

function IntegrationStackSection() {
  return (
    <section className="relative px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/75 p-6 shadow-2xl shadow-slate-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="relative">
            <div className="mx-auto max-w-3xl text-center">
              <Badge
                variant="premium"
                icon={<ServerCog className="h-3.5 w-3.5" />}
              >
                Production Stack
              </Badge>

              <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                Built with tools that make the app{" "}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                  real and deployable
                </span>
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
                This project is being prepared for real authentication,
                database storage, serverless APIs, image hosting, payments, and
                deployment.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {stackItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                    className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-950/50"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <Icon size={22} />
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20 dark:border-white/10 lg:p-12">
          <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge
                variant="premium"
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Start building
              </Badge>

              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                Your AI SaaS foundation is ready for the next phase.
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
                Next we will connect the separate pages, dashboard layout,
                protected routes, Clerk auth, backend functions, database, and
                real AI APIs step by step.
              </p>
            </div>

            <Link to={ROUTES.dashboard}>
              <Button
                size="xl"
                rightIcon={<ArrowRight size={19} />}
                className="w-full lg:w-auto"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}