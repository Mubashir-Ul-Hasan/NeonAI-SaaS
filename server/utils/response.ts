import type { ApiErrorResponse, ApiSuccessResponse } from "../types";
import { getPublicError, normalizeError } from "./errors";

export type FunctionResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
};

type JsonResponseOptions = {
  statusCode?: number;
  headers?: Record<string, string>;
  message?: string;
};

const defaultJsonHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export function json<T>(
  data: T,
  options: JsonResponseOptions = {},
): FunctionResponse {
  return {
    statusCode: options.statusCode ?? 200,
    headers: {
      ...defaultJsonHeaders,
      ...options.headers,
    },
    body: JSON.stringify(data),
  };
}

export function success<T>(
  data: T,
  options: JsonResponseOptions = {},
): FunctionResponse {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options.message ? { message: options.message } : {}),
  };

  return json(payload, {
    statusCode: options.statusCode ?? 200,
    headers: options.headers,
  });
}

export function created<T>(
  data: T,
  options: Omit<JsonResponseOptions, "statusCode"> = {},
): FunctionResponse {
  return success(data, {
    ...options,
    statusCode: 201,
  });
}

export function accepted<T>(
  data: T,
  options: Omit<JsonResponseOptions, "statusCode"> = {},
): FunctionResponse {
  return success(data, {
    ...options,
    statusCode: 202,
  });
}

export function noContent(headers: Record<string, string> = {}): FunctionResponse {
  return {
    statusCode: 204,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
    body: "",
  };
}

export function failure(
  error: unknown,
  headers: Record<string, string> = {},
): FunctionResponse {
  const normalizedError = normalizeError(error);
  const publicError = getPublicError(normalizedError);

  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: publicError.code,
      message: publicError.message,
      ...(publicError.details !== undefined
        ? {
            details: publicError.details,
          }
        : {}),
    },
  };

  return json(payload, {
    statusCode: publicError.statusCode,
    headers,
  });
}

export function badGateway(message = "Bad gateway."): FunctionResponse {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: "AI_PROVIDER_ERROR",
      message,
    },
  };

  return json(payload, {
    statusCode: 502,
  });
}

export function text(
  body: string,
  options: {
    statusCode?: number;
    headers?: Record<string, string>;
  } = {},
): FunctionResponse {
  return {
    statusCode: options.statusCode ?? 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...options.headers,
    },
    body,
  };
}

export function html(
  body: string,
  options: {
    statusCode?: number;
    headers?: Record<string, string>;
  } = {},
): FunctionResponse {
  return {
    statusCode: options.statusCode ?? 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      ...options.headers,
    },
    body,
  };
}

export function redirect(
  location: string,
  statusCode: 301 | 302 | 303 | 307 | 308 = 302,
  headers: Record<string, string> = {},
): FunctionResponse {
  return {
    statusCode,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      ...headers,
    },
    body: "",
  };
}

export function binary(
  buffer: Buffer,
  contentType: string,
  options: {
    statusCode?: number;
    fileName?: string;
    headers?: Record<string, string>;
  } = {},
): FunctionResponse {
  return {
    statusCode: options.statusCode ?? 200,
    isBase64Encoded: true,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      ...(options.fileName
        ? {
            "Content-Disposition": `attachment; filename="${sanitizeFileName(
              options.fileName,
            )}"`,
          }
        : {}),
      ...options.headers,
    },
    body: buffer.toString("base64"),
  };
}

export function optionsResponse(
  headers: Record<string, string> = {},
): FunctionResponse {
  return {
    statusCode: 204,
    headers,
    body: "",
  };
}

export function addHeaders(
  response: FunctionResponse,
  headers: Record<string, string>,
): FunctionResponse {
  return {
    ...response,
    headers: {
      ...response.headers,
      ...headers,
    },
  };
}

export function withRequestId(
  response: FunctionResponse,
  requestId?: string,
): FunctionResponse {
  if (!requestId) return response;

  return addHeaders(response, {
    "X-Request-Id": requestId,
  });
}

export function parseResponseBody<T = unknown>(response: FunctionResponse): T | null {
  if (!response.body) return null;

  try {
    return JSON.parse(response.body) as T;
  } catch {
    return null;
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^\w.\-() ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);
}