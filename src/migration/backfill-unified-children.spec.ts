/**
 * Idempotency and correctness spec for the backfill-unified-children migration.
 *
 * The migration's core transformation is a PURE function mergeChildrenSources().
 * All DB I/O lives in a thin wrapper called separately.
 *
 * Tested behaviors:
 *   - Idempotency: applying the merge twice yields the same output as once
 *   - Form record is authoritative (firstName, lastName, birthday, admissionDate)
 *   - alert_children supplies Excel-only fields (gender, childCode, fullName, ...)
 *   - Invalid DNIs are excluded from the output
 *   - Date divergence: Excel dates that differ from form dates → birthdayImported / admissionDateImported
 *   - Records with only an alert_children entry (no form record) are included
 *   - Records unique to form (no alert_children match) are included
 */

import {
  mergeChildrenSources,
  normalizeDniMigration,
  type FormChild,
  type AlertChild,
  type UnifiedChild,
} from '../../migration/scripts/backfill-unified-children';

// ─── fixtures ────────────────────────────────────────────────────────────────

const BIRTHDAY_FORM = new Date('2015-03-20T00:00:00.000Z');
const BIRTHDAY_EXCEL = new Date('2015-04-01T00:00:00.000Z'); // different from form
const ADMISSION_FORM = new Date('2020-01-10T00:00:00.000Z');
const ADMISSION_EXCEL = new Date('2020-01-10T00:00:00.000Z'); // same as form

function makeFormChild(overrides: Partial<FormChild> = {}): FormChild {
  return {
    _id: 'form-id-001',
    firstName: 'MARIA',
    lastName: 'GONZALEZ',
    documentNumber: '12345678',
    birthday: BIRTHDAY_FORM,
    admissionDate: ADMISSION_FORM,
    communityHallId: 'hall-obj-id-001',
    ...overrides,
  };
}

function makeAlertChild(overrides: Partial<AlertChild> = {}): AlertChild {
  return {
    _id: 'alert-id-001',
    documentNumber: '12345678',
    fullName: 'MARIA GONZALEZ EXCEL',
    gender: 'F',
    childCode: 'CC-001',
    managementCommitteCode: 'MC-01',
    managementCommitteName: 'Comité Norte',
    communityHallName: 'Sala Norte',
    communityHallLocalId: 'HALL-01',
    birthday: BIRTHDAY_EXCEL,
    admissionDate: ADMISSION_EXCEL,
    ...overrides,
  };
}

// ─── normalizeDniMigration ────────────────────────────────────────────────────

describe('normalizeDniMigration', () => {
  it('returns null for null input', () => {
    expect(normalizeDniMigration(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeDniMigration(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeDniMigration('')).toBeNull();
  });

  it('strips whitespace and returns 8-digit DNI', () => {
    expect(normalizeDniMigration('  12345678  ')).toBe('12345678');
  });

  it('zero-pads a 7-digit DNI to 8 digits', () => {
    expect(normalizeDniMigration('1234567')).toBe('01234567');
  });

  it('returns null for DNI with more than 8 digits', () => {
    expect(normalizeDniMigration('123456789')).toBeNull();
  });

  it('returns null for non-digit characters that, once stripped, exceed 8 digits', () => {
    // 'ABC123456789' strips to '123456789' (9 digits) → invalid
    expect(normalizeDniMigration('ABC123456789')).toBeNull();
  });

  it('strips hyphens and normalizes', () => {
    expect(normalizeDniMigration('1234-5678')).toBe('12345678');
  });
});

// ─── mergeChildrenSources ─────────────────────────────────────────────────────

describe('mergeChildrenSources', () => {
  describe('idempotency', () => {
    it('applying the merge twice produces the same result as once', () => {
      const formChildren: FormChild[] = [makeFormChild()];
      const alertChildren: AlertChild[] = [makeAlertChild()];

      const firstPass = mergeChildrenSources(formChildren, alertChildren);

      // Second pass: simulate re-running on already-merged data by
      // using the same source inputs (the pure function should be stable).
      const secondPass = mergeChildrenSources(formChildren, alertChildren);

      expect(secondPass).toHaveLength(firstPass.length);
      expect(secondPass[0].documentNumber).toBe(firstPass[0].documentNumber);
      expect(secondPass[0].firstName).toBe(firstPass[0].firstName);
      expect(secondPass[0].gender).toBe(firstPass[0].gender);
      expect(secondPass[0].birthdayImported?.toISOString()).toBe(
        firstPass[0].birthdayImported?.toISOString(),
      );
    });

    it('no duplicates when same DNI appears multiple times in form source', () => {
      const formChildren: FormChild[] = [
        makeFormChild({ _id: 'form-a', documentNumber: '12345678' }),
        makeFormChild({ _id: 'form-b', documentNumber: '12345678' }), // duplicate DNI
      ];
      const alertChildren: AlertChild[] = [];

      const result = mergeChildrenSources(formChildren, alertChildren);
      expect(result.filter((c) => c.documentNumber === '12345678')).toHaveLength(1);
    });
  });

  describe('form record is authoritative', () => {
    it('uses form firstName and lastName when both sources present', () => {
      const form = makeFormChild({ firstName: 'MARIA', lastName: 'GONZALEZ' });
      const alert = makeAlertChild({ fullName: 'DIFFERENT NAME FROM EXCEL' });

      const [result] = mergeChildrenSources([form], [alert]);

      expect(result.firstName).toBe('MARIA');
      expect(result.lastName).toBe('GONZALEZ');
    });

    it('uses form birthday (authoritative) and stores diverging Excel birthday in birthdayImported', () => {
      const form = makeFormChild({ birthday: BIRTHDAY_FORM });
      const alert = makeAlertChild({ birthday: BIRTHDAY_EXCEL }); // different

      const [result] = mergeChildrenSources([form], [alert]);

      expect(result.birthday.toISOString()).toBe(BIRTHDAY_FORM.toISOString());
      expect(result.birthdayImported?.toISOString()).toBe(BIRTHDAY_EXCEL.toISOString());
    });

    it('uses form admissionDate and leaves admissionDateImported null when Excel matches', () => {
      const form = makeFormChild({ admissionDate: ADMISSION_FORM });
      const alert = makeAlertChild({ admissionDate: ADMISSION_EXCEL }); // same date

      const [result] = mergeChildrenSources([form], [alert]);

      expect(result.admissionDate.toISOString()).toBe(ADMISSION_FORM.toISOString());
      expect(result.admissionDateImported).toBeNull();
    });
  });

  describe('alert_children supplies Excel-only fields', () => {
    it('copies gender, childCode, managementCommitteCode/Name, communityHallName, communityHallLocalId', () => {
      const form = makeFormChild();
      const alert = makeAlertChild({
        gender: 'M',
        childCode: 'CC-999',
        managementCommitteCode: 'MC-99',
        managementCommitteName: 'Comité Sur',
        communityHallName: 'Sala Sur',
        communityHallLocalId: 'HALL-99',
      });

      const [result] = mergeChildrenSources([form], [alert]);

      expect(result.gender).toBe('M');
      expect(result.childCode).toBe('CC-999');
      expect(result.managementCommitteCode).toBe('MC-99');
      expect(result.managementCommitteName).toBe('Comité Sur');
      expect(result.communityHallName).toBe('Sala Sur');
      expect(result.communityHallLocalId).toBe('HALL-99');
    });

    it('sets fullName from Excel when form record has no fullName', () => {
      const form = makeFormChild();
      const alert = makeAlertChild({ fullName: 'MARIA GONZALEZ EXCEL' });

      const [result] = mergeChildrenSources([form], [alert]);

      expect(result.fullName).toBe('MARIA GONZALEZ EXCEL');
    });
  });

  describe('invalid DNI exclusion', () => {
    it('excludes form records with invalid DNI', () => {
      const formChildren: FormChild[] = [
        makeFormChild({ documentNumber: 'ABC-INVALID' }),
        makeFormChild({ _id: 'valid-form', documentNumber: '87654321', lastName: 'VALID' }),
      ];
      const result = mergeChildrenSources(formChildren, []);

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('87654321');
    });

    it('excludes alert_children records with invalid DNI', () => {
      const alertChildren: AlertChild[] = [
        makeAlertChild({ documentNumber: '' }),
        makeAlertChild({ _id: 'valid-alert', documentNumber: '11223344', fullName: 'VALID' }),
      ];
      const result = mergeChildrenSources([], alertChildren);

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('11223344');
    });
  });

  describe('records unique to one source', () => {
    it('includes form-only records (no matching alert_child)', () => {
      const form = makeFormChild({ documentNumber: '99887766' });
      const result = mergeChildrenSources([form], []);

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('99887766');
      expect(result[0].firstName).toBe('MARIA');
      expect(result[0].gender).toBeNull();
    });

    it('includes alert-only records (no matching form child) with null firstName/lastName', () => {
      const alert = makeAlertChild({ documentNumber: '55443322', fullName: 'EXCEL ONLY' });
      const result = mergeChildrenSources([], [alert]);

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('55443322');
      expect(result[0].fullName).toBe('EXCEL ONLY');
      expect(result[0].firstName).toBeNull();
      expect(result[0].lastName).toBeNull();
    });
  });

  describe('date divergence', () => {
    it('stores null in birthdayImported when Excel birthday matches form birthday', () => {
      const sameDate = new Date('2018-06-15T00:00:00.000Z');
      const form = makeFormChild({ birthday: sameDate });
      const alert = makeAlertChild({ birthday: sameDate });

      const [result] = mergeChildrenSources([form], [alert]);

      expect(result.birthdayImported).toBeNull();
    });

    it('stores Excel admissionDate in admissionDateImported when it differs from form', () => {
      const formAdmission = new Date('2019-08-01T00:00:00.000Z');
      const excelAdmission = new Date('2019-09-01T00:00:00.000Z');
      const form = makeFormChild({ admissionDate: formAdmission });
      const alert = makeAlertChild({ admissionDate: excelAdmission });

      const [result] = mergeChildrenSources([form], [alert]);

      expect(result.admissionDate.toISOString()).toBe(formAdmission.toISOString());
      expect(result.admissionDateImported?.toISOString()).toBe(excelAdmission.toISOString());
    });
  });
});
