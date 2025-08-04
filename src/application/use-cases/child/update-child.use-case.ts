import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateChildDto } from '../../dtos/child/update-child.dto';
import { ChildResponseDto } from '../../dtos/child/child-response.dto';
import { CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import { Child } from 'src/domain/entities/child.entity';

@Injectable()
export class UpdateChildUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly repository: ChildRepository,
  ) {}

  async execute(id: string, dto: UpdateChildDto): Promise<ChildResponseDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`No se encontró un niño con el ID ${id}`);
    }

    const updated = new Child(
      dto.documentNumber,
      dto.firstName,
      dto.lastName,
      dto.birthday,
      dto.admissionDate,
      dto.communityHallId,
      id,
    );

    const result = await this.repository.update(updated);
    return ChildResponseDto.fromDomain(result);
  }
}
