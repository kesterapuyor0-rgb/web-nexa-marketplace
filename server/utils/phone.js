export function normalizePhoneE164(value, defaultDialCode = "+234") {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const numeric = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${numeric}` : `${defaultDialCode}${numeric}`;
}
