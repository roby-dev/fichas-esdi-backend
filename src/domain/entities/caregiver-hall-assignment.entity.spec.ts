import { CaregiverHallAssignment } from './caregiver-hall-assignment.entity';

describe('CaregiverHallAssignment Entity', () => {
  describe('create', () => {
    it('creates an open-ended assignment', () => {
      const assignment = CaregiverHallAssignment.create({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        validFrom: new Date('2025-01-01'),
      });

      expect(assignment.caregiverId).toBe('cgv-1');
      expect(assignment.communityHallId).toBe('hall-1');
      expect(assignment.isActiveOn(new Date('2025-06-01'))).toBe(true);
    });
  });

  describe('isActiveOn', () => {
    it('is active within the validity range', () => {
      const assignment = CaregiverHallAssignment.fromPrimitives({
        id: 'a-1',
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-12-31'),
      });

      expect(assignment.isActiveOn(new Date('2025-06-15'))).toBe(true);
      expect(assignment.isActiveOn(new Date('2024-12-31'))).toBe(false);
      expect(assignment.isActiveOn(new Date('2026-01-01'))).toBe(false);
    });

    it('is active after validFrom when open-ended', () => {
      const assignment = CaregiverHallAssignment.create({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        validFrom: new Date('2025-01-01'),
      });

      expect(assignment.isActiveOn(new Date('2026-01-01'))).toBe(true);
    });
  });

  describe('close', () => {
    it('returns a new assignment with a validTo date', () => {
      const open = CaregiverHallAssignment.create({
        caregiverId: 'cgv-1',
        communityHallId: 'hall-1',
        validFrom: new Date('2025-01-01'),
      });

      const closed = open.close(new Date('2025-06-30'));

      expect(closed.id).toBe(open.id);
      expect(closed.validTo).toEqual(new Date('2025-06-30'));
      expect(closed.isActiveOn(new Date('2025-07-01'))).toBe(false);
    });
  });
});
