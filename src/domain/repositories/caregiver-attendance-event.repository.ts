import { CaregiverAttendanceEvent } from '../entities/caregiver-attendance-event.entity';

export type CaregiverAttendanceEventFilter = {
  caregiverId?: string;
  communityHallId?: string;
  localDate?: string;
  source?: string;
  limit?: number;
  offset?: number;
};

export interface CaregiverAttendanceEventRepository {
  save(event: CaregiverAttendanceEvent): Promise<CaregiverAttendanceEvent>;
  findById(id: string): Promise<CaregiverAttendanceEvent | null>;
  findByFilters(
    filter: CaregiverAttendanceEventFilter,
  ): Promise<CaregiverAttendanceEvent[]>;
}
