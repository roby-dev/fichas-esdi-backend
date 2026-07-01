import { CaregiverAttendanceRecord } from './caregiver-attendance-record.entity';

describe('CaregiverAttendanceRecord Entity', () => {
  describe('createOfficial', () => {
    it('creates an official mark with source and entry time', () => {
      const record = CaregiverAttendanceRecord.createOfficial({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        blockId: 'block-1',
        entryTime: '08:05',
        source: 'self-service',
      });

      expect(record.markKind).toBe('official');
      expect(record.caregiverId).toBe('cgv-1');
      expect(record.isVoided).toBe(false);
      expect(record.source).toBe('self-service');
    });
  });

  describe('createSpecial', () => {
    it('creates a special mark with performer and reason', () => {
      const record = CaregiverAttendanceRecord.createSpecial({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        blockId: 'block-1',
        entryTime: '09:00',
        source: 'assisted',
        reason: 'System was down',
        performerId: 'user-1',
      });

      expect(record.markKind).toBe('special');
      expect(record.performerId).toBe('user-1');
      expect(record.reason).toBe('System was down');
    });
  });

  describe('void', () => {
    it('returns a voided copy preserving identity', () => {
      const record = CaregiverAttendanceRecord.createOfficial({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        blockId: 'block-1',
        entryTime: '08:05',
        source: 'self-service',
      });

      const voided = record.void();

      expect(voided.isVoided).toBe(true);
      expect(voided.id).toBe(record.id);
    });
  });

  describe('createCorrection', () => {
    it('creates a corrected record referencing the original', () => {
      const original = CaregiverAttendanceRecord.createOfficial({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        blockId: 'block-1',
        entryTime: '08:05',
        source: 'self-service',
      });

      const corrected = CaregiverAttendanceRecord.createCorrection({
        original,
        newEntryTime: '08:10',
        reason: 'Wrong time registered',
        performerId: 'user-1',
      });

      expect(corrected.markKind).toBe('corrected');
      expect(corrected.entryTime).toBe('08:10');
      expect(corrected.correctedFromId).toBe(original.id);
    });
  });
});
