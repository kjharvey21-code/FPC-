/**
 * Returns today's local date formatted as YYYY-MM-DD (safe from UTC rollover).
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates that a YYYY-MM-DD string represents a real calendar date
 * between 1950-01-01 and today (inclusive).
 */
export function isValidBirthdate(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const [yStr, mStr, dStr] = trimmed.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);

  if (year < 1950 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return false;
  }

  const today = getTodayIsoDate();
  return trimmed <= today;
}

/**
 * Formats a YYYY-MM-DD birthdate string safely into a readable label (e.g. "Mar 12, 2005")
 * without UTC-to-local off-by-one day shifts.
 */
export function formatBirthdateDisplay(
  value?: string | null,
  monthStyle: 'short' | 'long' = 'short'
): string {
  if (!value) return '';
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return trimmed;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return trimmed;

  return date.toLocaleDateString('en-US', {
    month: monthStyle,
    day: 'numeric',
    year: 'numeric',
  });
}
