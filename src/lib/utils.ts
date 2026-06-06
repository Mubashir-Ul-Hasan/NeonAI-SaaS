import { format, formatDistanceToNow } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type ToolType =
  | "article"
  | "blog-title"
  | "image"
  | "background-removal"
  | "object-removal"
  | "resume-review";

export type UserPlan = "free" | "premium";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "MMM dd, yyyy") {
  if (!date) return "Unknown date";

  try {
    return format(new Date(date), pattern);
  } catch {
    return "Invalid date";
  }
}

export function formatRelativeTime(date: string | Date) {
  if (!date) return "Unknown time";

  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "Invalid time";
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const safeIndex = Math.min(index, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(1024, safeIndex)).toFixed(2))} ${
    sizes[safeIndex]
  }`;
}

export function truncateText(text: string, maxLength = 120) {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trim()}...`;
}

export function toTitleCase(value: string) {
  if (!value) return "";

  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

export function isPremiumTool(toolType: ToolType) {
  return [
    "background-removal",
    "object-removal",
    "resume-review",
  ].includes(toolType);
}

export function canUseTool(toolType: ToolType, plan: UserPlan) {
  if (plan === "premium") return true;

  return !isPremiumTool(toolType);
}

export function getToolLabel(toolType: ToolType) {
  const labels: Record<ToolType, string> = {
    article: "Article Writer",
    "blog-title": "Blog Title Generator",
    image: "AI Image Generator",
    "background-removal": "Background Removal",
    "object-removal": "Object Removal",
    "resume-review": "Resume Review",
  };

  return labels[toolType];
}

export function getToolDescription(toolType: ToolType) {
  const descriptions: Record<ToolType, string> = {
    article:
      "Generate polished articles from simple prompts with flexible length control.",
    "blog-title":
      "Create catchy, SEO-friendly blog titles for different industries.",
    image:
      "Turn text prompts into stunning AI-generated images with style options.",
    "background-removal":
      "Remove image backgrounds quickly and export clean professional assets.",
    "object-removal":
      "Remove unwanted objects from images using AI-powered editing.",
    "resume-review":
      "Analyze resumes and get professional improvement suggestions.",
  };

  return descriptions[toolType];
}

export function getToolGradient(toolType: ToolType) {
  const gradients: Record<ToolType, string> = {
    article: "from-blue-500 via-indigo-500 to-cyan-400",
    "blog-title": "from-fuchsia-500 via-violet-500 to-indigo-500",
    image: "from-emerald-400 via-green-500 to-teal-500",
    "background-removal": "from-orange-400 via-rose-500 to-red-500",
    "object-removal": "from-sky-500 via-blue-500 to-violet-600",
    "resume-review": "from-teal-400 via-cyan-500 to-blue-600",
  };

  return gradients[toolType];
}

export function getToolAccentColor(toolType: ToolType) {
  const colors: Record<ToolType, string> = {
    article: "text-blue-500",
    "blog-title": "text-violet-500",
    image: "text-emerald-500",
    "background-removal": "text-orange-500",
    "object-removal": "text-blue-500",
    "resume-review": "text-teal-500",
  };

  return colors[toolType];
}

export function getToolBgColor(toolType: ToolType) {
  const colors: Record<ToolType, string> = {
    article: "bg-blue-500/10",
    "blog-title": "bg-violet-500/10",
    image: "bg-emerald-500/10",
    "background-removal": "bg-orange-500/10",
    "object-removal": "bg-blue-500/10",
    "resume-review": "bg-teal-500/10",
  };

  return colors[toolType];
}

export function validateImageFile(file: File, maxSizeMB = 10) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const maxSize = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Please upload a JPG, PNG, or WebP image.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Image must be smaller than ${maxSizeMB}MB.`,
    };
  }

  return {
    valid: true,
    message: "Valid image.",
  };
}

export function validateResumeFile(file: File, maxSizeMB = 10) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  const maxSize = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Please upload a PDF, JPG, or PNG resume.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Resume file must be smaller than ${maxSizeMB}MB.`,
    };
  }

  return {
    valid: true,
    message: "Valid resume.",
  };
}

export function buildApiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `/api${cleanPath}`;
}

export async function copyToClipboard(text: string) {
  if (!navigator.clipboard) {
    throw new Error("Clipboard is not supported in this browser.");
  }

  await navigator.clipboard.writeText(text);
}

export function downloadFromUrl(url: string, filename = "quickai-download") {
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function createPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}

export function revokePreviewUrl(url?: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomId(prefix = "quickai") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (typeof error === "string") return error;

  return "Something went wrong. Please try again.";
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getUsagePercentage(used: number, limit: number) {
  if (limit <= 0) return 0;

  return Math.min(Math.round((used / limit) * 100), 100);
}

export function getPlanLabel(plan?: UserPlan | null) {
  if (plan === "premium") return "Premium";

  return "Free";
}

export function isBrowser() {
  return typeof window !== "undefined";
}

export function getWordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function readingTime(text: string) {
  const wordsPerMinute = 220;
  const words = getWordCount(text);
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));

  return `${minutes} min read`;
}

export function downloadTextFile({
  filename,
  content,
  mimeType = "text/plain;charset=utf-8",
}: {
  filename: string;
  content: string;
  mimeType?: string;
}) {
  const blob = new Blob([content], {
    type: mimeType,
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}