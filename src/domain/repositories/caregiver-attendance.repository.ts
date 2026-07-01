import { CaregiverAttendanceRecord } from '../entities/caregiver-attendance-record.entity';

export interface CaregiverAttendanceRepository {
  save(record: CaregiverAttendanceRecord): Promise<CaregiverAttendanceRecord>;
  findById(id: string): Promise<CaregiverAttendanceRecord | null>;
  findByCaregiverAndDate(
    caregiverId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceRecord[]>;
  findByHallAndDate(
    hallId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceRecord[]>;
  findByHallAndDateRange(
    hallId: string,
    from: string,
    to: string,
  ): Promise<CaregiverAttendanceRecord[]>;
  existsOfficialMark(
    caregiverId: string,
    localDate: string,
    blockId: string,
  ): Promise<boolean>;
  voidMark(id: string): Promise<CaregiverAttendanceRecord>;
}
