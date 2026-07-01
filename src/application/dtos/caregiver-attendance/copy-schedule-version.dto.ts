import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CopyScheduleVersionDto {
  @ApiProperty({
    example: '000000000000000000000003',
    description: 'ID del local comunal destino',
  })
  @IsMongoId()
  @IsNotEmpty()
  targetHallId: string;

  @ApiProperty({
    example: '2025-07-01',
    description: 'Fecha efectiva en el destino',
  })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Nombre de la versión copiada' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
