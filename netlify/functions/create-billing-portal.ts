import { requireUser } from "../../server/auth/requireUser";
import { env } from "../../server/env";
import { validationError } from "../../server/utils/errors";
import { createPostHandler } from "../../server/utils/handler";
import { parseOptionalJsonBody } from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";

type CreateBillingPortalBody = {
  returnUrl?: unknown;
};

type BillingPortalResponse = {
  portalUrl: string;
  setupRequired: boolean;
  provider: "clerk-billing";
  returnUrl: string;
  message: string;
};

export const handler = createPostHandler(async ({ event }) => {
  const auth = await requireUser(event);
  const body = parseOptionalJsonBody<CreateBillingPortalBody>(event);

  const returnUrl = normalizeReturnUrl(body.returnUrl);

  const configuredPortalUrl =
    process.env.CLERK_BILLING_PORTAL_URL ||
    process.env.BILLING_PORTAL_URL ||
    process.env.CUSTOMER_PORTAL_URL;

  if (!configuredPortalUrl) {
    const fallbackUrl = buildClientBillingUrl({
      returnUrl,
      setupRequired: true,
    });

    return success<BillingPortalResponse>(
      {
        portalUrl: fallbackUrl,
        setupRequired: true,
        provider: "clerk-billing",
        returnUrl,
        message:
          "Billing portal URL is not configured yet. Add CLERK_BILLING_PORTAL_URL after enabling your billing customer portal.",
      },
      {
        message: "Billing portal setup is pending.",
      },
    );
  }

  const portalUrl = buildPortalUrl(configuredPortalUrl, {
    clerkUserId: auth.clerkUserId,
    userId: auth.user.id,
    email: auth.user.email,
    returnUrl,
  });

  return success<BillingPortalResponse>(
    {
      portalUrl,
      setupRequired: false,
      provider: "clerk-billing",
      returnUrl,
      message: "Billing portal URL created successfully.",
    },
    {
      message: "Billing portal URL created successfully.",
    },
  );
});

function normalizeReturnUrl(value: unknown): string {
  const fallbackUrl = `${env.clientUrl}/dashboard/billing`;

  if (value === undefined || value === null || value === "") {
    return fallbackUrl;
  }

  if (typeof value !== "string") {
    throw validationError("returnUrl must be a string.");
  }

  const returnUrl = value.trim();

  if (!returnUrl) {
    return fallbackUrl;
  }

  try {
    const parsedReturnUrl = new URL(returnUrl);
    const parsedClientUrl = new URL(env.clientUrl);

    if (parsedReturnUrl.origin !== parsedClientUrl.origin) {
      throw validationError("returnUrl must use the same origin as CLIENT_URL.");
    }

    return parsedReturnUrl.toString();
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") {
      throw error;
    }

    throw validationError("returnUrl must be a valid URL.");
  }
}

function buildPortalUrl(
  baseUrl: string,
  params: {
    clerkUserId: string;
    userId: string;
    email: string;
    returnUrl: string;
  },
): string {
  try {
    const url = new URL(baseUrl);

    url.searchParams.set("client_reference_id", params.userId);
    url.searchParams.set("clerk_user_id", params.clerkUserId);
    url.searchParams.set("email", params.email);
    url.searchParams.set("return_url", params.returnUrl);

    return url.toString();
  } catch {
    throw validationError("Configured billing portal URL is invalid.");
  }
}

function buildClientBillingUrl(params: {
  returnUrl: string;
  setupRequired: boolean;
}): string {
  const url = new URL(`${env.clientUrl}/dashboard/billing`);

  url.searchParams.set("return_url", params.returnUrl);

  if (params.setupRequired) {
    url.searchParams.set("portal_setup", "required");
  }

  return url.toString();
}