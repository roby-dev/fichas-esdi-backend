import { CaregiverAttendanceException } from '../entities/caregiver-attendance-exception.entity';

export interface CaregiverAttendanceExceptionRepository {
  save(
    exception: CaregiverAttendanceException,
  ): Promise<CaregiverAttendanceException>;
  findById(id: string): Promise<CaregiverAttendanceException | null>;
  findByHallAndDate(
    hallId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceException[]>;
  findByCaregiverAndDate(
    caregiverId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceException[]>;
  findByHallDateRange(
    hallId: string,
    from: string,
    to: string,
  ): Promise<CaregiverAttendanceException[]>;
  findByCaregiverDateRange(
    caregiverId: string,
    from: string,
    to: string,
  ): Promise<CaregiverAttendanceException[]>;
}
