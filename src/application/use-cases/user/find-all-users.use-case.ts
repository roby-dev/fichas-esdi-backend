// src/application/use-cases/user/get-all-users.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from 'src/domain/constants/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';

@Injectable()
export class FindAllUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(): Promise<UserResponseDto[]> {
    const users = await this.userRepo.findAll();
    return users.map(UserResponseDto.fromDomain);
  }
}
