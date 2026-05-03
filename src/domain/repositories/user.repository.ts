import { User } from '../entities/user.entity';

export interface UserRepository {
  findAll(limit?: number, offset?: number): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  /**
   * Updates non-credential user fields (email, roles, etc.).
   * CONTRACT: MUST NOT write passwordHash or mustChangePassword.
   * Use updatePassword() for credential mutations.
   */
  update(user: User): Promise<User>;
  /**
   * Updates passwordHash and mustChangePassword atomically.
   * This is the ONLY method allowed to touch credential fields.
   */
  updatePassword(
    id: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ): Promise<User>;
}
