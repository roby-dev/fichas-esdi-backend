import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMMUNITY_HALL_REPOSITORY } from 'src/domain/constants/tokens';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CommunityHallResponseDto } from 'src/application/dtos/community-hall/community-hall-response.dto';

@Injectable()
export class FindCommunityHallByIdUseCase {
  constructor(
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly repository: CommunityHallRepository,
  ) {}

  async execute(id: string): Promise<CommunityHallResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`No existe un local comunal con id ${id}`);
    }

    return CommunityHallResponseDto.fromDomain(entity);
  }
}
