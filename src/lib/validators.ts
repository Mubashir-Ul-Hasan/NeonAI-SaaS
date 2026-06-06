import { z } from "zod";

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_RESUME_TYPES,
  ARTICLE_LENGTH_OPTIONS,
  ARTICLE_TONE_OPTIONS,
  BLOG_CATEGORY_OPTIONS,
  BLOG_TITLE_STYLE_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  MAX_IMAGE_SIZE_MB,
  MAX_RESUME_SIZE_MB,
  RESUME_REVIEW_FOCUS_OPTIONS,
} from "./constants";
import { isValidEmail } from "./utils";

const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_RESUME_SIZE_BYTES = MAX_RESUME_SIZE_MB * 1024 * 1024;

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function getOptionValues<T extends readonly { value: string }[]>(options: T) {
  return options.map((option) => option.value) as [
    T[number]["value"],
    ...T[number]["value"][],
  ];
}

function getStringOptionValues<T extends readonly string[]>(options: T) {
  return options as unknown as [T[number], ...T[number][]];
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .refine((value) => isValidEmail(value), {
    message: "Please enter a valid email address.",
  });

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be less than 72 characters.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/[0-9]/, "Password must include at least one number.");

export const promptSchema = z
  .string()
  .trim()
  .min(5, "Prompt must be at least 5 characters.")
  .max(2500, "Prompt must be less than 2,500 characters.");

export const shortPromptSchema = z
  .string()
  .trim()
  .min(3, "Prompt must be at least 3 characters.")
  .max(500, "Prompt must be less than 500 characters.");

export const objectRemovalPromptSchema = z
  .string()
  .trim()
  .min(5, "Describe the object you want to remove.")
  .max(700, "Object description must be less than 700 characters.");

export const articleLengthSchema = z.enum(
  getOptionValues(ARTICLE_LENGTH_OPTIONS),
  {
    message: "Please select a valid article length.",
  },
);

export const articleToneSchema = z.enum(
  getStringOptionValues(ARTICLE_TONE_OPTIONS),
  {
    message: "Please select a valid article tone.",
  },
);

export const blogCategorySchema = z.enum(
  getStringOptionValues(BLOG_CATEGORY_OPTIONS),
  {
    message: "Please select a valid blog category.",
  },
);

export const blogTitleStyleSchema = z.enum(
  getStringOptionValues(BLOG_TITLE_STYLE_OPTIONS),
  {
    message: "Please select a valid title style.",
  },
);

export const imageStyleSchema = z.enum(getOptionValues(IMAGE_STYLE_OPTIONS), {
  message: "Please select a valid image style.",
});

export const imageSizeSchema = z.enum(getOptionValues(IMAGE_SIZE_OPTIONS), {
  message: "Please select a valid image size.",
});

export const resumeFocusSchema = z.enum(
  getStringOptionValues(RESUME_REVIEW_FOCUS_OPTIONS),
  {
    message: "Please select a valid resume review focus.",
  },
);

export const imageFileSchema = z
  .custom<File>((value) => isFile(value), {
    message: "Please upload an image file.",
  })
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type as never), {
    message: "Please upload a JPG, PNG, or WebP image.",
  })
  .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, {
    message: `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`,
  });

export const resumeFileSchema = z
  .custom<File>((value) => isFile(value), {
    message: "Please upload your resume.",
  })
  .refine((file) => ACCEPTED_RESUME_TYPES.includes(file.type as never), {
    message: "Please upload a PDF, JPG, or PNG resume.",
  })
  .refine((file) => file.size <= MAX_RESUME_SIZE_BYTES, {
    message: `Resume must be smaller than ${MAX_RESUME_SIZE_MB}MB.`,
  });

export const signInSchema = z.object({
  email: emailSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be less than 80 characters."),
});

export const adminLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Admin username is required.")
    .max(80, "Username must be less than 80 characters."),
  password: z
    .string()
    .min(6, "Admin password is required.")
    .max(120, "Password must be less than 120 characters."),
});

export const generateArticleSchema = z.object({
  prompt: promptSchema,
  length: articleLengthSchema,
  tone: articleToneSchema.default("Professional"),
});

export const generateTitlesSchema = z.object({
  prompt: shortPromptSchema,
  category: blogCategorySchema,
  style: blogTitleStyleSchema.default("SEO Optimized"),
  count: z
    .number()
    .int("Count must be a whole number.")
    .min(3, "Generate at least 3 titles.")
    .max(15, "Generate no more than 15 titles.")
    .default(8),
});

export const generateImageSchema = z.object({
  prompt: promptSchema.max(1200, "Image prompt must be less than 1,200 characters."),
  style: imageStyleSchema,
  size: imageSizeSchema.default("square"),
});

export const removeBackgroundSchema = z.object({
  image: imageFileSchema,
});

export const removeObjectSchema = z.object({
  image: imageFileSchema,
  prompt: objectRemovalPromptSchema,
});

export const reviewResumeSchema = z.object({
  resume: resumeFileSchema,
  focus: resumeFocusSchema.default("Overall Review"),
});

export const creationFilterSchema = z.object({
  toolType: z
    .enum([
      "article",
      "blog-title",
      "image",
      "background-removal",
      "object-removal",
      "resume-review",
    ])
    .optional(),
  page: z.coerce
    .number()
    .int("Page must be a whole number.")
    .min(1, "Page must be at least 1.")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be a whole number.")
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit cannot be more than 100.")
    .default(20),
});

export const deleteCreationSchema = z.object({
  creationId: z
    .string()
    .trim()
    .min(1, "Creation ID is required.")
    .max(120, "Invalid creation ID."),
});

export const billingPlanSchema = z.object({
  plan: z.enum(["free", "premium"], {
    message: "Please select a valid plan.",
  }),
});

export const userSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be less than 80 characters.")
    .optional(),
  email: emailSchema.optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export type GenerateArticleInput = z.infer<typeof generateArticleSchema>;
export type GenerateTitlesInput = z.infer<typeof generateTitlesSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
export type RemoveBackgroundInput = z.infer<typeof removeBackgroundSchema>;
export type RemoveObjectInput = z.infer<typeof removeObjectSchema>;
export type ReviewResumeInput = z.infer<typeof reviewResumeSchema>;

export type CreationFilterInput = z.infer<typeof creationFilterSchema>;
export type DeleteCreationInput = z.infer<typeof deleteCreationSchema>;
export type BillingPlanInput = z.infer<typeof billingPlanSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  values: unknown,
): {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
} {
  const result = schema.safeParse(values);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: {},
    };
  }

  const errors: Record<string, string> = {};

  result.error.issues.forEach((issue) => {
    const key = issue.path.join(".") || "form";

    if (!errors[key]) {
      errors[key] = issue.message;
    }
  });

  return {
    success: false,
    errors,
  };
}

export function getFirstValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
}

export function getFieldError(
  errors: Record<string, string | undefined>,
  fieldName: string,
) {
  return errors[fieldName] ?? "";
}

export function hasFieldError(
  errors: Record<string, string | undefined>,
  fieldName: string,
) {
  return Boolean(errors[fieldName]);
}

export function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function getFileFromFormData(formData: FormData, key: string) {
  const value = formData.get(key);

  return isFile(value) ? value : null;
}