import { requireUser } from "../../server/auth/requireUser";
import { createPostHandler } from "../../server/utils/handler";
import { parseOptionalJsonBody } from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";
import { env } from "../../server/env";
import { validationError } from "../../server/utils/errors";

type CreateCheckoutBody = {
  planId?: unknown;
  returnUrl?: unknown;
};

type CheckoutResponse = {
  checkoutUrl: string;
  setupRequired: boolean;
  provider: "clerk-billing";
  planId: string;
  returnUrl: string;
  message: string;
};

const defaultPremiumPlanId = "premium";

export const handler = createPostHandler(async ({ event }) => {
  const auth = await requireUser(event);
  const body = parseOptionalJsonBody<CreateCheckoutBody>(event);

  const planId = normalizePlanId(body.planId);
  const returnUrl = normalizeReturnUrl(body.returnUrl);

  const configuredCheckoutUrl =
    process.env.CLERK_BILLING_CHECKOUT_URL ||
    process.env.BILLING_CHECKOUT_URL ||
    process.env.CHECKOUT_URL;

  if (!configuredCheckoutUrl) {
    const fallbackUrl = buildClientBillingUrl({
      returnUrl,
      planId,
      setupRequired: true,
    });

    return success<CheckoutResponse>(
      {
        checkoutUrl: fallbackUrl,
        setupRequired: true,
        provider: "clerk-billing",
        planId,
        returnUrl,
        message:
          "Billing checkout URL is not configured yet. Add CLERK_BILLING_CHECKOUT_URL after creating your Clerk Billing checkout flow.",
      },
      {
        message: "Checkout setup is pending.",
      },
    );
  }

  const checkoutUrl = buildCheckoutUrl(configuredCheckoutUrl, {
    clerkUserId: auth.clerkUserId,
    userId: auth.user.id,
    email: auth.user.email,
    planId,
    returnUrl,
  });

  return success<CheckoutResponse>(
    {
      checkoutUrl,
      setupRequired: false,
      provider: "clerk-billing",
      planId,
      returnUrl,
      message: "Checkout URL created successfully.",
    },
    {
      message: "Checkout URL created successfully.",
    },
  );
});

function normalizePlanId(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return defaultPremiumPlanId;
  }

  if (typeof value !== "string") {
    throw validationError("planId must be a string.");
  }

  const planId = value.trim();

  if (!planId) {
    return defaultPremiumPlanId;
  }

  if (!/^[a-zA-Z0-9_-]{2,80}$/.test(planId)) {
    throw validationError("planId contains invalid characters.");
  }

  return planId;
}

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

function buildCheckoutUrl(
  baseUrl: string,
  params: {
    clerkUserId: string;
    userId: string;
    email: string;
    planId: string;
    returnUrl: string;
  },
): string {
  try {
    const url = new URL(baseUrl);

    url.searchParams.set("client_reference_id", params.userId);
    url.searchParams.set("clerk_user_id", params.clerkUserId);
    url.searchParams.set("email", params.email);
    url.searchParams.set("plan", params.planId);
    url.searchParams.set("return_url", params.returnUrl);

    return url.toString();
  } catch {
    throw validationError("Configured checkout URL is invalid.");
  }
}

function buildClientBillingUrl(params: {
  returnUrl: string;
  planId: string;
  setupRequired: boolean;
}): string {
  const url = new URL(`${env.clientUrl}/dashboard/billing`);

  url.searchParams.set("plan", params.planId);
  url.searchParams.set("return_url", params.returnUrl);

  if (params.setupRequired) {
    url.searchParams.set("setup", "required");
  }

  return url.toString();
}