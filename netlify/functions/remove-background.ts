/// <reference types="node" />

import { removeBackgroundFromUploadedFile } from "../../server/ai/clipdrop";
import { requirePremiumWithUsageLimit } from "../../server/auth/requirePremium";
import {
  createCreation,
  createFailedCreation,
  mapCreationToPublicCreation,
} from "../../server/services/creationService";
import { trackFailure, trackSuccess } from "../../server/services/usageService";
import { uploadBufferToCloudinary } from "../../server/storage/cloudinary";
import { getErrorMessage } from "../../server/utils/errors";
import { createPostHandler } from "../../server/utils/handler";
import {
  getFirstFile,
  getMultipartField,
  parseMultipartFormData,
} from "../../server/utils/parseMultipart";
import { success } from "../../server/utils/response";
import { validateImageFile } from "../../server/utils/validators";

export const handler = createPostHandler(async ({ event }) => {
  const startedAt = Date.now();

  const auth = await requirePremiumWithUsageLimit({
    event,
    toolType: "background-removal",
  });

  const form = parseMultipartFormData(event, {
    maxFiles: 1,
  });

  const imageFile = validateImageFile(getFirstFile(form, "file"));
  const prompt =
    getMultipartField(form, "prompt") ||
    getMultipartField(form, "description") ||
    "Remove image background";

  try {
    const clipdropResult = await removeBackgroundFromUploadedFile(imageFile);

    const uploadedImage = await uploadBufferToCloudinary(
      clipdropResult.outputBuffer,
      {
        folder: "quickai/background-removal",
        fileName: clipdropResult.outputFileName,
        resourceType: "image",
        tags: [
          "quickai",
          "background-removal",
          `user-${auth.clerkUserId}`,
        ],
        metadata: {
          toolType: "background-removal",
          clerkUserId: auth.clerkUserId,
          originalFileName: imageFile.fileName,
          originalMimeType: imageFile.mimeType,
        },
      },
    );

    const creation = await createCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "background-removal",
      prompt,
      resultImageUrl: uploadedImage.secureUrl,
      cloudinaryPublicId: uploadedImage.publicId,
      status: "completed",
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: clipdropResult.originalFileSize,
        outputFileSize: clipdropResult.outputFileSize,
        outputMimeType: clipdropResult.outputMimeType,
        cloudinaryBytes: uploadedImage.bytes,
        cloudinaryFormat: uploadedImage.format,
        width: uploadedImage.width ?? null,
        height: uploadedImage.height ?? null,
        remainingCredits: clipdropResult.remainingCredits ?? null,
        creditsConsumed: clipdropResult.creditsConsumed ?? null,
        clipdropLatencyMs: clipdropResult.latencyMs,
        usageLimitUsed: auth.usageLimit.used,
        usageLimitRemaining: auth.usageLimit.remaining,
      },
    });

    await trackSuccess({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: creation.id,
      toolType: "background-removal",
      provider: "clipdrop",
      latencyMs: Date.now() - startedAt,
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: clipdropResult.originalFileSize,
        outputFileSize: clipdropResult.outputFileSize,
        outputMimeType: clipdropResult.outputMimeType,
        cloudinaryPublicId: uploadedImage.publicId,
        clipdropLatencyMs: clipdropResult.latencyMs,
        remainingCredits: clipdropResult.remainingCredits ?? null,
        creditsConsumed: clipdropResult.creditsConsumed ?? null,
      },
    });

    return success(
      {
        creation: mapCreationToPublicCreation(creation),
        image: {
          imageUrl: uploadedImage.secureUrl,
          cloudinaryPublicId: uploadedImage.publicId,
          width: uploadedImage.width ?? null,
          height: uploadedImage.height ?? null,
          format: uploadedImage.format,
          bytes: uploadedImage.bytes,
        },
        usage: {
          used: auth.usageLimit.used + 1,
          limit: auth.usageLimit.limit,
          remaining: Math.max(auth.usageLimit.remaining - 1, 0),
          plan: auth.usageLimit.plan,
        },
      },
      {
        message: "Background removed successfully.",
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Background removal failed.");

    const failedCreation = await createFailedCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "background-removal",
      prompt,
      errorMessage,
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: imageFile.size,
        mimeType: imageFile.mimeType,
      },
    });

    await trackFailure({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: failedCreation.id,
      toolType: "background-removal",
      provider: "clipdrop",
      latencyMs: Date.now() - startedAt,
      errorMessage,
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: imageFile.size,
        mimeType: imageFile.mimeType,
      },
    });

    throw error;
  }
});