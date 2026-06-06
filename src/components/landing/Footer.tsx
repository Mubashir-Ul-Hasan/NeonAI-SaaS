import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import {
  ArrowRight,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { APP_DESCRIPTION, APP_NAME, SUPPORT_EMAIL } from "../../lib/constants";
import { ROUTES, toolCards } from "../../lib/routes";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

const companyLinks = [
  {
    label: "Home",
    href: ROUTES.home,
  },
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
  {
    label: "FAQ",
    href: "#faq",
  },
];

const legalLinks = [
  {
    label: "Privacy Policy",
    href: "#",
  },
  {
    label: "Terms of Service",
    href: "#",
  },
  {
    label: "Cookie Policy",
    href: "#",
  },
  {
    label: "Contact",
    href: `mailto:${SUPPORT_EMAIL}`,
  },
];

const socialLinks = [
  {
    label: "Website",
    href: "#",
    icon: Globe,
  },
  {
    label: "Community",
    href: "#",
    icon: MessageCircle,
  },
  {
    label: "Updates",
    href: "#",
    icon: Send,
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white px-5 pt-20 dark:border-white/10 dark:bg-[#050816]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10rem] top-10 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-10rem] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 dark:border-white/10">
          <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] right-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge
                variant="premium"
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Ready to create
              </Badge>

              <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Launch your AI content workflow from one beautiful dashboard.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Sign in, choose a tool, generate content, save history, and
                upgrade when you need premium AI features.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <SignedOut>
                <Link to={ROUTES.signUp}>
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight size={18} />}
                    className="w-full sm:w-auto"
                  >
                    Start Free
                  </Button>
                </Link>

                <Link to={ROUTES.signIn}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full border-white/10 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
                  >
                    Log in
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                <Link to={ROUTES.dashboard}>
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight size={18} />}
                    className="w-full sm:w-auto"
                  >
                    Open Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>

        <div className="grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1.1fr]">
          <div>
            <Link to={ROUTES.home} className="inline-flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
                <Sparkles size={22} />
              </div>

              <div>
                <p className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  {APP_NAME}
                </p>
                <p className="-mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  AI SaaS Workspace
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">
              {APP_DESCRIPTION}
            </p>

            <div className="mt-6 grid gap-3">
              <FooterInfo
                icon={<Mail size={17} />}
                label={SUPPORT_EMAIL}
                href={`mailto:${SUPPORT_EMAIL}`}
              />

              <FooterInfo
                icon={<MapPin size={17} />}
                label="Built for global creators"
              />

              <FooterInfo
                icon={<ShieldCheck size={17} />}
                label="Secure auth, billing, and user data"
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:text-violet-600 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Navigation">
            {companyLinks.map((item) =>
              item.href.startsWith("#") ? (
                <a key={item.label} href={item.href} className="footer-link">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.href} className="footer-link">
                  {item.label}
                </Link>
              ),
            )}
          </FooterColumn>

          <FooterColumn title="AI Tools">
            {toolCards.slice(0, 6).map((tool) => (
              <Link key={tool.title} to={tool.href} className="footer-link">
                {tool.title}
              </Link>
            ))}
          </FooterColumn>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-950 dark:text-white">
              Newsletter
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
              Get product updates, SaaS tips, and AI workflow ideas directly in
              your inbox.
            </p>

            <form
              className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="min-h-12 flex-1 rounded-2xl border-0 bg-transparent px-4 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />

                <Button
                  type="submit"
                  size="md"
                  rightIcon={<Send size={16} />}
                  className="mx-6"
                >
                  Subscribe
                </Button>
              </div>
            </form>

            <div className="mt-5 rounded-3xl border border-violet-500/20 bg-violet-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                  <WandSparkles size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    Coming next
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    We’ll connect real AI APIs, database storage, premium
                    payment checks, and admin analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-slate-200 py-6 text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {legalLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="transition hover:text-violet-600 dark:hover:text-violet-300"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-950 dark:text-white">
        {title}
      </h3>

      <div className="mt-5 grid gap-3">{children}</div>
    </div>
  );
}

function FooterInfo({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const className =
    "flex items-center gap-3 text-sm font-semibold text-slate-500 transition dark:text-slate-400";

  const content = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100 text-violet-600 dark:bg-white/5 dark:text-violet-300">
        {icon}
      </span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(className, "hover:text-violet-600 dark:hover:text-violet-300")}
      >
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}