import { User } from '../entities/user.entity';

export interface UserRepository {
  findAll(limit?: number, offset?: number): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  update(user: User): Promise<User>;
}
