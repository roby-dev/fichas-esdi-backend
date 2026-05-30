/**
 * Normalizes a raw DNI value to exactly 8 digits.
 *
 * Rules:
 * - Strips any non-digit characters (spaces, hyphens, letters, etc.)
 * - Pads with leading zeros if fewer than 8 digits remain
 * - Returns null if the result has more than 8 digits or is empty
 */
export function normalizeDni(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 8) return null;
  return digits.padStart(8, '0');
}
