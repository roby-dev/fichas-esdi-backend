import { CommitteeMembership } from '../entities/committee-membership.entity';

export interface CommitteeMembershipRepository {
  save(membership: CommitteeMembership): Promise<CommitteeMembership>;
  findById(id: string): Promise<CommitteeMembership | null>;
  findByCommitteeAndUser(
    committeeRef: string,
    userRef: string,
  ): Promise<CommitteeMembership | null>;
  findAllByUserRef(
    userRef: string,
    limit?: number,
    offset?: number,
  ): Promise<CommitteeMembership[]>;
  findAllByCommitteeRef(
    committeeRef: string,
    limit?: number,
    offset?: number,
  ): Promise<CommitteeMembership[]>;
  findAll(
    limit?: number,
    offset?: number,
  ): Promise<CommitteeMembership[]>;
  delete(id: string): Promise<void>;
}
