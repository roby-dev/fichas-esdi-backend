import { Child } from 'src/domain/entities/child.entity';

export interface ChildrenByUser {
  userId: string;
  children: Child[];
}

export interface UpsertChildDto {
  documentNumber: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  birthday?: Date;
  admissionDate?: Date;
  birthdayImported?: Date | null;
  admissionDateImported?: Date | null;
  communityHallId?: string | null;
  communityHallLocalId?: string;
  communityHallName?: string;
  userId?: string | null;
  gender?: string;
  childCode?: string;
  managementCommitteCode?: string;
  managementCommitteName?: string;
}

export interface ChildRepository {
  save(child: Child): Promise<Child>;
  update(child: Child): Promise<Child>;
  findById(id: string): Promise<Child | null>;
  findAll(limit?: number, offset?: number): Promise<Child[]>;
  findAllUnpaginated(): Promise<Child[]>;
  delete(id: string): Promise<void>;
  findByDocumentNumber(documentNumber: string): Promise<Child | null>;
  /** @deprecated Use findByDocumentNumber (global) instead. Kept for Phase-1/2 compatibility. */
  findByDocumentNumberAndCommunnityHallId(
    documentNumber: string,
    communityHallId: string,
  ): Promise<Child | null>;
  findAlllByUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Child[]>;
  findAllByCommittee(committeeId: string): Promise<Child[]>;
  findAllGroupedByUser(): Promise<ChildrenByUser[]>;
  /**
   * Atomically inserts or updates a child record keyed by normalized DNI.
   * Uses MongoDB findOneAndUpdate with upsert:true.
   */
  upsertByDni(dto: UpsertChildDto): Promise<Child>;
}
