const APP_LOCALE = "en-IN";
const IST_OFFSET_MINUTES = 5 * 60 + 30;

function toDate(value) {
  if (!value) return null;
  const naiveIsoUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  const normalized =
    typeof value === "string" && naiveIsoUtcPattern.test(value)
      ? `${value}Z`
      : value;
  const date = value instanceof Date ? value : new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIstParts(value) {
  const date = toDate(value);
  if (!date) return null;
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return {
    day: String(istDate.getUTCDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat(APP_LOCALE, { month: "short", timeZone: "UTC" }).format(istDate),
    year: istDate.getUTCFullYear(),
    hour24: istDate.getUTCHours(),
    minute: String(istDate.getUTCMinutes()).padStart(2, "0"),
  };
}

function formatHour(parts) {
  const hour12 = parts.hour24 % 12 || 12;
  const suffix = parts.hour24 >= 12 ? "PM" : "AM";
  return `${String(hour12).padStart(2, "0")}:${parts.minute} ${suffix}`;
}

export function formatDateTime(value) {
  const parts = toIstParts(value);
  if (!parts) return "Not available";
  return `${parts.day} ${parts.month} ${parts.year}, ${formatHour(parts)} IST`;
}

export function formatDate(value) {
  const parts = toIstParts(value);
  if (!parts) return "Not available";
  return `${parts.day} ${parts.month} ${parts.year}`;
}

export function formatTime(value) {
  const parts = toIstParts(value);
  if (!parts) return "Not available";
  return `${formatHour(parts)} IST`;
}
