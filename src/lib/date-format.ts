import { formatDateOnlyValue, parseDateOnlyInput } from "@/lib/date-only";

export function formatDateDDMMYYYY(value: Date | string) {
  if (typeof value === "string") {
    const dateOnly = parseDateOnlyInput(value);
    if (dateOnly) {
      return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(dateOnly);
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" }).format(date);
}

export function serializeActivityDate(value: Date): string {
  return formatDateOnlyValue(value);
}

export function formatDateTimeDDMMYYYY(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const formattedDate = new Intl.DateTimeFormat("en-GB").format(date);
  const formattedTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${formattedDate}, ${formattedTime}`;
}
