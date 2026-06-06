import type { FunctionResponse } from "./response";
import { optionsResponse } from "./response";

export type CorsEvent = {
  headers?: Record<string, string | undefined>;
  httpMethod?: string;
};

export type CorsOptions = {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  allowCredentials?: boolean;
  maxAgeSeconds?: number;
};

const defaultAllowedMethods = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];

const defaultAllowedHeaders = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "X-Clerk-User-Id",
  "Svix-Id",
  "Svix-Timestamp",
  "Svix-Signature",
];

const defaultExposedHeaders = ["X-Request-Id"];

export function getDefaultAllowedOrigins(): string[] {
  const origins = [
    process.env.APP_URL,
    process.env.CLIENT_URL,
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.VITE_APP_URL,
    "http://localhost:5173",
    "http://localhost:8888",
  ];

  return origins
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getRequestOrigin(event: CorsEvent): string | undefined {
  const headers = event.headers ?? {};

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "origin") {
      return value;
    }
  }

  return undefined;
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin) return false;

  if (allowedOrigins.includes("*")) return true;

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === origin) return true;

    if (allowedOrigin.endsWith("*")) {
      const prefix = allowedOrigin.slice(0, -1);

      return origin.startsWith(prefix);
    }

    return false;
  });
}

export function getCorsHeaders(
  event?: CorsEvent,
  options: CorsOptions = {},
): Record<string, string> {
  const allowedOrigins = options.allowedOrigins ?? getDefaultAllowedOrigins();
  const requestOrigin = event ? getRequestOrigin(event) : undefined;

  const allowAnyOrigin = allowedOrigins.includes("*");
  const originIsAllowed = isOriginAllowed(requestOrigin, allowedOrigins);

  const allowedOrigin = allowAnyOrigin
    ? "*"
    : originIsAllowed && requestOrigin
      ? requestOrigin
      : allowedOrigins[0] || "http://localhost:5173";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": (
      options.allowedMethods ?? defaultAllowedMethods
    ).join(", "),
    "Access-Control-Allow-Headers": (
      options.allowedHeaders ?? defaultAllowedHeaders
    ).join(", "),
    "Access-Control-Expose-Headers": (
      options.exposedHeaders ?? defaultExposedHeaders
    ).join(", "),
    "Access-Control-Max-Age": String(options.maxAgeSeconds ?? 86400),
    Vary: "Origin",
  };

  if (options.allowCredentials ?? true) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function withCorsHeaders(
  response: FunctionResponse,
  event?: CorsEvent,
  options: CorsOptions = {},
): FunctionResponse {
  return {
    ...response,
    headers: {
      ...getCorsHeaders(event, options),
      ...response.headers,
    },
  };
}

export function isPreflightRequest(event: CorsEvent): boolean {
  return event.httpMethod === "OPTIONS";
}

export function corsPreflightResponse(
  event?: CorsEvent,
  options: CorsOptions = {},
): FunctionResponse {
  return optionsResponse(getCorsHeaders(event, options));
}

export function assertOriginAllowed(
  event: CorsEvent,
  options: CorsOptions = {},
): void {
  const allowedOrigins = options.allowedOrigins ?? getDefaultAllowedOrigins();
  const requestOrigin = getRequestOrigin(event);

  if (!requestOrigin) return;

  if (!isOriginAllowed(requestOrigin, allowedOrigins)) {
    throw new Error(`CORS origin is not allowed: ${requestOrigin}`);
  }
}