import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';

@Injectable()
export class DeleteChildUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly repository: ChildRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new NotFoundException(`No se encontró un niño con el ID ${id}`);
    }

    await this.repository.delete(id);
  }
}
