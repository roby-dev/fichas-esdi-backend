import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateManagementCommitteeDto {
  @ApiProperty({
    description: 'Código del comité de gestión',
    example: '737',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'El código debe tener al menos 1 caracteres' })
  @MaxLength(100, { message: 'El código no debe exceder los 100 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  committeeId: string;

  @ApiProperty({
    description: 'Nombre del comité de gestión',
    example: 'LAS BUGANVILAS',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no debe exceder los 100 caracteres' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value?.trim().toUpperCase() : value,
  )
  name: string;
}
