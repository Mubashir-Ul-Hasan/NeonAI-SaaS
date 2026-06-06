/// <reference types="node" />

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql as drizzleSql } from "drizzle-orm";

import { env, getSafeEnvSummary } from "../env";
import { databaseError } from "../utils/errors";
import * as dbSchema from "./schema";

const sqlClient = neon(env.databaseUrl);

export const db = drizzle(sqlClient, {
  schema: dbSchema,
  logger: env.isDevelopment,
});

export type Database = NeonHttpDatabase<typeof dbSchema>;

export async function testDatabaseConnection() {
  try {
    const result = await db.execute(drizzleSql`select 1 as ok`);

    return {
      connected: true,
      result,
    };
  } catch (error) {
    throw databaseError("Failed to connect to Neon database.", error);
  }
}

export async function getDatabaseHealth() {
  try {
    const startedAt = Date.now();

    await db.execute(drizzleSql`select 1`);

    return {
      status: "healthy" as const,
      latencyMs: Date.now() - startedAt,
      env: getSafeEnvSummary(),
    };
  } catch (error) {
    return {
      status: "unhealthy" as const,
      latencyMs: null,
      error: error instanceof Error ? error.message : "Unknown database error",
      env: getSafeEnvSummary(),
    };
  }
}

export async function executeDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorMessage = "Database operation failed.",
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw databaseError(errorMessage, error);
  }
}

export async function countRows(tableName: string) {
  const safeTableName = assertSafeTableName(tableName);

  const result = await db.execute(
    drizzleSql.raw(`select count(*)::int as count from ${safeTableName}`),
  );

  const firstRow = result.rows?.[0] as { count?: number } | undefined;

  return Number(firstRow?.count ?? 0);
}

export function assertSafeTableName(tableName: string) {
  const normalizedTableName = tableName.trim();

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(normalizedTableName)) {
    throw databaseError("Invalid table name.");
  }

  return normalizedTableName;
}

export { dbSchema };