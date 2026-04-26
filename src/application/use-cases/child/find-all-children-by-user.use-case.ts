import { Inject, Injectable } from '@nestjs/common';
import { CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import { ChildResponseDto } from '../../dtos/child/child-response.dto';
import { RequestUserContext } from 'src/common/contexts/user-context.service';

@Injectable()
export class FindAllChildrenByUserUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly repository: ChildRepository,
    private readonly userContext: RequestUserContext,
  ) {}

  async execute(limit?: number, offset?: number): Promise<ChildResponseDto[]> {
    const userId = this.userContext.getUserId();
    const children = await this.repository.findAlllByUser(userId, limit, offset);
    return children.map(ChildResponseDto.fromDomain);
  }
}
