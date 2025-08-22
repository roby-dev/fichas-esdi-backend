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

type DateInput = string | Date | undefined | null;

const DAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function toUtcDateOrNull(v?: DateInput): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  ); // normaliza como UTC-only date instance
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * formatea una fecha según opciones:
 * - weekday: true -> "martes 01 de diciembre del 2026"
 * - weekday: false, includeYear true -> "01 de diciembre de 2026"
 * - weekday: false, includeYear false -> "01 de diciembre"
 */
function formatUtcDate(
  d: Date,
  opts?: { weekday?: boolean; includeYear?: boolean },
): string {
  const weekday = opts?.weekday ?? false;
  const includeYear = opts?.includeYear ?? true;

  const day = pad2(d.getUTCDate());
  const monthName = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();

  if (weekday) {
    const wd = DAYS[d.getUTCDay()];
    // si mostramos weekday, usamos "del" antes del año -> "martes 01 de diciembre del 2026"
    return `${wd} ${day} de ${monthName} del ${year}`;
  }

  if (includeYear) {
    // sin weekday usamos "de" -> "01 de diciembre de 2026"
    return `${day} de ${monthName} de ${year}`;
  }

  // sin year -> "01 de diciembre"
  return `${day} de ${monthName}`;
}

// ---- función genérica principal ----
/**
 * Genera un string del tipo:
 * "Ficha de ingreso disponible desde el 13 de abril hasta el 25 de mayo de 2025"
 * o
 * "Ficha de egreso disponible desde el martes 01 de diciembre del 2026"
 *
 * @param label - ej. "Ficha de ingreso disponible"
 * @param from - fecha inicio (string ISO o Date)
 * @param until - fecha fin (string ISO o Date)
 * @param opts.weekdayForSingle - si true, al mostrar una sola fecha (from o until) añade weekday
 */
export function formatAvailability(
  label: string,
  from?: DateInput,
  until?: DateInput,
  opts?: { weekdayForSingle?: boolean },
): string {
  const a = toUtcDateOrNull(from);
  const b = toUtcDateOrNull(until);

  if (!a && !b) return `${label} fechas no disponibles`;

  if (a && b) {
    if (isSameUtcDate(a, b)) {
      return `${label} el ${formatUtcDate(a, { weekday: true, includeYear: true })}`;
    }

    if (a.getUTCFullYear() === b.getUTCFullYear()) {
      return `${label} desde el ${formatUtcDate(a, { weekday: true, includeYear: false })} hasta el ${formatUtcDate(b, { weekday: false, includeYear: true })}`;
    }

    return `${label} desde el ${formatUtcDate(a, { weekday: true, includeYear: true })} hasta el ${formatUtcDate(b, { weekday: true, includeYear: true })}`;
  }

  if (a && !b) {
    if (opts?.weekdayForSingle) {
      return `${label} desde el ${formatUtcDate(a, { weekday: true, includeYear: true })}`;
    }
    return `${label} desde el ${formatUtcDate(a, { weekday: false, includeYear: true })}`;
  }

  if (!a && b) {
    if (opts?.weekdayForSingle) {
      return `${label} hasta el ${formatUtcDate(b, { weekday: true, includeYear: true })}`;
    }
    return `${label} hasta el ${formatUtcDate(b, { weekday: false, includeYear: true })}`;
  }

  return `${label} fechas no disponibles`;
}

export function formatAdmissionAvailability(
  admissionValidFrom?: DateInput,
  admissionValidUntil?: DateInput,
) {
  return formatAvailability(
    'Ficha de ingreso disponible',
    admissionValidFrom,
    admissionValidUntil,
    { weekdayForSingle: true },
  );
}

export function formatGraduationAvailability(
  graduationFromOrDate?: DateInput,
  graduationUntil?: DateInput,
) {
  return formatAvailability(
    'Ficha de egreso disponible',
    graduationFromOrDate,
    graduationUntil,
    { weekdayForSingle: true },
  );
}
