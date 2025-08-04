import { Inject, Injectable } from '@nestjs/common';
import { CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import { ChildResponseDto } from '../../dtos/child/child-response.dto';

@Injectable()
export class FindAllChildrenUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly repository: ChildRepository,
  ) {}

  async execute(limit = 10, offset = 0): Promise<ChildResponseDto[]> {
    const children = await this.repository.findAll(limit, offset);
    return children.map(ChildResponseDto.fromDomain);
  }
}
