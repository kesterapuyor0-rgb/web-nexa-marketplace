export function normalizePhoneE164(value: unknown, defaultDialCode = '+234'): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const numeric = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${numeric}` : `${defaultDialCode}${numeric}`;
}
