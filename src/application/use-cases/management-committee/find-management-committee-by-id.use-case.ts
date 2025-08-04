import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose'; // 👈 importar utilidad
import { MANAGEMENT_COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';
import { ManagementCommitteeResponseDto } from 'src/application/dtos/management-committee/management-committee-response.dto';

@Injectable()
export class FindManagementCommitteeByIdUseCase {
  private readonly logger = new Logger(FindManagementCommitteeByIdUseCase.name);

  constructor(
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly managementCommitteeRepository: ManagementCommitteeRepository,
  ) {}

  async execute(id: string): Promise<ManagementCommitteeResponseDto> {
    const entity = await this.managementCommitteeRepository.findById(id);

    if (!entity) {
      this.logger.warn(`No existe un comité con id ${id}`);
      throw new NotFoundException(`No existe un comité con id ${id}`);
    }

    return ManagementCommitteeResponseDto.fromDomain(entity);
  }
}
