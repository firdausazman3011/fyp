import { z } from "zod";
import { ActivityStatus, SuggestionStatus } from "@prisma/client";

export const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@siswa\.um\.edu\.my$/;
export const ADMIN_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters!")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter!")
  .regex(/[a-z]/, "Password must include at least one lowercase letter!")
  .regex(/[0-9]/, "Password must include at least one number!")
  .regex(/[!@#$%^&*]/, "Password must include at least one symbol (!@#$%^&*)!");

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .regex(STUDENT_EMAIL_REGEX, "Email must end with @siswa.um.edu.my"),
  password: passwordPolicy,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: passwordPolicy,
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or fewer."),
  profilePicture: z.string().trim().optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordPolicy,
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const changeEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .regex(ADMIN_EMAIL_REGEX, "Admin email must end with @gmail.com"),
});

const titleSchema = z
  .string()
  .trim()
  .min(5, "Title must be at least 5 characters.")
  .max(100, "Title must be at most 100 characters.");

const descriptionSchema = z
  .string()
  .trim()
  .min(20, "Description must be at least 20 characters.")
  .max(1000, "Description must be at most 1000 characters.");

const locationSchema = z
  .string()
  .trim()
  .min(2, "Location must be at least 2 characters.")
  .max(100, "Location must be at most 100 characters.");

const organizerSchema = z
  .string()
  .trim()
  .min(2, "Organizer must be at least 2 characters.")
  .max(100, "Organizer must be at most 100 characters.");

export function parseFutureDateTime(dateInput: string, timeInput: string) {
  const parsed = new Date(`${dateInput}T${timeInput}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseDateOnly(dateInput: string) {
  const parsed = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

const activitySchemaFields = {
  title: titleSchema,
  description: descriptionSchema,
  date: z.string().trim().min(1, "Date is required."),
  time: z.string().trim().min(1, "Time is required."),
  durationMinutes: z.coerce
    .number()
    .int("Duration must be a whole number of minutes.")
    .min(15, "Value must be greater than or equal to 15.")
    .max(1440, "Duration must be 1440 minutes or fewer."),
  participantLimit: z.coerce
    .number()
    .int("Participant limit must be a whole number.")
    .min(1, "Participant limit must be at least 1.")
    .max(10000, "Participant limit is too large."),
  location: locationSchema,
  organizer: organizerSchema,
  imageUrl: z.string().trim().min(1, "Image is required."),
  status: z.nativeEnum(ActivityStatus).default(ActivityStatus.DRAFT),
};

function withFutureDateValidation<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.superRefine((value, ctx) => {
    const scheduledAt = parseFutureDateTime(value.date, value.time);
    if (!scheduledAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Invalid date/time." });
      return;
    }
    if (scheduledAt.getTime() < Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Date/time cannot be in the past." });
    }
  });
}

export const createActivitySchema = withFutureDateValidation(z.object(activitySchemaFields));

export const updateActivitySchema = withFutureDateValidation(
  z.object({
    ...activitySchemaFields,
    status: z.nativeEnum(ActivityStatus),
  }),
);

export const suggestionSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    date: z.string().trim().min(1, "Date is required."),
    location: locationSchema,
  })
  .superRefine((value, ctx) => {
    const parsed = parseDateOnly(value.date);
    if (!parsed) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Invalid date." });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed.getTime() < today.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Suggested activity date must be today or in the future.",
      });
    }
  });

export const reviewSuggestionSchema = z.object({
  status: z.enum([SuggestionStatus.APPROVED, SuggestionStatus.REJECTED]),
  adminRemark: z.string().trim().max(500, "Remark must be 500 characters or fewer.").optional(),
});

export function toZodErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues?: Array<{ message?: string }> }).issues;
    return issues?.[0]?.message ?? "Invalid input.";
  }
  return "Invalid input.";
}
