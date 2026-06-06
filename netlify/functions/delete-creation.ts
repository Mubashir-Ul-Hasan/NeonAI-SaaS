import { requireUser } from "../../server/auth/requireUser";
import { deleteCreation } from "../../server/services/creationService";
import { validationError } from "../../server/utils/errors";
import { createHandler } from "../../server/utils/handler";
import {
  getBooleanQueryParam,
  getQueryParam,
  parseOptionalJsonBody,
} from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";
import { validateCreationId } from "../../server/utils/validators";

type DeleteCreationBody = {
  creationId?: unknown;
  id?: unknown;
  deleteCloudinaryAsset?: unknown;
};

export const handler = createHandler(
  async ({ event, method }) => {
    const auth = await requireUser(event);

    const body =
      method === "POST"
        ? parseOptionalJsonBody<DeleteCreationBody>(event)
        : {};

    const creationId = validateCreationId(
      body.creationId ?? body.id ?? getQueryParam(event, "creationId") ?? getQueryParam(event, "id"),
    );

    const deleteCloudinaryAsset = getDeleteCloudinaryAssetValue(event, body);

    const result = await deleteCreation({
      creationId,
      clerkUserId: auth.clerkUserId,
      deleteCloudinaryAsset,
    });

    if (!result.deleted) {
      throw validationError("Creation could not be deleted.");
    }

    return success(
      {
        deleted: true,
        creationId: result.id,
        deletedCloudinaryAsset: result.deletedCloudinaryAsset,
      },
      {
        message: "Creation deleted successfully.",
      },
    );
  },
  {
    allowedMethods: ["POST", "DELETE"],
  },
);

function getDeleteCloudinaryAssetValue(
  event: Parameters<typeof getBooleanQueryParam>[0],
  body: DeleteCreationBody,
): boolean {
  if (typeof body.deleteCloudinaryAsset === "boolean") {
    return body.deleteCloudinaryAsset;
  }

  if (typeof body.deleteCloudinaryAsset === "string") {
    const value = body.deleteCloudinaryAsset.toLowerCase();

    if (["true", "1", "yes"].includes(value)) return true;
    if (["false", "0", "no"].includes(value)) return false;
  }

  return getBooleanQueryParam(event, "deleteCloudinaryAsset", true);
}