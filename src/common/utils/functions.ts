export function addUtcDays(base: Date, days: number): Date {
  const utc = Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate() + days,
  );
  return new Date(utc);
}

export function nowUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function parseDdMmYyyyToUtcDate(dateStr: string): Date {
  if (!dateStr) return nowUtc();
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isSameUtcDate(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

export function isAfterOrSameUtc(d1: Date, d2: Date): boolean {
  return isSameUtcDate(d1, d2) || d1.getTime() > d2.getTime();
}

export function isBeforeOrSameUtc(d1: Date, d2: Date): boolean {
  return isSameUtcDate(d1, d2) || d1.getTime() < d2.getTime();
}
