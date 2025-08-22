import { Inject, Injectable } from '@nestjs/common';
import { CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import { ChildResponseDto } from '../../dtos/child/child-response.dto';

@Injectable()
export class FindAllChildrenByCommitteeUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly repository: ChildRepository,
  ) {}

  async execute(id: string): Promise<ChildResponseDto[]> {
    const children = await this.repository.findAllByCommittee(id);
    return children.map(ChildResponseDto.fromDomain);
  }
}
