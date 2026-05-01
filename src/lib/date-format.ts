export function formatDateDDMMYYYY(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-GB").format(date);
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
