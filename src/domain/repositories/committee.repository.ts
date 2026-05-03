import { Committee } from '../entities/committee.entity';

export interface CommitteeRepository {
  save(committe: Committee): Promise<Committee>;
  findById(id: string): Promise<Committee | null>;
  findAll(limit?: number, offset?: number): Promise<Committee[]>;
  findAllUnpaginated(): Promise<Committee[]>;
  update(committee: Committee): Promise<Committee>;
  delete(id: string): Promise<void>;
}
