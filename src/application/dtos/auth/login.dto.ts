import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, isString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'rgersonzs95@gmail.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456-a',
    description: 'Contraseña de usuario',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
