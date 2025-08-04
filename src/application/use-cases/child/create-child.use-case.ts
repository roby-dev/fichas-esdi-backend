import { Inject, Injectable } from '@nestjs/common';
import { CreateChildDto } from '../../dtos/child/create-child.dto';
import { ChildResponseDto } from '../../dtos/child/child-response.dto';
import {
  CHILD_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
} from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { Child } from 'src/domain/entities/child.entity';

@Injectable()
export class CreateChildUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly childRepository: ChildRepository,
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly hallRepository: CommunityHallRepository,
  ) {}

  async execute(dto: CreateChildDto): Promise<ChildResponseDto> {
    const hall = await this.hallRepository.findById(dto.communityHallId);

    const child = Child.create(
      dto.documentNumber,
      dto.firstName,
      dto.lastName,
      new Date(dto.birthday),
      new Date(dto.admissionDate),
      dto.communityHallId,
      hall ?? undefined,
    );

    const saved = await this.childRepository.save(child);
    return ChildResponseDto.fromDomain(saved);
  }
}
