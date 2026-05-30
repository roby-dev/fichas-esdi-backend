import { ImportErrorLog } from './import-error-log.entity';

describe('ImportErrorLog entity', () => {
  const loggedAt = new Date('2026-05-30T12:00:00.000Z');

  describe('create', () => {
    it('should create a log entry with all required fields', () => {
      const log = ImportErrorLog.create({
        errorCode: 'UNKNOWN_COMMUNITY_HALL',
        errorMessage: 'Community hall LOC999 not found',
        documentNumber: '12345678',
        loggedAt,
      });

      expect(log.errorCode).toBe('UNKNOWN_COMMUNITY_HALL');
      expect(log.errorMessage).toBe('Community hall LOC999 not found');
      expect(log.documentNumber).toBe('12345678');
      expect(log.loggedAt).toEqual(loggedAt);
      expect(log.id).toBeUndefined();
    });

    it('should create a log with optional fields populated', () => {
      const log = ImportErrorLog.create({
        errorCode: 'UNRESOLVED_COMMITTEE_CODE',
        errorMessage: 'Committee UNKNOWN not found',
        documentNumber: '87654321',
        fullName: 'Juan Lopez',
        childCode: 'CH-002',
        managementCommitteCode: 'UNKNOWN',
        managementCommitteName: 'Desconocido',
        communityHallId: 'LOC001',
        communityHallName: 'Sala A',
        importBatchRef: 'padron-mayo-2026.xlsx',
        loggedAt,
      });

      expect(log.fullName).toBe('Juan Lopez');
      expect(log.childCode).toBe('CH-002');
      expect(log.managementCommitteCode).toBe('UNKNOWN');
      expect(log.managementCommitteName).toBe('Desconocido');
      expect(log.communityHallId).toBe('LOC001');
      expect(log.communityHallName).toBe('Sala A');
      expect(log.importBatchRef).toBe('padron-mayo-2026.xlsx');
    });

    it('should support INVALID_DNI error code', () => {
      const log = ImportErrorLog.create({
        errorCode: 'INVALID_DNI',
        errorMessage: 'Document number ABC12345 cannot be normalized',
        documentNumber: 'ABC12345',
        loggedAt,
      });

      expect(log.errorCode).toBe('INVALID_DNI');
    });

    it('should support COMMITTEE_DETECTION_SKIPPED error code', () => {
      const log = ImportErrorLog.create({
        errorCode: 'COMMITTEE_DETECTION_SKIPPED',
        errorMessage: 'Community hall unresolved; committee detection skipped',
        documentNumber: '12345678',
        importBatchRef: 'batch-001',
        loggedAt,
      });

      expect(log.errorCode).toBe('COMMITTEE_DETECTION_SKIPPED');
      expect(log.importBatchRef).toBe('batch-001');
    });
  });

  describe('fromPrimitives / toPrimitives', () => {
    it('should round-trip through toPrimitives and fromPrimitives', () => {
      const original = ImportErrorLog.create({
        errorCode: 'UNKNOWN_COMMUNITY_HALL',
        errorMessage: 'Hall not found',
        documentNumber: '12345678',
        importBatchRef: 'file.xlsx',
        loggedAt,
      });

      const primitives = { ...original.toPrimitives(), id: 'log-id-1' };
      const restored = ImportErrorLog.fromPrimitives(primitives);

      expect(restored.id).toBe('log-id-1');
      expect(restored.errorCode).toBe('UNKNOWN_COMMUNITY_HALL');
      expect(restored.documentNumber).toBe('12345678');
      expect(restored.loggedAt).toEqual(loggedAt);
    });
  });

  describe('toPrimitives satisfies Record<string, unknown>', () => {
    it('should return a plain object', () => {
      const log = ImportErrorLog.create({
        errorCode: 'INVALID_DNI',
        errorMessage: 'bad dni',
        documentNumber: 'BAD',
        loggedAt,
      });
      const primitives: Record<string, unknown> = log.toPrimitives();
      expect(typeof primitives).toBe('object');
    });
  });
});
