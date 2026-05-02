import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateCommitteeMembershipDto {
  @ApiProperty({
    example: '64ee123abcde4567f8901234',
    description: 'ID (Mongo) del comité de gestión a asignar',
  })
  @IsMongoId()
  @IsNotEmpty()
  committeeRef: string;

  @ApiProperty({
    example: '688f81da182ea76a2df99b07',
    description: 'ID (Mongo) del usuario que recibe la asignación',
  })
  @IsMongoId()
  @IsNotEmpty()
  userRef: string;
}
