export type UserPlan = "free" | "premium";

export type UserRole = "user" | "admin";

export type ToolType =
  | "article"
  | "blog-title"
  | "image"
  | "background-removal"
  | "object-removal"
  | "resume-review";

export type CreationStatus = "processing" | "completed" | "failed";

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type JsonRecord = Record<string, JsonValue>;

export type ApiSuccessResponse<T> = {
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

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiRequestOptions = {
  token?: string | null;
  signal?: AbortSignal;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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

export type UserSummaryResponse = {
  user: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    plan: UserPlan;
    role: UserRole;
  };
  plan: {
    current: UserPlan;
    role: UserRole;
    billingStatus: string;
    subscriptionCurrentPeriodEnd: string | null;
  };
  usage: {
    monthStartedAt: string;
    usedThisMonth: number;
    limit: number;
    remaining: number;
  };
  creations: {
    total: number;
    recentCount: number;
    counts: {
      total: number;
      completed: number;
      processing: number;
      failed: number;
      favorites: number;
    };
  };
  usageByTool: Array<{
    toolType: ToolType;
    count: number;
    tokensUsed: number;
    costUsd: number;
  }>;
  toolAccess: Array<{
    allowed: boolean;
    requiresPremium: boolean;
    plan: UserPlan;
    toolType: ToolType;
  }>;
  account: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type GenerateArticleInput = {
  prompt: string;
  tone?: string;
  length?: "short" | "medium" | "long";
  keywords?: string[];
};

export type GenerateArticleResponse = {
  creation: PublicCreation;
  article: {
    title: string;
    content: string;
    wordCount: number;
    readingTimeMinutes: number;
  };
  usage: UsageResponse;
};

export type GenerateTitlesInput = {
  topic: string;
  category?: string;
  style?: string;
  count?: number;
};

export type GenerateTitlesResponse = {
  creation: PublicCreation;
  titles: string[];
  usage: UsageResponse;
};

export type GenerateImageInput = {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  size?: string;
};

export type GenerateImageResponse = {
  creation: PublicCreation;
  image: {
    imageUrl: string;
    resultImageUrl?: string;
    cloudinaryPublicId: string;
    width: number | null;
    height: number | null;
    format: string;
    bytes: number;
  };
  imageUrl?: string;
  resultImageUrl?: string;
  usage: UsageResponse;
};

export type ImageToolResponse = {
  creation: PublicCreation;
  image: {
    imageUrl: string;
    cloudinaryPublicId: string;
    width: number | null;
    height: number | null;
    format: string;
    bytes: number;
  };
  usage: UsageResponse;
};

export type ReviewResumeResponse = {
  creation: PublicCreation;
  review: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    atsSuggestions: string[];
    fullReview: string;
    extraction: {
      method: string;
      metadata: JsonRecord;
    };
  };
  usage: UsageResponse;
};

export type UsageResponse = {
  used: number;
  limit: number;
  remaining: number;
  plan: UserPlan;
};

export type GetCreationsParams = {
  page?: number;
  limit?: number;
  toolType?: ToolType;
  status?: CreationStatus;
  search?: string;
  includeFailed?: boolean;
};

export type GetCreationsResponse = {
  creations: PublicCreation[];
  pagination: PaginationMeta;
  counts: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    favorites: number;
  };
  usage: {
    used: number;
    limit: number;
    remaining: number;
    plan: UserPlan;
    periodStartedAt: string;
  };
  filters: {
    toolType: ToolType | null;
    status: CreationStatus | null;
    search: string | null;
    includeFailed: boolean;
  };
};

export type DeleteCreationInput = {
  creationId: string;
  deleteCloudinaryAsset?: boolean;
};

export type DeleteCreationResponse = {
  deleted: boolean;
  creationId: string;
  deletedCloudinaryAsset: boolean;
};

export type AdminStatsResponse = {
  admin: {
    id: string;
    clerkUserId: string;
    email: string;
    role: UserRole;
  };
  period: "day" | "week" | "month";
  overview: Record<string, number>;
  charts: {
    usageByTool: Array<{
      toolType: ToolType;
      count: number;
      tokensUsed: number;
      costUsd: number;
    }>;
    creationCountsByTool: Array<{
      toolType: ToolType;
      count: number;
    }>;
  };
  recent: {
    creations: PublicCreation[];
    usageLogs: Array<Record<string, unknown>>;
    users: Array<Record<string, unknown>>;
  };
  revenue: {
    premiumPlanPriceUsd: number;
    estimatedMonthlyRevenueUsd: number;
    note: string;
  };
};

export type CheckoutResponse = {
  checkoutUrl: string;
  setupRequired: boolean;
  provider: "clerk-billing";
  planId: string;
  returnUrl: string;
  message: string;
};

export type BillingPortalResponse = {
  portalUrl: string;
  setupRequired: boolean;
  provider: "clerk-billing";
  returnUrl: string;
  message: string;
};

export type HealthResponse = {
  status: "healthy" | "degraded";
  checkedAt: string;
  latencyMs: number;
  services: Record<string, string>;
  database: Record<string, unknown>;
  env: Record<string, unknown>;
  note: string;
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor({
    message,
    code,
    status,
    details,
  }: {
    message: string;
    code: string;
    status: number;
    details?: unknown;
  }) {
    super(message);

    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export async function apiFetch<T>(
  path: string,
  options: RequestInit & ApiRequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(buildApiUrl(path), {
    ...requestOptions,
    headers: {
      ...(requestOptions.body instanceof FormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...headers,
    },
  });

  const payload = await parseApiPayload<T>(response);

  if (!response.ok) {
    throw createApiErrorFromPayload(payload, response.status);
  }

  if (isApiErrorResponse(payload)) {
    throw new ApiError({
      message: payload.error.message,
      code: payload.error.code,
      status: response.status,
      details: payload.error.details,
    });
  }

  if (isApiSuccessResponse<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/health", {
    method: "GET",
  });
}

export async function getUserSummary(
  options?: ApiRequestOptions | AuthToken,
): Promise<UserSummaryResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<UserSummaryResponse>("/api/get-user-summary", {
    method: "GET",
    token: requestOptions.token,
    signal: requestOptions.signal,
  });
}

export async function generateArticle(
  input: GenerateArticleInput,
  options?: ApiRequestOptions | AuthToken,
): Promise<GenerateArticleResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<GenerateArticleResponse>("/api/generate-article", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: JSON.stringify(input),
  });
}

export async function generateTitles(
  input: GenerateTitlesInput,
  options?: ApiRequestOptions | AuthToken,
): Promise<GenerateTitlesResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<GenerateTitlesResponse>("/api/generate-titles", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: JSON.stringify(input),
  });
}

export async function generateImage(
  input: GenerateImageInput,
  options?: ApiRequestOptions | AuthToken,
): Promise<GenerateImageResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<GenerateImageResponse>("/api/generate-image", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: JSON.stringify(input),
  });
}


export async function removeBackground(
  input: {
    file: File;
    prompt?: string;
  },
  options?: ApiRequestOptions | AuthToken,
): Promise<ImageToolResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  const formData = new FormData();

  formData.append("file", input.file);

  if (input.prompt) {
    formData.append("prompt", input.prompt);
  }

  return apiFetch<ImageToolResponse>("/api/remove-background", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: formData,
  });
}

export async function removeObject(
  input: {
    file: File;
    maskFile: File;
    prompt: string;
  },
  options?: ApiRequestOptions | AuthToken,
): Promise<ImageToolResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  const formData = new FormData();

  formData.append("file", input.file);
  formData.append("mask_file", input.maskFile);
  formData.append("prompt", input.prompt);

  return apiFetch<ImageToolResponse>("/api/remove-object", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: formData,
  });
}

export async function reviewResume(
  input: {
    file: File;
    targetRole?: string;
    focus?: string;
  },
  options?: ApiRequestOptions | AuthToken,
): Promise<ReviewResumeResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  const formData = new FormData();

  formData.append("file", input.file);

  if (input.targetRole) {
    formData.append("targetRole", input.targetRole);
  }

  if (input.focus) {
    formData.append("focus", input.focus);
  }

  return apiFetch<ReviewResumeResponse>("/api/review-resume", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: formData,
  });
}

export async function getCreations(
  params: GetCreationsParams,
  options?: ApiRequestOptions | AuthToken,
): Promise<GetCreationsResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<GetCreationsResponse>(
    buildPathWithQuery("/api/get-creations", params),
    {
      method: "GET",
      token: requestOptions.token,
      signal: requestOptions.signal,
    },
  );
}

export async function deleteCreation(
  input: DeleteCreationInput,
  options?: ApiRequestOptions | AuthToken,
): Promise<DeleteCreationResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<DeleteCreationResponse>("/api/delete-creation", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: JSON.stringify(input),
  });
}

export async function getAdminStats(
  options:
    | (ApiRequestOptions & {
        period?: "day" | "week" | "month";
      })
    | AuthToken = {},
): Promise<AdminStatsResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  const period =
    typeof options === "object" && options !== null ? options.period : undefined;

  return apiFetch<AdminStatsResponse>(
    buildPathWithQuery("/api/admin-stats", {
      period,
    }),
    {
      method: "GET",
      token: requestOptions.token,
      signal: requestOptions.signal,
    },
  );
}

export async function createCheckout(
  input: {
    planId?: string;
    returnUrl?: string;
  },
  options?: ApiRequestOptions | AuthToken,
): Promise<CheckoutResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<CheckoutResponse>("/api/create-checkout", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: JSON.stringify(input),
  });
}

export async function createBillingPortal(
  input: {
    returnUrl?: string;
  },
  options?: ApiRequestOptions | AuthToken,
): Promise<BillingPortalResponse> {
  const requestOptions = normalizeApiRequestOptions(options);

  return apiFetch<BillingPortalResponse>("/api/create-billing-portal", {
    method: "POST",
    token: requestOptions.token,
    signal: requestOptions.signal,
    body: JSON.stringify(input),
  });
}

export async function openCheckout(
  input: {
    planId?: string;
    returnUrl?: string;
  },
  options: ApiRequestOptions,
): Promise<CheckoutResponse> {
  const checkout = await createCheckout(input, options);

  window.location.href = checkout.checkoutUrl;

  return checkout;
}

export async function openBillingPortal(
  input: {
    returnUrl?: string;
  },
  options: ApiRequestOptions,
): Promise<BillingPortalResponse> {
  const portal = await createBillingPortal(input, options);

  window.location.href = portal.portalUrl;

  return portal;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function isPremiumRequiredError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 402 || error.code === "PREMIUM_REQUIRED")
  );
}

export function isUsageLimitError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 429 || error.code === "USAGE_LIMIT_REACHED")
  );
}

export const api = {
  getHealth,
  getUserSummary,
  generateArticle,
  generateTitles,
  generateImage,
  removeBackground,
  removeObject,
  reviewResume,
  getCreations,
  deleteCreation,
  getAdminStats,
  createCheckout,
  createBillingPortal,
  openCheckout,
  openBillingPortal,
};

async function parseApiPayload<T>(response: Response): Promise<ApiResponse<T> | T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    if (!response.ok) {
      throw new ApiError({
        message: text || response.statusText || "Request failed.",
        code: "HTTP_ERROR",
        status: response.status,
      });
    }

    return text as T;
  }

  return (await response.json()) as ApiResponse<T> | T;
}

function createApiErrorFromPayload(payload: unknown, status: number): ApiError {
  if (isApiErrorResponse(payload)) {
    return new ApiError({
      message: payload.error.message,
      code: payload.error.code,
      status,
      details: payload.error.details,
    });
  }

  return new ApiError({
    message: "Request failed.",
    code: "HTTP_ERROR",
    status,
    details: payload,
  });
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success?: unknown }).success === true &&
    "data" in value
  );
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success?: unknown }).success === false &&
    "error" in value
  );
}

function normalizeApiBaseUrl(value: unknown): string {
  if (typeof value !== "string") return "";

  return value.trim().replace(/\/$/, "");
}

function buildApiUrl(path: string): string {
  if (!API_BASE_URL) return path;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${cleanPath}`;
}

function normalizeApiRequestOptions(
  options?: ApiRequestOptions | AuthToken,
): ApiRequestOptions {
  if (typeof options === "string" || options === null || options === undefined) {
    return {
      token: options,
    };
  }

  return options;
}

function buildPathWithQuery(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `${path}?${queryString}` : path;
}

// -----------------------------------------------------------------------------
// Backward-compatible type aliases
// These keep older dashboard/components/hooks working while the new API client
// uses newer internal type names.
// -----------------------------------------------------------------------------

export type AuthToken = string | null | undefined;

export type Creation = Omit<PublicCreation, "metadata" | "errorMessage"> & {
  userId?: string;
  clerkUserId?: string;

  inputImageUrl?: string | null;
  outputImageUrl?: string | null;
  cloudinaryPublicId?: string | null;

  originalFileName?: string | null;
  originalFileSize?: number | string | null;
  outputFileSize?: number | string | null;

  metadata: JsonRecord | null;
  errorMessage?: string | null;

  [key: string]: unknown;
};

export type GenerateArticlePayload = GenerateArticleInput;
export type GenerateArticleResult = GenerateArticleResponse;

export type GenerateTitlesPayload = GenerateTitlesInput;
export type GenerateTitlesResult = GenerateTitlesResponse;

export type GenerateImagePayload = GenerateImageInput;
export type GenerateImageResult = GenerateImageResponse;

export type RemoveBackgroundPayload = {
  file: File;
  prompt?: string;
};

export type RemoveBackgroundResult = ImageToolResponse;

export type RemoveObjectPayload = {
  file: File;
  maskFile: File;
  prompt: string;
};

export type RemoveObjectResult = ImageToolResponse;

export type ReviewResumePayload = {
  file: File;
  targetRole?: string;
  focus?: string;
};

export type ReviewResumeResult = ReviewResumeResponse;

export type GetCreationsResult = GetCreationsResponse;

export type DeleteCreationPayload = DeleteCreationInput;
export type DeleteCreationResult = DeleteCreationResponse;
