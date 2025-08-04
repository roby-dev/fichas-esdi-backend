// src/application/use-cases/user/create-user.use-case.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from 'src/application/dtos/user/create-user.dto';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';
import { USER_REPOSITORY } from 'src/domain/constants/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'src/domain/entities/user.entity';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const entity = User.create(dto.email, passwordHash);
    const user = await this.userRepo.save(entity);

    return UserResponseDto.fromDomain(user);
  }
}
