import { NextResponse } from "next/server";

export type FieldErrors = Record<string, string>;

export function toZodFieldErrors(error: unknown): FieldErrors {
  if (!error || typeof error !== "object" || !("issues" in error)) {
    return {};
  }

  const issues = (error as { issues?: Array<{ path: Array<string | number>; message?: string }> }).issues ?? [];
  const fieldErrors: FieldErrors = {};

  for (const issue of issues) {
    const key = issue.path[0]?.toString();
    if (!key || fieldErrors[key]) continue;
    fieldErrors[key] = issue.message ?? "Invalid value.";
  }

  return fieldErrors;
}

export function validationErrorResponse(error: unknown, fallback = "Invalid input.") {
  const fieldErrors = toZodFieldErrors(error);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: fallback, fieldErrors }, { status: 400 });
  }
  return null;
}

export function fieldErrorResponse(fieldErrors: FieldErrors, status = 400) {
  return NextResponse.json({ error: Object.values(fieldErrors)[0], fieldErrors }, { status });
}

export function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
