import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty } from 'class-validator';

export class TransferCaregiverMotherDto {
  @ApiProperty({
    example: '000000000000000000000002',
    description: 'ID del nuevo local comunal',
  })
  @IsMongoId()
  @IsNotEmpty()
  communityHallId: string;

  @ApiProperty({
    example: '2025-07-01',
    description: 'Fecha efectiva del traslado',
  })
  @IsDateString()
  validFrom: string;
}
