import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ isArray: true }) roles: string[];

  static fromDomain(user: User): UserResponseDto {
    return {
      id: user.id!,
      email: user.email,
      roles: user.roles,
    };
  }
}
