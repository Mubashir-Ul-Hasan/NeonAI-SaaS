import { generateArticleWithGemini } from "../../server/ai/gemini";
import { requireUserWithUsageLimit } from "../../server/auth/requirePremium";
import {
  createCreation,
  createFailedCreation,
  mapCreationToPublicCreation,
} from "../../server/services/creationService";
import { trackFailure, trackSuccess } from "../../server/services/usageService";
import { createPostHandler } from "../../server/utils/handler";
import { parseJsonBody } from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";
import { validateGenerateArticleInput } from "../../server/utils/validators";
import { getErrorMessage } from "../../server/utils/errors";

export const handler = createPostHandler(async ({ event }) => {
  const startedAt = Date.now();

  const auth = await requireUserWithUsageLimit({
    event,
    toolType: "article",
  });

  const body = parseJsonBody(event);
  const input = validateGenerateArticleInput(body);

  try {
    const article = await generateArticleWithGemini(input);

    const resultText = buildArticleMarkdown({
      title: article.title,
      content: article.content,
    });

    const creation = await createCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "article",
      prompt: input.prompt,
      resultText,
      status: "completed",
      metadata: {
        title: article.title,
        tone: input.tone ?? null,
        length: input.length ?? "medium",
        keywords: input.keywords ?? [],
        wordCount: article.wordCount,
        readingTimeMinutes: article.readingTimeMinutes,
        usageLimitUsed: auth.usageLimit.used,
        usageLimitRemaining: auth.usageLimit.remaining,
      },
    });

    await trackSuccess({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: creation.id,
      toolType: "article",
      provider: "gemini",
      tokensUsed: article.usage.totalTokens,
      latencyMs: Date.now() - startedAt,
      metadata: {
        promptTokens: article.usage.promptTokens,
        outputTokens: article.usage.outputTokens,
        wordCount: article.wordCount,
        readingTimeMinutes: article.readingTimeMinutes,
      },
    });

    return success(
      {
        creation: mapCreationToPublicCreation(creation),
        article: {
          title: article.title,
          content: article.content,
          wordCount: article.wordCount,
          readingTimeMinutes: article.readingTimeMinutes,
        },
        usage: {
          used: auth.usageLimit.used + 1,
          limit: auth.usageLimit.limit,
          remaining: Math.max(auth.usageLimit.remaining - 1, 0),
          plan: auth.usageLimit.plan,
        },
      },
      {
        message: "Article generated successfully.",
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Article generation failed.");

    const failedCreation = await createFailedCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "article",
      prompt: input.prompt,
      errorMessage,
      metadata: {
        tone: input.tone ?? null,
        length: input.length ?? "medium",
        keywords: input.keywords ?? [],
      },
    });

    await trackFailure({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: failedCreation.id,
      toolType: "article",
      provider: "gemini",
      latencyMs: Date.now() - startedAt,
      errorMessage,
    });

    throw error;
  }
});

function buildArticleMarkdown(input: {
  title: string;
  content: string;
}): string {
  const cleanTitle = input.title.trim();
  const cleanContent = input.content.trim();

  if (cleanContent.startsWith("#")) {
    return cleanContent;
  }

  return [`# ${cleanTitle}`, "", cleanContent].join("\n");
}