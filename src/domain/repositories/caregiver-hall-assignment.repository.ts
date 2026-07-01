import { CaregiverHallAssignment } from '../entities/caregiver-hall-assignment.entity';

export interface CaregiverHallAssignmentRepository {
  save(assignment: CaregiverHallAssignment): Promise<CaregiverHallAssignment>;
  findById(id: string): Promise<CaregiverHallAssignment | null>;
  findByCaregiverId(caregiverId: string): Promise<CaregiverHallAssignment[]>;
  findActiveByCaregiverAndDate(
    caregiverId: string,
    date: Date,
  ): Promise<CaregiverHallAssignment | null>;
  closeCurrentAssignment(caregiverId: string, validTo: Date): Promise<void>;
  findByHallIdAndDateRange(
    hallId: string,
    from: Date,
    to: Date,
  ): Promise<CaregiverHallAssignment[]>;
  findByHallIds(hallIds: string[]): Promise<CaregiverHallAssignment[]>;
}
