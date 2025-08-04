import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ isArray: true }) roles: string[];

  static fromDomain(user: User) {
    const dto = new UserResponseDto();
    dto.id = user.id!;
    dto.email = user.email;
    dto.roles = user.roles;
    return dto;
  }
}
