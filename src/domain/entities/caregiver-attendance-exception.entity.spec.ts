import { CaregiverAttendanceException } from './caregiver-attendance-exception.entity';

describe('CaregiverAttendanceException Entity', () => {
  describe('hallHoliday', () => {
    it('creates a hall-level holiday exception', () => {
      const exception = CaregiverAttendanceException.hallHoliday({
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        reason: 'National holiday',
      });

      expect(exception.scope).toBe('hall');
      expect(exception.kind).toBe('holiday');
      expect(exception.appliesToHallDate('hall-1', '2025-01-06')).toBe(true);
      expect(exception.appliesToHallDate('hall-2', '2025-01-06')).toBe(false);
    });
  });

  describe('caregiverJustification', () => {
    it('creates a caregiver-level justification', () => {
      const exception = CaregiverAttendanceException.caregiverJustification({
        caregiverId: 'cgv-1',
        localDate: '2025-01-06',
        blockId: 'block-1',
        reason: 'Medical leave',
      });

      expect(exception.scope).toBe('caregiver');
      expect(exception.kind).toBe('justification');
      expect(
        exception.appliesToCaregiverBlock('cgv-1', '2025-01-06', 'block-1'),
      ).toBe(true);
      expect(
        exception.appliesToCaregiverBlock('cgv-1', '2025-01-06', 'block-2'),
      ).toBe(false);
    });
  });

  describe('isAccepted', () => {
    it('returns true for accepted exceptions and false for pending', () => {
      const accepted = CaregiverAttendanceException.hallHoliday({
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        reason: 'Holiday',
        status: 'accepted',
      });

      const pending = CaregiverAttendanceException.hallHoliday({
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        reason: 'Holiday',
        status: 'pending',
      });

      expect(accepted.isAccepted()).toBe(true);
      expect(pending.isAccepted()).toBe(false);
    });
  });
});
