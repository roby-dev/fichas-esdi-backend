import { Committee } from '../entities/committe.entity';

export interface CommitteeRepository {
  save(committe: Committee): Promise<Committee>;
  findById(id: string): Promise<Committee | null>;
  findAll(limit?: number, offset?: number): Promise<Committee[]>;
  update(committee: Committee): Promise<Committee>;
  delete(id: string): Promise<void>;
}
