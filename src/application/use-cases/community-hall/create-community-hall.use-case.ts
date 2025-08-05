import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommunityHallDto } from 'src/application/dtos/community-hall/create-community-hall.dto';
import { CommunityHallResponseDto } from 'src/application/dtos/community-hall/community-hall-response.dto';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import {
  COMMUNITY_HALL_REPOSITORY,
  MANAGEMENT_COMMITTEE_REPOSITORY,
} from 'src/domain/constants/tokens';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';

@Injectable()
export class CreateCommunityHallUseCase {
  constructor(
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly repository: CommunityHallRepository,
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly managementCommitteeRepository: ManagementCommitteeRepository,
  ) {}

  async execute(
    dto: CreateCommunityHallDto,
  ): Promise<CommunityHallResponseDto> {
    const committee = await this.managementCommitteeRepository.findById(
      dto.managementCommitteeId,
    );
    if (!committee) {
      throw new NotFoundException(
        `No existe un comité con id ${dto.managementCommitteeId}`,
      );
    }

    const existing = await this.repository.findByNameAndCommitteeId(
      dto.name,
      dto.managementCommitteeId,
    );

    if (existing) {
      throw new ConflictException(
        'Ya existe un local comunal con ese nombre en el mismo comité',
      );
    }

    const entity = CommunityHall.create(
      dto.localId,
      dto.name,
      dto.managementCommitteeId,
      committee
    );
    const saved = await this.repository.save(entity);

    return CommunityHallResponseDto.fromDomain(saved);
  }
}
