/// <reference types="node" />

import { Buffer } from "node:buffer";

import type { PaginationParams } from "../types";
import { badRequest, validationError } from "./errors";

export type BodyLikeEvent = {
  body?: string | null;
  isBase64Encoded?: boolean;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  multiValueQueryStringParameters?: Record<string, string[] | undefined> | null;
  httpMethod?: string;
};

export type ParseJsonOptions = {
  required?: boolean;
  maxBodySizeBytes?: number;
};

const defaultMaxBodySizeBytes = 1024 * 1024;

export function parseJsonBody<T = unknown>(
  event: BodyLikeEvent,
  options: ParseJsonOptions = {},
): T {
  const { required = true, maxBodySizeBytes = defaultMaxBodySizeBytes } = options;

  if (!event.body) {
    if (!required) return {} as T;

    throw badRequest("Request body is required.");
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  const bodySizeBytes = Buffer.byteLength(rawBody, "utf8");

  if (bodySizeBytes > maxBodySizeBytes) {
    throw badRequest("Request body is too large.", {
      maxBodySizeBytes,
      bodySizeBytes,
    });
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
}

export function parseOptionalJsonBody<T = Record<string, never>>(
  event: BodyLikeEvent,
  options: Omit<ParseJsonOptions, "required"> = {},
): T {
  return parseJsonBody<T>(event, {
    ...options,
    required: false,
  });
}

export function parseTextBody(
  event: BodyLikeEvent,
  options: ParseJsonOptions = {},
): string {
  const { required = true, maxBodySizeBytes = defaultMaxBodySizeBytes } = options;

  if (!event.body) {
    if (!required) return "";

    throw badRequest("Request body is required.");
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  const bodySizeBytes = Buffer.byteLength(rawBody, "utf8");

  if (bodySizeBytes > maxBodySizeBytes) {
    throw badRequest("Request body is too large.", {
      maxBodySizeBytes,
      bodySizeBytes,
    });
  }

  return rawBody;
}

export function parseRawBody(
  event: BodyLikeEvent,
  options: ParseJsonOptions = {},
): Buffer {
  const { required = true, maxBodySizeBytes = defaultMaxBodySizeBytes } = options;

  if (!event.body) {
    if (!required) return Buffer.from("");

    throw badRequest("Request body is required.");
  }

  const buffer = event.isBase64Encoded
    ? Buffer.from(event.body, "base64")
    : Buffer.from(event.body, "utf8");

  if (buffer.byteLength > maxBodySizeBytes) {
    throw badRequest("Request body is too large.", {
      maxBodySizeBytes,
      bodySizeBytes: buffer.byteLength,
    });
  }

  return buffer;
}

export function getHeader(
  event: BodyLikeEvent,
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

export function getContentType(event: BodyLikeEvent): string {
  return getHeader(event, "content-type") ?? "";
}

export function isJsonRequest(event: BodyLikeEvent): boolean {
  return getContentType(event).toLowerCase().includes("application/json");
}

export function requireJsonRequest(event: BodyLikeEvent): void {
  if (!isJsonRequest(event)) {
    throw badRequest("Content-Type must be application/json.");
  }
}

export function getQueryParams(event: BodyLikeEvent): Record<string, string> {
  const query = event.queryStringParameters ?? {};
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }

  return params;
}

export function getQueryParam(
  event: BodyLikeEvent,
  key: string,
): string | undefined {
  const value = event.queryStringParameters?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getMultiQueryParam(event: BodyLikeEvent, key: string): string[] {
  const multiValue = event.multiValueQueryStringParameters?.[key];

  if (Array.isArray(multiValue)) {
    return multiValue.map((item: string) => item.trim()).filter(Boolean);
  }

  const singleValue = getQueryParam(event, key);

  return singleValue ? [singleValue] : [];
}

export function getRequiredQueryParam(event: BodyLikeEvent, key: string): string {
  const value = getQueryParam(event, key);

  if (!value) {
    throw validationError(`Missing required query parameter: ${key}`);
  }

  return value;
}

export function getNumberQueryParam(
  event: BodyLikeEvent,
  key: string,
  fallback?: number,
): number | undefined {
  const value = getQueryParam(event, key);

  if (!value) return fallback;

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw validationError(`Query parameter "${key}" must be a valid number.`);
  }

  return parsedValue;
}

export function getBooleanQueryParam(
  event: BodyLikeEvent,
  key: string,
  fallback = false,
): boolean {
  const value = getQueryParam(event, key);

  if (!value) return fallback;

  const normalizedValue = value.toLowerCase();

  if (["true", "1", "yes", "y"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "n"].includes(normalizedValue)) {
    return false;
  }

  throw validationError(`Query parameter "${key}" must be a valid boolean.`);
}

export function getPaginationParams(
  event: BodyLikeEvent,
  defaults: Required<PaginationParams> = {
    page: 1,
    limit: 20,
  },
): Required<PaginationParams> {
  const page = getNumberQueryParam(event, "page", defaults.page) ?? defaults.page;
  const limit =
    getNumberQueryParam(event, "limit", defaults.limit) ?? defaults.limit;

  return {
    page: clampInteger(page, 1, 10_000),
    limit: clampInteger(limit, 1, 100),
  };
}

export function assertBodyHasKeys<T extends Record<string, unknown>>(
  body: T,
  keys: Array<keyof T>,
): void {
  const missingKeys = keys.filter((key) => {
    const value = body[key];

    return value === undefined || value === null || value === "";
  });

  if (missingKeys.length) {
    throw validationError("Request body is missing required fields.", {
      missingFields: missingKeys.map(String),
    });
  }
}

export function requireStringField<T extends Record<string, unknown>>(
  body: T,
  key: keyof T,
  options: {
    minLength?: number;
    maxLength?: number;
    trim?: boolean;
  } = {},
): string {
  const value = body[key];

  if (typeof value !== "string") {
    throw validationError(`Field "${String(key)}" must be a string.`);
  }

  const finalValue = options.trim === false ? value : value.trim();

  if (!finalValue) {
    throw validationError(`Field "${String(key)}" is required.`);
  }

  if (options.minLength && finalValue.length < options.minLength) {
    throw validationError(
      `Field "${String(key)}" must be at least ${options.minLength} characters.`,
    );
  }

  if (options.maxLength && finalValue.length > options.maxLength) {
    throw validationError(
      `Field "${String(key)}" must be at most ${options.maxLength} characters.`,
    );
  }

  return finalValue;
}

export function optionalStringField<T extends Record<string, unknown>>(
  body: T,
  key: keyof T,
  options: {
    maxLength?: number;
    trim?: boolean;
  } = {},
): string | undefined {
  const value = body[key];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw validationError(`Field "${String(key)}" must be a string.`);
  }

  const finalValue = options.trim === false ? value : value.trim();

  if (!finalValue) {
    return undefined;
  }

  if (options.maxLength && finalValue.length > options.maxLength) {
    throw validationError(
      `Field "${String(key)}" must be at most ${options.maxLength} characters.`,
    );
  }

  return finalValue;
}

export function optionalStringArrayField<T extends Record<string, unknown>>(
  body: T,
  key: keyof T,
  options: {
    maxItems?: number;
    maxItemLength?: number;
  } = {},
): string[] | undefined {
  const value = body[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw validationError(`Field "${String(key)}" must be an array.`);
  }

  const values = value.map((item: unknown) => {
    if (typeof item !== "string") {
      throw validationError(`Field "${String(key)}" must only contain strings.`);
    }

    return item.trim();
  }).filter(Boolean);

  if (options.maxItems && values.length > options.maxItems) {
    throw validationError(
      `Field "${String(key)}" must contain at most ${options.maxItems} items.`,
    );
  }

  if (
    options.maxItemLength &&
    values.some((item: string) => item.length > options.maxItemLength!)
  ) {
    throw validationError(
      `Field "${String(key)}" contains an item that is too long.`,
    );
  }

  return values;
}

export function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;

  const integer = Math.floor(value);

  return Math.min(Math.max(integer, min), max);
}