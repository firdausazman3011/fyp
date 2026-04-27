import { z } from "zod";

export const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@siswa\.um\.edu\.my$/;

const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters!")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter!")
  .regex(/[0-9]/, "Password must include at least one number!")
  .regex(/[!@#$%^&*]/, "Password must include at least one symbol (!@#$%^&*)!");

export const signupSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .regex(STUDENT_EMAIL_REGEX, "Email must end with @siswa.um.edu.my"),
  password: passwordPolicy,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: passwordPolicy,
});

export function toZodErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues?: Array<{ message?: string }> }).issues;
    return issues?.[0]?.message ?? "Invalid input.";
  }
  return "Invalid input.";
}
