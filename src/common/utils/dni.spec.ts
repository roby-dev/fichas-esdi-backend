import { normalizeDni } from './dni';

describe('normalizeDni', () => {
  it('returns null for null input', () => {
    expect(normalizeDni(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeDni(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeDni('')).toBeNull();
  });

  it('returns null when only non-digit characters', () => {
    expect(normalizeDni('ABC')).toBeNull();
  });

  it('returns null when mixed letters produce zero digits', () => {
    expect(normalizeDni('---')).toBeNull();
  });

  it('pads a 7-digit value with a leading zero', () => {
    expect(normalizeDni('1234567')).toBe('01234567');
  });

  it('returns an 8-digit value unchanged', () => {
    expect(normalizeDni('12345678')).toBe('12345678');
  });

  it('strips whitespace and returns 8 digits', () => {
    expect(normalizeDni('  12345678  ')).toBe('12345678');
  });

  it('strips hyphens and returns 8 digits', () => {
    expect(normalizeDni('1234-5678')).toBe('12345678');
  });

  it('returns null when more than 8 digits', () => {
    expect(normalizeDni('123456789')).toBeNull();
  });

  it('strips non-digits and pads a short result', () => {
    expect(normalizeDni(' 123 456 7')).toBe('01234567');
  });
});
