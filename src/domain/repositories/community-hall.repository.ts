import { CommunityHall } from '../entities/community-hall.entity';

export interface CommunityHallRepository {
  save(hall: CommunityHall): Promise<CommunityHall>;
  findById(id: string): Promise<CommunityHall | null>;
  findAll(limit?: number, offset?: number): Promise<CommunityHall[]>;
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
}
