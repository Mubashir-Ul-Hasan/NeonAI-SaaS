import { generateBlogTitlesWithGemini } from "../../server/ai/gemini";
import { requireUserWithUsageLimit } from "../../server/auth/requirePremium";
import {
  createCreation,
  createFailedCreation,
  mapCreationToPublicCreation,
} from "../../server/services/creationService";
import { trackFailure, trackSuccess } from "../../server/services/usageService";
import { getErrorMessage } from "../../server/utils/errors";
import { createPostHandler } from "../../server/utils/handler";
import { parseJsonBody } from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";
import { validateGenerateTitlesInput } from "../../server/utils/validators";

export const handler = createPostHandler(async ({ event }) => {
  const startedAt = Date.now();

  const auth = await requireUserWithUsageLimit({
    event,
    toolType: "blog-title",
  });

  const body = parseJsonBody(event);
  const input = validateGenerateTitlesInput(body);

  try {
    const result = await generateBlogTitlesWithGemini(input);

    const resultText = buildTitlesMarkdown(result.titles);

    const creation = await createCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "blog-title",
      prompt: input.topic,
      resultText,
      status: "completed",
      metadata: {
        topic: input.topic,
        category: input.category ?? null,
        style: input.style ?? null,
        count: input.count ?? result.titles.length,
        titles: result.titles,
        usageLimitUsed: auth.usageLimit.used,
        usageLimitRemaining: auth.usageLimit.remaining,
      },
    });

    await trackSuccess({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: creation.id,
      toolType: "blog-title",
      provider: "gemini",
      tokensUsed: result.usage.totalTokens,
      latencyMs: Date.now() - startedAt,
      metadata: {
        promptTokens: result.usage.promptTokens,
        outputTokens: result.usage.outputTokens,
        titleCount: result.titles.length,
      },
    });

    return success(
      {
        creation: mapCreationToPublicCreation(creation),
        titles: result.titles,
        usage: {
          used: auth.usageLimit.used + 1,
          limit: auth.usageLimit.limit,
          remaining: Math.max(auth.usageLimit.remaining - 1, 0),
          plan: auth.usageLimit.plan,
        },
      },
      {
        message: "Blog titles generated successfully.",
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Blog title generation failed.");

    const failedCreation = await createFailedCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "blog-title",
      prompt: input.topic,
      errorMessage,
      metadata: {
        topic: input.topic,
        category: input.category ?? null,
        style: input.style ?? null,
        count: input.count ?? 5,
      },
    });

    await trackFailure({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: failedCreation.id,
      toolType: "blog-title",
      provider: "gemini",
      latencyMs: Date.now() - startedAt,
      errorMessage,
    });

    throw error;
  }
});

function buildTitlesMarkdown(titles: string[]): string {
  return [
    "# Generated Blog Titles",
    "",
    ...titles.map((title, index) => `${index + 1}. ${title}`),
  ].join("\n");
}