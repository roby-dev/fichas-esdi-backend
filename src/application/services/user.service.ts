import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import { USER_REPOSITORY } from 'src/domain/constants/tokens';
import { User } from 'src/domain/entities/user.entity';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { AssignRolesDto } from '../dtos/user/assign-roles.dto';
import { UserResponseDto } from '../dtos/user/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const entity = User.create(dto.email, passwordHash);
    const user = await this.userRepo.save(entity);
    return UserResponseDto.fromDomain(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepo.findAll();
    return users.map(UserResponseDto.fromDomain);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return UserResponseDto.fromDomain(user);
  }

  async assignRoles(id: string, dto: AssignRolesDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.roles = Array.from(new Set([...user.roles, ...dto.roles]));
    await this.userRepo.update(user);
    return UserResponseDto.fromDomain(user);
  }
}
