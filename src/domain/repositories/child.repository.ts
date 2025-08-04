import { Child } from 'src/domain/entities/child.entity';

export interface ChildRepository {
  save(child: Child): Promise<Child>;
  update(child: Child): Promise<Child>;
  findById(id: string): Promise<Child | null>;
  findAll(limit?: number, offset?: number): Promise<Child[]>;
  delete(id: string): Promise<void>;
  findByDocumentNumber(documentNumber: string): Promise<Child | null>;
}
