import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CorrectMarkDto {
  @ApiProperty({ example: '08:10' })
  @IsString()
  @IsNotEmpty()
  entryTime: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
