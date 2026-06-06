import {
  BarChart3,
  FileText,
  ImageIcon,
  LayoutDashboard,
  PenLine,
  Scissors,
  Sparkles,
  Wand2,
  ShieldCheck,
  Users,
  CreditCard,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { ToolType } from "./utils";

export const ROUTES = {
  home: "/",

  signIn: "/sign-in",
  signUp: "/sign-up",

  dashboard: "/dashboard",
  writeArticle: "/dashboard/write-article",
  blogTitles: "/dashboard/blog-titles",
  generateImage: "/dashboard/generate-image",
  removeBackground: "/dashboard/remove-background",
  removeObject: "/dashboard/remove-object",
  reviewResume: "/dashboard/review-resume",
  creations: "/dashboard/creations",
  settings: "/dashboard/settings",
  billing: "/dashboard/billing",

  adminLogin: "/admin-login",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminRevenue: "/admin/revenue",
  adminUsage: "/admin/usage",
  adminCreations: "/admin/creations",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export type NavItem = {
  label: string;
  href: AppRoute | string;
  icon: LucideIcon;
  description?: string;
  isPremium?: boolean;
  toolType?: ToolType;
};

export const landingNavItems = [
  {
    label: "Tools",
    href: "#tools",
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
  {
    label: "Reviews",
    href: "#reviews",
  },
  {
    label: "FAQ",
    href: "#faq",
  },
];

export const dashboardNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    description: "Account overview and recent activity",
  },
  {
    label: "Write Article",
    href: ROUTES.writeArticle,
    icon: PenLine,
    description: "Generate long-form articles from prompts",
    toolType: "article",
  },
  {
    label: "Blog Titles",
    href: ROUTES.blogTitles,
    icon: FileText,
    description: "Create catchy blog title ideas",
    toolType: "blog-title",
  },
  {
    label: "Generate Image",
    href: ROUTES.generateImage,
    icon: ImageIcon,
    description: "Create AI images from text prompts",
    toolType: "image",
  },
  {
    label: "Remove Background",
    href: ROUTES.removeBackground,
    icon: Scissors,
    description: "Remove image backgrounds instantly",
    isPremium: true,
    toolType: "background-removal",
  },
  {
    label: "Remove Object",
    href: ROUTES.removeObject,
    icon: Wand2,
    description: "Erase unwanted objects from images",
    isPremium: true,
    toolType: "object-removal",
  },
  {
    label: "Review Resume",
    href: ROUTES.reviewResume,
    icon: ShieldCheck,
    description: "Get professional resume feedback",
    isPremium: true,
    toolType: "resume-review",
  },
];

export const dashboardBottomNavItems: NavItem[] = [
  {
    label: "Billing",
    href: ROUTES.billing,
    icon: CreditCard,
    description: "Manage your subscription",
  },
  {
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings,
    description: "Account and preferences",
  },
];

export const adminNavItems: NavItem[] = [
  {
    label: "Overview",
    href: ROUTES.admin,
    icon: BarChart3,
    description: "Application performance snapshot",
  },
  {
    label: "Users",
    href: ROUTES.adminUsers,
    icon: Users,
    description: "Manage and inspect users",
  },
  {
    label: "Revenue",
    href: ROUTES.adminRevenue,
    icon: CreditCard,
    description: "Premium plan and payment analytics",
  },
  {
    label: "Usage",
    href: ROUTES.adminUsage,
    icon: Activity,
    description: "Tool usage and credit analytics",
  },
  {
    label: "Creations",
    href: ROUTES.adminCreations,
    icon: Sparkles,
    description: "Monitor generated content",
  },
];

export const toolCards = [
  {
    title: "Article Writer",
    href: ROUTES.writeArticle,
    icon: PenLine,
    toolType: "article" as ToolType,
    badge: "Free",
    shortDescription: "Turn simple ideas into polished long-form articles.",
    gradient: "from-sky-500 via-indigo-500 to-violet-600",
  },
  {
    title: "Blog Title Generator",
    href: ROUTES.blogTitles,
    icon: FileText,
    toolType: "blog-title" as ToolType,
    badge: "Free",
    shortDescription: "Generate magnetic titles for blogs, ads, and campaigns.",
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-600",
  },
  {
    title: "AI Image Generator",
    href: ROUTES.generateImage,
    icon: ImageIcon,
    toolType: "image" as ToolType,
    badge: "Free",
    shortDescription: "Create stunning visuals from imagination and prompts.",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
  },
  {
    title: "Background Remover",
    href: ROUTES.removeBackground,
    icon: Scissors,
    toolType: "background-removal" as ToolType,
    badge: "Premium",
    shortDescription: "Cut out clean product images, portraits, and graphics.",
    gradient: "from-orange-400 via-rose-500 to-red-600",
  },
  {
    title: "Object Remover",
    href: ROUTES.removeObject,
    icon: Wand2,
    toolType: "object-removal" as ToolType,
    badge: "Premium",
    shortDescription: "Remove unwanted objects while keeping the image natural.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
  },
  {
    title: "Resume Reviewer",
    href: ROUTES.reviewResume,
    icon: ShieldCheck,
    toolType: "resume-review" as ToolType,
    badge: "Premium",
    shortDescription: "Improve resumes with AI-powered career feedback.",
    gradient: "from-violet-500 via-purple-500 to-pink-500",
  },
];

export const publicRoutes = [
  ROUTES.home,
  ROUTES.signIn,
  ROUTES.signUp,
  ROUTES.adminLogin,
];

export const protectedRoutes = [
  ROUTES.dashboard,
  ROUTES.writeArticle,
  ROUTES.blogTitles,
  ROUTES.generateImage,
  ROUTES.removeBackground,
  ROUTES.removeObject,
  ROUTES.reviewResume,
  ROUTES.creations,
  ROUTES.settings,
  ROUTES.billing,
];

export const premiumRoutes = [
  ROUTES.removeBackground,
  ROUTES.removeObject,
  ROUTES.reviewResume,
];

export const adminRoutes = [
  ROUTES.admin,
  ROUTES.adminUsers,
  ROUTES.adminRevenue,
  ROUTES.adminUsage,
  ROUTES.adminCreations,
];

export function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

export function isPremiumRoute(pathname: string) {
  return premiumRoutes.some((route) => pathname.startsWith(route));
}

export function isAdminRoute(pathname: string) {
  return adminRoutes.some((route) => pathname.startsWith(route));
}

export function getRouteTitle(pathname: string) {
  const allRoutes = [
    ...dashboardNavItems,
    ...dashboardBottomNavItems,
    ...adminNavItems,
  ];

  const currentRoute = allRoutes.find((item) => item.href === pathname);

  if (currentRoute) return currentRoute.label;

  if (pathname === ROUTES.home) return "Home";
  if (pathname === ROUTES.signIn) return "Sign In";
  if (pathname === ROUTES.signUp) return "Create Account";
  if (pathname === ROUTES.adminLogin) return "Admin Login";

  return "QuickAI";
}

export function getToolRoute(toolType: ToolType) {
  const routes: Record<ToolType, AppRoute> = {
    article: ROUTES.writeArticle,
    "blog-title": ROUTES.blogTitles,
    image: ROUTES.generateImage,
    "background-removal": ROUTES.removeBackground,
    "object-removal": ROUTES.removeObject,
    "resume-review": ROUTES.reviewResume,
  };

  return routes[toolType];
}

export function getToolTypeFromPath(pathname: string): ToolType | null {
  const match = dashboardNavItems.find((item) => item.href === pathname);

  return match?.toolType ?? null;
}

export function getBreadcrumbs(pathname: string) {
  if (pathname === ROUTES.home) {
    return [{ label: "Home", href: ROUTES.home }];
  }

  if (pathname.startsWith("/admin")) {
    return [
      { label: "Admin", href: ROUTES.admin },
      { label: getRouteTitle(pathname), href: pathname },
    ];
  }

  if (pathname.startsWith("/dashboard")) {
    return [
      { label: "Dashboard", href: ROUTES.dashboard },
      { label: getRouteTitle(pathname), href: pathname },
    ];
  }

  return [{ label: getRouteTitle(pathname), href: pathname }];
}

export const DEFAULT_AFTER_SIGN_IN = ROUTES.dashboard;
export const DEFAULT_AFTER_SIGN_UP = ROUTES.dashboard;
export const DEFAULT_AFTER_SIGN_OUT = ROUTES.home;