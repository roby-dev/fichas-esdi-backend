import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDto {
  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Presente cuando el cambio fue auto-iniciado. La sesión actual permanece activa.',
  })
  ok?: true;

  @ApiProperty({
    type: Boolean,
    required: false,
    description:
      'Presente cuando el usuario tenía mustChangePassword=true. Todas las sesiones fueron invalidadas; el cliente debe redirigir al login.',
  })
  mustReauthenticate?: true;
}
