import {
  IsString,
  IsDateString,
  IsNotEmpty,
  Length,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChildDto {
  @ApiProperty({
    description: 'Número de documento del niño',
    example: '72345678',
    minLength: 8,
    maxLength: 12,
  })
  @IsString()
  @Length(8, 12)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  documentNumber: string;

  @ApiProperty({
    description: 'Nombres del niño',
    example: 'JUAN CARLOS',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del niño',
    example: 'RAMOS TORRES',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  lastName: string;

  @ApiProperty({
    description: 'Fecha de nacimiento (ISO)',
    example: '2020-01-15',
  })
  @IsDateString()
  birthday: Date;

  @ApiProperty({
    description: 'Fecha de ingreso al programa (ISO)',
    example: '2023-06-01',
  })
  @IsDateString()
  admissionDate: Date;

  @ApiProperty({
    description: 'ID del local comunal al que pertenece el niño',
    example: '688f81da182ea76a2df99b07',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  communityHallId: string;
}
