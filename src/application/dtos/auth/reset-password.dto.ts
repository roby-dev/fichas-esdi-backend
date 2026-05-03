import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'Contraseña temporal asignada por el administrador. ' +
      'Do NOT log this field. Transmit over HTTPS only.',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  temporaryPassword: string;
}
