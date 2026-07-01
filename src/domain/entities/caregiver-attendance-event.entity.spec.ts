import { CaregiverAttendanceEvent } from './caregiver-attendance-event.entity';

describe('CaregiverAttendanceEvent Entity', () => {
  describe('create', () => {
    it('creates a rejection event for self-service attempts', () => {
      const event = CaregiverAttendanceEvent.create({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        localDate: '2025-01-06',
        blockId: 'block-1',
        reason: 'out_of_window',
        source: 'self-service',
        metadata: { attemptedAt: '08:35' },
      });

      expect(event.reason).toBe('out_of_window');
      expect(event.source).toBe('self-service');
      expect(event.caregiverId).toBe('cgv-1');
      expect(event.metadata).toEqual({ attemptedAt: '08:35' });
    });
  });
});
