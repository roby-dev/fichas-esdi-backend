import { Child } from './child.entity';
import { CommunityHall } from './community-hall.entity';
import { User } from './user.entity';

describe('Child Entity - Validations', () => {

  const user = new User(
    'rgersonzs95@gmail.com',
    'asdsadsdadsad',
    [],
    '12345678'
  )

  const baseHall = new CommunityHall(
    'HALL A',
    'committee-id-123',
    'hall-id-123',
  );

  const createChild = (birthday: Date, admissionDate: Date, today: Date) => {
    // Mock system date
    jest.useFakeTimers().setSystemTime(today);

    return Child.create(
      '12345678',
      'Juan',
      'Pérez',
      birthday,
      admissionDate,
      baseHall.id!,
      user.id!,
      baseHall,
    );
  };

  afterEach(() => {
    jest.useRealTimers(); // restore real time
  });

  describe('isCurrentlyAdmitted', () => {
    const admission = new Date('2024-05-01');

    it('should be valid exactly at +19 days', () => {
      const today = new Date('2024-05-20');
      const child = createChild(new Date('2020-01-01'), admission, today);
      expect(child.isCurrentlyAdmitted).toBe(true);
    });

    it('should be valid exactly at +40 days', () => {
      const today = new Date('2024-06-10');
      const child = createChild(new Date('2020-01-01'), admission, today);
      expect(child.isCurrentlyAdmitted).toBe(true);
    });

    it('should be valid between +19 and +40 days', () => {
      const today = new Date('2024-06-01');
      const child = createChild(new Date('2020-01-01'), admission, today);
      expect(child.isCurrentlyAdmitted).toBe(true);
    });

    it('should be invalid before +19 days', () => {
      const today = new Date('2024-05-18');
      const child = createChild(new Date('2020-01-01'), admission, today);
      expect(child.isCurrentlyAdmitted).toBe(false);
    });

    it('should be invalid after +40 days', () => {
      const today = new Date('2024-06-11');
      const child = createChild(new Date('2020-01-01'), admission, today);
      expect(child.isCurrentlyAdmitted).toBe(false);
    });
  });

  describe('isGraduated', () => {
    it('should be graduated exactly at +35 months', () => {
      const birthday = new Date('2022-01-31');
      const today = new Date('2025-12-01'); // Jan 31 + 35 months
      const child = createChild(birthday, new Date('2024-05-01'), today);
      expect(child.isGraduated).toBe(true);
    });

    it('should not be graduated before +35 months', () => {
      const birthday = new Date('2022-01-31');
      const today = new Date('2024-12-30T00:00:00.000Z'); // justo un día antes
      const child = createChild(birthday, new Date('2024-05-01'), today);

      expect(child.isGraduated).toBe(false);
    });

    it('should be graduated after +35 months', () => {
      const birthday = new Date('2022-01-31');
      const today = new Date('2026-01-01');
      const child = createChild(birthday, new Date('2024-05-01'), today);
      expect(child.isGraduated).toBe(true);
    });
  });
});
