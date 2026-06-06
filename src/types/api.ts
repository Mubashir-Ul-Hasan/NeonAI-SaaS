import type { ToolType, UserPlan } from "../lib/utils";
import type {
  Creation,
  CreationMetadata,
  CreationQueryParams,
  CreationStats,
} from "./creation";
import type {
  AdminUserListItem,
  AdminUserQueryParams,
  AppUser,
  SubscriptionStatus,
  UserBillingInfo,
  UserNotification,
  UserPreferences,
  UserSession,
  UserUsage,
} from "./user";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiStatus = "idle" | "loading" | "success" | "error";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "USAGE_LIMIT_REACHED"
  | "PREMIUM_REQUIRED"
  | "RATE_LIMITED"
  | "AI_PROVIDER_ERROR"
  | "UPLOAD_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  code?: ApiErrorCode | string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type ApiRequestConfig = {
  method?: ApiMethod;
  token?: string | null;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export type ApiQueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type UploadedAsset = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resourceType?: "image" | "video" | "raw";
};

export type FileUploadResponse = {
  asset: UploadedAsset;
};

export type GenerateArticleRequest = {
  prompt: string;
  length: "short" | "medium" | "long";
  tone?: string;
};

export type GenerateArticleResponse = {
  article: string;
  creation: Creation;
  creditsUsed: number;
};

export type GenerateTitlesRequest = {
  prompt: string;
  category: string;
  style?: string;
  count?: number;
};

export type GenerateTitlesResponse = {
  titles: string[];
  creation: Creation;
  creditsUsed: number;
};

export type GenerateImageRequest = {
  prompt: string;
  style: string;
  size?: string;
};

export type GenerateImageResponse = {
  imageUrl: string;
  creation: Creation;
  creditsUsed: number;
};

export type RemoveBackgroundRequest = {
  image: File;
};

export type RemoveBackgroundResponse = {
  imageUrl: string;
  originalImageUrl?: string;
  creation: Creation;
  creditsUsed: number;
};

export type RemoveObjectRequest = {
  image: File;
  prompt: string;
};

export type RemoveObjectResponse = {
  imageUrl: string;
  originalImageUrl?: string;
  creation: Creation;
  creditsUsed: number;
};

export type ReviewResumeRequest = {
  resume: File;
  focus?: string;
};

export type ReviewResumeResponse = {
  analysis: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  creation: Creation;
  creditsUsed: number;
};

export type GetCreationsRequest = CreationQueryParams;

export type GetCreationsResponse = {
  creations: Creation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  stats?: CreationStats;
};

export type GetCreationByIdRequest = {
  creationId: string;
};

export type GetCreationByIdResponse = {
  creation: Creation;
};

export type DeleteCreationRequest = {
  creationId: string;
};

export type DeleteCreationResponse = {
  deletedId: string;
};

export type UpdateCreationRequest = {
  creationId: string;
  title?: string;
  isFavorite?: boolean;
  metadata?: CreationMetadata;
};

export type UpdateCreationResponse = {
  creation: Creation;
};

export type ToggleFavoriteRequest = {
  creationId: string;
  isFavorite: boolean;
};

export type ToggleFavoriteResponse = {
  creationId: string;
  isFavorite: boolean;
};

export type GetCurrentUserResponse = {
  user: AppUser;
  session: UserSession;
};

export type SyncCurrentUserResponse = {
  user: AppUser;
  created: boolean;
};

export type UpdateUserProfileRequest = {
  name?: string;
  imageUrl?: string | null;
};

export type UpdateUserProfileResponse = {
  user: AppUser;
};

export type UpdateUserPreferencesRequest = Partial<UserPreferences>;

export type UpdateUserPreferencesResponse = {
  preferences: UserPreferences;
};

export type GetUserUsageResponse = {
  usage: UserUsage;
  plan: UserPlan;
  resetAt?: string | null;
};

export type GetUserNotificationsResponse = {
  notifications: UserNotification[];
  unreadCount: number;
};

export type MarkNotificationReadRequest = {
  notificationId: string;
};

export type MarkNotificationReadResponse = {
  notificationId: string;
  isRead: boolean;
};

export type StartCheckoutRequest = {
  plan: UserPlan;
  returnUrl?: string;
};

export type StartCheckoutResponse = {
  checkoutUrl: string;
};

export type BillingPortalResponse = {
  portalUrl: string;
};

export type GetBillingInfoResponse = {
  billing: UserBillingInfo;
};

export type SubscriptionWebhookPayload = {
  userId?: string;
  clerkUserId?: string;
  plan?: UserPlan;
  status?: SubscriptionStatus;
  subscriptionId?: string;
  currentPeriodEnd?: string | null;
  metadata?: Record<string, unknown>;
};

export type AdminStatsResponse = {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalCreations: number;
  monthlyRevenue: number;
  totalRevenue: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  toolUsage: Array<{
    toolType: ToolType;
    count: number;
    percentage: number;
  }>;
  revenueChart: Array<{
    month: string;
    revenue: number;
    users: number;
    premium: number;
    creations: number;
  }>;
  recentActivity: Array<{
    id: string;
    user: string;
    action: string;
    toolType?: ToolType | null;
    createdAt: string;
  }>;
};

export type AdminUsersRequest = AdminUserQueryParams;

export type AdminUsersResponse = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type AdminUserDetailsRequest = {
  userId: string;
};

export type AdminUserDetailsResponse = {
  user: AdminUserListItem;
  creations: Creation[];
  billing?: UserBillingInfo | null;
};

export type AdminCreationsRequest = {
  search?: string;
  toolType?: ToolType | "all";
  status?: "pending" | "processing" | "completed" | "failed" | "all";
  page?: number;
  limit?: number;
};

export type AdminCreationsResponse = {
  creations: Creation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type AdminRevenueResponse = {
  monthlyRevenue: number;
  totalRevenue: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  chart: Array<{
    month: string;
    revenue: number;
    premiumUsers: number;
  }>;
};

export type AdminUsageResponse = {
  totalGenerations: number;
  totalCreditsUsed: number;
  toolUsage: Array<{
    toolType: ToolType;
    generations: number;
    creditsUsed: number;
  }>;
};

export type AdminLoginRequest = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  success: boolean;
  token?: string;
  expiresAt?: string;
};

export type HealthCheckResponse = {
  status: "ok" | "error";
  app: string;
  timestamp: string;
  environment: "development" | "production" | "preview" | string;
};

export type NetlifyFunctionContext = {
  userId?: string;
  clerkUserId?: string;
  email?: string;
  role?: "user" | "admin";
  plan?: UserPlan;
};

export type ServerValidationError = {
  field: string;
  message: string;
};

export type ServerActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: {
    message: string;
    code?: ApiErrorCode | string;
    validationErrors?: ServerValidationError[];
  };
};

export type FormState<T = unknown> = {
  status: ApiStatus;
  data?: T;
  error?: string | null;
};

export type MutationState<T = unknown> = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  data?: T;
  error?: string | null;
};

export type ToolGenerationState<T = unknown> = {
  status: ApiStatus;
  result?: T;
  creation?: Creation;
  error?: string | null;
  progress?: number;
};

export function isApiSuccess<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiError<T>(
  response: ApiResponse<T>,
): response is ApiErrorResponse {
  return response.success === false;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createErrorResponse({
  message,
  code,
  details,
}: {
  message: string;
  code?: ApiErrorCode | string;
  details?: unknown;
}): ApiErrorResponse {
  return {
    success: false,
    message,
    code,
    details,
  };
}

export function createInitialFormState<T = unknown>(): FormState<T> {
  return {
    status: "idle",
    data: undefined,
    error: null,
  };
}

export function createLoadingFormState<T = unknown>(
  previousData?: T,
): FormState<T> {
  return {
    status: "loading",
    data: previousData,
    error: null,
  };
}

export function createSuccessFormState<T>(data: T): FormState<T> {
  return {
    status: "success",
    data,
    error: null,
  };
}

export function createErrorFormState<T = unknown>(error: string): FormState<T> {
  return {
    status: "error",
    error,
  };
}