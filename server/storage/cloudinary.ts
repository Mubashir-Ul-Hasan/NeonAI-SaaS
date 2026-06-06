/// <reference types="node" />

import { Buffer } from "node:buffer";
import {
  v2 as cloudinary,
  type UploadApiOptions,
  type UploadApiResponse,
} from "cloudinary";

import { requireCloudinaryEnv } from "../env";
import type { JsonRecord, UploadedFile } from "../types";
import { storageError } from "../utils/errors";
import { getSafeFileName } from "../utils/validators";

export type CloudinaryUploadFolder =
  | "quickai/images"
  | "quickai/background-removal"
  | "quickai/object-removal"
  | "quickai/resumes"
  | "quickai/uploads";

export type CloudinaryResourceType = "image" | "raw" | "video" | "auto";

export type UploadBufferOptions = {
  folder?: CloudinaryUploadFolder | string;
  publicId?: string;
  fileName?: string;
  resourceType?: CloudinaryResourceType;
  overwrite?: boolean;
  tags?: string[];
  metadata?: JsonRecord;
};

export type UploadedCloudinaryAsset = {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  originalFilename?: string;
};

let configured = false;

export function configureCloudinary(): void {
  if (configured) return;

  const cloudinaryEnv = requireCloudinaryEnv();

  cloudinary.config({
    cloud_name: cloudinaryEnv.cloudName,
    api_key: cloudinaryEnv.apiKey,
    api_secret: cloudinaryEnv.apiSecret,
    secure: true,
  });

  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  try {
    configureCloudinary();
    return true;
  } catch {
    return false;
  }
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: UploadBufferOptions = {},
): Promise<UploadedCloudinaryAsset> {
  configureCloudinary();

  if (!buffer.byteLength) {
    throw storageError("Cannot upload an empty file to Cloudinary.");
  }

  const uploadOptions = buildUploadOptions(options);

  try {
    const response = await uploadBuffer(buffer, uploadOptions);

    return mapUploadResponse(response);
  } catch (error) {
    throw storageError("Failed to upload file to Cloudinary.", error);
  }
}

export async function uploadImageBuffer(
  buffer: Buffer,
  options: Omit<UploadBufferOptions, "resourceType"> = {},
): Promise<UploadedCloudinaryAsset> {
  return uploadBufferToCloudinary(buffer, {
    ...options,
    folder: options.folder ?? "quickai/images",
    resourceType: "image",
  });
}

export async function uploadUploadedFile(
  file: UploadedFile,
  options: UploadBufferOptions = {},
): Promise<UploadedCloudinaryAsset> {
  return uploadBufferToCloudinary(file.buffer, {
    fileName: file.fileName,
    resourceType: options.resourceType ?? "auto",
    ...options,
  });
}

export async function uploadDataUrlToCloudinary(
  dataUrl: string,
  options: UploadBufferOptions = {},
): Promise<UploadedCloudinaryAsset> {
  configureCloudinary();

  if (!dataUrl.trim().startsWith("data:")) {
    throw storageError("Invalid data URL for Cloudinary upload.");
  }

  const uploadOptions = buildUploadOptions(options);

  try {
    const response = await cloudinary.uploader.upload(dataUrl, uploadOptions);

    return mapUploadResponse(response);
  } catch (error) {
    throw storageError("Failed to upload data URL to Cloudinary.", error);
  }
}

export async function uploadDataUriToCloudinary(
  dataUri: string,
  options: UploadBufferOptions = {},
): Promise<UploadedCloudinaryAsset> {
  return uploadDataUrlToCloudinary(dataUri, options);
}

export async function uploadBase64ToCloudinary(
  base64: string,
  options: UploadBufferOptions = {},
): Promise<UploadedCloudinaryAsset> {
  const cleanBase64 = base64.includes(",")
    ? base64.split(",").pop() ?? ""
    : base64;

  if (!cleanBase64.trim()) {
    throw storageError("Cannot upload empty base64 data to Cloudinary.");
  }

  return uploadBufferToCloudinary(Buffer.from(cleanBase64, "base64"), options);
}

export async function uploadRemoteImageToCloudinary(
  imageUrl: string,
  options: UploadBufferOptions = {},
): Promise<UploadedCloudinaryAsset> {
  configureCloudinary();

  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    throw storageError("Cloudinary remote upload requires a valid image URL.");
  }

  const uploadOptions = buildUploadOptions({
    ...options,
    folder: options.folder ?? "quickai/images",
    resourceType: options.resourceType ?? "image",
    fileName: options.fileName ?? "quickai-remote-image",
  });

  try {
    const response = await cloudinary.uploader.upload(imageUrl, uploadOptions);

    return mapUploadResponse(response);
  } catch (error) {
    throw storageError("Failed to upload remote image to Cloudinary.", error);
  }
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: Exclude<CloudinaryResourceType, "auto"> = "image",
): Promise<boolean> {
  configureCloudinary();

  if (!publicId.trim()) {
    return false;
  }

  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    return response.result === "ok" || response.result === "not found";
  } catch (error) {
    throw storageError("Failed to delete Cloudinary asset.", error);
  }
}

export async function deleteManyCloudinaryAssets(
  publicIds: string[],
  resourceType: Exclude<CloudinaryResourceType, "auto"> = "image",
): Promise<{
  deleted: string[];
  failed: string[];
}> {
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const publicId of publicIds) {
    try {
      const wasDeleted = await deleteCloudinaryAsset(publicId, resourceType);

      if (wasDeleted) {
        deleted.push(publicId);
      } else {
        failed.push(publicId);
      }
    } catch {
      failed.push(publicId);
    }
  }

  return {
    deleted,
    failed,
  };
}

export function createPublicIdFromFileName(fileName: string): string {
  const safeFileName = getSafeFileName(fileName, "quickai-upload");
  const nameWithoutExtension = safeFileName.replace(/\.[^/.]+$/, "");
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).slice(2, 8);

  return `${nameWithoutExtension}-${timestamp}-${randomPart}`
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function getCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = pathParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) return null;

    const publicIdParts = pathParts.slice(uploadIndex + 1);

    if (publicIdParts[0]?.startsWith("v")) {
      publicIdParts.shift();
    }

    if (!publicIdParts.length) return null;

    const publicIdWithExtension = publicIdParts.join("/");
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

    return decodeURIComponent(publicId);
  } catch {
    return null;
  }
}

function uploadBuffer(
  buffer: Buffer,
  uploadOptions: UploadApiOptions,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result."));
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

function buildUploadOptions(options: UploadBufferOptions): UploadApiOptions {
  const folder = normalizeFolder(options.folder ?? "quickai/uploads");
  const publicId =
    options.publicId ??
    createPublicIdFromFileName(options.fileName ?? "quickai-upload");

  const uploadOptions: UploadApiOptions = {
    folder,
    public_id: publicId,
    resource_type: options.resourceType ?? "auto",
    overwrite: options.overwrite ?? true,
  };

  if (options.tags?.length) {
    uploadOptions.tags = options.tags.filter(Boolean);
  }

  if (options.metadata && Object.keys(options.metadata).length > 0) {
    uploadOptions.context = serializeCloudinaryContext(options.metadata);
  }

  return uploadOptions;
}

function mapUploadResponse(response: UploadApiResponse): UploadedCloudinaryAsset {
  return {
    url: response.url ?? response.secure_url,
    secureUrl: response.secure_url,
    publicId: response.public_id,
    format: response.format ?? "unknown",
    resourceType: response.resource_type,
    bytes: response.bytes ?? 0,
    width: response.width,
    height: response.height,
    originalFilename: response.original_filename,
  };
}

function normalizeFolder(folder: string): string {
  return folder
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
}

function serializeCloudinaryContext(metadata: JsonRecord): string {
  return Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const cleanKey = String(key)
        .replace(/[=|]/g, "_")
        .slice(0, 100);

      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      const cleanValue = stringValue
        .replace(/[=|]/g, " ")
        .slice(0, 1024);

      return `${cleanKey}=${cleanValue}`;
    })
    .join("|");
}