import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import { ChildResponseDto } from '../../dtos/child/child-response.dto';

@Injectable()
export class FindChildByIdUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly repository: ChildRepository,
  ) {}

  async execute(id: string): Promise<ChildResponseDto> {
    const child = await this.repository.findById(id);

    if (!child) {
      throw new NotFoundException(`No se encontró un niño con el ID ${id}`);
    }

    return ChildResponseDto.fromDomain(child);
  }
}
