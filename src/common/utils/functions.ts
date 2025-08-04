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
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds(),
  ));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}