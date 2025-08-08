import { AlertChild } from 'src/domain/entities/alert-child.entity';

export interface AlertChildRepository {
  findAllByUserId(userId: string): Promise<AlertChild[]>;
  save(alertChild: AlertChild): Promise<AlertChild>;
  bulkSave(alertChildren: AlertChild[]): Promise<AlertChild[]>;
  findAll(limit?: number, offset?: number): Promise<AlertChild[]>;
  findById(id: string): Promise<AlertChild | null>;
  update(alertChild: AlertChild): Promise<AlertChild>;
  bulkUpdate(alertChildren: AlertChild[]): Promise<AlertChild[]>;
}
