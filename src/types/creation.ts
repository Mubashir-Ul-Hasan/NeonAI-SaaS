import type { ToolType } from "../lib/utils";

export type CreationStatus = "pending" | "processing" | "completed" | "failed";

export type CreationVisibility = "private" | "public";

export type CreationSortOption = "newest" | "oldest" | "favorites";

export type CreationViewMode = "grid" | "list";

export type CreationMetadata = {
  articleLength?: "short" | "medium" | "long";
  articleTone?: string;

  blogCategory?: string;
  titleStyle?: string;
  titleCount?: number;

  imageStyle?: string;
  imageSize?: string;

  removedObjectPrompt?: string;

  resumeFocus?: string;
  resumeScore?: number;
  resumeStrengths?: string[];
  resumeImprovements?: string[];

  model?: string;
  provider?: "gemini" | "clipdrop" | "cloudinary" | "openai" | "other";

  creditsUsed?: number;
  processingTimeMs?: number;

  originalFileName?: string;
  originalFileSize?: number;
  originalFileType?: string;

  [key: string]: unknown;
};

export type Creation = {
  id: string;
  userId: string;
  toolType: ToolType;

  title?: string | null;
  prompt?: string | null;

  resultText?: string | null;
  resultImageUrl?: string | null;
  inputImageUrl?: string | null;

  metadata?: CreationMetadata | null;

  status: CreationStatus;
  visibility?: CreationVisibility;
  isFavorite: boolean;

  errorMessage?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type TextCreation = Creation & {
  toolType: "article" | "blog-title" | "resume-review";
  resultText: string;
};

export type ImageCreation = Creation & {
  toolType: "image" | "background-removal" | "object-removal";
  resultImageUrl: string;
};

export type ArticleCreation = Creation & {
  toolType: "article";
  resultText: string;
  metadata?: CreationMetadata & {
    articleLength?: "short" | "medium" | "long";
    articleTone?: string;
  };
};

export type BlogTitleCreation = Creation & {
  toolType: "blog-title";
  resultText: string;
  metadata?: CreationMetadata & {
    blogCategory?: string;
    titleStyle?: string;
    titleCount?: number;
  };
};

export type GeneratedImageCreation = Creation & {
  toolType: "image";
  resultImageUrl: string;
  metadata?: CreationMetadata & {
    imageStyle?: string;
    imageSize?: string;
  };
};

export type BackgroundRemovalCreation = Creation & {
  toolType: "background-removal";
  inputImageUrl: string;
  resultImageUrl: string;
};

export type ObjectRemovalCreation = Creation & {
  toolType: "object-removal";
  inputImageUrl: string;
  resultImageUrl: string;
  prompt: string;
  metadata?: CreationMetadata & {
    removedObjectPrompt?: string;
  };
};

export type ResumeReviewCreation = Creation & {
  toolType: "resume-review";
  resultText: string;
  metadata?: CreationMetadata & {
    resumeFocus?: string;
    resumeScore?: number;
    resumeStrengths?: string[];
    resumeImprovements?: string[];
  };
};

export type CreationListResponse = {
  creations: Creation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type CreationQueryParams = {
  toolType?: ToolType | "all";
  status?: CreationStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
  sort?: CreationSortOption;
  favoritesOnly?: boolean;
};

export type CreateCreationPayload = {
  toolType: ToolType;
  title?: string;
  prompt?: string;
  resultText?: string;
  resultImageUrl?: string;
  inputImageUrl?: string;
  metadata?: CreationMetadata;
  status?: CreationStatus;
};

export type UpdateCreationPayload = {
  creationId: string;
  title?: string;
  isFavorite?: boolean;
  visibility?: CreationVisibility;
  metadata?: CreationMetadata;
};

export type DeleteCreationPayload = {
  creationId: string;
};

export type CreationActionResult = {
  success: boolean;
  message: string;
  creation?: Creation;
};

export type CreationHistoryGroup = {
  label: string;
  date: string;
  creations: Creation[];
};

export type CreationStats = {
  total: number;
  completed: number;
  failed: number;
  favorites: number;
  byTool: Record<ToolType, number>;
};

export type ToolHistoryPreview = {
  toolType: ToolType;
  latestCreation?: Creation;
  totalCreations: number;
  lastUsedAt?: string | null;
};

export type GeneratedArticleResult = {
  article: string;
  creation: ArticleCreation;
};

export type GeneratedTitlesResult = {
  titles: string[];
  creation: BlogTitleCreation;
};

export type GeneratedImageResult = {
  imageUrl: string;
  creation: GeneratedImageCreation;
};

export type RemovedBackgroundResult = {
  imageUrl: string;
  creation: BackgroundRemovalCreation;
};

export type RemovedObjectResult = {
  imageUrl: string;
  creation: ObjectRemovalCreation;
};

export type ResumeReviewResult = {
  analysis: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  creation: ResumeReviewCreation;
};

export function isTextCreation(creation: Creation): creation is TextCreation {
  return (
    creation.toolType === "article" ||
    creation.toolType === "blog-title" ||
    creation.toolType === "resume-review"
  );
}

export function isImageCreation(creation: Creation): creation is ImageCreation {
  return (
    creation.toolType === "image" ||
    creation.toolType === "background-removal" ||
    creation.toolType === "object-removal"
  );
}

export function isCompletedCreation(creation: Creation) {
  return creation.status === "completed";
}

export function isFailedCreation(creation: Creation) {
  return creation.status === "failed";
}

export function hasCreationResult(creation: Creation) {
  return Boolean(creation.resultText || creation.resultImageUrl);
}

export function getCreationPreview(creation: Creation) {
  if (creation.resultText) {
    return creation.resultText.slice(0, 160);
  }

  if (creation.resultImageUrl) {
    return "Generated image result";
  }

  if (creation.errorMessage) {
    return creation.errorMessage;
  }

  return "No preview available";
}