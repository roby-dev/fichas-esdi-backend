import { CommunityHall } from '../entities/community-hall.entity';

export interface CommunityHallRepository {
  save(communityCenter: CommunityHall): Promise<CommunityHall>;
  findById(id: string): Promise<CommunityHall | null>;
  findAll(limit?: number, offset?: number): Promise<CommunityHall[]>;
  update(person: CommunityHall): Promise<CommunityHall>;
  delete(id: string): Promise<void>;
  findByNameAndCommitteeId(
    name: string,
    managementCommitteeId: string,
  ): Promise<CommunityHall | null>;
  findAllByCommitteeId(
    managementCommitteeId: string,
    limit: number,
    offset: number,
  ): Promise<CommunityHall[]>;
}
