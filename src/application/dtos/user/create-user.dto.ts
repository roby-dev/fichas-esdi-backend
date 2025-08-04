// src/application/dtos/user/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'rgersonzs95@gmail.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456-a',
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
