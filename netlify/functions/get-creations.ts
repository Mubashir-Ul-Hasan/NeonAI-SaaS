import type { CreationStatus, ToolType } from "../../server/types";
import { requireUser } from "../../server/auth/requireUser";
import {
  getCreationCounts,
  listCreations,
} from "../../server/services/creationService";
import { getUsageSummary } from "../../server/services/usageService";
import { validationError } from "../../server/utils/errors";
import { createGetHandler } from "../../server/utils/handler";
import {
  getBooleanQueryParam,
  getPaginationParams,
  getQueryParam,
} from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";
import {
  isToolType,
  validateSearchQuery,
} from "../../server/utils/validators";

export const handler = createGetHandler(async ({ event }) => {
  const auth = await requireUser(event);

  const pagination = getPaginationParams(event, {
    page: 1,
    limit: 12,
  });

  const toolType = parseToolTypeQuery(getQueryParam(event, "toolType"));
  const status = parseCreationStatusQuery(getQueryParam(event, "status"));
  const search = validateSearchQuery(getQueryParam(event, "search"));
  const includeFailed = getBooleanQueryParam(event, "includeFailed", false);

  const [creationsResult, counts, usage] = await Promise.all([
    listCreations({
      clerkUserId: auth.clerkUserId,
      page: pagination.page,
      limit: pagination.limit,
      toolType,
      status,
      search,
      includeFailed,
    }),
    getCreationCounts({
      clerkUserId: auth.clerkUserId,
    }),
    getUsageSummary({
      clerkUserId: auth.clerkUserId,
      plan: auth.user.plan,
      period: "month",
    }),
  ]);

  return success(
    {
      creations: creationsResult.items,
      pagination: creationsResult.pagination,
      counts,
      usage,
      filters: {
        toolType: toolType ?? null,
        status: status ?? null,
        search: search ?? null,
        includeFailed,
      },
    },
    {
      message: "Creations loaded successfully.",
    },
  );
});

function parseToolTypeQuery(value: string | undefined): ToolType | undefined {
  if (!value) return undefined;

  if (!isToolType(value)) {
    throw validationError("Invalid toolType query parameter.", {
      received: value,
      allowedValues: [
        "article",
        "blog-title",
        "image",
        "background-removal",
        "object-removal",
        "resume-review",
      ],
    });
  }

  return value;
}

function parseCreationStatusQuery(
  value: string | undefined,
): CreationStatus | undefined {
  if (!value) return undefined;

  if (
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }

  throw validationError("Invalid status query parameter.", {
    received: value,
    allowedValues: ["processing", "completed", "failed"],
  });
}