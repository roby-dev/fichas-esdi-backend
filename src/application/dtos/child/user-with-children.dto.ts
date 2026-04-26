import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../user/user-response.dto';
import { ChildResponseDto } from './child-response.dto';

export class UserWithChildrenDto {
  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: () => [ChildResponseDto] })
  children: ChildResponseDto[];
}
