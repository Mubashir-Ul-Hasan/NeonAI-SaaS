export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "UPLOAD_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "PREMIUM_REQUIRED"
  | "USAGE_LIMIT_REACHED"
  | "DATABASE_ERROR"
  | "AI_PROVIDER_ERROR"
  | "STORAGE_ERROR"
  | "WEBHOOK_ERROR"
  | "CONFIG_ERROR"
  | "INTERNAL_SERVER_ERROR";

export type AppErrorOptions = {
  code?: ErrorCode;
  statusCode?: number;
  message: string;
  details?: unknown;
  cause?: unknown;
  expose?: boolean;
};

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: unknown;
  cause?: unknown;
  expose: boolean;

  constructor({
    code = "INTERNAL_SERVER_ERROR",
    statusCode = 500,
    message,
    details,
    cause,
    expose,
  }: AppErrorOptions) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.cause = cause;
    this.expose = expose ?? statusCode < 500;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function badRequest(message = "Bad request.", details?: unknown) {
  return new AppError({
    code: "BAD_REQUEST",
    statusCode: 400,
    message,
    details,
  });
}

export function unauthorized(message = "Authentication required.") {
  return new AppError({
    code: "UNAUTHORIZED",
    statusCode: 401,
    message,
  });
}

export function forbidden(message = "You do not have permission to do this.") {
  return new AppError({
    code: "FORBIDDEN",
    statusCode: 403,
    message,
  });
}

export function notFound(message = "Resource not found.") {
  return new AppError({
    code: "NOT_FOUND",
    statusCode: 404,
    message,
  });
}

export function methodNotAllowed(
  method: string | undefined,
  allowedMethods: string[],
) {
  return new AppError({
    code: "METHOD_NOT_ALLOWED",
    statusCode: 405,
    message: `Method ${method || "UNKNOWN"} is not allowed.`,
    details: {
      allowedMethods,
    },
  });
}

export function validationError(message = "Validation failed.", details?: unknown) {
  return new AppError({
    code: "VALIDATION_ERROR",
    statusCode: 422,
    message,
    details,
  });
}

export function rateLimited(message = "Too many requests. Please try again later.") {
  return new AppError({
    code: "RATE_LIMITED",
    statusCode: 429,
    message,
  });
}

export function uploadTooLarge(maxUploadSizeMb: number) {
  return new AppError({
    code: "UPLOAD_TOO_LARGE",
    statusCode: 413,
    message: `Uploaded file is too large. Maximum size is ${maxUploadSizeMb}MB.`,
    details: {
      maxUploadSizeMb,
    },
  });
}

export function unsupportedFileType(
  mimeType: string,
  allowedTypes: readonly string[],
) {
  return new AppError({
    code: "UNSUPPORTED_FILE_TYPE",
    statusCode: 415,
    message: `Unsupported file type: ${mimeType || "unknown"}.`,
    details: {
      mimeType,
      allowedTypes,
    },
  });
}

export function premiumRequired(
  message = "This tool requires a Premium subscription.",
) {
  return new AppError({
    code: "PREMIUM_REQUIRED",
    statusCode: 402,
    message,
  });
}

export function usageLimitReached(used: number, limit: number) {
  return new AppError({
    code: "USAGE_LIMIT_REACHED",
    statusCode: 429,
    message: "You have reached your monthly usage limit.",
    details: {
      used,
      limit,
      remaining: 0,
    },
  });
}

export function databaseError(message = "Database operation failed.", cause?: unknown) {
  return new AppError({
    code: "DATABASE_ERROR",
    statusCode: 500,
    message,
    cause,
    expose: false,
  });
}

export function aiProviderError(
  provider: string,
  message = "AI provider request failed.",
  cause?: unknown,
) {
  return new AppError({
    code: "AI_PROVIDER_ERROR",
    statusCode: 502,
    message,
    details: {
      provider,
    },
    cause,
    expose: false,
  });
}

export function storageError(
  message = "Storage operation failed.",
  cause?: unknown,
) {
  return new AppError({
    code: "STORAGE_ERROR",
    statusCode: 502,
    message,
    cause,
    expose: false,
  });
}

export function webhookError(
  message = "Webhook verification failed.",
  cause?: unknown,
) {
  return new AppError({
    code: "WEBHOOK_ERROR",
    statusCode: 400,
    message,
    cause,
  });
}

export function configError(message: string) {
  return new AppError({
    code: "CONFIG_ERROR",
    statusCode: 500,
    message,
    expose: false,
  });
}

export function internalServerError(
  message = "Something went wrong. Please try again later.",
  cause?: unknown,
) {
  return new AppError({
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
    message,
    cause,
    expose: false,
  });
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return internalServerError(error.message, error);
  }

  if (typeof error === "string") {
    return internalServerError(error);
  }

  return internalServerError("An unknown server error occurred.", error);
}

export function getPublicError(error: unknown) {
  const normalizedError = normalizeError(error);

  return {
    code: normalizedError.code,
    statusCode: normalizedError.statusCode,
    message: normalizedError.expose
      ? normalizedError.message
      : "Something went wrong. Please try again later.",
    details: normalizedError.expose ? normalizedError.details : undefined,
  };
}

export function getErrorMessage(error: unknown, fallback = "Unknown error") {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

export function assertRequiredValue<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value === null || value === undefined || value === "") {
    throw validationError(message);
  }

  return value;
}

export function assertNever(value: never, message = "Unexpected value."): never {
  throw internalServerError(message, value);
}