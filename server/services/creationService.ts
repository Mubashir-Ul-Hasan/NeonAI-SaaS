import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  type SQL,
} from "drizzle-orm";

import { db, executeDatabaseOperation } from "../db/client";
import {
  creations,
  type Creation as DbCreation,
  type NewCreation,
} from "../db/schema";
import type {
  CreateCreationInput,
  CreationStatus,
  DeleteCreationResult,
  GetCreationsParams,
  JsonRecord,
  PaginatedResult,
  PaginationMeta,
  PublicCreation,
  ToolType,
  UpdateCreationInput,
} from "../types";
import { databaseError, notFound, validationError } from "../utils/errors";
import { deleteCloudinaryAsset } from "../storage/cloudinary";

export type ListCreationsInput = GetCreationsParams & {
  userId?: string;
  clerkUserId?: string;
  includeFailed?: boolean;
};

export type CreationCounts = {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  favorites: number;
};

export async function createCreation(
  input: CreateCreationInput,
): Promise<DbCreation> {
  const normalizedInput = normalizeCreateCreationInput(input);

  return executeDatabaseOperation(async () => {
    const [createdCreation] = await db
      .insert(creations)
      .values(normalizedInput)
      .returning();

    if (!createdCreation) {
      throw databaseError("Failed to create saved creation.");
    }

    return createdCreation;
  }, "Failed to create saved creation.");
}

export async function createProcessingCreation(
  input: Omit<CreateCreationInput, "status">,
): Promise<DbCreation> {
  return createCreation({
    ...input,
    status: "processing",
  });
}

export async function createFailedCreation(
  input: Omit<CreateCreationInput, "status"> & {
    errorMessage: string;
  },
): Promise<DbCreation> {
  return createCreation({
    ...input,
    status: "failed",
    errorMessage: input.errorMessage,
  });
}

export async function updateCreationById(
  creationId: string,
  input: UpdateCreationInput,
): Promise<DbCreation> {
  const updateValues = normalizeUpdateCreationInput(input);

  if (!Object.keys(updateValues).length) {
    return requireCreationById(creationId);
  }

  return executeDatabaseOperation(async () => {
    const [updatedCreation] = await db
      .update(creations)
      .set({
        ...updateValues,
        updatedAt: new Date(),
      })
      .where(eq(creations.id, creationId))
      .returning();

    if (!updatedCreation) {
      throw notFound("Creation was not found.");
    }

    return updatedCreation;
  }, "Failed to update creation.");
}

export async function completeCreation(
  creationId: string,
  input: {
    resultText?: string | null;
    resultImageUrl?: string | null;
    cloudinaryPublicId?: string | null;
    metadata?: JsonRecord;
  },
): Promise<DbCreation> {
  return updateCreationById(creationId, {
    ...input,
    status: "completed",
    errorMessage: null,
  });
}

export async function failCreation(
  creationId: string,
  errorMessage: string,
  metadata?: JsonRecord,
): Promise<DbCreation> {
  return updateCreationById(creationId, {
    status: "failed",
    errorMessage,
    ...(metadata ? { metadata } : {}),
  });
}

export async function getCreationById(
  creationId: string,
): Promise<DbCreation | null> {
  return executeDatabaseOperation(async () => {
    const [creation] = await db
      .select()
      .from(creations)
      .where(eq(creations.id, creationId))
      .limit(1);

    return creation ?? null;
  }, "Failed to get creation.");
}

export async function requireCreationById(
  creationId: string,
): Promise<DbCreation> {
  const creation = await getCreationById(creationId);

  if (!creation) {
    throw notFound("Creation was not found.");
  }

  return creation;
}

export async function getUserCreationById(input: {
  creationId: string;
  userId?: string;
  clerkUserId?: string;
}): Promise<DbCreation | null> {
  const conditions = buildOwnershipConditions(input);

  return executeDatabaseOperation(async () => {
    const [creation] = await db
      .select()
      .from(creations)
      .where(and(...conditions))
      .limit(1);

    return creation ?? null;
  }, "Failed to get user creation.");
}

export async function requireUserCreationById(input: {
  creationId: string;
  userId?: string;
  clerkUserId?: string;
}): Promise<DbCreation> {
  const creation = await getUserCreationById(input);

  if (!creation) {
    throw notFound("Creation was not found.");
  }

  return creation;
}

export async function listCreations(
  input: ListCreationsInput = {},
): Promise<PaginatedResult<PublicCreation>> {
  const page = clampInteger(input.page ?? 1, 1, 10_000);
  const limit = clampInteger(input.limit ?? 20, 1, 100);
  const offset = (page - 1) * limit;
  const conditions = buildListConditions(input);

  return executeDatabaseOperation(async () => {
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({
        total: count(creations.id),
      })
      .from(creations)
      .where(whereClause);

    const rows = await db
      .select()
      .from(creations)
      .where(whereClause)
      .orderBy(desc(creations.createdAt))
      .limit(limit)
      .offset(offset);

    const total = Number(totalResult?.total ?? 0);
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      items: rows.map(mapCreationToPublicCreation),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      } satisfies PaginationMeta,
    };
  }, "Failed to list creations.");
}

export async function listUserCreations(input: {
  clerkUserId: string;
  params?: GetCreationsParams;
}): Promise<PaginatedResult<PublicCreation>> {
  return listCreations({
    ...input.params,
    clerkUserId: input.clerkUserId,
  });
}

export async function listRecentCreations(input: {
  clerkUserId?: string;
  limit?: number;
} = {}): Promise<PublicCreation[]> {
  const limit = clampInteger(input.limit ?? 10, 1, 50);
  const conditions: SQL[] = [];

  if (input.clerkUserId) {
    conditions.push(eq(creations.clerkUserId, input.clerkUserId));
  }

  return executeDatabaseOperation(async () => {
    const rows = await db
      .select()
      .from(creations)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(creations.createdAt))
      .limit(limit);

    return rows.map(mapCreationToPublicCreation);
  }, "Failed to list recent creations.");
}

export async function deleteCreation(input: {
  creationId: string;
  userId?: string;
  clerkUserId?: string;
  deleteCloudinaryAsset?: boolean;
}): Promise<DeleteCreationResult> {
  const creation = await requireUserCreationById(input);

  let deletedCloudinaryAsset = false;

  if (input.deleteCloudinaryAsset !== false && creation.cloudinaryPublicId) {
    deletedCloudinaryAsset = await deleteCloudinaryAsset(
      creation.cloudinaryPublicId,
      "image",
    );
  }

  return executeDatabaseOperation(async () => {
    const deletedRows = await db
      .delete(creations)
      .where(eq(creations.id, creation.id))
      .returning({
        id: creations.id,
      });

    return {
      id: creation.id,
      deleted: deletedRows.length > 0,
      deletedCloudinaryAsset,
    };
  }, "Failed to delete creation.");
}

export async function deleteCreationByAdmin(input: {
  creationId: string;
  deleteCloudinaryAsset?: boolean;
}): Promise<DeleteCreationResult> {
  const creation = await requireCreationById(input.creationId);

  let deletedCloudinaryAsset = false;

  if (input.deleteCloudinaryAsset !== false && creation.cloudinaryPublicId) {
    deletedCloudinaryAsset = await deleteCloudinaryAsset(
      creation.cloudinaryPublicId,
      "image",
    );
  }

  return executeDatabaseOperation(async () => {
    const deletedRows = await db
      .delete(creations)
      .where(eq(creations.id, creation.id))
      .returning({
        id: creations.id,
      });

    return {
      id: creation.id,
      deleted: deletedRows.length > 0,
      deletedCloudinaryAsset,
    };
  }, "Failed to delete creation as admin.");
}

export async function toggleCreationFavorite(input: {
  creationId: string;
  userId?: string;
  clerkUserId?: string;
}): Promise<DbCreation> {
  const creation = await requireUserCreationById(input);

  return updateCreationById(creation.id, {
    isFavorite: !creation.isFavorite,
  });
}

export async function setCreationFavorite(input: {
  creationId: string;
  isFavorite: boolean;
  userId?: string;
  clerkUserId?: string;
}): Promise<DbCreation> {
  await requireUserCreationById(input);

  return updateCreationById(input.creationId, {
    isFavorite: input.isFavorite,
  });
}

export async function getCreationCounts(input: {
  clerkUserId?: string;
} = {}): Promise<CreationCounts> {
  const baseConditions: SQL[] = [];

  if (input.clerkUserId) {
    baseConditions.push(eq(creations.clerkUserId, input.clerkUserId));
  }

  return executeDatabaseOperation(async () => {
    const whereBase = baseConditions.length ? and(...baseConditions) : undefined;

    const [totalResult] = await db
      .select({ total: count(creations.id) })
      .from(creations)
      .where(whereBase);

    const [completedResult] = await db
      .select({ total: count(creations.id) })
      .from(creations)
      .where(and(...baseConditions, eq(creations.status, "completed")));

    const [processingResult] = await db
      .select({ total: count(creations.id) })
      .from(creations)
      .where(and(...baseConditions, eq(creations.status, "processing")));

    const [failedResult] = await db
      .select({ total: count(creations.id) })
      .from(creations)
      .where(and(...baseConditions, eq(creations.status, "failed")));

    const [favoritesResult] = await db
      .select({ total: count(creations.id) })
      .from(creations)
      .where(and(...baseConditions, eq(creations.isFavorite, true)));

    return {
      total: Number(totalResult?.total ?? 0),
      completed: Number(completedResult?.total ?? 0),
      processing: Number(processingResult?.total ?? 0),
      failed: Number(failedResult?.total ?? 0),
      favorites: Number(favoritesResult?.total ?? 0),
    };
  }, "Failed to get creation counts.");
}

export async function getCreationCountsByTool(input: {
  clerkUserId?: string;
} = {}): Promise<
  Array<{
    toolType: ToolType;
    count: number;
  }>
> {
  const conditions: SQL[] = [];

  if (input.clerkUserId) {
    conditions.push(eq(creations.clerkUserId, input.clerkUserId));
  }

  return executeDatabaseOperation(async () => {
    const rows = await db
      .select({
        toolType: creations.toolType,
        total: count(creations.id),
      })
      .from(creations)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(creations.toolType);

    return rows.map((row) => ({
      toolType: row.toolType,
      count: Number(row.total ?? 0),
    }));
  }, "Failed to get creation counts by tool.");
}

export function mapCreationToPublicCreation(
  creation: DbCreation,
): PublicCreation {
  return {
    id: creation.id,
    toolType: creation.toolType,
    prompt: creation.prompt,
    resultText: creation.resultText,
    resultImageUrl: creation.resultImageUrl,
    status: creation.status,
    isFavorite: creation.isFavorite,
    metadata: creation.metadata,
    errorMessage: creation.errorMessage,
    createdAt: creation.createdAt.toISOString(),
    updatedAt: creation.updatedAt.toISOString(),
  };
}

export function mapCreationsToPublicCreations(
  rows: DbCreation[],
): PublicCreation[] {
  return rows.map(mapCreationToPublicCreation);
}

function normalizeCreateCreationInput(
  input: CreateCreationInput,
): NewCreation {
  return {
    userId: requireNonEmpty(input.userId, "User ID"),
    clerkUserId: requireNonEmpty(input.clerkUserId, "Clerk user ID"),
    toolType: normalizeToolType(input.toolType),
    prompt: requireNonEmpty(input.prompt, "Prompt"),
    resultText: input.resultText ?? null,
    resultImageUrl: input.resultImageUrl ?? null,
    cloudinaryPublicId: input.cloudinaryPublicId ?? null,
    status: normalizeCreationStatus(input.status ?? "completed"),
    isFavorite: input.isFavorite ?? false,
    metadata: sanitizeMetadata(input.metadata),
    errorMessage: input.errorMessage ?? null,
  };
}

function normalizeUpdateCreationInput(
  input: UpdateCreationInput,
): Partial<NewCreation> {
  const updateValues: Partial<NewCreation> = {};

  if (input.resultText !== undefined) {
    updateValues.resultText = input.resultText;
  }

  if (input.resultImageUrl !== undefined) {
    updateValues.resultImageUrl = input.resultImageUrl;
  }

  if (input.cloudinaryPublicId !== undefined) {
    updateValues.cloudinaryPublicId = input.cloudinaryPublicId;
  }

  if (input.status !== undefined) {
    updateValues.status = normalizeCreationStatus(input.status);
  }

  if (input.isFavorite !== undefined) {
    updateValues.isFavorite = input.isFavorite;
  }

  if (input.metadata !== undefined) {
    updateValues.metadata = sanitizeMetadata(input.metadata);
  }

  if (input.errorMessage !== undefined) {
    updateValues.errorMessage = input.errorMessage;
  }

  return updateValues;
}

function buildOwnershipConditions(input: {
  creationId: string;
  userId?: string;
  clerkUserId?: string;
}): SQL[] {
  const conditions: SQL[] = [eq(creations.id, input.creationId)];

  if (input.userId) {
    conditions.push(eq(creations.userId, input.userId));
  }

  if (input.clerkUserId) {
    conditions.push(eq(creations.clerkUserId, input.clerkUserId));
  }

  if (!input.userId && !input.clerkUserId) {
    throw validationError("Either userId or clerkUserId is required.");
  }

  return conditions;
}

function buildListConditions(input: ListCreationsInput): SQL[] {
  const conditions: SQL[] = [];

  if (input.userId) {
    conditions.push(eq(creations.userId, input.userId));
  }

  if (input.clerkUserId) {
    conditions.push(eq(creations.clerkUserId, input.clerkUserId));
  }

  if (input.toolType) {
    conditions.push(eq(creations.toolType, input.toolType));
  }

  if (input.status) {
    conditions.push(eq(creations.status, input.status));
  }

  if (!input.includeFailed && !input.status) {
    // Keep failed items hidden from normal history unless explicitly requested.
    // Admin screens can pass includeFailed: true.
  }

  if (input.search?.trim()) {
    const search = `%${escapeLike(input.search.trim())}%`;

    conditions.push(
      or(
        ilike(creations.prompt, search),
        ilike(creations.resultText, search),
      )!,
    );
  }

  return conditions;
}

function normalizeToolType(toolType: ToolType): ToolType {
  const allowedToolTypes: ToolType[] = [
    "article",
    "blog-title",
    "image",
    "background-removal",
    "object-removal",
    "resume-review",
  ];

  if (!allowedToolTypes.includes(toolType)) {
    throw validationError("Invalid tool type.", {
      toolType,
      allowedToolTypes,
    });
  }

  return toolType;
}

function normalizeCreationStatus(status: CreationStatus): CreationStatus {
  const allowedStatuses: CreationStatus[] = [
    "processing",
    "completed",
    "failed",
  ];

  if (!allowedStatuses.includes(status)) {
    throw validationError("Invalid creation status.", {
      status,
      allowedStatuses,
    });
  }

  return status;
}

function sanitizeMetadata(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const metadata: JsonRecord = {};

  for (const [key, item] of Object.entries(value)) {
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      metadata[key] = item;
    }

    if (Array.isArray(item)) {
      metadata[key] = item.filter(
        (entry) =>
          entry === null ||
          typeof entry === "string" ||
          typeof entry === "number" ||
          typeof entry === "boolean",
      );
    }
  }

  return metadata;
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw validationError(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;

  return Math.min(Math.max(Math.floor(value), min), max);
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}