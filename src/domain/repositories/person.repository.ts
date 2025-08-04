import { Person } from '../entities/person.entity';

export interface PersonRepository {
  save(person: Person): Promise<Person>;
  findById(id: string): Promise<Person | null>;
  findAll(limit?: number, offset?: number): Promise<Person[]>;
  update(person: Person): Promise<Person>;
  delete(id: string): Promise<void>;
  findByEmail(email: string): Promise<Person | null>;
}
