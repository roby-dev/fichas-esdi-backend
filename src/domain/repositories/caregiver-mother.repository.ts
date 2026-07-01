import { CaregiverMother } from '../entities/caregiver-mother.entity';

export interface CaregiverMotherRepository {
  save(caregiver: CaregiverMother): Promise<CaregiverMother>;
  update(caregiver: CaregiverMother): Promise<CaregiverMother>;
  findById(id: string): Promise<CaregiverMother | null>;
  findByIdentity(
    documentType: string,
    documentNumber: string,
  ): Promise<CaregiverMother | null>;
  findAll(limit?: number, offset?: number): Promise<CaregiverMother[]>;
  findByIds(ids: string[]): Promise<CaregiverMother[]>;
  existsByIdentity(
    documentType: string,
    documentNumber: string,
  ): Promise<boolean>;
  delete(id: string): Promise<void>;
}
