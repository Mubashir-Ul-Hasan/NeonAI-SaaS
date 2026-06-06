/// <reference types="node" />

import type { Buffer } from "node:buffer";

export type UserPlan = "free" | "premium";

export type UserRole = "user" | "admin";

export type ToolType =
  | "article"
  | "blog-title"
  | "image"
  | "background-removal"
  | "object-removal"
  | "resume-review";

export type PremiumToolType =
  | "background-removal"
  | "object-removal"
  | "resume-review";

export type FreeToolType = "article" | "blog-title" | "image";

export type CreationStatus = "processing" | "completed" | "failed";

export type ApiUsageStatus = "success" | "failed" | "pending";

export type ApiProvider =
  | "gemini"
  | "clipdrop"
  | "cloudinary"
  | "resume-reviewer"
  | "system";

export type BillingStatus =
  | "free"
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "incomplete";

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type JsonRecord = Record<string, JsonValue>;

export type AppUser = {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  plan: UserPlan;
  role: UserRole;
  billingStatus: BillingStatus;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedUser = {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  plan: UserPlan;
  role: UserRole;
};

export type AuthContext = {
  user: AuthenticatedUser;
  clerkUserId: string;
};

export type AdminContext = AuthContext & {
  user: AuthenticatedUser & {
    role: "admin";
  };
};

export type Creation = {
  id: string;
  userId: string;
  clerkUserId: string;
  toolType: ToolType;
  prompt: string;
  resultText: string | null;
  resultImageUrl: string | null;
  cloudinaryPublicId: string | null;
  status: CreationStatus;
  isFavorite: boolean;
  metadata: JsonRecord;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicCreation = {
  id: string;
  toolType: ToolType;
  prompt: string;
  resultText: string | null;
  resultImageUrl: string | null;
  status: CreationStatus;
  isFavorite: boolean;
  metadata: JsonRecord;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiUsageLog = {
  id: string;
  userId: string | null;
  clerkUserId: string | null;
  creationId: string | null;
  toolType: ToolType | null;
  provider: ApiProvider;
  status: ApiUsageStatus;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
  errorMessage: string | null;
  metadata: JsonRecord;
  createdAt: Date;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export type GenerateArticleInput = {
  prompt: string;
  tone?: string;
  length?: "short" | "medium" | "long";
  keywords?: string[];
};

export type GenerateArticleOutput = {
  title: string;
  content: string;
  wordCount: number;
  readingTimeMinutes: number;
};

export type GenerateTitlesInput = {
  topic: string;
  category?: string;
  style?: string;
  count?: number;
};

export type GenerateTitlesOutput = {
  titles: string[];
};

export type ImageStyle =
  | "realistic"
  | "digital-art"
  | "anime"
  | "3d-render"
  | "cyberpunk"
  | "minimal"
  | "product-shot"
  | "cinematic";

export type ImageSize = "square" | "portrait" | "landscape";

export interface GenerateImageInput {
  prompt: string;
  negativePrompt?: string;
  style?: ImageStyle;
  size?: ImageSize;
}

export type GenerateImageOutput = {
  imageUrl: string;
  cloudinaryPublicId?: string;
  metadata?: JsonRecord;
};

export type RemoveBackgroundInput = {
  imageBuffer: Buffer;
  fileName: string;
  mimeType: string;
};

export type RemoveBackgroundOutput = {
  imageUrl: string;
  cloudinaryPublicId?: string;
  originalFileSize: number;
  outputFileSize?: number;
};

export type RemoveObjectInput = {
  imageBuffer: Buffer;
  fileName: string;
  mimeType: string;
  objectPrompt: string;
};

export type RemoveObjectOutput = {
  imageUrl: string;
  cloudinaryPublicId?: string;
  originalFileSize: number;
  outputFileSize?: number;
};

export type ReviewResumeInput = {
  resumeBuffer: Buffer;
  fileName: string;
  mimeType: string;
  targetRole?: string;
  focus?: string;
};

export type ResumeReviewOutput = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  atsSuggestions: string[];
  fullReview: string;
};

export type UploadedFile = {
  fieldName: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
};

export type CreateCreationInput = {
  userId: string;
  clerkUserId: string;
  toolType: ToolType;
  prompt: string;
  resultText?: string | null;
  resultImageUrl?: string | null;
  cloudinaryPublicId?: string | null;
  status?: CreationStatus;
  isFavorite?: boolean;
  metadata?: JsonRecord;
  errorMessage?: string | null;
};

export type UpdateCreationInput = Partial<
  Pick<
    Creation,
    | "resultText"
    | "resultImageUrl"
    | "cloudinaryPublicId"
    | "status"
    | "isFavorite"
    | "metadata"
    | "errorMessage"
  >
>;

export type GetCreationsParams = PaginationParams & {
  toolType?: ToolType;
  status?: CreationStatus;
  search?: string;
};

export type DeleteCreationResult = {
  id: string;
  deleted: boolean;
  deletedCloudinaryAsset: boolean;
};

export type UsageLimitResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  plan: UserPlan;
};

export type TrackUsageInput = {
  userId?: string | null;
  clerkUserId?: string | null;
  creationId?: string | null;
  toolType?: ToolType | null;
  provider: ApiProvider;
  status: ApiUsageStatus;
  tokensUsed?: number;
  costUsd?: number;
  latencyMs?: number;
  errorMessage?: string | null;
  metadata?: JsonRecord;
};

export type AdminStats = {
  totalUsers: number;
  premiumUsers: number;
  totalCreations: number;
  totalApiCalls: number;
  totalRevenueUsd: number;
  failedApiCalls: number;
  recentCreations: PublicCreation[];
  usageByTool: Array<{
    toolType: ToolType;
    count: number;
  }>;
};

export type ClerkWebhookEventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "session.created"
  | "session.ended"
  | "organizationMembership.created"
  | "organizationMembership.updated"
  | "organizationMembership.deleted";

export type ClerkWebhookUserData = {
  id: string;
  email_addresses?: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
};

export type ClerkWebhookPayload = {
  type: ClerkWebhookEventType;
  data: ClerkWebhookUserData;
};

export type NetlifyFunctionHeaders = Record<string, string>;

export type HandlerMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

export type RequestBody<T> = {
  body: T;
};

export type MaybePromise<T> = T | Promise<T>;