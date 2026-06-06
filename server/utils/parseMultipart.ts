/// <reference types="node" />

import { Buffer } from "node:buffer";

import type { JsonRecord, UploadedFile } from "../types";
import { env } from "../env";
import { badRequest, uploadTooLarge, validationError } from "./errors";
import { getContentType, type BodyLikeEvent } from "./parseBody";
import { getSafeFileName } from "./validators";

export type MultipartFieldValue = string | string[];

export type ParsedMultipartForm = {
  fields: Record<string, MultipartFieldValue>;
  files: Record<string, UploadedFile[]>;
};

export type ParseMultipartOptions = {
  maxBodySizeBytes?: number;
  maxFiles?: number;
  maxFieldSizeBytes?: number;
};

type PartHeaders = Record<string, string>;

type ContentDisposition = {
  name?: string;
  fileName?: string;
};

const defaultMaxBodySizeBytes = env.maxUploadSizeMb * 1024 * 1024;
const defaultMaxFieldSizeBytes = 512 * 1024;

export function parseMultipartFormData(
  event: BodyLikeEvent,
  options: ParseMultipartOptions = {},
): ParsedMultipartForm {
  const contentType = getContentType(event);

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw badRequest("Content-Type must be multipart/form-data.");
  }

  const boundary = getBoundary(contentType);

  if (!boundary) {
    throw badRequest("Multipart boundary is missing.");
  }

  if (!event.body) {
    throw badRequest("Request body is required.");
  }

  const bodyBuffer = event.isBase64Encoded
    ? Buffer.from(event.body, "base64")
    : Buffer.from(event.body, "latin1");

  const maxBodySizeBytes = options.maxBodySizeBytes ?? defaultMaxBodySizeBytes;

  if (bodyBuffer.byteLength > maxBodySizeBytes) {
    throw uploadTooLarge(Math.ceil(maxBodySizeBytes / 1024 / 1024));
  }

  const maxFiles = options.maxFiles ?? 5;
  const maxFieldSizeBytes =
    options.maxFieldSizeBytes ?? defaultMaxFieldSizeBytes;

  const result: ParsedMultipartForm = {
    fields: {},
    files: {},
  };

  const parts = splitMultipartBody(bodyBuffer, boundary);
  let fileCount = 0;

  for (const part of parts) {
    if (!part.byteLength) continue;

    const parsedPart = parsePart(part);

    if (!parsedPart) continue;

    const { headers, content } = parsedPart;
    const disposition = parseContentDisposition(headers["content-disposition"]);

    if (!disposition.name) continue;

    const fieldName = disposition.name;

    if (disposition.fileName !== undefined) {
      fileCount += 1;

      if (fileCount > maxFiles) {
        throw validationError(`You can upload at most ${maxFiles} files.`);
      }

      const fileName = getSafeFileName(disposition.fileName, "upload");
      const mimeType =
        headers["content-type"]?.toLowerCase() || "application/octet-stream";

      const file: UploadedFile = {
        fieldName,
        fileName,
        mimeType,
        buffer: content,
        size: content.byteLength,
      };

      if (!result.files[fieldName]) {
        result.files[fieldName] = [];
      }

      result.files[fieldName].push(file);
      continue;
    }

    if (content.byteLength > maxFieldSizeBytes) {
      throw validationError(`Field "${fieldName}" is too large.`, {
        fieldName,
        maxFieldSizeBytes,
      });
    }

    appendField(result.fields, fieldName, content.toString("utf8").trim());
  }

  return result;
}

export function getFirstFile(
  form: ParsedMultipartForm,
  fieldName = "file",
): UploadedFile {
  const file = form.files[fieldName]?.[0];

  if (!file) {
    throw validationError(`Missing uploaded file field: ${fieldName}`);
  }

  return file;
}

export function getOptionalFirstFile(
  form: ParsedMultipartForm,
  fieldName = "file",
): UploadedFile | undefined {
  return form.files[fieldName]?.[0];
}

export function getFiles(
  form: ParsedMultipartForm,
  fieldName = "file",
): UploadedFile[] {
  return form.files[fieldName] ?? [];
}

export function getMultipartField(
  form: ParsedMultipartForm,
  fieldName: string,
): string | undefined {
  const value = form.fields[fieldName];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getRequiredMultipartField(
  form: ParsedMultipartForm,
  fieldName: string,
): string {
  const value = getMultipartField(form, fieldName);

  if (!value) {
    throw validationError(`Missing required field: ${fieldName}`);
  }

  return value;
}

export function getMultipartFieldArray(
  form: ParsedMultipartForm,
  fieldName: string,
): string[] {
  const value = form.fields[fieldName];

  if (!value) return [];

  return Array.isArray(value) ? value : [value];
}

export function getMultipartJsonField<T = JsonRecord>(
  form: ParsedMultipartForm,
  fieldName: string,
  fallback?: T,
): T {
  const value = getMultipartField(form, fieldName);

  if (!value) {
    if (fallback !== undefined) return fallback;

    throw validationError(`Missing required JSON field: ${fieldName}`);
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    throw validationError(`Field "${fieldName}" must contain valid JSON.`);
  }
}

export function getOptionalMultipartJsonField<T = JsonRecord>(
  form: ParsedMultipartForm,
  fieldName: string,
): T | undefined {
  const value = getMultipartField(form, fieldName);

  if (!value) return undefined;

  try {
    return JSON.parse(value) as T;
  } catch {
    throw validationError(`Field "${fieldName}" must contain valid JSON.`);
  }
}

export function assertMultipartHasFile(
  form: ParsedMultipartForm,
  fieldName = "file",
): void {
  if (!form.files[fieldName]?.length) {
    throw validationError(`Missing uploaded file field: ${fieldName}`);
  }
}

export function assertMultipartHasField(
  form: ParsedMultipartForm,
  fieldName: string,
): void {
  if (!getMultipartField(form, fieldName)) {
    throw validationError(`Missing required field: ${fieldName}`);
  }
}

function getBoundary(contentType: string): string | undefined {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];

  return boundary?.trim();
}

function splitMultipartBody(bodyBuffer: Buffer, boundary: string): Buffer[] {
  const boundaryText = `--${boundary}`;
  const bodyText = bodyBuffer.toString("latin1");

  return bodyText
    .split(boundaryText)
    .map((partText) => partText.trimStart())
    .filter((partText) => partText && partText !== "--")
    .map((partText) => {
      let cleanPartText = partText;

      if (cleanPartText.endsWith("--")) {
        cleanPartText = cleanPartText.slice(0, -2);
      }

      cleanPartText = trimCrLf(cleanPartText);

      return Buffer.from(cleanPartText, "latin1");
    });
}

function parsePart(
  partBuffer: Buffer,
): { headers: PartHeaders; content: Buffer } | null {
  const separator = Buffer.from("\r\n\r\n", "latin1");
  const separatorIndex = indexOfBuffer(partBuffer, separator);

  if (separatorIndex === -1) {
    return null;
  }

  const rawHeaders = partBuffer.slice(0, separatorIndex).toString("utf8");
  const contentStartIndex = separatorIndex + separator.byteLength;

  let content = partBuffer.slice(contentStartIndex);

  if (endsWithCrLf(content)) {
    content = content.slice(0, -2);
  }

  return {
    headers: parsePartHeaders(rawHeaders),
    content,
  };
}

function parsePartHeaders(rawHeaders: string): PartHeaders {
  const headers: PartHeaders = {};

  for (const line of rawHeaders.split("\r\n")) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key) {
      headers[key] = value;
    }
  }

  return headers;
}

function parseContentDisposition(
  value: string | undefined,
): ContentDisposition {
  if (!value) return {};

  const result: ContentDisposition = {};

  const parts = value.split(";").map((part) => part.trim());

  for (const part of parts) {
    const [rawKey, ...rawValueParts] = part.split("=");

    if (!rawKey || !rawValueParts.length) continue;

    const key = rawKey.trim().toLowerCase();
    const rawValue = rawValueParts.join("=").trim();
    const cleanValue = removeWrappingQuotes(rawValue);

    if (key === "name") {
      result.name = cleanValue;
    }

    if (key === "filename" || key === "filename*") {
      result.fileName = decodeFileName(cleanValue);
    }
  }

  return result;
}

function appendField(
  fields: Record<string, MultipartFieldValue>,
  fieldName: string,
  value: string,
): void {
  const existingValue = fields[fieldName];

  if (existingValue === undefined) {
    fields[fieldName] = value;
    return;
  }

  if (Array.isArray(existingValue)) {
    existingValue.push(value);
    return;
  }

  fields[fieldName] = [existingValue, value];
}

function removeWrappingQuotes(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  return value;
}

function decodeFileName(fileName: string): string {
  if (fileName.toLowerCase().startsWith("utf-8''")) {
    try {
      return decodeURIComponent(fileName.slice(7));
    } catch {
      return fileName.slice(7);
    }
  }

  return fileName;
}

function indexOfBuffer(buffer: Buffer, search: Buffer): number {
  return buffer.indexOf(search);
}

function trimCrLf(value: string): string {
  return value.replace(/^\r\n/, "").replace(/\r\n$/, "");
}

function endsWithCrLf(buffer: Buffer): boolean {
  return (
    buffer.byteLength >= 2 &&
    buffer[buffer.byteLength - 2] === 13 &&
    buffer[buffer.byteLength - 1] === 10
  );
}