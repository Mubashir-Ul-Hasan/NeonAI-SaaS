import type { HandlerMethod, MaybePromise } from "../types";
import { methodNotAllowed } from "./errors";
import type { CorsOptions } from "./cors";
import {
  corsPreflightResponse,
  isPreflightRequest,
  withCorsHeaders,
} from "./cors";
import type { FunctionResponse } from "./response";
import { failure, withRequestId } from "./response";

export type NetlifyLikeEvent = {
  httpMethod: string;
  path?: string;
  rawUrl?: string;
  rawQuery?: string;
  body?: string | null;
  isBase64Encoded?: boolean;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  multiValueQueryStringParameters?: Record<string, string[] | undefined> | null;
};

export type NetlifyLikeContext = {
  requestId?: string;
  functionName?: string;
  clientContext?: unknown;
};

export type HandlerContext<Event extends NetlifyLikeEvent = NetlifyLikeEvent> = {
  event: Event;
  context: NetlifyLikeContext;
  requestId: string;
  startedAt: number;
  method: HandlerMethod;
};

export type AppHandler<Event extends NetlifyLikeEvent = NetlifyLikeEvent> = (
  context: HandlerContext<Event>,
) => MaybePromise<FunctionResponse>;

export type CreateHandlerOptions = {
  allowedMethods?: HandlerMethod[];
  cors?: CorsOptions | false;
  logErrors?: boolean;
};

const defaultAllowedMethods: HandlerMethod[] = ["GET", "POST"];

export function createHandler<Event extends NetlifyLikeEvent = NetlifyLikeEvent>(
  handler: AppHandler<Event>,
  options: CreateHandlerOptions = {},
) {
  return async (
    event: Event,
    context: NetlifyLikeContext = {},
  ): Promise<FunctionResponse> => {
    const requestId = getRequestId(event, context);
    const startedAt = Date.now();
    const corsOptions = options.cors === false ? false : options.cors ?? {};

    try {
      if (isPreflightRequest(event)) {
        return withRequestId(
          corsOptions === false
            ? {
                statusCode: 204,
                body: "",
              }
            : corsPreflightResponse(event, corsOptions),
          requestId,
        );
      }

      const method = normalizeMethod(event.httpMethod);
      const allowedMethods = options.allowedMethods ?? defaultAllowedMethods;

      if (!allowedMethods.includes(method)) {
        throw methodNotAllowed(method, allowedMethods);
      }

      const response = await handler({
        event,
        context,
        requestId,
        startedAt,
        method,
      });

      return finalizeResponse(response, {
        event,
        requestId,
        startedAt,
        corsOptions,
      });
    } catch (error) {
      if (options.logErrors ?? true) {
        logServerError(error, {
          requestId,
          method: event.httpMethod,
          path: event.path,
          functionName: context.functionName,
        });
      }

      return finalizeResponse(failure(error), {
        event,
        requestId,
        startedAt,
        corsOptions,
      });
    }
  };
}

export function createGetHandler<Event extends NetlifyLikeEvent = NetlifyLikeEvent>(
  handler: AppHandler<Event>,
  options: Omit<CreateHandlerOptions, "allowedMethods"> = {},
) {
  return createHandler(handler, {
    ...options,
    allowedMethods: ["GET"],
  });
}

export function createPostHandler<Event extends NetlifyLikeEvent = NetlifyLikeEvent>(
  handler: AppHandler<Event>,
  options: Omit<CreateHandlerOptions, "allowedMethods"> = {},
) {
  return createHandler(handler, {
    ...options,
    allowedMethods: ["POST"],
  });
}

export function createDeleteHandler<
  Event extends NetlifyLikeEvent = NetlifyLikeEvent,
>(
  handler: AppHandler<Event>,
  options: Omit<CreateHandlerOptions, "allowedMethods"> = {},
) {
  return createHandler(handler, {
    ...options,
    allowedMethods: ["DELETE"],
  });
}

export function createMutationHandler<
  Event extends NetlifyLikeEvent = NetlifyLikeEvent,
>(
  handler: AppHandler<Event>,
  options: Omit<CreateHandlerOptions, "allowedMethods"> = {},
) {
  return createHandler(handler, {
    ...options,
    allowedMethods: ["POST", "PUT", "PATCH", "DELETE"],
  });
}

export function createReadWriteHandler<
  Event extends NetlifyLikeEvent = NetlifyLikeEvent,
>(
  handler: AppHandler<Event>,
  options: Omit<CreateHandlerOptions, "allowedMethods"> = {},
) {
  return createHandler(handler, {
    ...options,
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });
}

function finalizeResponse<Event extends NetlifyLikeEvent>(
  response: FunctionResponse,
  {
    event,
    requestId,
    startedAt,
    corsOptions,
  }: {
    event: Event;
    requestId: string;
    startedAt: number;
    corsOptions: CorsOptions | false;
  },
): FunctionResponse {
  const responseTimeMs = Date.now() - startedAt;

  const responseWithBaseHeaders = {
    ...response,
    headers: {
      ...response.headers,
      "X-Request-Id": requestId,
      "X-Response-Time": `${responseTimeMs}ms`,
    },
  };

  const responseWithRequestId = withRequestId(responseWithBaseHeaders, requestId);

  if (corsOptions === false) {
    return responseWithRequestId;
  }

  return withCorsHeaders(responseWithRequestId, event, corsOptions);
}

function normalizeMethod(method: string | undefined): HandlerMethod {
  const normalizedMethod = method?.toUpperCase();

  if (
    normalizedMethod === "GET" ||
    normalizedMethod === "POST" ||
    normalizedMethod === "PUT" ||
    normalizedMethod === "PATCH" ||
    normalizedMethod === "DELETE" ||
    normalizedMethod === "OPTIONS"
  ) {
    return normalizedMethod;
  }

  return "GET";
}

function getRequestId(
  event: NetlifyLikeEvent,
  context: NetlifyLikeContext,
): string {
  const existingRequestId =
    getHeader(event, "x-request-id") ||
    getHeader(event, "x-nf-request-id") ||
    context.requestId;

  if (existingRequestId) {
    return existingRequestId;
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getHeader(
  event: NetlifyLikeEvent,
  headerName: string,
): string | undefined {
  const headers = event.headers ?? {};
  const normalizedHeaderName = headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedHeaderName) {
      return value;
    }
  }

  return undefined;
}

function logServerError(
  error: unknown,
  metadata: {
    requestId: string;
    method?: string;
    path?: string;
    functionName?: string;
  },
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify(
      {
        level: "error",
        message: errorMessage,
        stack: errorStack,
        ...metadata,
      },
      null,
      2,
    ),
  );
}