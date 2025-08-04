import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCommunityHallDto {
  @ApiProperty({
    description: 'Nombre del local comunal',
    example: 'Local Comunal Las Palmeras',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no debe exceder los 100 caracteres' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  name: string;

  @ApiProperty({
    description: 'ID del comité de gestión asociado',
    example: '64df012fa23b93e8f83e916b',
  })
  @IsMongoId({ message: 'El ID del comité de gestión no es válido' })
  managementCommitteeId: string;
}
