import { CommunityHall } from '../entities/community-hall.entity';

export interface CommunityHallRepository {
  save(hall: CommunityHall): Promise<CommunityHall>;
  findById(id: string): Promise<CommunityHall | null>;
  findAll(limit?: number, offset?: number): Promise<CommunityHall[]>;
  findAllUnpaginated(): Promise<CommunityHall[]>;
  update(hall: CommunityHall): Promise<CommunityHall>;
  delete(id: string): Promise<void>;
  findByNameAndCommitteeRef(
    name: string,
    committeeRef: string,
  ): Promise<CommunityHall | null>;
  findAllByCommitteeRef(
    committeeRef: string,
    limit: number,
    offset: number,
  ): Promise<CommunityHall[]>;
  /** Find a community hall by its local identifier string (e.g. "LOC001") */
  findByLocalId(localId: string): Promise<CommunityHall | null>;
}
