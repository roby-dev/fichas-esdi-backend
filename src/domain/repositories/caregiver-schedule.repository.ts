import { CaregiverScheduleVersion } from '../entities/caregiver-schedule-version.entity';

export interface CaregiverScheduleRepository {
  save(version: CaregiverScheduleVersion): Promise<CaregiverScheduleVersion>;
  findById(id: string): Promise<CaregiverScheduleVersion | null>;
  findActiveByHallAndDate(
    hallId: string,
    date: Date,
  ): Promise<CaregiverScheduleVersion | null>;
  findByHallId(hallId: string): Promise<CaregiverScheduleVersion[]>;
  closeCurrentVersion(hallId: string, validTo: Date): Promise<void>;
  copyToHall(
    versionId: string,
    targetHallId: string,
    validFrom: Date,
    name: string,
  ): Promise<CaregiverScheduleVersion>;
}
