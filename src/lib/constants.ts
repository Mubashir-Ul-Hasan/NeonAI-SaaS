import type { ToolType, UserPlan } from "./utils";
import { ROUTES } from "./routes";

export const APP_NAME = "NeonAI";

export const APP_TAGLINE = "Creative AI SaaS Workspace";

export const APP_DESCRIPTION =
  "An all-in-one AI SaaS platform for generating articles, blog titles, images, background removals, object edits, and resume reviews.";

export const APP_URL =
  import.meta.env.VITE_APP_URL || "http://localhost:5173";

export const SUPPORT_EMAIL = "support@quickai.app";

export const FREE_PLAN_LIMIT = {
  article: 10,
  "blog-title": 20,
  image: 10,
  "background-removal": 0,
  "object-removal": 0,
  "resume-review": 0,
} satisfies Record<ToolType, number>;

export const PREMIUM_PLAN_LIMIT = {
  article: 500,
  "blog-title": 800,
  image: 150,
  "background-removal": 300,
  "object-removal": 150,
  "resume-review": 100,
} satisfies Record<ToolType, number>;

export const PLAN_NAMES: Record<UserPlan, string> = {
  free: "Free",
  premium: "Premium",
};

export const PLAN_DESCRIPTIONS: Record<UserPlan, string> = {
  free: "Start with essential AI writing and image generation tools with limited monthly usage.",
  premium:
    "Unlock advanced image editing tools, resume review, and higher usage limits.",
};

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceSuffix: "/month",
    description: "Perfect for trying core AI writing and image generation tools.",
    badge: "Starter",
    href: ROUTES.dashboard,
    features: [
      "Article generator",
      "Blog title generator",
      "AI image generator",
      "Limited monthly credits",
      "Basic creation history",
      "Light and dark dashboard",
    ],
    limits: [
      "10 articles per month",
      "20 blog title generations per month",
      "10 AI images per month",
      "Advanced image editing tools locked",
    ],
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19",
    priceSuffix: "/month",
    description: "For creators, students, founders, and professionals.",
    badge: "Most Popular",
    href: ROUTES.billing,
    features: [
      "Everything in Free",
      "Higher AI image generation limits",
      "Background remover",
      "Object remover",
      "Resume reviewer",
      "Full creation history",
      "Priority generation",
      "Premium support",
    ],
    limits: [
      "500 articles per month",
      "800 blog title generations per month",
      "150 AI images per month",
      "300 background removals per month",
      "100 resume reviews per month",
    ],
    highlighted: true,
  },
] as const;

export const TOOL_CONFIG = {
  article: {
    title: "Article Writer",
    subtitle: "Generate polished long-form content",
    description:
      "Turn a short prompt into a structured, professional article with tone and length control.",
    buttonLabel: "Generate Article",
    inputLabel: "Article Topic",
    inputPlaceholder:
      "Example: Write an article about how AI tools help small businesses grow...",
    resultLabel: "Generated Article",
    emptyStateTitle: "Your article will appear here",
    emptyStateDescription:
      "Enter a topic, choose the length, and generate your article.",
    historyLabel: "Previous Articles",
    isPremium: false,
  },
  "blog-title": {
    title: "Blog Title Generator",
    subtitle: "Create catchy titles for any category",
    description:
      "Generate SEO-friendly and attention-grabbing blog titles for your chosen topic.",
    buttonLabel: "Generate Titles",
    inputLabel: "Blog Topic",
    inputPlaceholder:
      "Example: Remote work productivity tips for software engineers...",
    resultLabel: "Generated Titles",
    emptyStateTitle: "Your blog titles will appear here",
    emptyStateDescription:
      "Enter a topic, choose a category, and generate title ideas.",
    historyLabel: "Previous Titles",
    isPremium: false,
  },
  image: {
    title: "AI Image Generator",
    subtitle: "Create visuals from text prompts",
    description:
      "Transform your imagination into professional AI-generated images with different visual styles.",
    buttonLabel: "Generate Image",
    inputLabel: "Image Prompt",
    inputPlaceholder:
      "Example: A futuristic workspace floating above a neon city, cinematic lighting...",
    resultLabel: "Generated Image",
    emptyStateTitle: "Your image will appear here",
    emptyStateDescription:
      "Describe the image, choose a style, and generate a visual.",
    historyLabel: "Previous Images",
    isPremium: false,
  },
  "background-removal": {
    title: "Background Removal",
    subtitle: "Remove image backgrounds instantly",
    description:
      "Upload an image and remove the background for product photos, portraits, or creative assets.",
    buttonLabel: "Remove Background",
    inputLabel: "Upload Image",
    inputPlaceholder: "Upload JPG, PNG, or WebP image",
    resultLabel: "Processed Image",
    emptyStateTitle: "Your clean image will appear here",
    emptyStateDescription:
      "Upload an image and remove its background with one click.",
    historyLabel: "Previous Background Removals",
    isPremium: true,
  },
  "object-removal": {
    title: "Object Removal",
    subtitle: "Erase unwanted objects with AI",
    description:
      "Upload an image, describe the object you want removed, and generate a clean edited result.",
    buttonLabel: "Remove Object",
    inputLabel: "Object Description",
    inputPlaceholder:
      "Example: Remove the person in the background near the left side...",
    resultLabel: "Edited Image",
    emptyStateTitle: "Your edited image will appear here",
    emptyStateDescription:
      "Upload an image, describe what to remove, and generate the edited result.",
    historyLabel: "Previous Object Removals",
    isPremium: true,
  },
  "resume-review": {
    title: "Resume Review",
    subtitle: "Get professional resume feedback",
    description:
      "Upload your resume and receive AI-powered suggestions for structure, clarity, keywords, and impact.",
    buttonLabel: "Review Resume",
    inputLabel: "Upload Resume",
    inputPlaceholder: "Upload PDF, JPG, or PNG resume",
    resultLabel: "Resume Analysis",
    emptyStateTitle: "Your resume review will appear here",
    emptyStateDescription:
      "Upload your resume and generate a professional improvement report.",
    historyLabel: "Previous Resume Reviews",
    isPremium: true,
  },
} satisfies Record<
  ToolType,
  {
    title: string;
    subtitle: string;
    description: string;
    buttonLabel: string;
    inputLabel: string;
    inputPlaceholder: string;
    resultLabel: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    historyLabel: string;
    isPremium: boolean;
  }
>;

export const ARTICLE_LENGTH_OPTIONS = [
  {
    label: "Short",
    value: "short",
    description: "Around 400-600 words",
    tokenHint: 800,
  },
  {
    label: "Medium",
    value: "medium",
    description: "Around 800-1,200 words",
    tokenHint: 1600,
  },
  {
    label: "Long",
    value: "long",
    description: "Around 1,500-2,000 words",
    tokenHint: 2600,
  },
] as const;

export const ARTICLE_TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Persuasive",
  "Educational",
  "Storytelling",
  "Technical",
  "Luxury",
  "Casual",
] as const;

export const BLOG_CATEGORY_OPTIONS = [
  "Technology",
  "Business",
  "Marketing",
  "Education",
  "Health",
  "Finance",
  "Lifestyle",
  "Travel",
  "Food",
  "Fitness",
  "Startup",
  "AI",
  "Programming",
  "Productivity",
] as const;

export const BLOG_TITLE_STYLE_OPTIONS = [
  "SEO Optimized",
  "Listicle",
  "How-to",
  "Question Based",
  "Bold and Catchy",
  "Professional",
  "Beginner Friendly",
  "Viral Style",
] as const;

export const IMAGE_STYLE_OPTIONS = [
  {
    label: "Realistic",
    value: "realistic",
    promptPrefix: "Highly realistic, professional photography style",
  },
  {
    label: "Digital Art",
    value: "digital-art",
    promptPrefix: "High-quality digital art, vibrant lighting",
  },
  {
    label: "Anime",
    value: "anime",
    promptPrefix: "Anime inspired illustration, clean line art",
  },
  {
    label: "3D Render",
    value: "3d-render",
    promptPrefix: "Premium 3D render, cinematic composition",
  },
  {
    label: "Cyberpunk",
    value: "cyberpunk",
    promptPrefix: "Cyberpunk aesthetic, neon lights, futuristic mood",
  },
  {
    label: "Minimal",
    value: "minimal",
    promptPrefix: "Minimal modern design, clean composition",
  },
  {
    label: "Product Shot",
    value: "product-shot",
    promptPrefix: "Professional product photography, studio lighting",
  },
  {
    label: "Cinematic",
    value: "cinematic",
    promptPrefix: "Cinematic scene, dramatic lighting, high detail",
  },
] as const;

export const IMAGE_SIZE_OPTIONS = [
  {
    label: "Square",
    value: "square",
    description: "Best for social posts and general images",
  },
  {
    label: "Portrait",
    value: "portrait",
    description: "Best for mobile, posters, and profile visuals",
  },
  {
    label: "Landscape",
    value: "landscape",
    description: "Best for banners, covers, and hero images",
  },
] as const;

export const RESUME_REVIEW_FOCUS_OPTIONS = [
  "Overall Review",
  "ATS Optimization",
  "Grammar and Clarity",
  "Technical Resume",
  "Software Engineering Resume",
  "Internship Resume",
  "Leadership Resume",
  "Career Change Resume",
] as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const MAX_IMAGE_SIZE_MB = 10;

export const MAX_RESUME_SIZE_MB = 10;

export const CREATION_TYPES = [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
] satisfies ToolType[];

export const CREATION_STATUS = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;

export const DASHBOARD_STATS = [
  {
    label: "Total Creations",
    value: "0",
    description: "Generated outputs saved",
  },
  {
    label: "Free Credits Used",
    value: "0",
    description: "Monthly usage tracked",
  },
  {
    label: "Premium Tools",
    value: "3",
    description: "Advanced tools available",
  },
  {
    label: "Current Plan",
    value: "Free",
    description: "Upgrade anytime",
  },
] as const;

export const ADMIN_DEMO_STATS = [
  {
    label: "Total Users",
    value: "1,248",
    change: "+18.2%",
    trend: "up",
  },
  {
    label: "Premium Users",
    value: "326",
    change: "+9.4%",
    trend: "up",
  },
  {
    label: "Monthly Revenue",
    value: "$6,194",
    change: "+14.8%",
    trend: "up",
  },
  {
    label: "AI Generations",
    value: "8,921",
    change: "+22.1%",
    trend: "up",
  },
] as const;

export const ADMIN_CHART_DATA = [
  {
    month: "Jan",
    users: 320,
    premium: 48,
    revenue: 912,
    creations: 980,
  },
  {
    month: "Feb",
    users: 410,
    premium: 76,
    revenue: 1444,
    creations: 1320,
  },
  {
    month: "Mar",
    users: 580,
    premium: 105,
    revenue: 1995,
    creations: 2190,
  },
  {
    month: "Apr",
    users: 690,
    premium: 148,
    revenue: 2812,
    creations: 3180,
  },
  {
    month: "May",
    users: 850,
    premium: 201,
    revenue: 3819,
    creations: 4760,
  },
  {
    month: "Jun",
    users: 1040,
    premium: 265,
    revenue: 5035,
    creations: 6420,
  },
  {
    month: "Jul",
    users: 1248,
    premium: 326,
    revenue: 6194,
    creations: 8921,
  },
] as const;

export const TOOL_USAGE_DATA = [
  {
    name: "Articles",
    value: 34,
    type: "article",
  },
  {
    name: "Blog Titles",
    value: 28,
    type: "blog-title",
  },
  {
    name: "Images",
    value: 16,
    type: "image",
  },
  {
    name: "Background",
    value: 10,
    type: "background-removal",
  },
  {
    name: "Objects",
    value: 7,
    type: "object-removal",
  },
  {
    name: "Resume",
    value: 5,
    type: "resume-review",
  },
] satisfies Array<{
  name: string;
  value: number;
  type: ToolType;
}>;

export const RECENT_ACTIVITY_DEMO = [
  {
    id: "activity-1",
    user: "Sarah Khan",
    action: "generated an article",
    toolType: "article",
    createdAt: "2 minutes ago",
  },
  {
    id: "activity-2",
    user: "Nabil Rahman",
    action: "removed an image background",
    toolType: "background-removal",
    createdAt: "9 minutes ago",
  },
  {
    id: "activity-3",
    user: "Ayesha Islam",
    action: "reviewed a resume",
    toolType: "resume-review",
    createdAt: "18 minutes ago",
  },
  {
    id: "activity-4",
    user: "Tanvir Ahmed",
    action: "generated blog titles",
    toolType: "blog-title",
    createdAt: "27 minutes ago",
  },
] satisfies Array<{
  id: string;
  user: string;
  action: string;
  toolType: ToolType;
  createdAt: string;
}>;

export const EMPTY_CREATION_MESSAGE =
  "No creations yet. Choose a tool and generate your first result.";

export const GENERIC_ERROR_MESSAGE =
  "Something went wrong. Please try again in a moment.";

export const AUTH_REQUIRED_MESSAGE =
  "Please sign in to continue using QuickAI.";

export const PREMIUM_REQUIRED_MESSAGE =
  "This is a premium feature. Upgrade your plan to unlock it.";

export const FILE_UPLOAD_HELPER_TEXT =
  "Supported files: JPG, PNG, WebP. Maximum file size: 10MB.";

export const RESUME_UPLOAD_HELPER_TEXT =
  "Supported files: PDF, JPG, PNG. Maximum file size: 10MB.";

export const LOCAL_STORAGE_KEYS = {
  theme: "quickai-theme",
  sidebar: "quickai-sidebar",
  recentTool: "quickai-recent-tool",
  adminSession: "quickai-admin-session",
} as const;

export const API_ENDPOINTS = {
  generateArticle: "/api/generate-article",
  generateTitles: "/api/generate-titles",
  generateImage: "/api/generate-image",
  removeBackground: "/api/remove-background",
  removeObject: "/api/remove-object",
  reviewResume: "/api/review-resume",
  getCreations: "/api/get-creations",
  deleteCreation: "/api/delete-creation",
  adminStats: "/api/admin-stats",
  clerkWebhook: "/api/clerk-webhook",
} as const;

export const NETLIFY_FUNCTION_TIMEOUT_MS = 25_000;

export const TOAST_MESSAGES = {
  copied: "Copied to clipboard.",
  downloaded: "Download started.",
  saved: "Saved successfully.",
  deleted: "Deleted successfully.",
  generationStarted: "Generating your result...",
  generationCompleted: "Generation completed.",
  generationFailed: "Generation failed. Please try again.",
  premiumLocked: PREMIUM_REQUIRED_MESSAGE,
} as const;

export const THEME_GRADIENTS = {
  primary: "from-violet-600 via-fuchsia-600 to-cyan-500",
  dark: "from-slate-950 via-violet-950 to-slate-950",
  success: "from-emerald-400 via-teal-500 to-cyan-500",
  warning: "from-amber-400 via-orange-500 to-rose-500",
  danger: "from-rose-500 via-red-500 to-orange-500",
  admin: "from-red-500 via-violet-600 to-cyan-500",
} as const;

export const UI_SIZES = {
  sidebarWidth: 320,
  dashboardHeaderHeight: 76,
  mobileBreakpoint: 1024,
} as const;