import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({ example: '64df012fa23b93e8f83e916b', description: 'ID del usuario mongo' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({
    isArray: true,
    example: ['admin', 'user'],
    description: 'Lista de roles',
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}
