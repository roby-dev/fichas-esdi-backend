// src/application/use-cases/user/get-user-by-id.use-case.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from 'src/domain/constants/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return UserResponseDto.fromDomain(user);
  }
}
