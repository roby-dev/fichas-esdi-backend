import { ManagementCommittee } from '../entities/management-committe.entity';

export interface ManagementCommitteeRepository {
  save(communityCenter: ManagementCommittee): Promise<ManagementCommittee>;
  findById(id: string): Promise<ManagementCommittee | null>;
  findAll(limit?: number, offset?: number): Promise<ManagementCommittee[]>;
  update(person: ManagementCommittee): Promise<ManagementCommittee>;
  findByName(name: string, userId: string): Promise<ManagementCommittee | null>;
  delete(id: string): Promise<void>;
}
