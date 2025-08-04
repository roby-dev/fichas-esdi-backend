import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { USER_REPOSITORY } from 'src/domain/constants/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { AssignRolesDto } from 'src/application/dtos/user/assign-roles.dto';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';

@Injectable()
export class AssignRolesUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(id: string, dto: AssignRolesDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.roles = Array.from(new Set([...user.roles, ...dto.roles])); // evita duplicados
    await this.userRepo.update(user);

    return UserResponseDto.fromDomain(user);
  }
}
