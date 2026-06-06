/// <reference types="node" />

import {
  buildResumeReviewMarkdown,
  reviewUploadedResume,
} from "../../server/ai/resumeReviewer";
import { requirePremiumWithUsageLimit } from "../../server/auth/requirePremium";
import {
  createCreation,
  createFailedCreation,
  mapCreationToPublicCreation,
} from "../../server/services/creationService";
import { trackFailure, trackSuccess } from "../../server/services/usageService";
import { getErrorMessage } from "../../server/utils/errors";
import { createPostHandler } from "../../server/utils/handler";
import {
  getFirstFile,
  getMultipartField,
  parseMultipartFormData,
} from "../../server/utils/parseMultipart";
import { success } from "../../server/utils/response";
import {
  validateResumeFile,
  validateReviewResumeFields,
} from "../../server/utils/validators";

export const handler = createPostHandler(async ({ event }) => {
  const startedAt = Date.now();

  const auth = await requirePremiumWithUsageLimit({
    event,
    toolType: "resume-review",
  });

  const form = parseMultipartFormData(event, {
    maxFiles: 1,
  });

  const resumeFile = validateResumeFile(getFirstFile(form, "file"));

  const targetRole =
    getMultipartField(form, "targetRole") ||
    getMultipartField(form, "target_role") ||
    getMultipartField(form, "role");

  const focus =
    getMultipartField(form, "focus") ||
    getMultipartField(form, "reviewFocus") ||
    getMultipartField(form, "review_focus");

  const fields = validateReviewResumeFields({
    targetRole,
    focus,
  });

  const prompt = [
    "Review resume",
    fields.targetRole ? `for ${fields.targetRole}` : "",
    fields.focus ? `with focus on ${fields.focus}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const review = await reviewUploadedResume(resumeFile, {
      targetRole: fields.targetRole,
      focus: fields.focus,
    });

    const resultText = buildResumeReviewMarkdown({
      score: review.score,
      summary: review.summary,
      strengths: review.strengths,
      improvements: review.improvements,
      atsSuggestions: review.atsSuggestions,
      fullReview: review.fullReview,
    });

    const creation = await createCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "resume-review",
      prompt,
      resultText,
      status: "completed",
      metadata: {
        score: review.score,
        targetRole: fields.targetRole ?? null,
        focus: fields.focus ?? null,
        fileName: resumeFile.fileName,
        fileSize: resumeFile.size,
        mimeType: resumeFile.mimeType,
        extractionMethod: review.extraction.method,
        extractedTextPreview: review.extraction.text.slice(0, 1200),
        extractionMetadata: review.extraction.metadata,
        strengths: review.strengths,
        improvements: review.improvements,
        atsSuggestions: review.atsSuggestions,
        usageLimitUsed: auth.usageLimit.used,
        usageLimitRemaining: auth.usageLimit.remaining,
      },
    });

    await trackSuccess({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: creation.id,
      toolType: "resume-review",
      provider: "resume-reviewer",
      tokensUsed: review.usage.totalTokens,
      latencyMs: Date.now() - startedAt,
      metadata: {
        score: review.score,
        fileName: resumeFile.fileName,
        fileSize: resumeFile.size,
        mimeType: resumeFile.mimeType,
        extractionMethod: review.extraction.method,
        promptTokens: review.usage.promptTokens,
        outputTokens: review.usage.outputTokens,
      },
    });

    return success(
      {
        creation: mapCreationToPublicCreation(creation),
        review: {
          score: review.score,
          summary: review.summary,
          strengths: review.strengths,
          improvements: review.improvements,
          atsSuggestions: review.atsSuggestions,
          fullReview: review.fullReview,
          extraction: {
            method: review.extraction.method,
            metadata: review.extraction.metadata,
          },
        },
        usage: {
          used: auth.usageLimit.used + 1,
          limit: auth.usageLimit.limit,
          remaining: Math.max(auth.usageLimit.remaining - 1, 0),
          plan: auth.usageLimit.plan,
        },
      },
      {
        message: "Resume reviewed successfully.",
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Resume review failed.");

    const failedCreation = await createFailedCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "resume-review",
      prompt,
      errorMessage,
      metadata: {
        targetRole: fields.targetRole ?? null,
        focus: fields.focus ?? null,
        fileName: resumeFile.fileName,
        fileSize: resumeFile.size,
        mimeType: resumeFile.mimeType,
      },
    });

    await trackFailure({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: failedCreation.id,
      toolType: "resume-review",
      provider: "resume-reviewer",
      latencyMs: Date.now() - startedAt,
      errorMessage,
      metadata: {
        fileName: resumeFile.fileName,
        fileSize: resumeFile.size,
        mimeType: resumeFile.mimeType,
      },
    });

    throw error;
  }
});