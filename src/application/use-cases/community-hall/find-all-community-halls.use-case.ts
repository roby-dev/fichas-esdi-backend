import { Inject, Injectable } from '@nestjs/common';
import { COMMUNITY_HALL_REPOSITORY } from 'src/domain/constants/tokens';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CommunityHallResponseDto } from 'src/application/dtos/community-hall/community-hall-response.dto';

@Injectable()
export class FindAllCommunityHallsUseCase {
  constructor(
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly repository: CommunityHallRepository,
  ) {}

  async execute(limit = 10, offset = 0): Promise<CommunityHallResponseDto[]> {
    const centers = await this.repository.findAll(limit, offset);
    return centers.map(CommunityHallResponseDto.fromDomain);
  }
}
