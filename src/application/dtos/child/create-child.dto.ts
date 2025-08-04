import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateChildDto {
  @ApiProperty({
    example: '12345678',
    description: 'Número de documento del niño',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, {
    message: 'El número de documento debe tener exactamente 8 dígitos',
  })
  documentNumber: string;

  @ApiProperty({
    example: 'JUAN',
    description: 'Nombre del niño (se almacenará en mayúsculas)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toUpperCase())
  firstName: string;

  @ApiProperty({
    example: 'PÉREZ',
    description: 'Apellido del niño (se almacenará en mayúsculas)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toUpperCase())
  lastName: string;

  @ApiProperty({
    example: '2019-01-01',
    description: 'Fecha de nacimiento del niño (formato ISO 8601)',
  })
  @IsDateString()
  birthday: string;

  @ApiProperty({
    example: '2025-08-01',
    description: 'Fecha de ingreso (formato ISO 8601)',
  })
  @IsDateString()
  admissionDate: string;

  @ApiProperty({
    example: '688f81da182ea76a2df99b07',
    description: 'ID del local comunal asociado al niño',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  communityHallId: string;
}
