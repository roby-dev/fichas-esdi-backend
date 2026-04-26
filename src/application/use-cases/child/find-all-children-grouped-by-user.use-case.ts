import { Inject, Injectable } from '@nestjs/common';
import { CHILD_REPOSITORY, USER_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { ChildResponseDto } from '../../dtos/child/child-response.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { UserWithChildrenDto } from '../../dtos/child/user-with-children.dto';

@Injectable()
export class FindAllChildrenGroupedByUserUseCase {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly childRepository: ChildRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(): Promise<UserWithChildrenDto[]> {
    const [groups, users] = await Promise.all([
      this.childRepository.findAllGroupedByUser(),
      this.userRepository.findAll(1000, 0),
    ]);

    const userMap = new Map(users.map((u) => [u.id!, u]));

    return groups
      .filter((g) => userMap.has(g.userId))
      .map((g) => ({
        user: UserResponseDto.fromDomain(userMap.get(g.userId)!),
        children: g.children.map(ChildResponseDto.fromDomain),
      }));
  }
}
